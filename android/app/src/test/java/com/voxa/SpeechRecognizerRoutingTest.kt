package com.voxa

import android.speech.SpeechRecognizer
import org.junit.Assert.assertEquals
import org.junit.Test

class SpeechRecognizerRoutingTest {
  @Test
  fun missingLanguageModelIsDownloadedAndRetried() {
    assertEquals(
        SpeechRecognitionRecovery.DOWNLOAD_MODEL_AND_RETRY,
        speechRecognitionRecovery(
            errorCode = SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE,
            modelDownloadAttempted = false))
  }

  @Test
  fun missingLanguageModelIsOnlyDownloadedOncePerChunk() {
    assertEquals(
        SpeechRecognitionRecovery.FAIL,
        speechRecognitionRecovery(
            errorCode = SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE,
            modelDownloadAttempted = true))
  }

  @Test
  fun unsupportedLanguageDoesNotStartAnImpossibleDownload() {
    assertEquals(
        SpeechRecognitionRecovery.FAIL,
        speechRecognitionRecovery(
            errorCode = SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED,
            modelDownloadAttempted = false))
  }

  @Test
  fun recognitionContentErrorsDoNotRequestLanguageModels() {
    assertEquals(
        SpeechRecognitionRecovery.FAIL,
        speechRecognitionRecovery(
            errorCode = SpeechRecognizer.ERROR_NO_MATCH,
            modelDownloadAttempted = false))
  }
}
