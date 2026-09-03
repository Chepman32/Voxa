package com.localsub

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VideoExportSupportTest {
  @Test
  fun portraitVideoScalesDownToTheRequestedLongSide() {
    assertEquals(
        ExportDimensions(width = 720, height = 1280),
        targetExportDimensions(
            sourceWidth = 2160,
            sourceHeight = 3840,
            resolution = "720p"))
    assertEquals(
        ExportDimensions(width = 1080, height = 1920),
        targetExportDimensions(
            sourceWidth = 2160,
            sourceHeight = 3840,
            resolution = "1080p"))
  }

  @Test
  fun landscapeVideoPreservesItsAspectRatio() {
    assertEquals(
        ExportDimensions(width = 1280, height = 720),
        targetExportDimensions(
            sourceWidth = 3840,
            sourceHeight = 2160,
            resolution = "720p"))
  }

  @Test
  fun exportNeverUpscalesTheSource() {
    assertEquals(
        ExportDimensions(width = 640, height = 360),
        targetExportDimensions(
            sourceWidth = 640,
            sourceHeight = 360,
            resolution = "4k"))
  }

  @Test
  fun exportDimensionsAreEvenForHardwareEncoders() {
    val dimensions =
        targetExportDimensions(
            sourceWidth = 853,
            sourceHeight = 1281,
            resolution = "720p")

    assertEquals(0, dimensions.width % 2)
    assertEquals(0, dimensions.height % 2)
  }

  @Test
  fun subtitleTimingUsesAnExclusiveEndBoundary() {
    val first =
        ExportSubtitle(
            text = "First",
            startTimeMs = 100,
            endTimeMs = 300,
            words = emptyList())
    val second =
        ExportSubtitle(
            text = "Second",
            startTimeMs = 300,
            endTimeMs = 500,
            words = emptyList())

    assertNull(activeSubtitleAt(listOf(first, second), 99))
    assertEquals(first, activeSubtitleAt(listOf(first, second), 100))
    assertEquals(second, activeSubtitleAt(listOf(first, second), 300))
    assertNull(activeSubtitleAt(listOf(first, second), 500))
  }

  @Test
  fun wordHighlightTracksTheSpokenWord() {
    val subtitle =
        ExportSubtitle(
            text = "Hello world",
            startTimeMs = 0,
            endTimeMs = 1_000,
            words =
                listOf(
                    ExportSubtitleWord("Hello", 0, 400),
                    ExportSubtitleWord("world", 400, 900)))

    assertEquals(0, activeWordIndexAt(subtitle, 399))
    assertEquals(1, activeWordIndexAt(subtitle, 400))
    assertNull(activeWordIndexAt(subtitle, 900))
  }

  @Test
  fun verticalOffsetIsClampedInsideTheVideo() {
    assertEquals(
        16f,
        subtitleOriginY(
            position = "top",
            positionOffsetYRatio = -0.5f,
            videoHeight = 1_920,
            layerHeight = 180f))
    assertEquals(
        1_724f,
        subtitleOriginY(
            position = "bottom",
            positionOffsetYRatio = 0.5f,
            videoHeight = 1_920,
            layerHeight = 180f))
  }
}
