import React, {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Alert,
  Image,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import type { Asset } from 'react-native-image-picker';

import {
  buildPersistedManualFallbackProject,
  buildProjectFromAsset,
  repairProjectMedia,
} from './services/project-processor';
import {
  getAvailableSpeechLocales,
  getDeviceLocale,
  getSpeechAuthorizationStatus,
  requestSpeechAuthorization,
} from './services/native-voxa';
import { pickVideoAsset } from './services/media-picker';
import { haptics } from './services/haptics';
import { resolveLocale } from './i18n/translations';
import { useTranslation } from './i18n/useTranslation';
import {
  APP_LANGUAGE_LOCALE_VALUE,
  findSpeechLocaleOption,
  resolveAppSpeechLocale,
  resolveRememberedSpeechLocale,
} from './lib/speech-locale';
import { useAppStore } from './store/app-store';
import { SpeechAccessSheet } from './components/permissions/SpeechAccessSheet';
import { emptyStateImage, onboardingCards, palette } from './theme/tokens';
import { EditorScreen } from './components/editor/EditorScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { SettingsScreen } from './components/home/SettingsScreen';
import { TranscriptionLanguageSheet } from './components/home/TranscriptionLanguageSheet';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ProcessingOverlay } from './components/processing/ProcessingOverlay';
import { SplashSequence } from './components/splash/SplashSequence';
import type { PermissionSummary, SpeechLocaleOption } from './types/models';

