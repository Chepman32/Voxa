import AVFoundation
import Photos
import React
import Speech
import UIKit

private struct ExportSubtitleWord {
  let text: String
  let startTime: Double
  let endTime: Double
}

private struct SpeechLocaleProbeScore {
  let localeIdentifier: String
  let segmentCount: Int
  let coverage: Double
  let averageConfidence: Double
  let preferredRank: Int

  var isUsable: Bool {
    segmentCount > 0 && coverage > 0
  }
}

@objc(VoxaOfflineModule)
final class VoxaOfflineModule: NSObject {
  private let recognitionChunkDurationSeconds = 45.0
  private let detectionProbeDurationSeconds = 8.0

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

  @objc(getAvailableSpeechLocales:rejecter:)
  func getAvailableSpeechLocales(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let locales = self.availableOnDeviceSpeechLocales().map { locale in
      [
        "label": self.label(for: locale),
        "value": locale.identifier,
      ]
    }
    resolve(locales)
  }

  @objc(prepareProject:locale:resolver:rejecter:)
  func prepareProject(
    _ videoURI: String,
    locale: String?,
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
        var recognitionLocale: String?
        var recognitionMode = "auto"
        var errorMessage: String?

        if asset.tracks(withMediaType: .audio).isEmpty {
          errorMessage = "Selected video has no audio track"
        } else {
          let audioURL = try await self.extractAudio(from: asset)
          defer { try? FileManager.default.removeItem(at: audioURL) }

          waveform = try self.generateWaveform(from: audioURL, bucketCount: 160)

          do {
            let localeOverride = locale?.trimmingCharacters(in: .whitespacesAndNewlines)
            let resolvedLocale: String
            if let localeOverride, localeOverride.isEmpty == false {
              recognitionMode = "manual"
              resolvedLocale = localeOverride
            } else {
              recognitionMode = "auto"
              resolvedLocale = try await self.detectSpeechLocale(for: asset)
            }

            recognitionLocale = resolvedLocale
            subtitles = try await self.recognizeSpeech(from: asset, locale: resolvedLocale)
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
          "transcriptTimeOffsetMs": 0,
          "recognitionStatus": recognitionStatus,
          "recognitionLocale": recognitionLocale as Any,
          "recognitionMode": recognitionMode,
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
    let accentColor = color(from: style["accentColor"] as? String ?? "#12E5FF")
    let wordHighlightEnabled = (style["wordHighlightEnabled"] as? NSNumber)?.boolValue ?? true
    let backgroundColor = color(
      from: style["backgroundColor"] as? String ?? "rgba(10, 10, 12, 0.62)"
    )
    let letterSpacing = CGFloat((style["letterSpacing"] as? NSNumber)?.doubleValue ?? 0.3)
    let position = style["position"] as? String ?? "bottom"
    let positionOffsetYRatio = CGFloat(
      (style["positionOffsetYRatio"] as? NSNumber)?.doubleValue ?? 0
    )
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
        positionOffsetYRatio: positionOffsetYRatio,
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
      let textFrame = CGRect(
        x: horizontalPadding,
        y: verticalPadding - 2,
        width: containerWidth - horizontalPadding * 2,
        height: containerHeight - verticalPadding * 2
      )
      textLayer.frame = textFrame
      textLayer.string = attributedText
      containerLayer.addSublayer(textLayer)

      if wordHighlightEnabled {
        let words = subtitleWords(from: subtitle)
        makeHighlightedWordLayers(
          text: text,
          words: words,
          font: font,
          accentColor: accentColor,
          letterSpacing: letterSpacing,
          uppercase: uppercase,
          frame: textFrame,
          totalDuration: max(totalDuration, 0.1)
        ).forEach(containerLayer.addSublayer)
      }

      let animation = opacityAnimation(
        start: startTime / 1000,
        end: endTime / 1000,
        totalDuration: max(totalDuration, 0.1)
      )
      containerLayer.add(animation, forKey: "opacity")
      return containerLayer
    }
  }

  func subtitleWords(from subtitle: [String: Any]) -> [ExportSubtitleWord] {
    guard let rawWords = subtitle["words"] as? [[String: Any]] else {
      return []
    }

    return rawWords
      .compactMap { rawWord in
        guard let rawText = rawWord["text"] as? String else {
          return nil
        }

        let text = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.isEmpty == false else {
          return nil
        }

        let startTime = (rawWord["startTime"] as? NSNumber)?.doubleValue ?? 0
        let endTime = (rawWord["endTime"] as? NSNumber)?.doubleValue ?? 0
        guard endTime > startTime else {
          return nil
        }

        return ExportSubtitleWord(text: text, startTime: startTime, endTime: endTime)
      }
      .sorted { left, right in
        if left.startTime == right.startTime {
          return left.endTime < right.endTime
        }
        return left.startTime < right.startTime
      }
  }

  func makeHighlightedWordLayers(
    text: String,
    words: [ExportSubtitleWord],
    font: UIFont,
    accentColor: UIColor,
    letterSpacing: CGFloat,
    uppercase: Bool,
    frame: CGRect,
    totalDuration: Double
  ) -> [CATextLayer] {
    guard words.isEmpty == false else {
      return []
    }

    let casedWords = words.map { word in
      ExportSubtitleWord(
        text: uppercase ? word.text.uppercased() : word.text,
        startTime: word.startTime,
        endTime: word.endTime
      )
    }

    let joinedWords = casedWords.map(\.text).joined(separator: " ")
    guard joinedWords == text else {
      return []
    }

    var location = 0
    return casedWords.enumerated().compactMap { index, word in
      let wordLength = (word.text as NSString).length
      let range = NSRange(location: location, length: wordLength)
      location += wordLength
      if index < casedWords.count - 1 {
        location += 1
      }

      let attributedText = NSMutableAttributedString(
        string: text,
        attributes: [
          .font: font,
          .foregroundColor: UIColor.clear,
          .kern: letterSpacing,
        ]
      )
      attributedText.addAttribute(.foregroundColor, value: accentColor, range: range)

      let layer = CATextLayer()
      layer.contentsScale = UIScreen.main.scale
      layer.alignmentMode = .center
      layer.isWrapped = true
      layer.frame = frame
      layer.opacity = 0
      layer.string = attributedText
      layer.add(
        opacityAnimation(
          start: word.startTime / 1000,
          end: word.endTime / 1000,
          totalDuration: totalDuration
        ),
        forKey: "opacity"
      )
      return layer
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

  func subtitleAnchorY(position: String, videoSize: CGSize, layerHeight: CGFloat) -> CGFloat {
    switch position {
    case "top":
      return 20
    case "middle":
      return videoSize.height * 0.42
    default:
      return videoSize.height - layerHeight - 18
    }
  }

  func subtitleVerticalBounds(videoSize: CGSize, layerHeight: CGFloat) -> (min: CGFloat, max: CGFloat) {
    let minOriginY: CGFloat = 16
    let maxOriginY = max(minOriginY, videoSize.height - layerHeight - 16)
    return (min: minOriginY, max: maxOriginY)
  }

  func subtitleOriginY(
    position: String,
    positionOffsetYRatio: CGFloat,
    videoSize: CGSize,
    layerHeight: CGFloat
  ) -> CGFloat {
    let bounds = subtitleVerticalBounds(videoSize: videoSize, layerHeight: layerHeight)
    let anchorY = subtitleAnchorY(
      position: position,
      videoSize: videoSize,
      layerHeight: layerHeight
    )
    let offsetY = positionOffsetYRatio * videoSize.height
    return min(max(anchorY + offsetY, bounds.min), bounds.max)
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

  func exportAudioChunk(from asset: AVAsset, timeRange: CMTimeRange) async throws -> URL {
    guard let exportSession = AVAssetExportSession(
      asset: asset,
      presetName: AVAssetExportPresetAppleM4A
    ) else {
      throw VoxaOfflineError.exportFailed("Unable to create a chunked audio export session.")
    }

    let outputURL = temporaryURL(extension: "m4a")
    exportSession.outputURL = outputURL
    exportSession.outputFileType = .m4a
    exportSession.timeRange = timeRange

    try await export(session: exportSession)
    return outputURL
  }

  func readTranscriptTimeOffsetMs(from audioURL: URL) throws -> Int {
    let asset = AVURLAsset(url: audioURL)
    guard let track = asset.tracks(withMediaType: .audio).first else {
      return 0
    }

    let reader = try AVAssetReader(asset: asset)
    let output = AVAssetReaderTrackOutput(track: track, outputSettings: nil)
    guard reader.canAdd(output) else {
      return 0
    }

    reader.add(output)
    reader.startReading()

    guard let sampleBuffer = output.copyNextSampleBuffer() else {
      return 0
    }

    let presentationTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    guard presentationTime.isValid, presentationTime.isNumeric else {
      return 0
    }

    return max(0, Int(CMTimeGetSeconds(presentationTime) * 1000))
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

  func availableOnDeviceSpeechLocales() -> [Locale] {
    SFSpeechRecognizer.supportedLocales()
      .filter { locale in
        guard let recognizer = SFSpeechRecognizer(locale: locale) else {
          return false
        }
        return recognizer.supportsOnDeviceRecognition
      }
      .sorted { left, right in
        let leftRank = preferredLanguageRank(for: left.identifier)
        let rightRank = preferredLanguageRank(for: right.identifier)
        if leftRank != rightRank {
          return leftRank < rightRank
        }

        return label(for: left).localizedCaseInsensitiveCompare(label(for: right)) == .orderedAscending
      }
  }

  func label(for locale: Locale) -> String {
    if let localized = Locale.current.localizedString(forIdentifier: locale.identifier),
       localized.isEmpty == false {
      return localized.prefix(1).uppercased() + String(localized.dropFirst())
    }

    return locale.identifier
  }

  func preferredLanguageRank(for localeIdentifier: String) -> Int {
    let normalizedTarget = normalizedLocaleIdentifier(localeIdentifier)
    let targetLanguage = baseLanguageIdentifier(from: normalizedTarget)

    for (index, preferredLanguage) in Locale.preferredLanguages.enumerated() {
      let normalizedPreferred = normalizedLocaleIdentifier(preferredLanguage)
      if normalizedPreferred == normalizedTarget {
        return index
      }

      if baseLanguageIdentifier(from: normalizedPreferred) == targetLanguage {
        return index + 100
      }
    }

    return Int.max
  }

  func normalizedLocaleIdentifier(_ value: String) -> String {
    value
      .replacingOccurrences(of: "_", with: "-")
      .lowercased()
  }

  func baseLanguageIdentifier(from localeIdentifier: String) -> String {
    normalizedLocaleIdentifier(localeIdentifier)
      .split(separator: "-")
      .first
      .map(String.init) ?? normalizedLocaleIdentifier(localeIdentifier)
  }

  func detectionProbeRanges(for totalDurationSeconds: Double) -> [CMTimeRange] {
    guard totalDurationSeconds > 0 else {
      return []
    }

    let probeDuration = min(detectionProbeDurationSeconds, totalDurationSeconds)
    let maxStart = max(0, totalDurationSeconds - probeDuration)
    let candidateStarts: [Double]

    if totalDurationSeconds <= probeDuration + 0.8 {
      candidateStarts = [0]
    } else if totalDurationSeconds <= probeDuration * 2.2 {
      candidateStarts = [0, maxStart]
    } else {
      candidateStarts = [
        0,
        max(0, min(maxStart, totalDurationSeconds / 2 - probeDuration / 2)),
        maxStart,
      ]
    }

    var uniqueStarts: [Double] = []
    for start in candidateStarts {
      let normalizedStart = max(0, min(maxStart, start))
      if uniqueStarts.contains(where: { abs($0 - normalizedStart) < 0.75 }) {
        continue
      }
      uniqueStarts.append(normalizedStart)
    }

    return uniqueStarts.map { start in
      CMTimeRange(
        start: CMTime(seconds: start, preferredTimescale: 600),
        duration: CMTime(seconds: probeDuration, preferredTimescale: 600)
      )
    }
  }

  func detectSpeechLocale(for asset: AVAsset) async throws -> String {
    let availableLocales = availableOnDeviceSpeechLocales()
    guard availableLocales.isEmpty == false else {
      throw VoxaOfflineError.noSupportedSpeechLocales
    }

    let totalDurationSeconds = max(0, CMTimeGetSeconds(asset.duration))
    let probeRanges = detectionProbeRanges(for: totalDurationSeconds)
    guard probeRanges.isEmpty == false else {
      throw VoxaOfflineError.noDetectableSpeechLocale
    }

    var bestScore: SpeechLocaleProbeScore?

    for locale in availableLocales {
      let score = try await scoreLocale(locale.identifier, for: asset, probeRanges: probeRanges)
      if isBetter(score, than: bestScore) {
        bestScore = score
      }
    }

    guard let bestScore, bestScore.isUsable else {
      throw VoxaOfflineError.noDetectableSpeechLocale
    }

    return bestScore.localeIdentifier
  }

  func scoreLocale(
    _ localeIdentifier: String,
    for asset: AVAsset,
    probeRanges: [CMTimeRange]
  ) async throws -> SpeechLocaleProbeScore {
    var segmentCount = 0
    var confidenceSum = 0.0
    var confidenceCount = 0
    var transcriptDurationSeconds = 0.0

    for probeRange in probeRanges {
      let chunkURL = try await exportAudioChunk(from: asset, timeRange: probeRange)
      defer { try? FileManager.default.removeItem(at: chunkURL) }

      do {
        let result = try await recognizeSpeechResult(from: chunkURL, locale: localeIdentifier)
        let segments = result.bestTranscription.segments
        segmentCount += segments.count
        confidenceCount += segments.count
        confidenceSum += segments.reduce(0) { partialResult, segment in
          partialResult + Double(segment.confidence)
        }
        transcriptDurationSeconds += segments.reduce(0) { partialResult, segment in
          partialResult + segment.duration
        }
      } catch {
        continue
      }
    }

    let totalProbeDurationSeconds = probeRanges.reduce(0) { partialResult, range in
      partialResult + CMTimeGetSeconds(range.duration)
    }
    let coverage = totalProbeDurationSeconds > 0
      ? min(1, transcriptDurationSeconds / totalProbeDurationSeconds)
      : 0
    let averageConfidence = confidenceCount > 0
      ? confidenceSum / Double(confidenceCount)
      : 0

    return SpeechLocaleProbeScore(
      localeIdentifier: localeIdentifier,
      segmentCount: segmentCount,
      coverage: coverage,
      averageConfidence: averageConfidence,
      preferredRank: preferredLanguageRank(for: localeIdentifier)
    )
  }

  func isBetter(
    _ candidate: SpeechLocaleProbeScore,
    than current: SpeechLocaleProbeScore?
  ) -> Bool {
    guard let current else {
      return candidate.isUsable
    }

    if candidate.isUsable != current.isUsable {
      return candidate.isUsable
    }

    if candidate.coverage != current.coverage {
      return candidate.coverage > current.coverage
    }

    if candidate.segmentCount != current.segmentCount {
      return candidate.segmentCount > current.segmentCount
    }

    if candidate.averageConfidence != current.averageConfidence {
      return candidate.averageConfidence > current.averageConfidence
    }

    if candidate.preferredRank != current.preferredRank {
      return candidate.preferredRank < current.preferredRank
    }

    return candidate.localeIdentifier < current.localeIdentifier
  }

  func onDeviceRecognizer(for locale: String) throws -> SFSpeechRecognizer {
    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale)) else {
      throw VoxaOfflineError.speechUnavailable
    }

    guard recognizer.supportsOnDeviceRecognition else {
      throw VoxaOfflineError.onDeviceRecognitionUnavailable
    }

    return recognizer
  }

  func recognizeSpeech(from asset: AVAsset, locale: String) async throws -> [[String: Any]] {
    guard string(from: SFSpeechRecognizer.authorizationStatus()) == "authorized" else {
      throw VoxaOfflineError.speechAuthorizationDenied
    }

    _ = try onDeviceRecognizer(for: locale)

    let totalDurationSeconds = max(0, CMTimeGetSeconds(asset.duration))
    guard totalDurationSeconds > 0 else {
      return []
    }

    var subtitles: [[String: Any]] = []
    var chunkStartSeconds = 0.0

    // Split long media into smaller audio exports so Speech can cover the full clip.
    while chunkStartSeconds < totalDurationSeconds {
      let chunkDurationSeconds = min(
        recognitionChunkDurationSeconds,
        totalDurationSeconds - chunkStartSeconds
      )
      let timeRange = CMTimeRange(
        start: CMTime(seconds: chunkStartSeconds, preferredTimescale: 600),
        duration: CMTime(seconds: chunkDurationSeconds, preferredTimescale: 600)
      )

      let chunkURL = try await exportAudioChunk(from: asset, timeRange: timeRange)
      defer { try? FileManager.default.removeItem(at: chunkURL) }

      do {
        let chunkStartMs = Int(round(chunkStartSeconds * 1000))
        let chunkSubtitles = try await recognizeSpeechChunk(
          from: chunkURL,
          locale: locale,
          chunkStartTimeMs: chunkStartMs
        )
        subtitles.append(contentsOf: chunkSubtitles)
      }
      chunkStartSeconds += chunkDurationSeconds
    }

    return subtitles
  }

  func recognizeSpeechChunk(
    from audioURL: URL,
    locale: String,
    chunkStartTimeMs: Int
  ) async throws -> [[String: Any]] {
    let result = try await recognizeSpeechResult(from: audioURL, locale: locale)

    let localOffsetMs = (try? readTranscriptTimeOffsetMs(from: audioURL)) ?? 0

    return result.bestTranscription.segments.map { segment in
      let adjustedStartMs = max(0, Int(segment.timestamp * 1000) - localOffsetMs)
      let adjustedEndMs = max(
        adjustedStartMs + 160,
        Int((segment.timestamp + segment.duration) * 1000) - localOffsetMs
      )
      let adjustedEnd = max(
        adjustedStartMs + chunkStartTimeMs + 160,
        adjustedEndMs + chunkStartTimeMs
      )
      return [
        "id": UUID().uuidString,
        "startTime": adjustedStartMs + chunkStartTimeMs,
        "endTime": adjustedEnd,
        "text": segment.substring,
        "words": [[
          "text": segment.substring,
          "startTime": adjustedStartMs + chunkStartTimeMs,
          "endTime": adjustedEnd,
          "confidence": Double(segment.confidence),
        ]],
        "confidence": Double(segment.confidence),
      ]
    }
  }

  func recognizeSpeechResult(
    from audioURL: URL,
    locale: String
  ) async throws -> SFSpeechRecognitionResult {
    let recognizer = try onDeviceRecognizer(for: locale)
    let request = SFSpeechURLRecognitionRequest(url: audioURL)
    request.requiresOnDeviceRecognition = true
    request.shouldReportPartialResults = false

    return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<SFSpeechRecognitionResult, Error>) in
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
  case noSupportedSpeechLocales
  case noDetectableSpeechLocale
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
    case .noSupportedSpeechLocales:
      return "This device does not currently expose any on-device speech recognition locales."
    case .noDetectableSpeechLocale:
      return "No supported on-device speech locale could transcribe this video."
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
