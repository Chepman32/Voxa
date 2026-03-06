import AVFoundation
import Photos
import React
import Speech
import UIKit

@objc(VoxaOfflineModule)
final class VoxaOfflineModule: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(requestAuthorizations:rejecter:)
  func requestAuthorizations(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let group = DispatchGroup()
    var speechStatus = self.string(from: SFSpeechRecognizer.authorizationStatus())
    var photoStatus = self.string(from: self.photoAuthorizationStatus())

    if speechStatus == "not_determined" {
      group.enter()
      SFSpeechRecognizer.requestAuthorization { status in
        speechStatus = self.string(from: status)
        group.leave()
      }
    }

    if photoStatus == "not_determined" {
      group.enter()
      self.requestPhotoAuthorization { status in
        photoStatus = self.string(from: status)
        group.leave()
      }
    }

    group.notify(queue: .main) {
      resolve([
        "photoLibrary": photoStatus,
        "photoAddOnly": photoStatus,
        "speech": speechStatus,
      ])
    }
  }

  @objc(getSpeechAuthorizationStatus:rejecter:)
  func getSpeechAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(self.string(from: SFSpeechRecognizer.authorizationStatus()))
  }

  @objc(requestSpeechAuthorization:rejecter:)
  func requestSpeechAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let currentStatus = SFSpeechRecognizer.authorizationStatus()
    guard currentStatus == .notDetermined else {
      resolve(self.string(from: currentStatus))
      return
    }

    SFSpeechRecognizer.requestAuthorization { status in
      resolve(self.string(from: status))
    }
  }

  @objc(prepareProject:locale:resolver:rejecter:)
  func prepareProject(
    _ videoURI: String,
    locale: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task.detached(priority: .userInitiated) {
      do {
        let videoURL = try self.normalizedFileURL(from: videoURI)
        let asset = AVURLAsset(url: videoURL)
        let durationMs = max(0, Int(CMTimeGetSeconds(asset.duration) * 1000))
        let videoSize = try self.renderSize(for: asset)
        let thumbnailURL = try self.generateThumbnail(for: asset)

        var waveform = Array(repeating: 0.16, count: 160)
        var subtitles: [[String: Any]] = []
        var recognitionStatus = "manual"
        var errorMessage: String?

        if asset.tracks(withMediaType: .audio).isEmpty {
          errorMessage = "Selected video has no audio track"
        } else {
          let audioURL = try await self.extractAudio(from: asset)
          defer { try? FileManager.default.removeItem(at: audioURL) }

          waveform = try self.generateWaveform(from: audioURL, bucketCount: 160)

          do {
            subtitles = try await self.recognizeSpeech(from: audioURL, locale: locale)
            recognitionStatus = subtitles.isEmpty ? "manual" : "ready"
          } catch {
            recognitionStatus = "failed"
            errorMessage = error.localizedDescription
          }
        }

        resolve([
          "duration": durationMs,
          "thumbnailUri": thumbnailURL.absoluteString,
          "width": Int(videoSize.width),
          "height": Int(videoSize.height),
          "waveform": waveform,
          "subtitles": subtitles,
          "recognitionStatus": recognitionStatus,
          "errorMessage": errorMessage as Any,
        ])
      } catch {
        reject("prepare_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(exportProject:resolver:rejecter:)
  func exportProject(
    _ payload: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task.detached(priority: .userInitiated) {
      do {
        guard let videoURI = payload["videoURI"] as? String else {
          throw VoxaOfflineError.invalidPayload("Missing video URI.")
        }
        guard let subtitlesArray = payload["subtitles"] as? [[String: Any]] else {
          throw VoxaOfflineError.invalidPayload("Missing subtitles.")
        }
        let style = payload["style"] as? [String: Any] ?? [:]
        let resolution = payload["resolution"] as? String ?? "1080p"

        let outputURL = try await self.exportBurnedInVideo(
          videoURI: videoURI,
          subtitles: subtitlesArray,
          style: style,
          resolution: resolution
        )

        resolve([
          "outputUri": outputURL.absoluteString,
        ])
      } catch {
        reject("export_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(saveVideoToPhotos:resolver:rejecter:)
  func saveVideoToPhotos(
    _ videoURI: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let performSave = {
      Task.detached(priority: .userInitiated) {
        do {
          let url = try self.normalizedFileURL(from: videoURI)
          let identifier = try await self.saveVideo(url: url)
          resolve([
            "localIdentifier": identifier,
          ])
        } catch {
          reject("save_failed", error.localizedDescription, error)
        }
      }
    }

    let status = self.photoAuthorizationStatus()
    switch status {
    case .authorized, .limited:
      performSave()
    case .notDetermined:
      self.requestPhotoAuthorization { nextStatus in
        if nextStatus == .authorized || nextStatus == .limited {
          performSave()
        } else {
          reject(
            "photos_permission_denied",
            "Photo library access is required to save exports.",
            nil
          )
        }
      }
    default:
      reject(
        "photos_permission_denied",
        "Photo library access is required to save exports.",
        nil
      )
    }
  }
}

private extension VoxaOfflineModule {
  func exportBurnedInVideo(
    videoURI: String,
    subtitles: [[String: Any]],
    style: [String: Any],
    resolution: String
  ) async throws -> URL {
    let videoURL = try normalizedFileURL(from: videoURI)
    let asset = AVURLAsset(url: videoURL)
    guard let sourceVideoTrack = asset.tracks(withMediaType: .video).first else {
      throw VoxaOfflineError.videoTrackMissing
    }

    let composition = AVMutableComposition()
    guard let compositionVideoTrack = composition.addMutableTrack(
      withMediaType: .video,
      preferredTrackID: kCMPersistentTrackID_Invalid
    ) else {
      throw VoxaOfflineError.exportFailed("Unable to build a composition track.")
    }

    let fullRange = CMTimeRange(start: .zero, duration: asset.duration)
    try compositionVideoTrack.insertTimeRange(
      fullRange,
      of: sourceVideoTrack,
      at: .zero
    )

    if let sourceAudioTrack = asset.tracks(withMediaType: .audio).first,
       let compositionAudioTrack = composition.addMutableTrack(
         withMediaType: .audio,
         preferredTrackID: kCMPersistentTrackID_Invalid
       ) {
      try? compositionAudioTrack.insertTimeRange(
        fullRange,
        of: sourceAudioTrack,
        at: .zero
      )
    }

    let sourceSize = try renderSize(for: asset)
    let targetSize = targetRenderSize(for: sourceSize, resolution: resolution)
    let scale = targetSize.width / sourceSize.width

    let videoComposition = AVMutableVideoComposition()
    videoComposition.renderSize = targetSize
    videoComposition.frameDuration = CMTime(value: 1, timescale: 30)

    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = fullRange

    let layerInstruction = AVMutableVideoCompositionLayerInstruction(
      assetTrack: compositionVideoTrack
    )
    layerInstruction.setTransform(
      sourceVideoTrack.preferredTransform.scaledBy(x: scale, y: scale),
      at: .zero
    )
    instruction.layerInstructions = [layerInstruction]
    videoComposition.instructions = [instruction]

    let parentLayer = CALayer()
    parentLayer.frame = CGRect(origin: .zero, size: targetSize)
    let videoLayer = CALayer()
    videoLayer.frame = CGRect(origin: .zero, size: targetSize)
    parentLayer.addSublayer(videoLayer)

    let subtitleLayers = makeSubtitleLayers(
      subtitles: subtitles,
      style: style,
      videoSize: targetSize,
      totalDuration: CMTimeGetSeconds(asset.duration)
    )
    subtitleLayers.forEach(parentLayer.addSublayer)

    videoComposition.animationTool = AVVideoCompositionCoreAnimationTool(
      postProcessingAsVideoLayer: videoLayer,
      in: parentLayer
    )

    guard let exportSession = AVAssetExportSession(
      asset: composition,
      presetName: AVAssetExportPresetHighestQuality
    ) else {
      throw VoxaOfflineError.exportFailed("Unable to create an export session.")
    }

    let outputURL = temporaryURL(extension: "mov")
    exportSession.outputURL = outputURL
    exportSession.outputFileType = .mov
    exportSession.videoComposition = videoComposition
    exportSession.shouldOptimizeForNetworkUse = false

    try await export(session: exportSession)
    return outputURL
  }

  func makeSubtitleLayers(
    subtitles: [[String: Any]],
    style: [String: Any],
    videoSize: CGSize,
    totalDuration: Double
  ) -> [CALayer] {
    let fontSize = CGFloat((style["fontSize"] as? NSNumber)?.doubleValue ?? 34)
    let font = resolvedFont(
      name: style["fontFamily"] as? String,
      size: fontSize,
      weightString: style["fontWeight"] as? String
    )
    let textColor = color(from: style["textColor"] as? String ?? "#FFFFFF")
    let backgroundColor = color(
      from: style["backgroundColor"] as? String ?? "rgba(10, 10, 12, 0.62)"
    )
    let letterSpacing = CGFloat((style["letterSpacing"] as? NSNumber)?.doubleValue ?? 0.3)
    let position = style["position"] as? String ?? "bottom"
    let uppercase = (style["casing"] as? String) == "uppercase"

    return subtitles.compactMap { subtitle in
      guard let rawText = subtitle["text"] as? String else {
        return nil
      }
      let startTime = (subtitle["startTime"] as? NSNumber)?.doubleValue ?? 0
      let endTime = (subtitle["endTime"] as? NSNumber)?.doubleValue ?? 0
      guard endTime > startTime else {
        return nil
      }

      let text = uppercase ? rawText.uppercased() : rawText
      let attributedText = NSAttributedString(
        string: text,
        attributes: [
          .font: font,
          .foregroundColor: textColor,
          .kern: letterSpacing,
        ]
      )

      let textBounds = attributedText.boundingRect(
        with: CGSize(width: videoSize.width * 0.84, height: .greatestFiniteMagnitude),
        options: [.usesFontLeading, .usesLineFragmentOrigin],
        context: nil
      ).integral

      let horizontalPadding: CGFloat = 18
      let verticalPadding: CGFloat = 10
      let containerWidth = min(videoSize.width * 0.88, textBounds.width + horizontalPadding * 2)
      let containerHeight = textBounds.height + verticalPadding * 2
      let originY = subtitleOriginY(
        position: position,
        videoSize: videoSize,
        layerHeight: containerHeight
      )

      let containerLayer = CALayer()
      containerLayer.frame = CGRect(
        x: (videoSize.width - containerWidth) / 2,
        y: originY,
        width: containerWidth,
        height: containerHeight
      )
      containerLayer.backgroundColor = backgroundColor.cgColor
      containerLayer.cornerRadius = 18
      containerLayer.opacity = 0
      containerLayer.shadowColor = UIColor.black.cgColor
      containerLayer.shadowOpacity = 0.28
      containerLayer.shadowRadius = 16
      containerLayer.shadowOffset = CGSize(width: 0, height: 8)

      let textLayer = CATextLayer()
      textLayer.contentsScale = UIScreen.main.scale
      textLayer.alignmentMode = .center
      textLayer.isWrapped = true
      textLayer.frame = CGRect(
        x: horizontalPadding,
        y: verticalPadding - 2,
        width: containerWidth - horizontalPadding * 2,
        height: containerHeight - verticalPadding * 2
      )
      textLayer.string = attributedText
      containerLayer.addSublayer(textLayer)

      let animation = opacityAnimation(
        start: startTime / 1000,
        end: endTime / 1000,
        totalDuration: max(totalDuration, 0.1)
      )
      containerLayer.add(animation, forKey: "opacity")
      return containerLayer
    }
  }

  func opacityAnimation(start: Double, end: Double, totalDuration: Double) -> CAKeyframeAnimation {
    let fadeDuration = min(0.14, max(0.08, (end - start) / 3))
    let fadeOutStart = max(start + fadeDuration, end - fadeDuration)

    let animation = CAKeyframeAnimation(keyPath: "opacity")
    animation.values = [0, 0, 1, 1, 0, 0]
    animation.keyTimes = [
      0,
      NSNumber(value: start / totalDuration),
      NSNumber(value: min(1, (start + fadeDuration) / totalDuration)),
      NSNumber(value: min(1, fadeOutStart / totalDuration)),
      NSNumber(value: min(1, end / totalDuration)),
      1,
    ]
    animation.duration = totalDuration
    animation.fillMode = .forwards
    animation.isRemovedOnCompletion = false
    return animation
  }

  func subtitleOriginY(position: String, videoSize: CGSize, layerHeight: CGFloat) -> CGFloat {
    switch position {
    case "top":
      return videoSize.height * 0.12
    case "middle":
      return (videoSize.height - layerHeight) / 2
    default:
      return max(16, videoSize.height * 0.78 - layerHeight)
    }
  }

  func resolvedFont(name: String?, size: CGFloat, weightString: String?) -> UIFont {
    let weight: UIFont.Weight
    switch weightString {
    case "500":
      weight = .medium
    case "600":
      weight = .semibold
    case "700":
      weight = .bold
    default:
      weight = .heavy
    }

    if let name, !name.isEmpty, name != "System", let customFont = UIFont(name: name, size: size) {
      return customFont
    }

    return .systemFont(ofSize: size, weight: weight)
  }

  func color(from value: String) -> UIColor {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)

    if trimmed.hasPrefix("#") {
      let hex = trimmed.replacingOccurrences(of: "#", with: "")
      var raw: UInt64 = 0
      Scanner(string: hex).scanHexInt64(&raw)

      switch hex.count {
      case 6:
        return UIColor(
          red: CGFloat((raw & 0xFF0000) >> 16) / 255,
          green: CGFloat((raw & 0x00FF00) >> 8) / 255,
          blue: CGFloat(raw & 0x0000FF) / 255,
          alpha: 1
        )
      case 8:
        return UIColor(
          red: CGFloat((raw & 0xFF000000) >> 24) / 255,
          green: CGFloat((raw & 0x00FF0000) >> 16) / 255,
          blue: CGFloat((raw & 0x0000FF00) >> 8) / 255,
          alpha: CGFloat(raw & 0x000000FF) / 255
        )
      default:
        return .white
      }
    }

    if trimmed.hasPrefix("rgba") {
      let components = trimmed
        .replacingOccurrences(of: "rgba(", with: "")
        .replacingOccurrences(of: ")", with: "")
        .split(separator: ",")
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

      if components.count == 4,
         let red = Double(components[0]),
         let green = Double(components[1]),
         let blue = Double(components[2]),
         let alpha = Double(components[3]) {
        return UIColor(
          red: red / 255,
          green: green / 255,
          blue: blue / 255,
          alpha: alpha
        )
      }
    }

    return .white
  }

  func extractAudio(from asset: AVAsset) async throws -> URL {
    guard asset.tracks(withMediaType: .audio).isEmpty == false else {
      throw VoxaOfflineError.noAudioTrack
    }

    guard let exportSession = AVAssetExportSession(
      asset: asset,
      presetName: AVAssetExportPresetAppleM4A
    ) else {
      throw VoxaOfflineError.exportFailed("Unable to create an audio export session.")
    }

    let outputURL = temporaryURL(extension: "m4a")
    exportSession.outputURL = outputURL
    exportSession.outputFileType = .m4a

    try await export(session: exportSession)
    return outputURL
  }

  func export(session: AVAssetExportSession) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      session.exportAsynchronously {
        switch session.status {
        case .completed:
          continuation.resume(returning: ())
        case .failed, .cancelled:
          continuation.resume(
            throwing: session.error ?? VoxaOfflineError.exportFailed("Export cancelled.")
          )
        default:
          continuation.resume(
            throwing: VoxaOfflineError.exportFailed("Export stopped unexpectedly.")
          )
        }
      }
    }
  }

  func recognizeSpeech(from audioURL: URL, locale: String) async throws -> [[String: Any]] {
    guard string(from: SFSpeechRecognizer.authorizationStatus()) == "authorized" else {
      throw VoxaOfflineError.speechAuthorizationDenied
    }

    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale)) else {
      throw VoxaOfflineError.speechUnavailable
    }

    guard recognizer.supportsOnDeviceRecognition else {
      throw VoxaOfflineError.onDeviceRecognitionUnavailable
    }

    let request = SFSpeechURLRecognitionRequest(url: audioURL)
    request.requiresOnDeviceRecognition = true
    request.shouldReportPartialResults = false

    let result: SFSpeechRecognitionResult = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<SFSpeechRecognitionResult, Error>) in
      var hasResumed = false
      recognizer.recognitionTask(with: request) { result, error in
        if hasResumed {
          return
        }
        if let error {
          hasResumed = true
          continuation.resume(throwing: error)
          return
        }
        guard let result, result.isFinal else {
          return
        }
        hasResumed = true
        continuation.resume(returning: result)
      }
    }

    return result.bestTranscription.segments.map { segment in
      [
        "id": UUID().uuidString,
        "startTime": Int(segment.timestamp * 1000),
        "endTime": Int((segment.timestamp + segment.duration) * 1000),
        "text": segment.substring,
        "confidence": Double(segment.confidence),
      ]
    }
  }

  func generateWaveform(from audioURL: URL, bucketCount: Int) throws -> [Double] {
    let asset = AVURLAsset(url: audioURL)
    guard let track = asset.tracks(withMediaType: .audio).first else {
      return Array(repeating: 0.16, count: bucketCount)
    }

    let reader = try AVAssetReader(asset: asset)
    let output = AVAssetReaderTrackOutput(
      track: track,
      outputSettings: [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVLinearPCMBitDepthKey: 16,
        AVLinearPCMIsBigEndianKey: false,
        AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsNonInterleaved: false,
      ]
    )
    reader.add(output)
    reader.startReading()

    var samples: [Float] = []

    while reader.status == .reading {
      guard let sampleBuffer = output.copyNextSampleBuffer() else {
        break
      }
      guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else {
        continue
      }

      let length = CMBlockBufferGetDataLength(blockBuffer)
      var data = Data(count: length)
      data.withUnsafeMutableBytes { buffer in
        guard let pointer = buffer.baseAddress else {
          return
        }
        CMBlockBufferCopyDataBytes(
          blockBuffer,
          atOffset: 0,
          dataLength: length,
          destination: pointer
        )
      }

      let count = length / MemoryLayout<Int16>.size
      let stride = max(1, count / 96)

      data.withUnsafeBytes { buffer in
        let values = buffer.bindMemory(to: Int16.self)
        for index in Swift.stride(from: 0, to: count, by: stride) {
          let value = abs(Float(values[index])) / Float(Int16.max)
          samples.append(value)
        }
      }
    }

    if samples.isEmpty {
      return Array(repeating: 0.16, count: bucketCount)
    }

    let bucketSize = max(1, samples.count / bucketCount)
    var buckets: [Double] = []
    buckets.reserveCapacity(bucketCount)

    for index in Swift.stride(from: 0, to: samples.count, by: bucketSize) {
      let chunk = samples[index ..< min(samples.count, index + bucketSize)]
      let average = chunk.reduce(0, +) / Float(chunk.count)
      let rms = sqrt(average)
      buckets.append(Double(min(0.94, max(0.12, rms * 1.9))))
    }

    if buckets.count < bucketCount, let last = buckets.last {
      buckets.append(contentsOf: Array(repeating: last, count: bucketCount - buckets.count))
    }

    return Array(buckets.prefix(bucketCount))
  }

  func generateThumbnail(for asset: AVAsset) throws -> URL {
    let imageGenerator = AVAssetImageGenerator(asset: asset)
    imageGenerator.appliesPreferredTrackTransform = true
    imageGenerator.maximumSize = CGSize(width: 1280, height: 1280)

    let requestedTime = CMTime(seconds: 0.2, preferredTimescale: 600)
    let cgImage = try imageGenerator.copyCGImage(at: requestedTime, actualTime: nil)
    let image = UIImage(cgImage: cgImage)
    guard let data = image.jpegData(compressionQuality: 0.84) else {
      throw VoxaOfflineError.thumbnailFailed
    }

    let outputURL = temporaryURL(extension: "jpg")
    try data.write(to: outputURL, options: .atomic)
    return outputURL
  }

  func renderSize(for asset: AVAsset) throws -> CGSize {
    guard let track = asset.tracks(withMediaType: .video).first else {
      throw VoxaOfflineError.videoTrackMissing
    }

    let transformedSize = track.naturalSize.applying(track.preferredTransform)
    return CGSize(
      width: abs(transformedSize.width),
      height: abs(transformedSize.height)
    )
  }

  func targetRenderSize(for sourceSize: CGSize, resolution: String) -> CGSize {
    let longSide: CGFloat
    switch resolution.lowercased() {
    case "720p":
      longSide = 1280
    case "4k":
      longSide = 3840
    default:
      longSide = 1920
    }

    let sourceLongSide = max(sourceSize.width, sourceSize.height)
    guard sourceLongSide > 0 else {
      return sourceSize
    }

    let scale = min(1, longSide / sourceLongSide)
    return CGSize(
      width: sourceSize.width * scale,
      height: sourceSize.height * scale
    )
  }

  func temporaryURL(extension ext: String) -> URL {
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension(ext)
    try? FileManager.default.removeItem(at: url)
    return url
  }

  func normalizedFileURL(from value: String) throws -> URL {
    if value.hasPrefix("file://"), let url = URL(string: value) {
      return url
    }

    if let url = URL(string: value), url.isFileURL {
      return url
    }

    if value.isEmpty {
      throw VoxaOfflineError.invalidPayload("Missing file path.")
    }

    return URL(fileURLWithPath: value.replacingOccurrences(of: "file://", with: ""))
  }

  func saveVideo(url: URL) async throws -> String {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<String, Error>) in
      var placeholder: PHObjectPlaceholder?

      PHPhotoLibrary.shared().performChanges({
        let request = PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
        placeholder = request?.placeholderForCreatedAsset
      }) { success, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        guard success else {
          continuation.resume(
            throwing: VoxaOfflineError.exportFailed("Photos save failed.")
          )
          return
        }
        continuation.resume(returning: placeholder?.localIdentifier ?? url.absoluteString)
      }
    }
  }

  func photoAuthorizationStatus() -> PHAuthorizationStatus {
    if #available(iOS 14, *) {
      return PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }
    return PHPhotoLibrary.authorizationStatus()
  }

  func requestPhotoAuthorization(completion: @escaping (PHAuthorizationStatus) -> Void) {
    if #available(iOS 14, *) {
      PHPhotoLibrary.requestAuthorization(for: .readWrite, handler: completion)
    } else {
      PHPhotoLibrary.requestAuthorization(completion)
    }
  }

  func string(from status: SFSpeechRecognizerAuthorizationStatus) -> String {
    switch status {
    case .authorized:
      return "authorized"
    case .denied:
      return "denied"
    case .restricted:
      return "restricted"
    case .notDetermined:
      return "not_determined"
    @unknown default:
      return "restricted"
    }
  }

  func string(from status: PHAuthorizationStatus) -> String {
    switch status {
    case .authorized:
      return "authorized"
    case .denied:
      return "denied"
    case .restricted:
      return "restricted"
    case .notDetermined:
      return "not_determined"
    case .limited:
      return "limited"
    @unknown default:
      return "restricted"
    }
  }
}

private enum VoxaOfflineError: LocalizedError {
  case invalidPayload(String)
  case noAudioTrack
  case onDeviceRecognitionUnavailable
  case speechAuthorizationDenied
  case speechUnavailable
  case thumbnailFailed
  case videoTrackMissing
  case exportFailed(String)

  var errorDescription: String? {
    switch self {
    case let .invalidPayload(message):
      return message
    case .noAudioTrack:
      return "The selected video does not contain an audio track."
    case .onDeviceRecognitionUnavailable:
      return "On-device speech recognition is unavailable for the selected locale."
    case .speechAuthorizationDenied:
      return "Speech recognition permission has not been granted."
    case .speechUnavailable:
      return "Speech recognition is unavailable on this device."
    case .thumbnailFailed:
      return "Unable to generate a video thumbnail."
    case .videoTrackMissing:
      return "Unable to load the video track."
    case let .exportFailed(message):
      return message
    }
  }
}