export function AppRoot() {
  const { t } = useTranslation();
  const hydrated = useAppStore(state => state.hydrated);
  const projects = useAppStore(state => state.projects);
  const processing = useAppStore(state => state.processing);
  const settings = useAppStore(state => state.settings);
  const route = useAppStore(state => state.route);
  const activeProjectId = useAppStore(state => state.activeProjectId);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const uiLocale = useAppStore(state => state.uiLocale);
  const setUiLocale = useAppStore(state => state.setUiLocale);

  const resetOnboarding = useAppStore(state => state.resetOnboarding);
  const openProject = useAppStore(state => state.openProject);
  const addProject = useAppStore(state => state.addProject);
  const deleteProject = useAppStore(state => state.deleteProject);
  const beginProcessing = useAppStore(state => state.beginProcessing);
  const setProcessingPhase = useAppStore(state => state.setProcessingPhase);
  const finishProcessing = useAppStore(state => state.finishProcessing);
  const openSettings = useAppStore(state => state.openSettings);
  const closeSettings = useAppStore(state => state.closeSettings);
  const setPreferredExportResolution = useAppStore(
    state => state.setPreferredExportResolution,
  );
  const setHighlightEditedWords = useAppStore(state => state.setHighlightEditedWords);
  const setTranscriptionLanguageMode = useAppStore(
    state => state.setTranscriptionLanguageMode,
  );
  const setRememberLastTranscriptionLanguage = useAppStore(
    state => state.setRememberLastTranscriptionLanguage,
  );
  const setLastTranscriptionLocale = useAppStore(
    state => state.setLastTranscriptionLocale,
  );
  const replaceProject = useAppStore(state => state.replaceProject);

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (uiLocale !== null) {
      return;
    }

    getDeviceLocale()
      .then(raw => {
        const resolved = resolveLocale(raw);
        setUiLocale(resolved);
      })
      .catch(() => {
        setUiLocale('en');
      });
  }, [hydrated, uiLocale, setUiLocale]);
  const repairedProjectIdsRef = useRef(new Set<string>());
  const [pendingSpeechAsset, setPendingSpeechAsset] = useState<Asset | null>(null);
  const [speechAccessStatus, setSpeechAccessStatus] =
    useState<PermissionSummary['speech'] | null>(null);
  const [speechAccessPending, setSpeechAccessPending] = useState(false);
  const [pendingTranscriptionAsset, setPendingTranscriptionAsset] =
    useState<Asset | null>(null);
  const [availableSpeechLocales, setAvailableSpeechLocales] = useState<
    SpeechLocaleOption[]
  >([]);
  const [speechLocalesLoading, setSpeechLocalesLoading] = useState(false);
  const [selectedTranscriptionLocale, setSelectedTranscriptionLocale] = useState(
    APP_LANGUAGE_LOCALE_VALUE,
  );

  const showSpeechAccessError = useCallback((error: unknown) => {
    const rawMessage = error instanceof Error && error.message ? error.message : null;
    const message =
      rawMessage === 'Unable to open the photo library.'
        ? t('photoLibraryOpenFailed')
        : rawMessage === 'The selected video could not be read.'
        ? t('selectedVideoUnreadable')
        : rawMessage ?? t('speechAccessFailedBody');

    Alert.alert(t('speechAccessFailedTitle'), message);
  }, [t]);

  const showLanguageListError = useCallback((error: unknown) => {
    const message =
      error instanceof Error && error.message
        ? error.message
        : t('languageListFailedBody');

    Alert.alert(t('languageListFailedTitle'), message);
  }, [t]);

  const loadSpeechLocales = useCallback(async () => {
    if (availableSpeechLocales.length > 0) {
      return availableSpeechLocales;
    }

    setSpeechLocalesLoading(true);
    try {
      const locales = await getAvailableSpeechLocales();
      setAvailableSpeechLocales(locales);
      return locales;
    } catch (error) {
      showLanguageListError(error);
      return [];
    } finally {
      setSpeechLocalesLoading(false);
    }
  }, [availableSpeechLocales, showLanguageListError]);

  useEffect(() => {
    const remoteImages = [
      emptyStateImage,
      ...onboardingCards.map(card => card.image),
    ];
    remoteImages.forEach(uri => {
      Image.prefetch(uri).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!hydrated || projects.length === 0) {
      return;
    }

    projects.forEach(project => {
      if (repairedProjectIdsRef.current.has(project.id)) {
        return;
      }

      repairedProjectIdsRef.current.add(project.id);
      repairProjectMedia(project)
        .then(repairedProject => {
          if (repairedProject !== project) {
            replaceProject(repairedProject);
          }
        })
        .catch(() => {});
    });
  }, [hydrated, projects, replaceProject]);

  const activeProject =
    projects.find(project => project.id === activeProjectId) ?? null;

  const appSpeechLocale = uiLocale
    ? resolveAppSpeechLocale(uiLocale, availableSpeechLocales)
    : null;
  const appSpeechLocaleLabel = appSpeechLocale
    ? findSpeechLocaleOption(appSpeechLocale, availableSpeechLocales)?.label
    : null;
  const lastTranscriptionLanguageLabel =
    findSpeechLocaleOption(
      settings.lastTranscriptionLocale,
      availableSpeechLocales,
    )?.label ??
    settings.lastTranscriptionLocale ??
    undefined;
  const transcriptionAppLanguageLabel = appSpeechLocaleLabel
    ? `${t('appLanguageLabel')} (${appSpeechLocaleLabel})`
    : `${t('appLanguageLabel')} (${uiLocale ? uiLocale.toUpperCase() : t('appLanguageFallback')})`;

  const closeSpeechAccessSheet = useCallback(() => {
    setPendingSpeechAsset(null);
    setSpeechAccessStatus(null);
    setSpeechAccessPending(false);
  }, []);

  const resolveDefaultTranscriptionLocale = useCallback((
    locales: SpeechLocaleOption[],
  ) => {
    if (settings.rememberLastTranscriptionLanguage) {
      const rememberedLocale = resolveRememberedSpeechLocale(
        settings.lastTranscriptionLocale,
        locales,
      );
      if (rememberedLocale) {
        return rememberedLocale;
      }
    }

    return uiLocale ? resolveAppSpeechLocale(uiLocale, locales) : null;
  }, [
    settings.lastTranscriptionLocale,
    settings.rememberLastTranscriptionLanguage,
    uiLocale,
  ]);

  const processAsset = useCallback(async (
    asset: Asset,
    localeOverride: string | null = null,
  ) => {
    beginProcessing(asset.uri);

    try {
      if (localeOverride && settings.rememberLastTranscriptionLanguage) {
        setLastTranscriptionLocale(localeOverride);
      }

      const project = await buildProjectFromAsset(
        asset,
        localeOverride,
        setProcessingPhase,
      );
      addProject(project);
      haptics.success();
      startTransition(() => {
        openProject(project.id);
      });
    } catch (error) {
      const fallbackProject = await buildPersistedManualFallbackProject(asset, error);
      addProject(fallbackProject);
      startTransition(() => {
        openProject(fallbackProject.id);
      });
    } finally {
      finishProcessing();
    }
  }, [
    addProject,
    beginProcessing,
    finishProcessing,
    openProject,
    setLastTranscriptionLocale,
    setProcessingPhase,
    settings.rememberLastTranscriptionLanguage,
  ]);

  const openTranscriptionLanguageSheet = useCallback(async (asset: Asset) => {
    const locales = await loadSpeechLocales();
    const rememberedLocale = settings.rememberLastTranscriptionLanguage
      ? resolveRememberedSpeechLocale(settings.lastTranscriptionLocale, locales)
      : null;

    setSelectedTranscriptionLocale(
      rememberedLocale ?? APP_LANGUAGE_LOCALE_VALUE,
    );
    setPendingTranscriptionAsset(asset);
  }, [
    loadSpeechLocales,
    settings.lastTranscriptionLocale,
    settings.rememberLastTranscriptionLanguage,
  ]);

  const prepareProjectImport = useCallback(async (asset: Asset) => {
    if (settings.transcriptionLanguageMode === 'ask') {
      await openTranscriptionLanguageSheet(asset);
      return;
    }

    const locales = await loadSpeechLocales();
    const localeOverride = resolveDefaultTranscriptionLocale(locales);
    await processAsset(asset, localeOverride);
  }, [
    loadSpeechLocales,
    openTranscriptionLanguageSheet,
    processAsset,
    resolveDefaultTranscriptionLocale,
    settings.transcriptionLanguageMode,
  ]);

  const closeTranscriptionLanguageSheet = useCallback(() => {
    setPendingTranscriptionAsset(null);
  }, []);

  const confirmTranscriptionLanguage = useCallback(async () => {
    if (!pendingTranscriptionAsset) {
      return;
    }

    const asset = pendingTranscriptionAsset;
    const locales = availableSpeechLocales.length > 0
      ? availableSpeechLocales
      : await loadSpeechLocales();
    const localeOverride =
      selectedTranscriptionLocale === APP_LANGUAGE_LOCALE_VALUE
        ? uiLocale
          ? resolveAppSpeechLocale(uiLocale, locales)
          : null
        : selectedTranscriptionLocale;

    setPendingTranscriptionAsset(null);
    await processAsset(asset, localeOverride);
  }, [
    availableSpeechLocales,
    loadSpeechLocales,
    pendingTranscriptionAsset,
    processAsset,
    selectedTranscriptionLocale,
    uiLocale,
  ]);

  const continueWithManualSubtitles = useCallback(async () => {
    if (!pendingSpeechAsset) {
      return;
    }

    const asset = pendingSpeechAsset;
    const error =
      speechAccessStatus === 'restricted'
        ? new Error(t('permRestricted'))
        : new Error(t('permDenied'));

    closeSpeechAccessSheet();
    const fallbackProject = await buildPersistedManualFallbackProject(asset, error);
    addProject(fallbackProject);
    startTransition(() => {
      openProject(fallbackProject.id);
    });
  }, [
    addProject,
    closeSpeechAccessSheet,
    openProject,
    pendingSpeechAsset,
    speechAccessStatus,
    t,
  ]);

  const refreshSpeechAccess = useCallback(async () => {
    if (!pendingSpeechAsset) {
      return;
    }

    const nextStatus = await getSpeechAuthorizationStatus();
    setSpeechAccessStatus(nextStatus);

    if (nextStatus !== 'authorized') {
      return;
    }

    const asset = pendingSpeechAsset;
    closeSpeechAccessSheet();
    await prepareProjectImport(asset);
  }, [closeSpeechAccessSheet, pendingSpeechAsset, prepareProjectImport]);

  useEffect(() => {
    if (!pendingSpeechAsset) {
      return;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') {
        return;
      }

      refreshSpeechAccess().catch(() => {});
    });

    return () => {
      subscription.remove();
    };
  }, [pendingSpeechAsset, refreshSpeechAccess]);

  const handleCreateProject = async () => {
    const asset = await pickVideoAsset();
    if (!asset) {
      return;
    }

    const speechStatus = await getSpeechAuthorizationStatus();
    if (speechStatus !== 'authorized') {
      setPendingSpeechAsset(asset);
      setSpeechAccessStatus(speechStatus);
      return;
    }

    await prepareProjectImport(asset);
  };

  const handleGrantSpeechAccess = useCallback(async () => {
    if (!pendingSpeechAsset) {
      return;
    }

    setSpeechAccessPending(true);
    try {
      const nextStatus = await requestSpeechAuthorization();
      setSpeechAccessStatus(nextStatus);

      if (nextStatus !== 'authorized') {
        return;
      }

      const asset = pendingSpeechAsset;
      closeSpeechAccessSheet();
      await prepareProjectImport(asset);
    } finally {
      setSpeechAccessPending(false);
    }
  }, [closeSpeechAccessSheet, pendingSpeechAsset, prepareProjectImport]);

  const handleOpenSpeechSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  if (!hydrated || uiLocale === null) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      {!hasCompletedOnboarding ? (
        <OnboardingFlow />
      ) : route === 'editor' && activeProject ? (
        <EditorScreen
          onClose={() => {}}
          project={activeProject}
        />
      ) : route === 'settings' ? (
        <SettingsScreen
          onClose={closeSettings}
          onHighlightEditedWordsChange={setHighlightEditedWords}
          onRememberLastTranscriptionLanguageChange={
            setRememberLastTranscriptionLanguage
          }
          onResetOnboarding={() => {
            closeSettings();
            resetOnboarding();
          }}
          onResolutionChange={setPreferredExportResolution}
          onTranscriptionLanguageModeChange={setTranscriptionLanguageMode}
          onUiLocaleChange={setUiLocale}
          highlightEditedWords={settings.highlightEditedWords}
          lastTranscriptionLanguageLabel={lastTranscriptionLanguageLabel}
          preferredExportResolution={settings.preferredExportResolution}
          rememberLastTranscriptionLanguage={
            settings.rememberLastTranscriptionLanguage
          }
          transcriptionLanguageMode={settings.transcriptionLanguageMode}
          uiLocale={uiLocale}
        />
      ) : (
        <HomeScreen
          onCreateProject={() => {
            handleCreateProject().catch(showSpeechAccessError);
          }}
          onDeleteProject={deleteProject}
          onOpenProject={projectId => {
            startTransition(() => {
              openProject(projectId);
            });
          }}
          onOpenSettings={openSettings}
          processingVisible={processing.visible}
          projects={projects}
        />
      )}

      <TranscriptionLanguageSheet
        appLanguageLabel={transcriptionAppLanguageLabel}
        loading={speechLocalesLoading}
        localeOptions={availableSpeechLocales}
        onClose={closeTranscriptionLanguageSheet}
        onConfirm={() => {
          confirmTranscriptionLanguage().catch(showSpeechAccessError);
        }}
        onSelectLocale={setSelectedTranscriptionLocale}
        selectedLocale={selectedTranscriptionLocale}
        visible={pendingTranscriptionAsset !== null}
      />

      <SpeechAccessSheet
        assetName={pendingSpeechAsset?.fileName ?? t('selectedVideo')}
        onClose={closeSpeechAccessSheet}
        onContinueManually={continueWithManualSubtitles}
        onGrantAccess={() => {
          handleGrantSpeechAccess().catch(showSpeechAccessError);
        }}
        onOpenSettings={() => {
          handleOpenSpeechSettings().catch(showSpeechAccessError);
        }}
        pending={speechAccessPending}
        speechStatus={speechAccessStatus}
        visible={pendingSpeechAsset !== null && speechAccessStatus !== 'authorized'}
      />

      <ProcessingOverlay processing={processing} />

      {showSplash ? <SplashSequence onComplete={() => setShowSplash(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
});
