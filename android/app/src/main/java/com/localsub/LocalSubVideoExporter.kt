package com.localsub

import android.content.ContentValues
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.Typeface
import android.media.MediaMetadataRetriever
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.text.Layout
import android.text.SpannableString
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.ForegroundColorSpan
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.CanvasOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.Presentation
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.util.Locale
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

@UnstableApi
internal class LocalSubVideoExporter(private val context: Context) {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val activeExports = mutableMapOf<Transformer, File>()

  fun export(
      inputFile: File,
      subtitles: List<ExportSubtitle>,
      style: ExportSubtitleStyle,
      resolution: String,
      completion: (Result<File>) -> Unit
  ) {
    mainHandler.post {
      var outputFile: File? = null
      var transformer: Transformer? = null
      try {
        if (!inputFile.isFile || !inputFile.canRead()) {
          throw IOException("The source video could not be opened.")
        }

        val sourceDimensions = readDisplayDimensions(inputFile)
        val outputDimensions =
            targetExportDimensions(
                sourceWidth = sourceDimensions.width,
                sourceHeight = sourceDimensions.height,
                resolution = resolution)
        val createdOutputFile =
            File(context.cacheDir, "$EXPORT_FILE_PREFIX${UUID.randomUUID()}.mp4")
        outputFile = createdOutputFile
        createdOutputFile.delete()

        val videoEffects =
            listOf(
                Presentation.createForWidthAndHeight(
                    outputDimensions.width,
                    outputDimensions.height,
                    Presentation.LAYOUT_SCALE_TO_FIT),
                OverlayEffect(listOf(SubtitleCanvasOverlay(subtitles, style))))
        val editedMediaItem =
            EditedMediaItem.Builder(MediaItem.fromUri(Uri.fromFile(inputFile)))
                .setEffects(Effects(emptyList(), videoEffects))
                .build()
        val finished = AtomicBoolean(false)
        val listener =
            object : Transformer.Listener {
              override fun onCompleted(composition: Composition, exportResult: ExportResult) {
                if (!finished.compareAndSet(false, true)) {
                  return
                }
                transformer?.let(activeExports::remove)
                completion(Result.success(createdOutputFile))
              }

              override fun onError(
                  composition: Composition,
                  exportResult: ExportResult,
                  exportException: ExportException
              ) {
                if (!finished.compareAndSet(false, true)) {
                  return
                }
                transformer?.let(activeExports::remove)
                createdOutputFile.delete()
                completion(Result.failure(exportException))
              }
            }

        val createdTransformer =
            Transformer.Builder(context)
                .setLooper(Looper.getMainLooper())
                .setAudioMimeType(MimeTypes.AUDIO_AAC)
                .setVideoMimeType(MimeTypes.VIDEO_H264)
                .addListener(listener)
                .build()
        transformer = createdTransformer
        activeExports[createdTransformer] = createdOutputFile
        createdTransformer.start(editedMediaItem, createdOutputFile.absolutePath)
      } catch (error: Exception) {
        transformer?.let(activeExports::remove)
        outputFile?.delete()
        completion(Result.failure(error))
      }
    }
  }

  fun cancelAll() {
    mainHandler.post {
      val exports = activeExports.toMap()
      activeExports.clear()
      exports.forEach { (transformer, outputFile) ->
        transformer.cancel()
        outputFile.delete()
      }
    }
  }

