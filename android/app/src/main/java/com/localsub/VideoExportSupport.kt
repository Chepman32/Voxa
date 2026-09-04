package com.localsub

import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

internal data class ExportDimensions(
    val width: Int,
    val height: Int)

internal data class ExportSubtitleWord(
    val text: String,
    val startTimeMs: Int,
    val endTimeMs: Int)

internal data class ExportSubtitle(
    val text: String,
    val startTimeMs: Int,
    val endTimeMs: Int,
    val words: List<ExportSubtitleWord>)

internal data class ExportSubtitleStyle(
    val fontFamily: String = "System",
    val fontWeight: Int = 800,
    val fontSize: Float = 34f,
    val letterSpacing: Float = 0.3f,
    val textColor: String = "#FFFFFF",
    val backgroundColor: String = "rgba(10, 10, 12, 0.62)",
    val accentColor: String = "#12E5FF",
    val wordHighlightEnabled: Boolean = true,
    val position: String = "bottom",
    val positionOffsetYRatio: Float = 0f,
    val uppercase: Boolean = false)

internal fun targetExportDimensions(
    sourceWidth: Int,
    sourceHeight: Int,
    resolution: String
): ExportDimensions {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return ExportDimensions(width = max(2, sourceWidth), height = max(2, sourceHeight))
  }

  val targetLongSide =
      when (resolution.lowercase()) {
        "720p" -> 1_280
        "4k" -> 3_840
        else -> 1_920
      }
  val sourceLongSide = max(sourceWidth, sourceHeight)
  val scale = min(1f, targetLongSide.toFloat() / sourceLongSide.toFloat())

  return ExportDimensions(
      width = evenDimension((sourceWidth * scale).roundToInt()),
      height = evenDimension((sourceHeight * scale).roundToInt()))
}

internal fun subtitleLayoutScale(videoWidth: Int, referenceWidth: Float): Float {
  if (videoWidth <= 0 || !referenceWidth.isFinite() || referenceWidth <= 0f) {
    return 1f
  }

  return videoWidth.toFloat() / referenceWidth
}

internal fun activeSubtitleAt(
    subtitles: List<ExportSubtitle>,
    presentationTimeMs: Int
): ExportSubtitle? =
    subtitles.firstOrNull {
      it.text.isNotBlank() &&
          it.endTimeMs > it.startTimeMs &&
          presentationTimeMs >= it.startTimeMs &&
          presentationTimeMs < it.endTimeMs
    }

internal fun activeWordIndexAt(
    subtitle: ExportSubtitle,
    presentationTimeMs: Int
): Int? =
    subtitle.words
        .indexOfFirst {
          it.text.isNotBlank() &&
              it.endTimeMs > it.startTimeMs &&
              presentationTimeMs >= it.startTimeMs &&
              presentationTimeMs < it.endTimeMs
        }
        .takeIf { it >= 0 }

internal fun subtitleOriginY(
    position: String,
    positionOffsetYRatio: Float,
    videoHeight: Int,
    layerHeight: Float,
    layoutScale: Float = 1f
): Float {
  val minOriginY = 16f * layoutScale
  val maxOriginY = max(minOriginY, videoHeight - layerHeight - 16f * layoutScale)
  val anchorY =
      when (position) {
        "top" -> 20f * layoutScale
        "middle" -> videoHeight * 0.42f
        else -> videoHeight - layerHeight - 18f * layoutScale
      }
  return (anchorY + positionOffsetYRatio * videoHeight).coerceIn(minOriginY, maxOriginY)
}

private fun evenDimension(value: Int): Int {
  val positive = max(2, value)
  return if (positive % 2 == 0) positive else positive - 1
}
