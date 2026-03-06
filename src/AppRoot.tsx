import React, {
  startTransition,
  useCallback,
  useEffect,
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

import { buildManualFallbackProject, buildProjectFromAsset } from './services/project-processor';
import {
  getSpeechAuthorizationStatus,
  requestAuthorizations,
  requestSpeechAuthorization,
} from './services/native-voxa';
import { pickVideoAsset } from './services/media-picker';
import { haptics } from './services/haptics';
import { useAppStore } from './store/app-store';
import { SpeechAccessSheet } from './components/permissions/SpeechAccessSheet';
import { emptyStateImage, onboardingCards, palette } from './theme/tokens';
import { EditorScreen } from './components/editor/EditorScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { SettingsSheet } from './components/home/SettingsSheet';
import { OnboardingCarousel } from './components/onboarding/OnboardingCarousel';
import { ProcessingOverlay } from './components/processing/ProcessingOverlay';
import { SplashSequence } from './components/splash/SplashSequence';
import type { PermissionSummary } from './types/models';

export function AppRoot() {
  const hydrated = useAppStore(state => state.hydrated);
  const projects = useAppStore(state => state.projects);
  const processing = useAppStore(state => state.processing);
  const settings = useAppStore(state => state.settings);
  const route = useAppStore(state => state.route);
  const activeProjectId = useAppStore(state => state.activeProjectId);
  const settingsOpen = useAppStore(state => state.settingsOpen);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);

  const completeOnboarding = useAppStore(state => state.completeOnboarding);
  const resetOnboarding = useAppStore(state => state.resetOnboarding);
  const openProject = useAppStore(state => state.openProject);
  const addProject = useAppStore(state => state.addProject);
  const deleteProject = useAppStore(state => state.deleteProject);
  const beginProcessing = useAppStore(state => state.beginProcessing);
  const setProcessingPhase = useAppStore(state => state.setProcessingPhase);
  const finishProcessing = useAppStore(state => state.finishProcessing);
  const openSettings = useAppStore(state => state.openSettings);
  const closeSettings = useAppStore(state => state.closeSettings);
  const setSpeechLocale = useAppStore(state => state.setSpeechLocale);
  const setPreferredExportResolution = useAppStore(
    state => state.setPreferredExportResolution,
  );

  const [showSplash, setShowSplash] = useState(true);
  const [permissionSummary, setPermissionSummary] =
    useState<PermissionSummary | null>(null);
  const [permissionsPending, setPermissionsPending] = useState(false);
  const [pendingSpeechAsset, setPendingSpeechAsset] = useState<Asset | null>(null);
  const [speechAccessStatus, setSpeechAccessStatus] =
    useState<PermissionSummary['speech'] | null>(null);
  const [speechAccessPending, setSpeechAccessPending] = useState(false);

  const showSpeechAccessError = useCallback((error: unknown) => {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Unable to request Speech Recognition access right now.';

    Alert.alert('Speech Access Failed', message);
  }, []);

  useEffect(() => {
    const remoteImages = [
      emptyStateImage,
      ...onboardingCards.map(card => card.image),
    ];
    remoteImages.forEach(uri => {
      Image.prefetch(uri).catch(() => {});
    });
  }, []);

  const activeProject =
    projects.find(project => project.id === activeProjectId) ?? null;

  const closeSpeechAccessSheet = useCallback(() => {
    setPendingSpeechAsset(null);
    setSpeechAccessStatus(null);
    setSpeechAccessPending(false);
  }, []);

  const handleGrantAccess = async () => {
    setPermissionsPending(true);
    try {
      const summary = await requestAuthorizations();
      setPermissionSummary(summary);
    } finally {
      setPermissionsPending(false);
      completeOnboarding();
    }
  };

  const processAsset = useCallback(async (asset: Asset) => {
    beginProcessing(asset.uri);

    try {
      const project = await buildProjectFromAsset(
        asset,
        settings.speechLocale,
        setProcessingPhase,
      );
      addProject(project);
      haptics.success();
      startTransition(() => {
        openProject(project.id);
      });
    } catch (error) {
      const fallbackProject = buildManualFallbackProject(asset, error);
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
    setProcessingPhase,
    settings.speechLocale,
  ]);

  const continueWithManualSubtitles = useCallback(() => {
    if (!pendingSpeechAsset) {
      return;
    }

    const asset = pendingSpeechAsset;
    const error =
      speechAccessStatus === 'restricted'
        ? new Error('Speech recognition is restricted on this device.')
        : new Error('Speech recognition permission has not been granted.');

    closeSpeechAccessSheet();
    const fallbackProject = buildManualFallbackProject(asset, error);
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
    await processAsset(asset);
  }, [closeSpeechAccessSheet, pendingSpeechAsset, processAsset]);

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

    await processAsset(asset);
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
      await processAsset(asset);
    } finally {
      setSpeechAccessPending(false);
    }
  }, [closeSpeechAccessSheet, pendingSpeechAsset, processAsset]);

  const handleOpenSpeechSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  if (!hydrated) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      {!hasCompletedOnboarding ? (
        <OnboardingCarousel
          onGrantAccess={handleGrantAccess}
          onSkip={completeOnboarding}
          pending={permissionsPending}
          permissionSummary={permissionSummary}
        />
      ) : route === 'editor' && activeProject ? (
        <EditorScreen
          onClose={() => {}}
          project={activeProject}
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

      <SettingsSheet
        onClose={closeSettings}
        onResetOnboarding={() => {
          closeSettings();
          resetOnboarding();
        }}
        onResolutionChange={setPreferredExportResolution}
        onSpeechLocaleChange={setSpeechLocale}
        preferredExportResolution={settings.preferredExportResolution}
        speechLocale={settings.speechLocale}
        visible={settingsOpen}
      />

      <SpeechAccessSheet
        assetName={pendingSpeechAsset?.fileName ?? 'Selected video'}
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