  fun saveToPhotos(videoUri: String): Uri {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      saveToMediaStore(videoUri)
    } else {
      saveToLegacyMoviesDirectory(videoUri)
    }
  }

  fun deleteTemporaryExport(videoUri: String) {
    val parsedUri = Uri.parse(videoUri)
    if (parsedUri.scheme != "file") {
      return
    }

    val file = parsedUri.path?.let(::File) ?: return
    val cacheDirectory = context.cacheDir.canonicalFile
    if (file.name.startsWith(EXPORT_FILE_PREFIX) &&
        file.parentFile?.canonicalFile == cacheDirectory) {
      file.delete()
    }
  }

  private fun readDisplayDimensions(videoFile: File): ExportDimensions {
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(videoFile.absolutePath)
      val rawWidth =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()
              ?: throw IOException("The source video width is unavailable.")
      val rawHeight =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()
              ?: throw IOException("The source video height is unavailable.")
      val rotation =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull()
              ?: 0
      return if (rotation == 90 || rotation == 270) {
        ExportDimensions(rawHeight, rawWidth)
      } else {
        ExportDimensions(rawWidth, rawHeight)
      }
    } finally {
      retriever.release()
    }
  }

  private fun saveToMediaStore(videoUri: String): Uri {
    val resolver = context.contentResolver
    val values =
        ContentValues().apply {
          put(MediaStore.Video.Media.DISPLAY_NAME, exportDisplayName())
          put(MediaStore.Video.Media.MIME_TYPE, VIDEO_MIME_TYPE)
          put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/LocalSub")
          put(MediaStore.Video.Media.IS_PENDING, 1)
        }
    val collection =
        MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val destination =
        resolver.insert(collection, values)
            ?: throw IOException("Android could not create the exported video in Photos.")

    try {
      openVideoInput(videoUri).use { input ->
        resolver.openOutputStream(destination, "w")?.use { output -> input.copyTo(output) }
            ?: throw IOException("Android could not write the exported video to Photos.")
      }
      values.clear()
      values.put(MediaStore.Video.Media.IS_PENDING, 0)
      if (resolver.update(destination, values, null, null) != 1) {
        throw IOException("Android could not finish adding the exported video to Photos.")
      }
      return destination
    } catch (error: Exception) {
      resolver.delete(destination, null, null)
      throw error
    }
  }

  @Suppress("DEPRECATION")
  private fun saveToLegacyMoviesDirectory(videoUri: String): Uri {
    val moviesDirectory =
        File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "LocalSub")
    if (!moviesDirectory.exists() && !moviesDirectory.mkdirs()) {
      throw IOException("Android could not open the Movies folder.")
    }

    val destination = File(moviesDirectory, exportDisplayName())
    try {
      openVideoInput(videoUri).use { input ->
        destination.outputStream().use { output -> input.copyTo(output) }
      }
    } catch (error: Exception) {
      destination.delete()
      throw error
    }

    val latch = CountDownLatch(1)
    var scannedUri: Uri? = null
    MediaScannerConnection.scanFile(
        context,
        arrayOf(destination.absolutePath),
        arrayOf(VIDEO_MIME_TYPE)) { _, uri ->
          scannedUri = uri
          latch.countDown()
        }
    if (!latch.await(MEDIA_SCAN_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
      throw IOException("The exported video was saved, but Android did not index it in time.")
    }
    return scannedUri ?: Uri.fromFile(destination)
  }

  private fun openVideoInput(videoUri: String): InputStream {
    val uri = Uri.parse(videoUri)
    return when (uri.scheme) {
      null -> File(uri.path ?: videoUri).inputStream()
      "file" -> File(uri.path ?: throw IOException("The exported video path is invalid.")).inputStream()
      else ->
          context.contentResolver.openInputStream(uri)
              ?: throw IOException("The exported video could not be opened.")
    }
  }

  private fun exportDisplayName(): String =
      "LocalSub-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(8)}.mp4"

  private class SubtitleCanvasOverlay(
      subtitles: List<ExportSubtitle>,
      private val style: ExportSubtitleStyle
  ) : CanvasOverlay(true) {
    private val subtitles = subtitles.sortedWith(compareBy(ExportSubtitle::startTimeMs, ExportSubtitle::endTimeMs))
    private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    override fun onDraw(canvas: Canvas, presentationTimeUs: Long) {
      canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
      val presentationTimeMs = (presentationTimeUs / 1_000L).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
      val subtitle = activeSubtitleAt(subtitles, presentationTimeMs) ?: return
      val text = if (style.uppercase) subtitle.text.uppercase(Locale.getDefault()) else subtitle.text
      if (text.isBlank()) {
        return
      }

      val textPaint =
          TextPaint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG).apply {
            color = parseCssColor(this@SubtitleCanvasOverlay.style.textColor, Color.WHITE)
            textSize = this@SubtitleCanvasOverlay.style.fontSize.coerceAtLeast(1f)
            typeface =
                resolveTypeface(
                    this@SubtitleCanvasOverlay.style.fontFamily,
                    this@SubtitleCanvasOverlay.style.fontWeight)
            letterSpacing = this@SubtitleCanvasOverlay.style.letterSpacing / textSize
          }
      val attributedText = highlightedText(text, subtitle, presentationTimeMs, textPaint.color)
      val maxTextWidth = max(1, (canvas.width * MAX_TEXT_WIDTH_RATIO).roundToInt())
      val measuringLayout = createTextLayout(attributedText, textPaint, maxTextWidth)
      val measuredLineWidth =
          (0 until measuringLayout.lineCount)
              .maxOfOrNull { measuringLayout.getLineWidth(it) }
              ?.let(::ceil)
              ?.toInt()
              ?: maxTextWidth
      val maximumContainerWidth = max(1, (canvas.width * MAX_CONTAINER_WIDTH_RATIO).roundToInt())
      val containerWidth =
          min(maximumContainerWidth, measuredLineWidth + HORIZONTAL_PADDING_PX * 2)
              .coerceAtLeast(HORIZONTAL_PADDING_PX * 2 + 1)
      val layoutWidth = max(1, containerWidth - HORIZONTAL_PADDING_PX * 2)
      val textLayout = createTextLayout(attributedText, textPaint, layoutWidth)
      val containerHeight = textLayout.height + VERTICAL_PADDING_PX * 2
      val originX = (canvas.width - containerWidth) / 2f
      val originY =
          subtitleOriginY(
              position = style.position,
              positionOffsetYRatio = style.positionOffsetYRatio,
              videoHeight = canvas.height,
              layerHeight = containerHeight.toFloat())

      backgroundPaint.apply {
        color =
            parseCssColor(
                this@SubtitleCanvasOverlay.style.backgroundColor,
                DEFAULT_BACKGROUND_COLOR)
        style = Paint.Style.FILL
        setShadowLayer(16f, 0f, 8f, Color.argb(71, 0, 0, 0))
      }
      canvas.drawRoundRect(
          originX,
          originY,
          originX + containerWidth,
          originY + containerHeight,
          CORNER_RADIUS_PX,
          CORNER_RADIUS_PX,
          backgroundPaint)
      backgroundPaint.clearShadowLayer()

      canvas.save()
      canvas.translate(
          originX + HORIZONTAL_PADDING_PX,
          originY + VERTICAL_PADDING_PX - TEXT_VERTICAL_ADJUSTMENT_PX)
      textLayout.draw(canvas)
      canvas.restore()
    }

    private fun highlightedText(
        text: String,
        subtitle: ExportSubtitle,
        presentationTimeMs: Int,
        defaultTextColor: Int
    ): CharSequence {
      if (!style.wordHighlightEnabled || subtitle.words.isEmpty()) {
        return text
      }

      val casedWords =
          subtitle.words.map { word ->
            if (style.uppercase) word.text.uppercase(Locale.getDefault()) else word.text
          }
      if (casedWords.joinToString(" ") != text) {
        return text
      }

      val activeWordIndex = activeWordIndexAt(subtitle, presentationTimeMs) ?: return text
      val spannable = SpannableString(text)
      var offset = 0
      casedWords.forEachIndexed { index, word ->
        val end = offset + word.length
        if (index == activeWordIndex && end <= spannable.length) {
          spannable.setSpan(
              ForegroundColorSpan(parseCssColor(style.accentColor, defaultTextColor)),
              offset,
              end,
              SpannableString.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        offset = end + 1
      }
      return spannable
    }

    private fun createTextLayout(
        text: CharSequence,
        textPaint: TextPaint,
        width: Int
    ): StaticLayout =
        StaticLayout.Builder.obtain(text, 0, text.length, textPaint, width)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setIncludePad(false)
            .build()

    private fun resolveTypeface(fontFamily: String, fontWeight: Int): Typeface {
      val family = fontFamily.trim().takeIf { it.isNotEmpty() && it != "System" }
      val base = Typeface.create(family, Typeface.NORMAL)
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        Typeface.create(base, fontWeight.coerceIn(1, 1_000), false)
      } else {
        Typeface.create(base, if (fontWeight >= 600) Typeface.BOLD else Typeface.NORMAL)
      }
    }

    private fun parseCssColor(value: String, fallback: Int): Int {
      val color = value.trim()
      return runCatching {
        when {
          color.matches(HEX_RGB_REGEX) -> {
            val red = color.substring(1, 3).toInt(16)
            val green = color.substring(3, 5).toInt(16)
            val blue = color.substring(5, 7).toInt(16)
            Color.rgb(red, green, blue)
          }
          color.matches(HEX_RGBA_REGEX) -> {
            val red = color.substring(1, 3).toInt(16)
            val green = color.substring(3, 5).toInt(16)
            val blue = color.substring(5, 7).toInt(16)
            val alpha = color.substring(7, 9).toInt(16)
            Color.argb(alpha, red, green, blue)
          }
          else -> {
            val rgba = RGBA_REGEX.matchEntire(color)
            if (rgba != null) {
              val red = rgba.groupValues[1].toInt().coerceIn(0, 255)
              val green = rgba.groupValues[2].toInt().coerceIn(0, 255)
              val blue = rgba.groupValues[3].toInt().coerceIn(0, 255)
              val alpha =
                  (rgba.groupValues[4].toFloat().coerceIn(0f, 1f) * 255f).roundToInt()
              Color.argb(alpha, red, green, blue)
            } else {
              Color.parseColor(color)
            }
          }
        }
      }.getOrDefault(fallback)
    }

    companion object {
      private const val MAX_TEXT_WIDTH_RATIO = 0.84f
      private const val MAX_CONTAINER_WIDTH_RATIO = 0.88f
      private const val HORIZONTAL_PADDING_PX = 18
      private const val VERTICAL_PADDING_PX = 10
      private const val TEXT_VERTICAL_ADJUSTMENT_PX = 2f
      private const val CORNER_RADIUS_PX = 18f
      private val DEFAULT_BACKGROUND_COLOR = Color.argb(158, 10, 10, 12)
      private val HEX_RGB_REGEX = Regex("^#[0-9a-fA-F]{6}$")
      private val HEX_RGBA_REGEX = Regex("^#[0-9a-fA-F]{8}$")
      private val RGBA_REGEX =
          Regex("^rgba\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*([0-9]*\\.?[0-9]+)\\s*\\)$")
    }
  }

  companion object {
    private const val EXPORT_FILE_PREFIX = "localsub-export-"
    private const val VIDEO_MIME_TYPE = "video/mp4"
    private const val MEDIA_SCAN_TIMEOUT_SECONDS = 15L
  }
}
