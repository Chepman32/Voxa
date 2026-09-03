package com.localsub

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.os.Parcelable
import android.os.SystemClock
import android.provider.OpenableColumns
import android.speech.ModelDownloadListener
import android.speech.RecognitionListener
import android.speech.RecognitionSupport
import android.speech.RecognitionSupportCallback
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

internal enum class SpeechRecognitionRecovery {
  DOWNLOAD_MODEL_AND_RETRY,
  RETRY_AFTER_SERVICE_RECONNECT,
  FAIL,
}

internal enum class SpeechModelPreparation {
  READY,
  DOWNLOAD,
  PENDING,
  UNSUPPORTED,
  UNKNOWN,
}

internal enum class SpeechModelDownloadStatus {
  AVAILABLE,
  SCHEDULED,
  FAILED,
}

internal enum class SpeechModelDownloadContinuation {
  CONTINUE,
  WAIT_FOR_MODEL,
  FAIL,
}

internal fun speechRecognitionRecovery(
    errorCode: Int?,
    modelDownloadAttempted: Boolean,
    serviceReconnectAttempted: Boolean = false
): SpeechRecognitionRecovery =
    when {
      errorCode == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE && !modelDownloadAttempted ->
        SpeechRecognitionRecovery.DOWNLOAD_MODEL_AND_RETRY
      errorCode == SpeechRecognizer.ERROR_SERVER_DISCONNECTED && !serviceReconnectAttempted ->
        SpeechRecognitionRecovery.RETRY_AFTER_SERVICE_RECONNECT
      else -> SpeechRecognitionRecovery.FAIL
    }

internal fun speechModelDownloadContinuation(
    status: SpeechModelDownloadStatus
): SpeechModelDownloadContinuation =
    when (status) {
      SpeechModelDownloadStatus.AVAILABLE -> SpeechModelDownloadContinuation.CONTINUE
      SpeechModelDownloadStatus.SCHEDULED -> SpeechModelDownloadContinuation.WAIT_FOR_MODEL
      SpeechModelDownloadStatus.FAILED -> SpeechModelDownloadContinuation.FAIL
    }

internal fun normalizedSpeechModelProgress(completedPercent: Int): Int =
    completedPercent.coerceIn(0, 100)

internal fun speechModelPreparation(
    requestedLocaleTag: String,
    installedOnDeviceLanguages: Collection<String>,
    pendingOnDeviceLanguages: Collection<String>,
    supportedOnDeviceLanguages: Collection<String>
): SpeechModelPreparation {
  fun matchesRequestedLocale(candidateLocaleTag: String): Boolean {
    val requested = Locale.forLanguageTag(requestedLocaleTag.replace('_', '-'))
    val candidate = Locale.forLanguageTag(candidateLocaleTag.replace('_', '-'))
    if (requested.language.isBlank() || candidate.language.isBlank()) {
      return requestedLocaleTag.equals(candidateLocaleTag, ignoreCase = true)
    }
    if (!requested.language.equals(candidate.language, ignoreCase = true)) {
      return false
    }

    val regionsMatch =
        requested.country.isBlank() ||
            candidate.country.isBlank() ||
            requested.country.equals(candidate.country, ignoreCase = true)
    val scriptsMatch =
        requested.script.isBlank() ||
            candidate.script.isBlank() ||
            requested.script.equals(candidate.script, ignoreCase = true)
    return regionsMatch && scriptsMatch
  }

  if (installedOnDeviceLanguages.any(::matchesRequestedLocale)) {
    return SpeechModelPreparation.READY
  }
  if (pendingOnDeviceLanguages.any(::matchesRequestedLocale)) {
    return SpeechModelPreparation.PENDING
  }
  if (supportedOnDeviceLanguages.any(::matchesRequestedLocale)) {
    return SpeechModelPreparation.DOWNLOAD
  }

  return if (installedOnDeviceLanguages.isEmpty() &&
      pendingOnDeviceLanguages.isEmpty() &&
      supportedOnDeviceLanguages.isEmpty()) {
    SpeechModelPreparation.UNKNOWN
  } else {
    SpeechModelPreparation.UNSUPPORTED
  }
}

class LocalSubOfflineModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()
  private val mainHandler = Handler(Looper.getMainLooper())
  private val videoExporter = LocalSubVideoExporter(reactContext)
  private val preferences =
      reactContext.getSharedPreferences("LocalSubOfflineModule", Context.MODE_PRIVATE)

  override fun getName(): String = NAME

  override fun invalidate() {
    videoExporter.cancelAll()
    executor.shutdownNow()
    super.invalidate()
  }

  @ReactMethod
  fun requestAuthorizations(promise: Promise) {
    requestRecordAudioPermission { status ->
      val response = Arguments.createMap()
      response.putString("photoLibrary", "authorized")
      response.putString("photoAddOnly", "authorized")
      response.putString("speech", status)
      promise.resolve(response)
    }
  }

  @ReactMethod
  fun getSpeechAuthorizationStatus(promise: Promise) {
    promise.resolve(speechAuthorizationStatus())
  }

  @ReactMethod
  fun requestSpeechAuthorization(promise: Promise) {
    requestRecordAudioPermission { status ->
      promise.resolve(status)
    }
  }

  @ReactMethod
  fun getNotificationAuthorizationStatus(promise: Promise) {
    promise.resolve(notificationAuthorizationStatus())
  }

  @ReactMethod
  fun requestNotificationAuthorization(promise: Promise) {
    if (notificationAuthorizationStatus() == "authorized" ||
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      promise.resolve(notificationAuthorizationStatus())
      return
    }

    val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
    if (activity == null) {
      promise.resolve(notificationAuthorizationStatus())
      return
    }

    preferences.edit().putBoolean(KEY_NOTIFICATIONS_REQUESTED, true).apply()
    activity.requestPermissions(
        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
        REQUEST_POST_NOTIFICATIONS,
        PermissionListener { requestCode, _, _ ->
          if (requestCode != REQUEST_POST_NOTIFICATIONS) {
            return@PermissionListener false
          }

          promise.resolve(notificationAuthorizationStatus())
          true
        })
  }

  @ReactMethod
  fun scheduleInactivityReminders(reminders: ReadableArray, promise: Promise) {
    if (notificationAuthorizationStatus() != "authorized") {
      promise.resolve(false)
      return
    }

    val parsedReminders =
        (0 until reminders.size()).mapNotNull { index ->
          val reminder = reminders.getMap(index) ?: return@mapNotNull null
          val id = reminder.getString("id")?.trim().orEmpty()
          val title = reminder.getString("title")?.trim().orEmpty()
          val body = reminder.getString("body")?.trim().orEmpty()
          val delaySeconds =
              if (reminder.hasKey("delaySeconds")) reminder.getDouble("delaySeconds").toLong()
              else 0L

          if (id.isBlank() || title.isBlank() || body.isBlank() || delaySeconds <= 0) {
            null
          } else {
            LocalSubReminder(id, title, body, delaySeconds)
          }
        }

    LocalSubReminderScheduler.schedule(reactContext, parsedReminders)
    promise.resolve(true)
  }

  @ReactMethod
  fun cancelInactivityReminders(promise: Promise) {
    LocalSubReminderScheduler.cancel(reactContext)
    promise.resolve(null)
  }

  private fun notificationAuthorizationStatus(): String {
    val notificationsEnabled =
        NotificationManagerCompat.from(reactContext).areNotificationsEnabled()

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return if (notificationsEnabled) "authorized" else "denied"
    }

    val permissionGranted =
        ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
    if (permissionGranted && notificationsEnabled) {
      return "authorized"
    }

    return if (preferences.getBoolean(KEY_NOTIFICATIONS_REQUESTED, false)) {
      "denied"
    } else {
      "not_determined"
    }
  }

  private fun requestRecordAudioPermission(onResult: (String) -> Unit) {
    if (speechAuthorizationStatus() == "authorized") {
      onResult("authorized")
      return
    }

    val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
    if (activity == null) {
      onResult(speechAuthorizationStatus())
      return
    }

    preferences.edit().putBoolean(KEY_RECORD_AUDIO_REQUESTED, true).apply()
    activity.requestPermissions(
        arrayOf(Manifest.permission.RECORD_AUDIO),
        REQUEST_RECORD_AUDIO,
        PermissionListener { requestCode, _, _ ->
          if (requestCode != REQUEST_RECORD_AUDIO) {
            return@PermissionListener false
          }

          onResult(speechAuthorizationStatus())
          true
        })
  }

  @ReactMethod
  fun getDeviceLocale(promise: Promise) {
    promise.resolve(Locale.getDefault().toLanguageTag())
  }

  @ReactMethod
  fun getAvailableSpeechLocales(promise: Promise) {
    val locales = listOf(
        "en-US",
        "en-GB",
        "es-ES",
        "pt-BR",
        "fr-FR",
        "de-DE",
        "it-IT",
        "ru-RU",
        "ja-JP",
        "ko-KR",
        "zh-CN",
        "ar-SA")

    val currentLanguage = Locale.getDefault().language
    val sortedLocales =
        locales.sortedWith(compareBy<String> { Locale.forLanguageTag(it).language != currentLanguage }
            .thenBy { labelForLocale(it) })

    val response = Arguments.createArray()
    sortedLocales.forEach { localeTag ->
      val item = Arguments.createMap()
      item.putString("label", labelForLocale(localeTag))
      item.putString("value", localeTag)
      response.pushMap(item)
    }
    promise.resolve(response)
  }

  @ReactMethod
  fun prepareProject(videoURI: String, locale: String?, promise: Promise) {
    executor.execute {
      val temporaryFiles = mutableListOf<File>()
      try {
        val persistedVideo = persistProjectMediaFile(videoURI)
        val metadata = readVideoMetadata(persistedVideo)
        val thumbnail = generateThumbnail(persistedVideo)
        val response = Arguments.createMap()
        var waveform = defaultWaveform()
        var subtitles = emptyList<SubtitleSegment>()
        var recognitionStatus = "manual"
        var recognitionLocale: String? = null
        var recognitionMode = "auto"
        var errorMessage: String? = null

        if (!hasAudioTrack(persistedVideo)) {
          errorMessage = "Selected video has no audio track"
        } else {
          try {
            val pcm = decodeAudioToPcm(persistedVideo, temporaryFiles)
            waveform = generateWaveform(pcm)

            val localeOverride = locale?.trim().orEmpty()
            val resolvedLocale =
                if (localeOverride.isNotEmpty()) {
                  normalizeLocaleTag(localeOverride)
                } else {
                  Locale.getDefault().toLanguageTag()
                }
            recognitionMode = if (localeOverride.isNotEmpty()) "manual" else "auto"
            recognitionLocale = resolvedLocale
            subtitles = recognizeSpeech(pcm, resolvedLocale, temporaryFiles)
            recognitionStatus = if (subtitles.isEmpty()) "manual" else "ready"
            if (subtitles.isEmpty()) {
              errorMessage = "No speech was recognized in the selected video."
            }
          } catch (error: Exception) {
            recognitionStatus = "failed"
            errorMessage = error.message ?: "Speech recognition failed."
          }
        }

        response.putInt("duration", metadata.durationMs)
        response.putString("videoUri", Uri.fromFile(persistedVideo).toString())
        response.putString("videoFileName", persistedVideo.name)
        response.putString("thumbnailUri", Uri.fromFile(thumbnail).toString())
        response.putString("thumbnailFileName", thumbnail.name)
        response.putInt("width", metadata.width)
        response.putInt("height", metadata.height)
        response.putArray("waveform", doubleArrayToWritableArray(waveform))
        response.putArray("subtitles", subtitlesToWritableArray(subtitles))
        response.putInt("transcriptTimeOffsetMs", 0)
        response.putString("recognitionStatus", recognitionStatus)
        recognitionLocale?.let { response.putString("recognitionLocale", it) }
        response.putString("recognitionMode", recognitionMode)
        errorMessage?.let { response.putString("errorMessage", it) }
        promise.resolve(response)
      } catch (error: Exception) {
        promise.reject("prepare_failed", error.message ?: "Unable to prepare project.", error)
      } finally {
        temporaryFiles.forEach { it.delete() }
      }
    }
  }

  @ReactMethod
  fun persistProjectVideo(videoURI: String, promise: Promise) {
    executor.execute {
      try {
        val persistedVideo = persistProjectMediaFile(videoURI)
        val response = Arguments.createMap()
        response.putString("videoUri", Uri.fromFile(persistedVideo).toString())
        response.putString("videoFileName", persistedVideo.name)
        promise.resolve(response)
      } catch (error: Exception) {
        promise.reject("persist_video_failed", error.message ?: "Unable to persist video.", error)
      }
    }
  }

  @ReactMethod
  fun resolveProjectMedia(payload: com.facebook.react.bridge.ReadableMap, promise: Promise) {
    executor.execute {
      try {
        val videoFileName =
            if (payload.hasKey("videoFileName") && !payload.isNull("videoFileName")) {
              payload.getString("videoFileName")
            } else {
              null
            }
        val thumbnailFileName =
            if (payload.hasKey("thumbnailFileName") && !payload.isNull("thumbnailFileName")) {
              payload.getString("thumbnailFileName")
            } else {
              null
            }
        val videoUri =
            if (payload.hasKey("videoURI") && !payload.isNull("videoURI")) {
              payload.getString("videoURI")
            } else {
              null
            }
        val thumbnailUri =
            if (payload.hasKey("thumbnailUri") && !payload.isNull("thumbnailUri")) {
              payload.getString("thumbnailUri")
            } else {
              null
            }

        val videoFile = resolveProjectMediaFile(videoFileName, videoUri, "mp4")
        val thumbnailFile =
            resolveProjectMediaFile(thumbnailFileName, thumbnailUri, "jpg")
                ?: videoFile?.let { generateThumbnail(it) }

        val response = Arguments.createMap()
        videoFile?.let {
          response.putString("videoUri", Uri.fromFile(it).toString())
          response.putString("videoFileName", it.name)
        }
        thumbnailFile?.let {
          response.putString("thumbnailUri", Uri.fromFile(it).toString())
          response.putString("thumbnailFileName", it.name)
        }
        promise.resolve(response)
      } catch (error: Exception) {
        promise.reject("resolve_media_failed", error.message ?: "Unable to resolve media.", error)
      }
    }
  }

  @ReactMethod
  fun exportProject(payload: ReadableMap, promise: Promise) {
    executor.execute {
      try {
        val videoUri = payload.optionalString("videoURI")
            ?: throw IOException("Choose a video before exporting.")
        val sourceFile =
            resolveProjectMediaFile(fileName = null, uri = videoUri, fallbackExtension = "mp4")
                ?: throw IOException("The source video could not be opened.")
        val subtitles = parseExportSubtitles(payload.optionalArray("subtitles"))
        val style = parseExportSubtitleStyle(payload.optionalMap("style"))
        val resolution = payload.optionalString("resolution") ?: "1080p"

        videoExporter.export(sourceFile, subtitles, style, resolution) { result ->
          result.fold(
              onSuccess = { outputFile ->
                val response = Arguments.createMap()
                response.putString("outputUri", Uri.fromFile(outputFile).toString())
                promise.resolve(response)
              },
              onFailure = { error ->
                promise.reject(
                    "export_failed",
                    error.message ?: "Unable to export the video.",
                    error)
              })
        }
      } catch (error: Exception) {
        promise.reject("export_failed", error.message ?: "Unable to export the video.", error)
      }
    }
  }

  @ReactMethod
  fun saveVideoToPhotos(videoURI: String, promise: Promise) {
    val saveVideo = {
      executor.execute {
        try {
          val localIdentifier = videoExporter.saveToPhotos(videoURI)
          runCatching { videoExporter.deleteTemporaryExport(videoURI) }
          val response = Arguments.createMap()
          response.putString("localIdentifier", localIdentifier.toString())
          promise.resolve(response)
        } catch (error: Exception) {
          promise.reject(
              "save_video_failed",
              error.message ?: "Unable to save the video to Photos.",
              error)
        }
      }
    }

    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
        ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
      val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
      if (activity == null) {
        promise.reject(
            "photo_permission_denied",
            "Storage permission is required to save the exported video.")
        return
      }

      activity.requestPermissions(
          arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
          REQUEST_WRITE_EXTERNAL_STORAGE,
          PermissionListener { requestCode, _, grantResults ->
            if (requestCode != REQUEST_WRITE_EXTERNAL_STORAGE) {
              return@PermissionListener false
            }
            if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
              saveVideo()
            } else {
              promise.reject(
                  "photo_permission_denied",
                  "Storage permission is required to save the exported video.")
            }
            true
          })
      return
    }

    saveVideo()
  }

  private fun parseExportSubtitles(rawSubtitles: ReadableArray?): List<ExportSubtitle> {
    if (rawSubtitles == null) {
      return emptyList()
    }

    return (0 until rawSubtitles.size())
        .mapNotNull { index ->
          val rawSubtitle = rawSubtitles.getMap(index) ?: return@mapNotNull null
          val text = rawSubtitle.optionalString("text")?.trim().orEmpty()
          val startTimeMs = rawSubtitle.optionalDouble("startTime")?.roundToInt() ?: 0
          val endTimeMs = rawSubtitle.optionalDouble("endTime")?.roundToInt() ?: 0
          if (text.isBlank() || endTimeMs <= startTimeMs) {
            return@mapNotNull null
          }

          val rawWords = rawSubtitle.optionalArray("words")
          val words =
              if (rawWords == null) {
                emptyList()
              } else {
                (0 until rawWords.size())
                    .mapNotNull { wordIndex ->
                      val rawWord = rawWords.getMap(wordIndex) ?: return@mapNotNull null
                      val wordText = rawWord.optionalString("text")?.trim().orEmpty()
                      val wordStart = rawWord.optionalDouble("startTime")?.roundToInt() ?: 0
                      val wordEnd = rawWord.optionalDouble("endTime")?.roundToInt() ?: 0
                      if (wordText.isBlank() || wordEnd <= wordStart) {
                        null
                      } else {
                        ExportSubtitleWord(wordText, wordStart, wordEnd)
                      }
                    }
                    .sortedWith(
                        compareBy(ExportSubtitleWord::startTimeMs, ExportSubtitleWord::endTimeMs))
              }

          ExportSubtitle(text, startTimeMs, endTimeMs, words)
        }
        .sortedWith(compareBy(ExportSubtitle::startTimeMs, ExportSubtitle::endTimeMs))
  }

  private fun parseExportSubtitleStyle(rawStyle: ReadableMap?): ExportSubtitleStyle {
    if (rawStyle == null) {
      return ExportSubtitleStyle()
    }

    val fontWeight =
        rawStyle.optionalString("fontWeight")?.toIntOrNull()
            ?: rawStyle.optionalDouble("fontWeight")?.roundToInt()
            ?: 800
    val position = rawStyle.optionalString("position").takeIf { it in setOf("top", "middle", "bottom") }
        ?: "bottom"

    return ExportSubtitleStyle(
        fontFamily = rawStyle.optionalString("fontFamily") ?: "System",
        fontWeight = fontWeight.coerceIn(100, 1_000),
        fontSize =
            rawStyle.optionalDouble("fontSize")
                ?.takeIf(Double::isFinite)
                ?.toFloat()
                ?.coerceIn(8f, 256f)
                ?: 34f,
        letterSpacing =
            rawStyle.optionalDouble("letterSpacing")
                ?.takeIf(Double::isFinite)
                ?.toFloat()
                ?.coerceIn(-4f, 24f)
                ?: 0.3f,
        textColor = rawStyle.optionalString("textColor") ?: "#FFFFFF",
        backgroundColor =
            rawStyle.optionalString("backgroundColor") ?: "rgba(10, 10, 12, 0.62)",
        accentColor = rawStyle.optionalString("accentColor") ?: "#12E5FF",
        wordHighlightEnabled = rawStyle.optionalBoolean("wordHighlightEnabled") ?: true,
        position = position,
        positionOffsetYRatio =
            rawStyle.optionalDouble("positionOffsetYRatio")
                ?.takeIf(Double::isFinite)
                ?.toFloat()
                ?: 0f,
        uppercase = rawStyle.optionalString("casing") == "uppercase")
  }

  private fun ReadableMap.optionalString(key: String): String? =
      if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.String) getString(key) else null

  private fun ReadableMap.optionalDouble(key: String): Double? =
      if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Number) getDouble(key) else null

  private fun ReadableMap.optionalBoolean(key: String): Boolean? =
      if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Boolean) getBoolean(key) else null

  private fun ReadableMap.optionalArray(key: String): ReadableArray? =
      if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Array) getArray(key) else null

  private fun ReadableMap.optionalMap(key: String): ReadableMap? =
      if (hasKey(key) && !isNull(key) && getType(key) == ReadableType.Map) getMap(key) else null

  private fun speechAuthorizationStatus(): String {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return "authorized"
    }

    val granted =
        reactContext.checkSelfPermission(Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    if (granted) {
      return "authorized"
    }

    return if (preferences.getBoolean(KEY_RECORD_AUDIO_REQUESTED, false)) {
      "denied"
    } else {
      "not_determined"
    }
  }

  private fun labelForLocale(localeTag: String): String {
    val locale = Locale.forLanguageTag(localeTag)
    val label = locale.getDisplayName(Locale.getDefault())
    return label.replaceFirstChar { if (it.isLowerCase()) it.titlecase(locale) else it.toString() }
  }

  private fun projectMediaDirectory(): File {
    val directory = File(reactContext.filesDir, PROJECT_MEDIA_DIRECTORY)
    if (!directory.exists() && !directory.mkdirs()) {
      throw IOException("Unable to open app media storage.")
    }
    return directory
  }

  private fun persistProjectMediaFile(videoURI: String): File {
    val sourceUri = Uri.parse(videoURI)
    val existingFile = fileFromUri(sourceUri)
    val mediaDirectory = projectMediaDirectory()

    if (existingFile != null &&
        existingFile.exists() &&
        existingFile.parentFile?.canonicalPath == mediaDirectory.canonicalPath) {
      return existingFile
    }

    val displayName = displayNameForUri(sourceUri)
    val extension = extensionForName(displayName) ?: "mp4"
    val output = File(mediaDirectory, "${UUID.randomUUID()}.$extension")

    if (existingFile != null && existingFile.exists()) {
      existingFile.inputStream().use { input ->
        output.outputStream().use { outputStream -> input.copyTo(outputStream) }
      }
      return output
    }

    reactContext.contentResolver.openInputStream(sourceUri)?.use { input ->
      output.outputStream().use { outputStream -> input.copyTo(outputStream) }
    } ?: throw IOException("Selected video could not be opened.")

    return output
  }

  private fun resolveProjectMediaFile(
      fileName: String?,
      uri: String?,
      fallbackExtension: String
  ): File? {
    val mediaDirectory = projectMediaDirectory()
    if (!fileName.isNullOrBlank()) {
      val candidate = File(mediaDirectory, fileName)
      if (candidate.exists()) {
        return candidate
      }
    }

    if (uri.isNullOrBlank()) {
      return null
    }

    val parsedUri = Uri.parse(uri)
    val existingFile = fileFromUri(parsedUri)
    if (existingFile != null && existingFile.exists()) {
      return existingFile
    }

    val output = File(mediaDirectory, "${UUID.randomUUID()}.$fallbackExtension")
    reactContext.contentResolver.openInputStream(parsedUri)?.use { input ->
      output.outputStream().use { outputStream -> input.copyTo(outputStream) }
    } ?: return null

    return output
  }

  private fun fileFromUri(uri: Uri): File? {
    return when (uri.scheme) {
      null -> File(uri.path ?: return null)
      "file" -> File(uri.path ?: return null)
      else -> null
    }
  }

  private fun displayNameForUri(uri: Uri): String? {
    if (uri.scheme == "content") {
      reactContext.contentResolver
          .query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
          ?.use { cursor ->
            if (cursor.moveToFirst()) {
              val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
              if (index >= 0) {
                return cursor.getString(index)
              }
            }
          }
    }

    return uri.lastPathSegment
  }

  private fun extensionForName(name: String?): String? {
    val extension = name?.substringAfterLast('.', missingDelimiterValue = "")?.lowercase()
    return extension?.takeIf { it.isNotBlank() && it.length <= 8 }
  }

  private fun readVideoMetadata(videoFile: File): VideoMetadata {
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(videoFile.absolutePath)
      val durationMs =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toIntOrNull()
              ?: 0
      val rawWidth =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()
              ?: 1080
      val rawHeight =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()
              ?: 1920
      val rotation =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull()
              ?: 0
      val rotated = rotation == 90 || rotation == 270
      return VideoMetadata(
          durationMs = durationMs,
          width = if (rotated) rawHeight else rawWidth,
          height = if (rotated) rawWidth else rawHeight)
    } finally {
      retriever.release()
    }
  }

  private fun generateThumbnail(videoFile: File): File {
    val output = File(projectMediaDirectory(), "${UUID.randomUUID()}.jpg")
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(videoFile.absolutePath)
      val bitmap =
          retriever.getFrameAtTime(200_000, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
              ?: retriever.frameAtTime
              ?: throw IOException("Unable to generate a video thumbnail.")
      FileOutputStream(output).use { stream ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 84, stream)
      }
      return output
    } finally {
      retriever.release()
    }
  }

  private fun hasAudioTrack(videoFile: File): Boolean {
    val extractor = MediaExtractor()
    try {
      extractor.setDataSource(videoFile.absolutePath)
      for (index in 0 until extractor.trackCount) {
        val mime = extractor.getTrackFormat(index).getString(MediaFormat.KEY_MIME)
        if (mime?.startsWith("audio/") == true) {
          return true
        }
      }
      return false
    } finally {
      extractor.release()
    }
  }

  private fun decodeAudioToPcm(videoFile: File, temporaryFiles: MutableList<File>): PcmAudio {
    val extractor = MediaExtractor()
    var decoder: MediaCodec? = null
    val outputFile = File.createTempFile("localsub-audio-", ".pcm", reactContext.cacheDir)
    temporaryFiles.add(outputFile)

    try {
      extractor.setDataSource(videoFile.absolutePath)
      var audioTrackIndex = -1
      var inputFormat: MediaFormat? = null

      for (index in 0 until extractor.trackCount) {
        val candidateFormat = extractor.getTrackFormat(index)
        val mime = candidateFormat.getString(MediaFormat.KEY_MIME)
        if (mime?.startsWith("audio/") == true) {
          audioTrackIndex = index
          inputFormat = candidateFormat
          break
        }
      }

      if (audioTrackIndex < 0 || inputFormat == null) {
        throw IOException("Selected video has no audio track")
      }

      extractor.selectTrack(audioTrackIndex)
      val mime = inputFormat.getString(MediaFormat.KEY_MIME)
          ?: throw IOException("Audio track format is unsupported.")
      decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(inputFormat, null, null, 0)
      decoder.start()

      var sampleRate =
          if (inputFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
            inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
          } else {
            DEFAULT_SAMPLE_RATE
          }
      var channelCount =
          if (inputFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
            inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
          } else {
            DEFAULT_CHANNEL_COUNT
          }
      var outputEncoding = AudioFormat.ENCODING_PCM_16BIT
      val bufferInfo = MediaCodec.BufferInfo()
      var inputDone = false
      var outputDone = false

      BufferedOutputStream(FileOutputStream(outputFile)).use { output ->
        while (!outputDone) {
          if (!inputDone) {
            val inputBufferIndex = decoder.dequeueInputBuffer(CODEC_TIMEOUT_US)
            if (inputBufferIndex >= 0) {
              val inputBuffer = decoder.getInputBuffer(inputBufferIndex)
              inputBuffer?.clear()
              val sampleSize =
                  if (inputBuffer != null) extractor.readSampleData(inputBuffer, 0) else -1

              if (sampleSize < 0) {
                decoder.queueInputBuffer(
                    inputBufferIndex,
                    0,
                    0,
                    0,
                    MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                inputDone = true
              } else {
                decoder.queueInputBuffer(
                    inputBufferIndex,
                    0,
                    sampleSize,
                    extractor.sampleTime,
                    0)
                extractor.advance()
              }
            }
          }

          when (val outputBufferIndex = decoder.dequeueOutputBuffer(bufferInfo, CODEC_TIMEOUT_US)) {
            MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
              val outputFormat = decoder.outputFormat
              if (outputFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
                sampleRate = outputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
              }
              if (outputFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
                channelCount = outputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
              }
              if (outputFormat.containsKey(MediaFormat.KEY_PCM_ENCODING)) {
                outputEncoding = outputFormat.getInteger(MediaFormat.KEY_PCM_ENCODING)
              }
            }
            MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
            else -> {
              if (outputBufferIndex >= 0) {
                val outputBuffer = decoder.getOutputBuffer(outputBufferIndex)
                if (outputBuffer != null && bufferInfo.size > 0) {
                  outputBuffer.position(bufferInfo.offset)
                  outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                  writePcm16(outputBuffer.slice(), outputEncoding, output)
                }

                if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                  outputDone = true
                }
                decoder.releaseOutputBuffer(outputBufferIndex, false)
              }
            }
          }
        }
      }

      val bytesPerFrame = max(1, channelCount) * BYTES_PER_PCM_16_SAMPLE
      val durationMs =
          if (sampleRate > 0 && outputFile.length() > 0) {
            ((outputFile.length() / bytesPerFrame).toDouble() / sampleRate * 1000).roundToInt()
          } else {
            0
          }

      return PcmAudio(
          file = outputFile,
          sampleRate = sampleRate,
          channelCount = max(1, channelCount),
          durationMs = durationMs)
    } finally {
      decoder?.stop()
      decoder?.release()
      extractor.release()
    }
  }

  private fun writePcm16(
      buffer: ByteBuffer,
      sourceEncoding: Int,
      output: BufferedOutputStream
  ) {
    when (sourceEncoding) {
      AudioFormat.ENCODING_PCM_FLOAT -> {
        val floatBuffer = buffer.order(ByteOrder.nativeOrder()).asFloatBuffer()
        val bytes = ByteArray(floatBuffer.remaining() * BYTES_PER_PCM_16_SAMPLE)
        var byteIndex = 0
        while (floatBuffer.hasRemaining()) {
          val clamped = floatBuffer.get().coerceIn(-1f, 1f)
          val sample = (clamped * Short.MAX_VALUE).roundToInt().toShort()
          bytes[byteIndex++] = (sample.toInt() and 0xFF).toByte()
          bytes[byteIndex++] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        output.write(bytes)
      }
      else -> {
        val bytes = ByteArray(buffer.remaining())
        buffer.get(bytes)
        output.write(bytes)
      }
    }
  }

  private fun generateWaveform(pcm: PcmAudio, bucketCount: Int = WAVEFORM_BUCKET_COUNT): DoubleArray {
    if (pcm.file.length() <= 0) {
      return defaultWaveform(bucketCount)
    }

    val bytesPerFrame = pcm.channelCount * BYTES_PER_PCM_16_SAMPLE
    val totalFrames = max(1L, pcm.file.length() / bytesPerFrame)
    val bucketFrames = max(1L, totalFrames / bucketCount)
    val sums = DoubleArray(bucketCount)
    val counts = IntArray(bucketCount)
    val readSize = (PCM_READ_BUFFER_SIZE / bytesPerFrame) * bytesPerFrame
    val buffer = ByteArray(max(bytesPerFrame, readSize))
    var frameIndex = 0L

    BufferedInputStream(FileInputStream(pcm.file)).use { input ->
      while (true) {
        val read = input.read(buffer)
        if (read <= 0) {
          break
        }
        val completeBytes = read - (read % bytesPerFrame)
        var offset = 0
        while (offset < completeBytes) {
          var amplitude = 0.0
          for (channel in 0 until pcm.channelCount) {
            val sampleOffset = offset + channel * BYTES_PER_PCM_16_SAMPLE
            val sample =
                ((buffer[sampleOffset + 1].toInt() shl 8) or
                    (buffer[sampleOffset].toInt() and 0xFF))
                    .toShort()
            amplitude += abs(sample.toDouble()) / Short.MAX_VALUE
          }

          val bucketIndex = min(bucketCount - 1, (frameIndex / bucketFrames).toInt())
          val normalizedAmplitude = amplitude / pcm.channelCount
          sums[bucketIndex] += normalizedAmplitude * normalizedAmplitude
          counts[bucketIndex] += 1
          frameIndex += 1
          offset += bytesPerFrame
        }
      }
    }

    return DoubleArray(bucketCount) { index ->
      if (counts[index] == 0) {
        0.16
      } else {
        min(0.94, max(0.12, sqrt(sums[index] / counts[index]) * 1.9))
      }
    }
  }

  private fun recognizeSpeech(
      pcm: PcmAudio,
      localeTag: String,
      temporaryFiles: MutableList<File>
  ): List<SubtitleSegment> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      throw IOException("Video speech recognition requires Android 13 or later.")
    }

    if (!SpeechRecognizer.isOnDeviceRecognitionAvailable(reactContext)) {
      throw IOException("On-device speech recognition is not available on this device.")
    }

    ensureOnDeviceSpeechModel(localeTag)

    val segments = mutableListOf<SubtitleSegment>()
    val chunkDurationMs = RECOGNITION_CHUNK_DURATION_MS
    var chunkStartMs = 0
    var firstFailure: Exception? = null

    while (chunkStartMs < pcm.durationMs) {
      val chunkLengthMs = min(chunkDurationMs, pcm.durationMs - chunkStartMs)
      val chunkFile = copyPcmChunk(pcm, chunkStartMs, chunkLengthMs)
      temporaryFiles.add(chunkFile)

      try {
        segments.addAll(
            recognizePcmChunk(
                chunkFile = chunkFile,
                sampleRate = pcm.sampleRate,
                channelCount = pcm.channelCount,
                localeTag = localeTag,
                chunkStartMs = chunkStartMs,
                chunkDurationMs = chunkLengthMs))
      } catch (error: RecognitionFailure) {
        if (error.isRecoverableNoMatch()) {
          if (firstFailure == null) {
            firstFailure = error
          }
        } else {
          throw error
        }
      }

      chunkStartMs += chunkLengthMs
    }

    val cleanedSegments = segments
        .filter { it.text.isNotBlank() && it.endTime > it.startTime }
        .sortedWith(compareBy<SubtitleSegment> { it.startTime }.thenBy { it.endTime })

    if (cleanedSegments.isEmpty()) {
      firstFailure?.let { throw it }
      return emptyList()
    }

    validateTranscriptScript(localeTag, cleanedSegments.joinToString(" ") { it.text })
    return cleanedSegments
  }

  private fun copyPcmChunk(pcm: PcmAudio, startMs: Int, durationMs: Int): File {
    val bytesPerFrame = pcm.channelCount * BYTES_PER_PCM_16_SAMPLE
    val startFrame = (startMs.toLong() * pcm.sampleRate) / 1000
    val frameCount = max(1L, (durationMs.toLong() * pcm.sampleRate) / 1000)
    val startByte = startFrame * bytesPerFrame
    val byteCount = min(frameCount * bytesPerFrame, pcm.file.length() - startByte)
    val outputFile = File.createTempFile("localsub-audio-chunk-", ".pcm", reactContext.cacheDir)

    RandomAccessFile(pcm.file, "r").use { input ->
      input.seek(startByte)
      FileOutputStream(outputFile).use { output ->
        val buffer = ByteArray(PCM_READ_BUFFER_SIZE)
        var remaining = byteCount
        while (remaining > 0) {
          val read = input.read(buffer, 0, min(buffer.size.toLong(), remaining).toInt())
          if (read <= 0) {
            break
          }
          output.write(buffer, 0, read)
          remaining -= read
        }
      }
    }

    return outputFile
  }

  private fun recognizePcmChunk(
      chunkFile: File,
      sampleRate: Int,
      channelCount: Int,
      localeTag: String,
      chunkStartMs: Int,
      chunkDurationMs: Int
  ): List<SubtitleSegment> {
    var modelDownloadAttempted = false
    var serviceReconnectAttempted = false

    while (true) {
      try {
        return recognizePcmChunkOnce(
            chunkFile = chunkFile,
            sampleRate = sampleRate,
            channelCount = channelCount,
            localeTag = localeTag,
            chunkStartMs = chunkStartMs,
            chunkDurationMs = chunkDurationMs)
      } catch (error: RecognitionFailure) {
        when (
            speechRecognitionRecovery(
                error.errorCode,
                modelDownloadAttempted,
                serviceReconnectAttempted)) {
          SpeechRecognitionRecovery.DOWNLOAD_MODEL_AND_RETRY -> {
            modelDownloadAttempted = true
            downloadOnDeviceSpeechModel(localeTag, error.errorCode)
          }
          SpeechRecognitionRecovery.RETRY_AFTER_SERVICE_RECONNECT -> {
            serviceReconnectAttempted = true
            SystemClock.sleep(SPEECH_SERVICE_RECONNECT_DELAY_MS)
          }
          SpeechRecognitionRecovery.FAIL -> throw error
        }
      }
    }
  }

  private fun recognizePcmChunkOnce(
      chunkFile: File,
      sampleRate: Int,
      channelCount: Int,
      localeTag: String,
      chunkStartMs: Int,
      chunkDurationMs: Int
  ): List<SubtitleSegment> {
    val latch = CountDownLatch(1)
    val finished = AtomicBoolean(false)
    val segments = mutableListOf<SubtitleSegment>()
    val errors = mutableListOf<RecognitionFailure>()
    val untimedSegmentResults = mutableListOf<RecognitionText>()
    var finalUntimedResult: RecognitionText? = null
    val recognizerRef = AtomicReference<SpeechRecognizer?>()
    val pipe = ParcelFileDescriptor.createPipe()
    val audioSource = pipe[0]
    val audioSink = pipe[1]

    fun finish() {
      if (finished.compareAndSet(false, true)) {
        latch.countDown()
      }
    }

    fun appendUntimedFallback() {
      if (segments.isNotEmpty()) {
        return
      }

      val fallback = finalUntimedResult ?: mergeRecognitionTexts(untimedSegmentResults)
      if (fallback != null) {
        segments.addAll(
            segmentsFromUntimedTranscript(fallback, chunkStartMs, chunkDurationMs))
      }
    }

    mainHandler.post {
      try {
        val recognizer = createVideoSpeechRecognizer()
        recognizerRef.set(recognizer)
        val intent = IntentFactory.createSpeechIntent(
            pfd = audioSource,
            sampleRate = sampleRate,
            channelCount = channelCount,
            localeTag = localeTag)

        recognizer.setRecognitionListener(
            object : RecognitionListener {
              override fun onReadyForSpeech(params: Bundle?) = Unit
              override fun onBeginningOfSpeech() = Unit
              override fun onRmsChanged(rmsdB: Float) = Unit
              override fun onBufferReceived(buffer: ByteArray?) = Unit
              override fun onEndOfSpeech() = Unit
              override fun onPartialResults(partialResults: Bundle?) = Unit
              override fun onEvent(eventType: Int, params: Bundle?) = Unit

              override fun onError(error: Int) {
                errors.add(RecognitionFailure(error, speechErrorMessage(error)))
                recognizerRef.compareAndSet(recognizer, null)
                recognizer.destroy()
                finish()
              }

              override fun onResults(results: Bundle?) {
                if (results != null) {
                  val timedWords = timedWordsFromRecognitionParts(results)
                  if (timedWords.isNotEmpty()) {
                    segments.addAll(
                        segmentsFromRecognitionParts(
                            timedWords, chunkStartMs, chunkDurationMs))
                  } else {
                    finalUntimedResult = recognitionTextFromBundle(results)
                  }
                }
                appendUntimedFallback()
                recognizerRef.compareAndSet(recognizer, null)
                recognizer.destroy()
                finish()
              }

              override fun onSegmentResults(segmentResults: Bundle) {
                val timedWords = timedWordsFromRecognitionParts(segmentResults)
                if (timedWords.isNotEmpty()) {
                  segments.addAll(
                      segmentsFromRecognitionParts(
                          timedWords, chunkStartMs, chunkDurationMs))
                } else {
                  recognitionTextFromBundle(segmentResults)?.let {
                    untimedSegmentResults.add(it)
                  }
                }
              }

              override fun onEndOfSegmentedSession() {
                appendUntimedFallback()
                recognizerRef.compareAndSet(recognizer, null)
                recognizer.destroy()
                finish()
              }
            })

        recognizer.startListening(intent)
        streamPcmAtRealtime(
            chunkFile = chunkFile,
            destination = audioSink,
            sampleRate = sampleRate,
            channelCount = channelCount,
            isFinished = finished,
            onFailure = { error ->
              errors.add(
                  RecognitionFailure(
                      null,
                      error.message ?: "Unable to stream audio for speech recognition."))
              mainHandler.post {
                recognizerRef.getAndSet(null)?.let { activeRecognizer ->
                  activeRecognizer.cancel()
                  activeRecognizer.destroy()
                }
              }
              finish()
            })
      } catch (error: Exception) {
        errors.add(RecognitionFailure(null, error.message ?: "Speech recognition failed."))
        recognizerRef.getAndSet(null)?.destroy()
        closeQuietly(audioSink)
        finish()
      }
    }

    val timeoutMs = max(MIN_RECOGNITION_TIMEOUT_MS, chunkDurationMs * 3L + 30_000L)
    val completed = latch.await(timeoutMs, TimeUnit.MILLISECONDS)
    closeQuietly(audioSource)
    closeQuietly(audioSink)

    if (!completed) {
      mainHandler.post {
        recognizerRef.getAndSet(null)?.let { recognizer ->
          recognizer.cancel()
          recognizer.destroy()
        }
      }
      throw RecognitionFailure(null, "Speech recognition timed out.")
    }

    if (segments.isEmpty() && errors.isNotEmpty()) {
      throw errors.first()
    }

    return segments
  }

  private fun ensureOnDeviceSpeechModel(localeTag: String) {
    when (queryOnDeviceSpeechModel(localeTag)) {
      SpeechModelPreparation.READY,
      SpeechModelPreparation.UNKNOWN -> Unit
      SpeechModelPreparation.DOWNLOAD -> downloadOnDeviceSpeechModel(localeTag)
      SpeechModelPreparation.PENDING -> waitForOnDeviceSpeechModel(localeTag)
      SpeechModelPreparation.UNSUPPORTED ->
        throw RecognitionFailure(
            SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED,
            "Offline speech recognition does not support $localeTag on this device.")
    }
  }

  private fun queryOnDeviceSpeechModel(localeTag: String): SpeechModelPreparation {
    val latch = CountDownLatch(1)
    val finished = AtomicBoolean(false)
    val result = AtomicReference(SpeechModelPreparation.UNKNOWN)
    val recognizerRef = AtomicReference<SpeechRecognizer?>()

    fun finish(preparation: SpeechModelPreparation) {
      if (finished.compareAndSet(false, true)) {
        result.set(preparation)
        recognizerRef.getAndSet(null)?.destroy()
        latch.countDown()
      }
    }

    mainHandler.post {
      try {
        val recognizer = createVideoSpeechRecognizer()
        recognizerRef.set(recognizer)
        recognizer.checkRecognitionSupport(
            IntentFactory.createModelDownloadIntent(localeTag),
            reactContext.mainExecutor,
            object : RecognitionSupportCallback {
              override fun onSupportResult(recognitionSupport: RecognitionSupport) {
                finish(
                    speechModelPreparation(
                        requestedLocaleTag = localeTag,
                        installedOnDeviceLanguages =
                            recognitionSupport.installedOnDeviceLanguages,
                        pendingOnDeviceLanguages = recognitionSupport.pendingOnDeviceLanguages,
                        supportedOnDeviceLanguages =
                            recognitionSupport.supportedOnDeviceLanguages))
              }

              override fun onError(error: Int) {
                finish(SpeechModelPreparation.UNKNOWN)
              }
            })
      } catch (_: Exception) {
        finish(SpeechModelPreparation.UNKNOWN)
      }
    }

    if (!latch.await(MODEL_SUPPORT_CHECK_TIMEOUT_MS, TimeUnit.MILLISECONDS)) {
      if (finished.compareAndSet(false, true)) {
        mainHandler.post { recognizerRef.getAndSet(null)?.destroy() }
      }
    }

    return result.get()
  }

  private fun downloadOnDeviceSpeechModel(localeTag: String, fallbackErrorCode: Int? = null) {
    val download = requestOnDeviceSpeechModel(localeTag)
    when (speechModelDownloadContinuation(download.status)) {
      SpeechModelDownloadContinuation.CONTINUE -> Unit
      SpeechModelDownloadContinuation.WAIT_FOR_MODEL ->
        waitForOnDeviceSpeechModel(localeTag)
      SpeechModelDownloadContinuation.FAIL ->
        throw RecognitionFailure(
            download.errorCode ?: fallbackErrorCode,
            download.message
                ?: "Unable to download the offline speech model for $localeTag. Check your connection and try again.")
    }
  }

  private fun waitForOnDeviceSpeechModel(localeTag: String) {
    emitSpeechModelDownloadProgress(localeTag, null)
    val deadline = SystemClock.elapsedRealtime() + MODEL_DOWNLOAD_READY_TIMEOUT_MS

    while (SystemClock.elapsedRealtime() < deadline) {
      when (queryOnDeviceSpeechModel(localeTag)) {
        SpeechModelPreparation.READY -> {
          emitSpeechModelDownloadReady(localeTag)
          return
        }
        SpeechModelPreparation.UNSUPPORTED ->
          throw RecognitionFailure(
              SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED,
              "Offline speech recognition does not support $localeTag on this device.")
        SpeechModelPreparation.DOWNLOAD,
        SpeechModelPreparation.PENDING,
        SpeechModelPreparation.UNKNOWN ->
          SystemClock.sleep(MODEL_SUPPORT_POLL_INTERVAL_MS)
      }
    }

    throw RecognitionFailure(
        SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE,
        "The offline speech model for $localeTag is still downloading. Check your connection and try again.")
  }

  private fun requestOnDeviceSpeechModel(localeTag: String): SpeechModelDownloadResult {
    val latch = CountDownLatch(1)
    val finished = AtomicBoolean(false)
    val result = AtomicReference<SpeechModelDownloadResult?>()
    val recognizerRef = AtomicReference<SpeechRecognizer?>()

    fun finish(downloadResult: SpeechModelDownloadResult) {
      if (finished.compareAndSet(false, true)) {
        result.set(downloadResult)
        recognizerRef.getAndSet(null)?.destroy()
        latch.countDown()
      }
    }

    mainHandler.post {
      try {
        val recognizer = createVideoSpeechRecognizer()
        recognizerRef.set(recognizer)
        val intent = IntentFactory.createModelDownloadIntent(localeTag)
        emitSpeechModelDownloadProgress(localeTag, 0)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          recognizer.triggerModelDownload(
              intent,
              reactContext.mainExecutor,
              object : ModelDownloadListener {
                override fun onProgress(completedPercent: Int) {
                  emitSpeechModelDownloadProgress(
                      localeTag,
                      normalizedSpeechModelProgress(completedPercent))
                }

                override fun onSuccess() {
                  emitSpeechModelDownloadReady(localeTag)
                  finish(SpeechModelDownloadResult(SpeechModelDownloadStatus.AVAILABLE))
                }

                override fun onScheduled() {
                  emitSpeechModelDownloadProgress(localeTag, null)
                  finish(SpeechModelDownloadResult(SpeechModelDownloadStatus.SCHEDULED))
                }

                override fun onError(error: Int) {
                  finish(
                      SpeechModelDownloadResult(
                          status = SpeechModelDownloadStatus.FAILED,
                          errorCode = error,
                          message = speechModelDownloadErrorMessage(localeTag, error)))
                }
              })
        } else {
          recognizer.triggerModelDownload(intent)
          emitSpeechModelDownloadProgress(localeTag, null)
          finish(SpeechModelDownloadResult(SpeechModelDownloadStatus.SCHEDULED))
        }
      } catch (error: Exception) {
        finish(
            SpeechModelDownloadResult(
                status = SpeechModelDownloadStatus.FAILED,
                message = error.message))
      }
    }

    if (!latch.await(MODEL_DOWNLOAD_TIMEOUT_MS, TimeUnit.MILLISECONDS)) {
      if (finished.compareAndSet(false, true)) {
        result.set(SpeechModelDownloadResult(SpeechModelDownloadStatus.SCHEDULED))
        mainHandler.post { recognizerRef.getAndSet(null)?.destroy() }
      }
    }

    return result.get() ?: SpeechModelDownloadResult(SpeechModelDownloadStatus.SCHEDULED)
  }

  private fun emitSpeechModelDownloadProgress(localeTag: String, progress: Int?) {
    if (!reactContext.hasActiveReactInstance()) {
      return
    }

    val payload = Arguments.createMap()
    payload.putString("localeTag", localeTag)
    payload.putString("status", SPEECH_MODEL_DOWNLOAD_STATUS_DOWNLOADING)
    if (progress == null) {
      payload.putNull("progress")
    } else {
      payload.putInt("progress", normalizedSpeechModelProgress(progress))
    }
    reactContext.emitDeviceEvent(SPEECH_MODEL_DOWNLOAD_EVENT, payload)
  }

  private fun emitSpeechModelDownloadReady(localeTag: String) {
    if (!reactContext.hasActiveReactInstance()) {
      return
    }

    val payload = Arguments.createMap()
    payload.putString("localeTag", localeTag)
    payload.putString("status", SPEECH_MODEL_DOWNLOAD_STATUS_READY)
    payload.putInt("progress", 100)
    reactContext.emitDeviceEvent(SPEECH_MODEL_DOWNLOAD_EVENT, payload)
  }

  private fun createVideoSpeechRecognizer(): SpeechRecognizer {
    return SpeechRecognizer.createOnDeviceSpeechRecognizer(reactContext)
  }

  private fun speechModelDownloadErrorMessage(localeTag: String, error: Int): String {
    return when (error) {
      SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED ->
        "Offline speech recognition does not support $localeTag on this device."
      SpeechRecognizer.ERROR_NETWORK,
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT ->
        "Unable to download the offline speech model for $localeTag. Check your connection and try again."
      else -> "Unable to download the offline speech model for $localeTag. Try again."
    }
  }

  private fun streamPcmAtRealtime(
      chunkFile: File,
      destination: ParcelFileDescriptor,
      sampleRate: Int,
      channelCount: Int,
      isFinished: AtomicBoolean,
      onFailure: (Exception) -> Unit
  ) {
    Thread({
      try {
        val bytesPerFrame = channelCount * BYTES_PER_PCM_16_SAMPLE
        val bytesPerSecond = sampleRate.toLong() * bytesPerFrame
        val targetBufferBytes =
            max(bytesPerFrame, (bytesPerSecond * AUDIO_STREAM_INTERVAL_MS / 1000).toInt())
        val bufferSize = targetBufferBytes - (targetBufferBytes % bytesPerFrame)
        val buffer = ByteArray(max(bytesPerFrame, bufferSize))
        val startedAtNanos = System.nanoTime()
        var streamedBytes = 0L

        BufferedInputStream(FileInputStream(chunkFile)).use { input ->
          ParcelFileDescriptor.AutoCloseOutputStream(destination).use { output ->
            while (!isFinished.get()) {
              val read = input.read(buffer)
              if (read <= 0) {
                break
              }

              output.write(buffer, 0, read)
              streamedBytes += read

              val targetElapsedNanos =
                  streamedBytes * TimeUnit.SECONDS.toNanos(1) / bytesPerSecond
              val remainingNanos =
                  targetElapsedNanos - (System.nanoTime() - startedAtNanos)
              if (remainingNanos > 0) {
                TimeUnit.NANOSECONDS.sleep(remainingNanos)
              }
            }
            output.flush()
          }
        }
      } catch (error: Exception) {
        if (!isFinished.get()) {
          onFailure(error)
        }
      }
    }, AUDIO_STREAM_THREAD_NAME).start()
  }

  private fun closeQuietly(descriptor: ParcelFileDescriptor) {
    try {
      descriptor.close()
    } catch (_: IOException) {
    }
  }

  private fun recognitionTextFromBundle(bundle: Bundle): RecognitionText? {
    val text = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        ?.firstOrNull()
        ?.trim()
        .orEmpty()
    if (text.isBlank()) {
      return null
    }

    val confidence = bundle.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
        ?.firstOrNull()
        ?.takeIf { it >= 0f }
        ?.toDouble()
    return RecognitionText(text, confidence)
  }

  private fun mergeRecognitionTexts(results: List<RecognitionText>): RecognitionText? {
    if (results.isEmpty()) {
      return null
    }

    val texts = results.map { it.text.trim() }.filter { it.isNotBlank() }
    if (texts.isEmpty()) {
      return null
    }

    return RecognitionText(
        text = texts.fold(mutableListOf<String>()) { merged, text ->
          if (merged.lastOrNull() != text) {
            merged.add(text)
          }
          merged
        }.joinToString(" "),
        confidence = results.mapNotNull { it.confidence }.minOrNull())
  }

  private fun segmentsFromUntimedTranscript(
      result: RecognitionText,
      chunkStartMs: Int,
      chunkDurationMs: Int
  ): List<SubtitleSegment> {
    val words = result.text.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
    if (words.isEmpty()) {
      return emptyList()
    }

    val usableDurationMs = max(words.size, chunkDurationMs)
    return words.mapIndexed { index, text ->
      val start =
          chunkStartMs + (usableDurationMs.toLong() * index / words.size).toInt()
      val end =
          chunkStartMs + (usableDurationMs.toLong() * (index + 1) / words.size).toInt()
      val subtitleWord = SubtitleWord(text, start, end, result.confidence)
      SubtitleSegment(
          id = UUID.randomUUID().toString(),
          startTime = start,
          endTime = end,
          text = text,
          words = listOf(subtitleWord),
          confidence = result.confidence)
    }
  }

  private fun normalizeLocaleTag(localeTag: String): String {
    val normalized = Locale.forLanguageTag(localeTag.replace('_', '-')).toLanguageTag()
    return if (normalized == "und") localeTag.replace('_', '-') else normalized
  }

  @Suppress("DEPRECATION")
  private fun timedWordsFromRecognitionParts(bundle: Bundle): List<TimedWord> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return emptyList()
    }

    val parts = bundle.getParcelableArrayList<Parcelable>(RECOGNITION_PARTS_KEY)
        ?: return emptyList()

    return parts.mapNotNull { part ->
      val rawText = invokeStringGetter(part, "getRawText")
      val formattedText = invokeStringGetter(part, "getFormattedText")
      val text = (formattedText ?: rawText).orEmpty().trim()
      if (text.isBlank()) {
        null
      } else {
        TimedWord(
            text = text,
            localStartMs = invokeLongGetter(part, "getTimestampMillis").toInt(),
            confidence = confidenceFromLevel(invokeIntGetter(part, "getConfidenceLevel")))
      }
    }
  }

  private fun segmentsFromRecognitionParts(
      rawWords: List<TimedWord>,
      chunkStartMs: Int,
      chunkDurationMs: Int
  ): List<SubtitleSegment> {
    if (rawWords.isEmpty()) {
      return emptyList()
    }

    val hasUsefulTiming = rawWords.map { it.localStartMs }.distinct().size > 1
    val chunkEndMs = chunkStartMs + chunkDurationMs
    val estimatedWordDuration = max(220, chunkDurationMs / max(1, rawWords.size))

    return rawWords.mapIndexed { index, word ->
      val localStart =
          if (hasUsefulTiming) {
            word.localStartMs.coerceIn(0, chunkDurationMs)
          } else {
            min(chunkDurationMs, index * estimatedWordDuration)
          }
      val nextLocalStart =
          if (index < rawWords.lastIndex) {
            if (hasUsefulTiming) rawWords[index + 1].localStartMs else (index + 1) * estimatedWordDuration
          } else {
            localStart + estimatedWordDuration
          }
      val start = (chunkStartMs + localStart).coerceAtMost(chunkEndMs - 1)
      val end = max(start + 160, min(chunkEndMs, chunkStartMs + nextLocalStart - 30))
      val subtitleWord = SubtitleWord(word.text, start, end, word.confidence)
      SubtitleSegment(
          id = UUID.randomUUID().toString(),
          startTime = start,
          endTime = end,
          text = word.text,
          words = listOf(subtitleWord),
          confidence = word.confidence)
    }
  }

  private fun confidenceFromLevel(level: Int): Double? {
    return when (level) {
      1 -> 0.25
      2 -> 0.45
      3 -> 0.62
      4 -> 0.78
      5 -> 0.92
      else -> null
    }
  }

  private fun invokeStringGetter(target: Any, methodName: String): String? =
      runCatching { target.javaClass.getMethod(methodName).invoke(target) as? String }.getOrNull()

  private fun invokeLongGetter(target: Any, methodName: String): Long =
      runCatching { target.javaClass.getMethod(methodName).invoke(target) as? Long }.getOrNull() ?: 0L

  private fun invokeIntGetter(target: Any, methodName: String): Int =
      runCatching { target.javaClass.getMethod(methodName).invoke(target) as? Int }.getOrNull() ?: 0

  private fun validateTranscriptScript(localeTag: String, transcript: String) {
    val language = Locale.forLanguageTag(localeTag).language.lowercase()
    if (language !in DISTINCTIVE_SCRIPT_LANGUAGES) {
      return
    }

    var relevant = 0
    var matched = 0
    transcript.codePoints().forEach { codePoint ->
      if (!Character.isLetter(codePoint)) {
        return@forEach
      }

      relevant += 1
      if (codePointMatchesLanguage(codePoint, language)) {
        matched += 1
      }
    }

    if (relevant >= MIN_SCRIPT_VALIDATION_LETTERS &&
        matched.toDouble() / relevant < MIN_SCRIPT_MATCH_RATIO) {
      throw IOException("The recognizer returned text in a different language. Try the selected language again.")
    }
  }

  private fun codePointMatchesLanguage(codePoint: Int, language: String): Boolean {
    return when (language) {
      "ru" -> codePoint in 0x0400..0x052F
      "ja" -> codePoint in 0x3040..0x30FF ||
          codePoint in 0x31F0..0x31FF ||
          codePoint in 0x3400..0x4DBF ||
          codePoint in 0x4E00..0x9FFF
      "ko" -> codePoint in 0x1100..0x11FF ||
          codePoint in 0x3130..0x318F ||
          codePoint in 0xAC00..0xD7AF
      "zh" -> codePoint in 0x3400..0x4DBF ||
          codePoint in 0x4E00..0x9FFF ||
          codePoint in 0x20000..0x2A6DF
      "ar" -> codePoint in 0x0600..0x06FF ||
          codePoint in 0x0750..0x077F ||
          codePoint in 0x08A0..0x08FF
      else -> false
    }
  }

  private fun speechErrorMessage(error: Int): String {
    return when (error) {
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Speech recognition network timed out."
      SpeechRecognizer.ERROR_NETWORK -> "Speech recognition network error."
      SpeechRecognizer.ERROR_AUDIO -> "Unable to read audio for speech recognition."
      SpeechRecognizer.ERROR_SERVER -> "Speech recognition service error."
      SpeechRecognizer.ERROR_CLIENT -> "Speech recognition client error."
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech was detected in the video."
      SpeechRecognizer.ERROR_NO_MATCH -> "No speech match was found in the video."
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer is busy. Try again."
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission is required for speech recognition."
      SpeechRecognizer.ERROR_TOO_MANY_REQUESTS -> "Too many speech recognition requests. Try again later."
      SpeechRecognizer.ERROR_SERVER_DISCONNECTED -> "Speech recognition service disconnected."
      SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED -> "Selected language is not supported by this recognizer."
      SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "Selected language is not available on this device."
      else -> "Speech recognition failed."
    }
  }

  private fun defaultWaveform(bucketCount: Int = WAVEFORM_BUCKET_COUNT): DoubleArray {
    return DoubleArray(bucketCount) { index ->
      val swell = 0.18 + abs(kotlin.math.sin(index / 9.0)) * 0.28
      val accent = if (index % 17 == 0) 0.2 else 0.0
      min(0.94, swell + accent)
    }
  }

  private fun doubleArrayToWritableArray(values: DoubleArray): WritableArray {
    val array = Arguments.createArray()
    values.forEach { array.pushDouble(it) }
    return array
  }

  private fun subtitlesToWritableArray(subtitles: List<SubtitleSegment>): WritableArray {
    val array = Arguments.createArray()
    subtitles.forEach { subtitle ->
      val item = Arguments.createMap()
      item.putString("id", subtitle.id)
      item.putInt("startTime", subtitle.startTime)
      item.putInt("endTime", subtitle.endTime)
      item.putString("text", subtitle.text)
      subtitle.confidence?.let { item.putDouble("confidence", it) }

      val words = Arguments.createArray()
      subtitle.words.forEach { word ->
        val wordMap = Arguments.createMap()
        wordMap.putString("text", word.text)
        wordMap.putInt("startTime", word.startTime)
        wordMap.putInt("endTime", word.endTime)
        word.confidence?.let { wordMap.putDouble("confidence", it) }
        words.pushMap(wordMap)
      }
      item.putArray("words", words)
      array.pushMap(item)
    }
    return array
  }

  private data class VideoMetadata(
      val durationMs: Int,
      val width: Int,
      val height: Int)

  private data class PcmAudio(
      val file: File,
      val sampleRate: Int,
      val channelCount: Int,
      val durationMs: Int)

  private data class SubtitleWord(
      val text: String,
      val startTime: Int,
      val endTime: Int,
      val confidence: Double?)

  private data class SubtitleSegment(
      val id: String,
      val startTime: Int,
      val endTime: Int,
      val text: String,
      val words: List<SubtitleWord>,
      val confidence: Double?)

  private data class TimedWord(
      val text: String,
      val localStartMs: Int,
      val confidence: Double?)

  private data class RecognitionText(
      val text: String,
      val confidence: Double?)

  private data class SpeechModelDownloadResult(
      val status: SpeechModelDownloadStatus,
      val errorCode: Int? = null,
      val message: String? = null)

  private class RecognitionFailure(
      val errorCode: Int?,
      message: String
  ) : IOException(message) {
    fun isRecoverableNoMatch(): Boolean =
        errorCode == SpeechRecognizer.ERROR_NO_MATCH ||
            errorCode == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
  }

  private object IntentFactory {
    fun createSpeechIntent(
        pfd: ParcelFileDescriptor,
        sampleRate: Int,
        channelCount: Int,
        localeTag: String
    ): android.content.Intent {
      return android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, localeTag)
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
        putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, pfd)
        putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, channelCount)
        putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
        putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, sampleRate)
        putExtra(RecognizerIntent.EXTRA_SEGMENTED_SESSION, RecognizerIntent.EXTRA_AUDIO_SOURCE)
        putExtra(RecognizerIntent.EXTRA_ENABLE_FORMATTING, RecognizerIntent.FORMATTING_OPTIMIZE_QUALITY)
        putExtra(EXTRA_REQUEST_WORD_TIMING, true)
        putExtra(EXTRA_REQUEST_WORD_CONFIDENCE, true)
      }
    }

    fun createModelDownloadIntent(localeTag: String): android.content.Intent {
      return android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, localeTag)
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      }
    }
  }

  companion object {
    const val NAME = "LocalSubOfflineModule"
    private const val KEY_RECORD_AUDIO_REQUESTED = "recordAudioRequested"
    private const val KEY_NOTIFICATIONS_REQUESTED = "notificationsRequested"
    private const val REQUEST_RECORD_AUDIO = 1009
    private const val REQUEST_POST_NOTIFICATIONS = 1010
    private const val REQUEST_WRITE_EXTERNAL_STORAGE = 1011
    private const val PROJECT_MEDIA_DIRECTORY = "ProjectMedia"
    private const val CODEC_TIMEOUT_US = 10_000L
    private const val DEFAULT_SAMPLE_RATE = 16_000
    private const val DEFAULT_CHANNEL_COUNT = 1
    private const val BYTES_PER_PCM_16_SAMPLE = 2
    private const val WAVEFORM_BUCKET_COUNT = 160
    private const val PCM_READ_BUFFER_SIZE = 64 * 1024
    private const val RECOGNITION_CHUNK_DURATION_MS = 45_000
    private const val MIN_RECOGNITION_TIMEOUT_MS = 45_000L
    private const val MODEL_SUPPORT_CHECK_TIMEOUT_MS = 10_000L
    private const val MODEL_DOWNLOAD_TIMEOUT_MS = 120_000L
    private const val MODEL_DOWNLOAD_READY_TIMEOUT_MS = 5 * 60_000L
    private const val MODEL_SUPPORT_POLL_INTERVAL_MS = 1_500L
    private const val SPEECH_SERVICE_RECONNECT_DELAY_MS = 750L
    private const val AUDIO_STREAM_INTERVAL_MS = 20L
    private const val AUDIO_STREAM_THREAD_NAME = "localsub-speech-audio"
    private const val MIN_SCRIPT_VALIDATION_LETTERS = 4
    private const val MIN_SCRIPT_MATCH_RATIO = 0.35
    private const val RECOGNITION_PARTS_KEY = "recognition_parts"
    private const val EXTRA_REQUEST_WORD_TIMING = "android.speech.extra.REQUEST_WORD_TIMING"
    private const val EXTRA_REQUEST_WORD_CONFIDENCE = "android.speech.extra.REQUEST_WORD_CONFIDENCE"
    private const val SPEECH_MODEL_DOWNLOAD_EVENT = "LocalSubSpeechModelDownloadProgress"
    private const val SPEECH_MODEL_DOWNLOAD_STATUS_DOWNLOADING = "downloading"
    private const val SPEECH_MODEL_DOWNLOAD_STATUS_READY = "ready"
    private val DISTINCTIVE_SCRIPT_LANGUAGES = setOf("ru", "ja", "ko", "zh", "ar")
  }
}
