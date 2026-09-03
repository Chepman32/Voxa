package com.localsub

import android.speech.SpeechRecognizer
import org.junit.Assert.assertEquals
import org.junit.Test

class SpeechRecognizerRoutingTest {
  @Test
  fun downloadableMultilingualLocalesRequestTheirCorrespondingModel() {
    listOf("ko-KR", "fr-FR", "pt-BR").forEach { localeTag ->
      assertEquals(
          SpeechModelPreparation.DOWNLOAD,
          speechModelPreparation(
              requestedLocaleTag = localeTag,
              installedOnDeviceLanguages = emptyList(),
              pendingOnDeviceLanguages = emptyList(),
              supportedOnDeviceLanguages = listOf(localeTag)))
    }
  }

  @Test
  fun installedMultilingualModelStartsRecognitionWithoutDownload() {
    assertEquals(
        SpeechModelPreparation.READY,
        speechModelPreparation(
            requestedLocaleTag = "fr-FR",
            installedOnDeviceLanguages = listOf("fr-FR"),
            pendingOnDeviceLanguages = emptyList(),
            supportedOnDeviceLanguages = emptyList()))
  }

  @Test
  fun pendingMultilingualModelDoesNotStartAnotherDownload() {
    assertEquals(
        SpeechModelPreparation.PENDING,
        speechModelPreparation(
            requestedLocaleTag = "ko-KR",
            installedOnDeviceLanguages = emptyList(),
            pendingOnDeviceLanguages = listOf("ko-KR"),
            supportedOnDeviceLanguages = emptyList()))
  }

  @Test
  fun anotherRegionalModelDoesNotSatisfyTheSelectedLocale() {
    assertEquals(
        SpeechModelPreparation.UNSUPPORTED,
        speechModelPreparation(
            requestedLocaleTag = "pt-BR",
            installedOnDeviceLanguages = listOf("pt-PT"),
            pendingOnDeviceLanguages = emptyList(),
            supportedOnDeviceLanguages = listOf("fr-FR")))
  }

  @Test
  fun emptySupportReportFallsBackToRecognitionProbe() {
    assertEquals(
        SpeechModelPreparation.UNKNOWN,
        speechModelPreparation(
            requestedLocaleTag = "fr-FR",
            installedOnDeviceLanguages = emptyList(),
            pendingOnDeviceLanguages = emptyList(),
            supportedOnDeviceLanguages = emptyList()))
  }

  @Test
  fun scheduledDownloadKeepsProcessingUntilTheModelIsReady() {
    assertEquals(
        SpeechModelDownloadContinuation.WAIT_FOR_MODEL,
        speechModelDownloadContinuation(SpeechModelDownloadStatus.SCHEDULED))
  }

  @Test
  fun speechModelProgressIsClampedToAPercentage() {
    assertEquals(0, normalizedSpeechModelProgress(-8))
    assertEquals(42, normalizedSpeechModelProgress(42))
    assertEquals(100, normalizedSpeechModelProgress(140))
  }

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
  fun disconnectedSpeechServiceIsRetriedOnce() {
    assertEquals(
        SpeechRecognitionRecovery.RETRY_AFTER_SERVICE_RECONNECT,
        speechRecognitionRecovery(
            errorCode = SpeechRecognizer.ERROR_SERVER_DISCONNECTED,
            modelDownloadAttempted = false,
            serviceReconnectAttempted = false))
    assertEquals(
        SpeechRecognitionRecovery.FAIL,
        speechRecognitionRecovery(
            errorCode = SpeechRecognizer.ERROR_SERVER_DISCONNECTED,
            modelDownloadAttempted = false,
            serviceReconnectAttempted = true))
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
