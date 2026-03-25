import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {
  useAtom,
  useAtomValue,
  useSetAtom,
} from 'jotai';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Video, { type OnLoadData, type VideoRef } from 'react-native-video';

import {
  applyManualSubtitleTextEdit,
  clamp,
  countRenderableSubtitles,
  findActiveSubtitleWordIndex,
  formatDuration,
  getRenderableSubtitleWords,
  getSubtitleVerticalBounds,
  getSubtitleVerticalOrigin,
  hasRenderableSubtitleWords,
  isSameEditableSubtitleText,
  isPlaceholderSubtitle,
  resolveSubtitleStyleFromVerticalOrigin,
  setSubtitlePositionPreset,
} from '../../lib/project';
import {
  getAvailableSpeechLocales,
  exportProject,
  saveVideoToPhotos,
  type NativeSubtitleSegment,
} from '../../services/native-voxa';
import { haptics } from '../../services/haptics';
import { retryProjectSubtitles } from '../../services/project-processor';
import { useAppStore } from '../../store/app-store';
import {
  activeSubtitleAtom,
  editorProjectAtom,
  EditorStateProvider,
  globalStyleAtom,
  isExportSheetOpenAtom,
  isPlayingAtom,
  isStylePanelOpenAtom,
  isTextEditingAtom,
  playbackPositionAtom,
  selectedSubtitleAtom,
  selectedSubtitleIdAtom,
  subtitlesAtom,
  timelineZoomAtom,
} from '../../store/editor-atoms';
import {
  palette,
  subtitleFontOptions,
  subtitleHighlightColorOptions,
  subtitleBackgroundColorOptions,
  subtitlePositionOptions,
  subtitleSizeOptions,
  subtitleTextColorOptions,
} from '../../theme/tokens';
import type {
  ExportResolution,
  Project,
  SpeechLocaleOption,
  SubtitleBlock,
  SubtitleEffect,
} from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { GlassPanel } from '../common/GlassPanel';
import { HighlightedSubtitleText } from '../common/HighlightedSubtitleText';
import { ExportSheet } from './ExportSheet';
import { calculateEditorVerticalLayout } from './layout';
import {
  AUTO_DETECT_LOCALE_VALUE,
  LocaleRetrySheet,
} from './LocaleRetrySheet';

const MAX_TIMELINE_SURFACE_WIDTH = 8192;
const TIMELINE_COLLAPSE_DURATION_MS = 220;
const SUBTITLE_NAVIGATION_SETTLE_MS = 260;
const SEEK_PROGRESS_SYNC_WINDOW_MS = 220;
const WORD_HIGHLIGHT_SWITCH_ID = 'word-highlight-switch';
export const ACTIVE_SUBTITLE_SECTION_ID = 'active-subtitle-section';
export const ACTIVE_SUBTITLE_HEADER_ID = 'active-subtitle-header';
export const ACTIVE_SUBTITLE_PREV_BUTTON_ID = 'active-subtitle-prev-button';
export const ACTIVE_SUBTITLE_NEXT_BUTTON_ID = 'active-subtitle-next-button';
export const BOTTOM_EDITOR_SHELL_ID = 'bottom-editor-shell';
export const TIMELINE_SECTION_ID = 'timeline-section';
export const BOTTOM_EDITOR_PAGER_ID = 'bottom-editor-pager';
export const BOTTOM_EDITOR_PRIMARY_TAB_ID = 'bottom-editor-primary-tab';
export const BOTTOM_EDITOR_STYLE_TAB_ID = 'bottom-editor-style-tab';
export const BOTTOM_EDITOR_LANGUAGE_TAB_ID = 'bottom-editor-language-tab';
export const BOTTOM_EDITOR_FX_TAB_ID = 'bottom-editor-fx-tab';
export const EDITOR_TOP_BAR_ID = 'editor-top-bar';
export const KEYBOARD_DISMISS_BUTTON_ID = 'keyboard-dismiss-button';
export const OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX = 'overlay-subtitle-word';
export const RETRY_SUBTITLE_BANNER_BUTTON_ID = 'retry-subtitle-banner-button';

export function resolveSubtitlePreviewTop({
  isDragging,
  dragStartTop,
  liveAnchorTop,
  translationY,
  minTop,
  maxTop,
}: {
  isDragging: boolean;
  dragStartTop: number;
  liveAnchorTop: number;
  translationY: number;
  minTop: number;
  maxTop: number;
}) {
  'worklet';

  const baseTop = isDragging ? dragStartTop : liveAnchorTop;
  return Math.min(Math.max(baseTop + translationY, minTop), maxTop);
}

export function resolveOverlaySubtitle({
  isDragging,
  draggedSubtitleSnapshot,
  navigationPinnedSubtitleSnapshot,
  liveSubtitle,
}: {
  isDragging: boolean;
  draggedSubtitleSnapshot: SubtitleBlock | null;
  navigationPinnedSubtitleSnapshot: SubtitleBlock | null;
  liveSubtitle: SubtitleBlock | null;
}) {
  if (isDragging && draggedSubtitleSnapshot) {
    return draggedSubtitleSnapshot;
  }

  if (navigationPinnedSubtitleSnapshot) {
    return navigationPinnedSubtitleSnapshot;
  }

  return liveSubtitle;
}

interface EditorScreenProps {
  project: Project;
  onClose: () => void;
}

export function EditorScreen({ project, onClose }: EditorScreenProps) {
  return (
    <EditorStateProvider key={project.id} project={project}>
      <EditorScreenContent onClose={onClose} />
    </EditorStateProvider>
  );
}

function EditorScreenContent({ onClose }: { onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoRef>(null);
  const timelineRef = useRef<ScrollView>(null);
  const bottomEditorPagerRef = useRef<ScrollView>(null);
  const lastSeekMs = useRef(0);
  const isScrubbing = useRef(false);
  const navigationPinnedSubtitleExpiresAtRef = useRef(0);
  const pendingSeekSyncRef = useRef<{ expiresAt: number; targetMs: number } | null>(null);
  const [skipFlash, setSkipFlash] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [subtitleBubbleHeight, setSubtitleBubbleHeight] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [localeRetrySheetVisible, setLocaleRetrySheetVisible] = useState(false);
  const [availableSpeechLocales, setAvailableSpeechLocales] = useState<SpeechLocaleOption[]>([]);
  const [loadingSpeechLocales, setLoadingSpeechLocales] = useState(false);
  const [retryingSubtitles, setRetryingSubtitles] = useState(false);
  const [draggedSubtitleSnapshot, setDraggedSubtitleSnapshot] = useState<SubtitleBlock | null>(null);
  const [navigationPinnedSubtitleSnapshot, setNavigationPinnedSubtitleSnapshot] = useState<SubtitleBlock | null>(null);
  const isSubtitleDraggingRef = useRef(false);
  const subtitleCanvasPreviewTopY = useSharedValue(0);
  const isSubtitleDragging = useSharedValue(false);
  const dragStartTop = useSharedValue(0);
  const subtitleSwapProgress = useSharedValue(1);

  const [editorProject, setProject] = useAtom(editorProjectAtom);
  const [playbackPosition, setPlaybackPosition] = useAtom(playbackPositionAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [selectedSubtitleId, setSelectedSubtitleId] = useAtom(selectedSubtitleIdAtom);
  const [subtitles, setSubtitles] = useAtom(subtitlesAtom);
  const [stylePresetValue, setStylePreset] = useAtom(globalStyleAtom);
  const [timelineZoom, setTimelineZoom] = useAtom(timelineZoomAtom);
  const [isTextEditing, setIsTextEditing] = useAtom(isTextEditingAtom);
  const [isStylePanelOpen, setIsStylePanelOpen] = useAtom(isStylePanelOpenAtom);
  const [isExportSheetOpen, setIsExportSheetOpen] = useAtom(isExportSheetOpenAtom);
  const activeSubtitle = useAtomValue(activeSubtitleAtom);
  const selectedSubtitle = useAtomValue(selectedSubtitleAtom);
  const setPlayback = useSetAtom(playbackPositionAtom);
  const project = editorProject as Project;
  const stylePreset = stylePresetValue as Project['globalStyle'];
  const [draftTextPreview, setDraftTextPreview] = useState<string | null>(null);

  const [selectedRetryLocale, setSelectedRetryLocale] = useState(
    project.recognitionLocale || AUTO_DETECT_LOCALE_VALUE
  );
  const [activeTab, setActiveTab] = useState<'subtitle' | 'style' | 'language' | 'fx'>('subtitle');
  const [showRegenerateButton, setShowRegenerateButton] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 2000);
  }, [clearHideTimer]);

  useEffect(() => {
    if (isPlaying) {
      scheduleHideControls();
    } else {
      clearHideTimer();
      setShowControls(true);
    }
    return clearHideTimer;
  }, [isPlaying, scheduleHideControls, clearHideTimer]);

  useEffect(() => {
    const handleKeyboardShow = (event?: { endCoordinates?: { height?: number } }) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event?.endCoordinates?.height ?? 0);
    };
    const handleKeyboardHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const subscriptions = [
      Keyboard.addListener('keyboardWillShow', handleKeyboardShow),
      Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
      Keyboard.addListener('keyboardDidShow', handleKeyboardShow),
      Keyboard.addListener('keyboardDidHide', handleKeyboardHide),
    ];

    return () => {
      subscriptions.forEach(subscription => {
        subscription.remove();
      });
    };
  }, []);

  useEffect(() => {
    const pageIndex = activeTab === 'subtitle' ? 0 : activeTab === 'style' ? 1 : activeTab === 'language' ? 2 : 3;
    bottomEditorPagerRef.current?.scrollTo?.({
      x: pageIndex * width,
      animated: true,
    });
  }, [activeTab, width]);

  const closeProject = useAppStore(state => state.closeProject);
  const beginProcessing = useAppStore(state => state.beginProcessing);
  const finishProcessing = useAppStore(state => state.finishProcessing);
  const setProcessingPhase = useAppStore(state => state.setProcessingPhase);
  const upsertProject = useAppStore(state => state.upsertProject);
  const resolution = useAppStore(state => state.settings.preferredExportResolution);
  const highlightEditedWords = useAppStore(state => state.settings.highlightEditedWords);
  const setResolution = useAppStore(state => state.setPreferredExportResolution);

  const persistProject = useEffectEvent((nextProject: Project | null) => {
    if (!nextProject) {
      return;
    }
    upsertProject(nextProject);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      persistProject(project);
    }, 120);
    return () => clearTimeout(timer);
  }, [project]);

  const topBarOffset = insets.top + 2;
  const bottomInset = Math.max(insets.bottom, 12);
  const keyboardOverlapInset = keyboardVisible
    ? Math.max(0, keyboardHeight - insets.bottom)
    : 0;
  const isKeyboardEditing = keyboardVisible && isTextEditing;
  const recognitionNeedsAttention = project.recognitionStatus !== 'ready';
  const editorLayout = calculateEditorVerticalLayout({
    screenHeight: height,
    topInset: insets.top,
    bottomInset: bottomInset + keyboardOverlapInset,
    bannerHeight: recognitionNeedsAttention ? Math.max(bannerHeight, 60) : 0,
    timelineCollapsed: false,
    topBarCollapsed: isKeyboardEditing,
  });
  const collapsedEditorLayout = calculateEditorVerticalLayout({
    screenHeight: height,
    topInset: insets.top,
    bottomInset: bottomInset + keyboardOverlapInset,
    bannerHeight: recognitionNeedsAttention ? Math.max(bannerHeight, 60) : 0,
    timelineCollapsed: true,
    topBarCollapsed: isKeyboardEditing,
  });
  const isTimelineCollapsed = keyboardVisible;
  const showKeyboardDismissButton = keyboardVisible && isTextEditing;
  const targetTimelineHeight = isTimelineCollapsed ? 0 : editorLayout.timelineTrackHeight;
  const targetTextZoneHeight = isTimelineCollapsed
    ? collapsedEditorLayout.textHeight
    : editorLayout.textHeight;
  const targetBottomEditorHeight =
    (isTimelineCollapsed
      ? collapsedEditorLayout.textHeight
      : editorLayout.timelineControlsHeight + editorLayout.textHeight) +
    (isTimelineCollapsed
      ? collapsedEditorLayout.bottomEditorTabsHeight
      : editorLayout.bottomEditorTabsHeight);

  const durationMs = Math.max(0, project?.duration ?? 0);
  const basePixelsPerSecond = 82 * timelineZoom;
  const basePixelsPerMs = basePixelsPerSecond / 1000;
  const rawContentWidth = Math.max(width, durationMs * basePixelsPerMs);
  const timelineScale =
    rawContentWidth > MAX_TIMELINE_SURFACE_WIDTH
      ? MAX_TIMELINE_SURFACE_WIDTH / rawContentWidth
      : 1;
  const pixelsPerMs = basePixelsPerMs * timelineScale;
  const contentWidth = Math.max(width, durationMs * pixelsPerMs);

  const activeDisplaySubtitle =
    isTextEditing ? selectedSubtitle ?? activeSubtitle : activeSubtitle;
  const liveDisplaySubtitle = isPlaceholderSubtitle(activeDisplaySubtitle)
    ? null
    : activeDisplaySubtitle;
  const resolvedDisplaySubtitle = resolveOverlaySubtitle({
    isDragging: isSubtitleDraggingRef.current,
    draggedSubtitleSnapshot,
    navigationPinnedSubtitleSnapshot:
      navigationPinnedSubtitleSnapshot &&
      Date.now() < navigationPinnedSubtitleExpiresAtRef.current
        ? navigationPinnedSubtitleSnapshot
        : null,
    liveSubtitle: liveDisplaySubtitle,
  });
  const displaySubtitle =
    isTextEditing && resolvedDisplaySubtitle && draftTextPreview !== null
      ? {
          ...resolvedDisplaySubtitle,
          text: draftTextPreview,
          words: undefined,
        }
      : resolvedDisplaySubtitle;
  const wordHighlightAvailable = subtitles.some(
    subtitle =>
      !isPlaceholderSubtitle(subtitle) &&
      hasRenderableSubtitleWords(subtitle, {
        allowSyntheticWords: highlightEditedWords,
      }),
  );
  const hasRenderableSubtitleBlocks = countRenderableSubtitles(subtitles) > 0;
  const normalizedImportError = project.importError?.replace(/[.\s]+$/, '');
  const recognitionBannerText = project.importError
    ? `${normalizedImportError}. Manual subtitle editing remains available.`
    : hasRenderableSubtitleBlocks
    ? 'Subtitles were created, but this project is still marked as requiring review.'
    : 'No subtitles were generated for this clip. Try Auto Detect or pick a language manually.';
  const recognitionBannerDetail = project.recognitionLocale
    ? `Last attempt: ${project.recognitionLocale}${project.recognitionMode === 'manual' ? ' (manual)' : ' (auto)'}.`
    : 'Choose Auto Detect or a specific on-device language to retry.';

  const showRetryError = useCallback((error: unknown) => {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Unable to regenerate subtitles right now.';

    Alert.alert('Subtitle Retry Failed', message);
  }, []);

  const loadSpeechLocales = useCallback(async () => {
    setLoadingSpeechLocales(true);
    try {
      const locales = await getAvailableSpeechLocales();
      setAvailableSpeechLocales(locales);
      return locales;
    } catch (error) {
      showRetryError(error);
      return [];
    } finally {
      setLoadingSpeechLocales(false);
    }
  }, [showRetryError]);

  const openLocaleRetrySheet = useCallback(async () => {
    const initialLocale =
      project.recognitionMode === 'manual' && project.recognitionLocale
        ? project.recognitionLocale
        : AUTO_DETECT_LOCALE_VALUE;
    setSelectedRetryLocale(initialLocale);
    setLocaleRetrySheetVisible(true);

    if (availableSpeechLocales.length > 0) {
      return;
    }

    await loadSpeechLocales();
  }, [
    availableSpeechLocales.length,
    loadSpeechLocales,
    project.recognitionLocale,
    project.recognitionMode,
  ]);

  const closeLocaleRetrySheet = useCallback(() => {
    if (retryingSubtitles) {
      return;
    }
    setLocaleRetrySheetVisible(false);
  }, [retryingSubtitles]);

  useEffect(() => {
    loadSpeechLocales();
  }, [loadSpeechLocales]);

  const handleRetrySubtitleGeneration = useCallback(async () => {
    const localeOverride =
      selectedRetryLocale === AUTO_DETECT_LOCALE_VALUE ? null : selectedRetryLocale;

    setRetryingSubtitles(true);
    beginProcessing(project.videoLocalURI);

    try {
      const updatedProject = await retryProjectSubtitles(
        project,
        localeOverride,
        setProcessingPhase,
      );

      setProject(updatedProject);
      upsertProject(updatedProject);

      if (updatedProject.recognitionStatus === 'ready') {
        setLocaleRetrySheetVisible(false);
        haptics.success();
        return;
      }

      Alert.alert(
        'No Subtitles Created',
        updatedProject.importError ??
          'No subtitles were generated with the selected language.',
      );
    } catch (error) {
      showRetryError(error);
    } finally {
      finishProcessing();
      setRetryingSubtitles(false);
    }
  }, [
    beginProcessing,
    finishProcessing,
    project,
    selectedRetryLocale,
    setProcessingPhase,
    setProject,
    showRetryError,
    upsertProject,
  ]);

  const syncTimelineToPosition = (timeMs: number, animated = false) => {
    if (!timelineRef.current) {
      return;
    }
    timelineRef.current.scrollTo({
      x: Math.max(0, timeMs * pixelsPerMs),
      animated,
    });
  };

  const seekTo = (timeMs: number) => {
    const clamped = clamp(timeMs, 0, project?.duration ?? 0);
    pendingSeekSyncRef.current = {
      targetMs: clamped,
      expiresAt: Date.now() + SEEK_PROGRESS_SYNC_WINDOW_MS,
    };
    setPlaybackPosition(clamped);
    videoRef.current?.seek(clamped / 1000);
    syncTimelineToPosition(clamped);
  };

  const updateWordHighlightEnabled = (value: boolean) => {
    if (!stylePreset) {
      return;
    }
    setStylePreset({
      ...stylePreset,
      wordHighlightEnabled: value,
    });
  };

  const applyPositionPreset = (position: Project['globalStyle']['position']) => {
    if (!stylePreset) {
      return;
    }
    setStylePreset(setSubtitlePositionPreset(stylePreset, position));
  };

  const commitSubtitleVerticalPosition = (nextTop: number) => {
    if (!stylePreset) {
      return;
    }
    const nextSubtitleBubbleHeight = Math.max(
      subtitleBubbleHeight,
      stylePreset.fontSize + 24,
    );
    setStylePreset(
      resolveSubtitleStyleFromVerticalOrigin(
        stylePreset,
        nextTop,
        editorLayout.videoHeight,
        nextSubtitleBubbleHeight,
      ),
    );
  };

  const updateProjectSubtitles = (updater: (current: SubtitleBlock[]) => SubtitleBlock[]) => {
    setSubtitles(current => updater(current));
  };

  const updateSelectedSubtitleText = (text: string) => {
    if (!selectedSubtitleId || !selectedSubtitle) {
      return;
    }
    if (isSameEditableSubtitleText(selectedSubtitle.text, text)) {
      return;
    }
    updateProjectSubtitles(current =>
      current.map(subtitle =>
        subtitle.id === selectedSubtitleId
          ? applyManualSubtitleTextEdit(subtitle, text)
          : subtitle,
      ),
    );
    setProject(current =>
      current
        ? {
            ...current,
            lastEditedSubtitleId: selectedSubtitleId,
          }
        : current,
    );
  };

  const beginSubtitleDragSession = useCallback((subtitle: SubtitleBlock | null) => {
    isSubtitleDraggingRef.current = true;
    setDraggedSubtitleSnapshot(subtitle);
  }, []);

  const finishSubtitleDragSession = useCallback(() => {
    isSubtitleDraggingRef.current = false;
    setDraggedSubtitleSnapshot(null);
  }, []);

  const beginSubtitleNavigationTransition = useCallback((subtitle: SubtitleBlock | null) => {
    navigationPinnedSubtitleExpiresAtRef.current = Date.now() + SUBTITLE_NAVIGATION_SETTLE_MS;
    setNavigationPinnedSubtitleSnapshot(subtitle);
  }, []);

  const navigateAdjacentSubtitle = (direction: -1 | 1, keepEditing: boolean) => {
    if (!selectedSubtitle) {
      return;
    }
    const currentIndex = subtitles.findIndex(item => item.id === selectedSubtitle.id);
    if (currentIndex === -1) {
      return;
    }
    const nextSubtitle = subtitles[currentIndex + direction];
    if (!nextSubtitle) {
      return;
    }
    beginSubtitleNavigationTransition(nextSubtitle);
    updateSelectedSubtitleSelection(nextSubtitle.id, keepEditing);
  };

  const updateSelectedSubtitleSelection = (subtitleId: string, keepEditing: boolean) => {
    setSelectedSubtitleId(subtitleId);
    setIsTextEditing(keepEditing);
    const subtitle = subtitles.find(item => item.id === subtitleId);
    if (subtitle) {
      seekTo(subtitle.startTime);
    }
  };

  const selectedSubtitleIndex = selectedSubtitle
    ? subtitles.findIndex(item => item.id === selectedSubtitle.id)
    : -1;
  const canNavigatePrevSubtitle = selectedSubtitleIndex > 0;
  const canNavigateNextSubtitle =
    selectedSubtitleIndex > -1 && selectedSubtitleIndex < subtitles.length - 1;

  const handleVideoLoad = (event: OnLoadData) => {
    if (!project) {
      return;
    }
    setProject({
      ...project,
      duration: Math.max(project.duration, Math.round(event.duration * 1000)),
      metrics: {
        width: event.naturalSize.width,
        height: event.naturalSize.height,
      },
    });
    // Seek video to initial playhead so it matches the hydrated position
    if (playbackPosition > 0) {
      videoRef.current?.seek(playbackPosition / 1000);
    }
  };

  const handleVideoProgress = (currentTimeMs: number) => {
    if (isScrubbing.current) {
      return;
    }
    const pendingSeekSync = pendingSeekSyncRef.current;
    if (pendingSeekSync) {
      const seekSettled = Math.abs(currentTimeMs - pendingSeekSync.targetMs) <= 140;
      const seekExpired = Date.now() >= pendingSeekSync.expiresAt;

      if (!seekSettled && !seekExpired) {
        return;
      }

      pendingSeekSyncRef.current = null;
    }
    setPlayback(currentTimeMs);
    syncTimelineToPosition(currentTimeMs);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setPlaybackPosition(0);
    videoRef.current?.seek(0);
  };

  const handleTimelineScroll = (offsetX: number) => {
    if (!project || !isScrubbing.current) {
      return;
    }
    const nextPosition = clamp(offsetX / pixelsPerMs, 0, project.duration);
    setPlaybackPosition(nextPosition);
    const now = Date.now();
    if (now - lastSeekMs.current > 34) {
      videoRef.current?.seek(nextPosition / 1000);
      lastSeekMs.current = now;
    }
  };

  const togglePlayback = useCallback(() => {
    if (!isPlaying) {
      videoRef.current?.seek(playbackPosition / 1000);
    }
    setIsPlaying(current => !current);
  }, [isPlaying, playbackPosition, setIsPlaying]);

  const handleVideoTap = useCallback(() => {
    if (!showControls) {
      setShowControls(true);
      scheduleHideControls();
    }
    togglePlayback();
  }, [scheduleHideControls, showControls, togglePlayback]);

  const flashSkip = (label: string) => {
    setSkipFlash(label);
    setTimeout(() => setSkipFlash(null), 380);
  };

  const seekBy = (deltaMs: number) => {
    haptics.light();
    flashSkip(deltaMs > 0 ? '+5s' : '-5s');
    seekTo(playbackPosition + deltaMs);
  };

  const closeEditor = () => {
    setIsPlaying(false);
    closeProject();
    onClose();
  };

  const openExportSheet = () => {
    setIsExportSheetOpen(true);
    setIsPlaying(false);
  };

  const handleExport = async () => {
    if (!project || !stylePreset) {
      return;
    }
    setExporting(true);
    try {
      const response = await exportProject({
        videoURI: project.videoLocalURI,
        resolution: resolution as ExportResolution,
        style: stylePreset,
        subtitles: project.subtitles
          .filter(subtitle => !isPlaceholderSubtitle(subtitle))
          .map(subtitle => ({
            id: subtitle.id,
            startTime: subtitle.startTime,
            endTime: subtitle.endTime,
            text: subtitle.text,
            words: getRenderableSubtitleWords(subtitle, {
              allowSyntheticWords: highlightEditedWords,
            }),
            confidence: subtitle.confidence,
          })) satisfies NativeSubtitleSegment[],
      });
      await saveVideoToPhotos(response.outputUri);
    } finally {
      setExporting(false);
    }
  };

  const videoDismissGesture = Gesture.Pan().onEnd(event => {
    if (event.translationY > 90) {
      runOnJS(closeEditor)();
    }
  });

  const bottomEdgeGesture = Gesture.Pan().onEnd(event => {
    if (event.translationY < -60) {
      runOnJS(openExportSheet)();
    }
  });

  const effectiveSubtitleBubbleHeight =
    stylePreset ? Math.max(subtitleBubbleHeight, stylePreset.fontSize + 24) : subtitleBubbleHeight;
  const videoSubtitleBounds = getSubtitleVerticalBounds(
    editorLayout.videoHeight,
    effectiveSubtitleBubbleHeight,
  );
  const videoSubtitleTop = stylePreset && displaySubtitle
    ? getSubtitleVerticalOrigin(
        stylePreset,
        editorLayout.videoHeight,
        effectiveSubtitleBubbleHeight,
      )
    : 0;
  const overlayStylePreset =
    displaySubtitle &&
    hasRenderableSubtitleWords(displaySubtitle, {
      allowSyntheticWords: highlightEditedWords,
    })
      ? stylePreset
      : {
          ...stylePreset,
          wordHighlightEnabled: false,
        };

  const subtitleBubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.86 + subtitleSwapProgress.value * 0.14,
    top: subtitleCanvasPreviewTopY.value,
    transform: [
      {
        scale: 0.985 + subtitleSwapProgress.value * 0.015,
      },
      {
        translateY: (1 - subtitleSwapProgress.value) * 8,
      },
    ],
  }));
  const timelineSectionAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(targetTimelineHeight, { duration: TIMELINE_COLLAPSE_DURATION_MS }),
    opacity: withTiming(isTimelineCollapsed ? 0 : 1, {
      duration: TIMELINE_COLLAPSE_DURATION_MS,
    }),
  }));
  const topBarAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(isKeyboardEditing ? 0 : 34, {
      duration: TIMELINE_COLLAPSE_DURATION_MS,
    }),
    marginTop: withTiming(isKeyboardEditing ? insets.top : topBarOffset, {
      duration: TIMELINE_COLLAPSE_DURATION_MS,
    }),
    opacity: withTiming(isKeyboardEditing ? 0 : 1, {
      duration: TIMELINE_COLLAPSE_DURATION_MS,
    }),
    transform: [
      {
        translateY: withTiming(isKeyboardEditing ? -10 : 0, {
          duration: TIMELINE_COLLAPSE_DURATION_MS,
        }),
      },
    ],
  }));
  const textZoneAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(targetTextZoneHeight, { duration: TIMELINE_COLLAPSE_DURATION_MS }),
  }));
  const bottomEditorAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(targetBottomEditorHeight, { duration: TIMELINE_COLLAPSE_DURATION_MS }),
  }));
  const keyboardDismissAnimatedStyle = useAnimatedStyle(() => ({
    bottom: withTiming(showKeyboardDismissButton ? keyboardHeight + 10 : 0, {
      duration: TIMELINE_COLLAPSE_DURATION_MS,
    }),
    opacity: withTiming(showKeyboardDismissButton ? 1 : 0, {
      duration: TIMELINE_COLLAPSE_DURATION_MS,
    }),
    transform: [
      {
        translateY: withTiming(showKeyboardDismissButton ? 0 : 12, {
          duration: TIMELINE_COLLAPSE_DURATION_MS,
        }),
      },
    ],
  }));

  useLayoutEffect(() => {
    if (isSubtitleDraggingRef.current) {
      return;
    }
    const topDelta = videoSubtitleTop - subtitleCanvasPreviewTopY.value;
    subtitleCanvasPreviewTopY.value = withSpring(videoSubtitleTop, {
      stiffness: 280,
      damping: 28,
      mass: 0.8,
      velocity: topDelta === 0 ? 0 : Math.sign(topDelta) * 2.2,
    });
  }, [
    displaySubtitle?.id,
    stylePreset?.position,
    stylePreset?.positionOffsetYRatio,
    subtitleBubbleHeight,
    subtitleCanvasPreviewTopY,
    videoSubtitleTop,
  ]);

  useEffect(() => {
    subtitleSwapProgress.value = 0;
    subtitleSwapProgress.value = withSpring(1, {
      stiffness: 300,
      damping: 24,
      mass: 0.74,
      velocity: 2.4,
    });
  }, [displaySubtitle?.id, subtitleSwapProgress]);

  const subtitleDragGesture = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-28, 28])
    .onBegin(() => {
      isSubtitleDragging.value = true;
      dragStartTop.value = subtitleCanvasPreviewTopY.value || videoSubtitleTop;
      subtitleCanvasPreviewTopY.value = dragStartTop.value;
      runOnJS(beginSubtitleDragSession)(displaySubtitle);
      runOnJS(haptics.light)();
    })
    .onUpdate(event => {
      const nextTop = resolveSubtitlePreviewTop({
        isDragging: isSubtitleDragging.value,
        dragStartTop: dragStartTop.value,
        liveAnchorTop: videoSubtitleTop,
        translationY: event.translationY,
        minTop: videoSubtitleBounds.minTop,
        maxTop: videoSubtitleBounds.maxTop,
      });
      subtitleCanvasPreviewTopY.value = nextTop;
    })
    .onEnd(event => {
      const nextTop = resolveSubtitlePreviewTop({
        isDragging: isSubtitleDragging.value,
        dragStartTop: dragStartTop.value,
        liveAnchorTop: videoSubtitleTop,
        translationY: event.translationY,
        minTop: videoSubtitleBounds.minTop,
        maxTop: videoSubtitleBounds.maxTop,
      });
      subtitleCanvasPreviewTopY.value = nextTop;
      runOnJS(commitSubtitleVerticalPosition)(nextTop);
    })
    .onFinalize(() => {
      isSubtitleDragging.value = false;
      runOnJS(finishSubtitleDragSession)();
    });

  const subtitleTapGesture = Gesture.Tap().onEnd((_event, success) => {
    if (!success) {
      return;
    }
    runOnJS(handleVideoTap)();
  });

  if (!project || !stylePreset) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.springify().damping(18)}
      exiting={FadeOut.duration(180)}
      style={styles.root}>
      <AtmosphereCanvas intensity={1.1} />
      <Animated.View
        pointerEvents={isKeyboardEditing ? 'none' : 'auto'}
        style={[styles.topBarShell, topBarAnimatedStyle]}
        testID={EDITOR_TOP_BAR_ID}>
        <View style={styles.topBar}>
          <Pressable onPress={closeEditor} style={styles.topBarButton}>
            <Feather color={palette.textPrimary} name="chevron-down" size={18} />
          </Pressable>
          <View style={styles.topBarMeta}>
            <Text style={styles.topBarSubtitle}>
              {formatDuration(playbackPosition)} / {formatDuration(project.duration)}
            </Text>
          </View>
          <Pressable onPress={openExportSheet} style={styles.topBarButton}>
            <Feather color={palette.textPrimary} name="upload" size={18} />
          </Pressable>
        </View>
      </Animated.View>

      {recognitionNeedsAttention ? (
        <GlassPanel
          onLayout={event => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight !== bannerHeight) {
              setBannerHeight(nextHeight);
            }
          }}
          style={styles.banner}>
          <Feather color={palette.amber} name="alert-triangle" size={16} />
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerText}>{recognitionBannerText}</Text>
            <Text style={styles.bannerMeta}>{recognitionBannerDetail}</Text>
          </View>
          <Pressable
            disabled={retryingSubtitles}
            onPress={() => {
              openLocaleRetrySheet().catch(showRetryError);
            }}
            style={[
              styles.bannerAction,
              retryingSubtitles ? styles.bannerActionDisabled : undefined,
            ]}
            testID={RETRY_SUBTITLE_BANNER_BUTTON_ID}>
            <Text style={styles.bannerActionLabel}>Retry</Text>
          </Pressable>
        </GlassPanel>
      ) : null}

      <View
        style={[
          styles.contentStack,
          {
            gap: editorLayout.stackGap,
            paddingBottom: editorLayout.contentPaddingBottom,
          },
        ]}>
        <GestureDetector gesture={videoDismissGesture}>
          <View style={[styles.videoZone, { height: editorLayout.videoHeight }]}>
            <Video
              onEnd={handleVideoEnd}
              onLoad={handleVideoLoad}
              onProgress={event => handleVideoProgress(event.currentTime * 1000)}
              paused={!isPlaying}
              ref={videoRef}
              repeat={false}
              resizeMode="cover"
              source={{ uri: project.videoLocalURI }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.videoShade} />

            <View style={styles.doubleTapRow}>
              <GestureDetector
                gesture={Gesture.Tap().numberOfTaps(2).onEnd(() => runOnJS(seekBy)(-5000))}>
                <View style={styles.videoHalf} />
              </GestureDetector>
              <GestureDetector
                gesture={Gesture.Tap().numberOfTaps(2).onEnd(() => runOnJS(seekBy)(5000))}>
                <View style={styles.videoHalf} />
              </GestureDetector>
            </View>

            <Pressable onPress={handleVideoTap} style={StyleSheet.absoluteFill} />

            {showControls ? (
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(150)}
                pointerEvents="box-none"
                style={styles.playPauseWrap}>
                <Pressable onPress={togglePlayback} style={styles.playPauseButton}>
                  <Feather
                    color={palette.textPrimary}
                    name={isPlaying ? 'pause' : 'play'}
                    size={28}
                  />
                </Pressable>
              </Animated.View>
            ) : null}

            {skipFlash ? (
              <Animated.View
                entering={FadeIn.duration(120)}
                exiting={FadeOut.duration(220)}
                style={styles.skipFlash}>
                <Text style={styles.skipFlashText}>{skipFlash}</Text>
              </Animated.View>
            ) : null}

            {displaySubtitle ? (
              <View pointerEvents="box-none" style={styles.overlaySubtitleWrap}>
                <GestureDetector gesture={Gesture.Race(subtitleDragGesture, subtitleTapGesture)}>
                  <Animated.View
                    style={[
                      styles.overlaySubtitleBubble,
                      subtitleBubbleAnimatedStyle,
                    ]}>
                    <HighlightedSubtitleText
                      allowSyntheticWords={highlightEditedWords}
                      onLayout={event => {
                        const nextHeight = event.nativeEvent.layout.height;
                        if (Math.abs(nextHeight - subtitleBubbleHeight) > 1) {
                          setSubtitleBubbleHeight(nextHeight);
                        }
                      }}
                      playheadPosition={playbackPosition}
                      style={[
                        styles.overlaySubtitleText,
                        {
                          color: stylePreset.textColor,
                          backgroundColor: stylePreset.backgroundColor,
                          fontFamily: stylePreset.fontFamily,
                          fontWeight: stylePreset.fontWeight,
                          letterSpacing: stylePreset.letterSpacing,
                          fontSize: stylePreset.fontSize,
                        },
                      ]}
                      stylePreset={overlayStylePreset}
                      subtitle={displaySubtitle}
                      wordTestIDPrefix={OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX}
                    />
                  </Animated.View>
                </GestureDetector>
              </View>
            ) : null}
          </View>
        </GestureDetector>

        <Animated.View
          pointerEvents={isTimelineCollapsed ? 'none' : 'auto'}
          style={[styles.timelineSectionShell, timelineSectionAnimatedStyle]}
          testID={TIMELINE_SECTION_ID}>
          <TimelineTrackSection
            contentWidth={contentWidth}
            onScroll={handleTimelineScroll}
            pixelsPerMs={pixelsPerMs}
            playhead={playbackPosition}
            timelineRef={timelineRef}
            timelineTrackHeight={editorLayout.timelineTrackHeight}
            timelineZoom={timelineZoom}
            setTimelineZoom={setTimelineZoom}
            waveform={project.waveform}
            width={width}
            onScrubEnd={() => {
              isScrubbing.current = false;
            }}
            onScrubStart={() => {
              isScrubbing.current = true;
              setIsPlaying(false);
            }}
          />
        </Animated.View>

        <Animated.View
          style={[styles.bottomEditorShell, bottomEditorAnimatedStyle]}
          testID={BOTTOM_EDITOR_SHELL_ID}>
          <BottomEditorTabs
            activeTab={activeTab}
            onSelectTab={tab => {
              setActiveTab(tab);
              setIsStylePanelOpen(tab === 'style');
            }}
          />
          <ScrollView
            bounces={false}
            horizontal
            keyboardShouldPersistTaps="handled"
            directionalLockEnabled
            decelerationRate="fast"
            onMomentumScrollEnd={event => {
              const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              const newTab = pageIndex === 0 ? 'subtitle' : pageIndex === 1 ? 'style' : pageIndex === 2 ? 'language' : 'fx';
              setActiveTab(newTab);
              setIsStylePanelOpen(newTab === 'style');
            }}
            pagingEnabled
            ref={bottomEditorPagerRef}
            scrollEnabled={!isTextEditing}
            showsHorizontalScrollIndicator={false}
            style={styles.bottomEditorPager}
            testID={BOTTOM_EDITOR_PAGER_ID}>
            <View style={[styles.bottomEditorPage, { width }]}>
              {isTimelineCollapsed ? null : (
                <TimelineControlsPanel
                  onToggleWordHighlight={updateWordHighlightEnabled}
                  wordHighlightAvailable={wordHighlightAvailable}
                  wordHighlightEnabled={stylePreset.wordHighlightEnabled}
                />
              )}

              <TextEditorSection
                canNavigateNext={canNavigateNextSubtitle}
                canNavigatePrev={canNavigatePrevSubtitle}
                containerAnimatedStyle={textZoneAnimatedStyle}
                isEditing={isTextEditing}
                keyboardVisible={keyboardVisible}
                onNavigate={navigateAdjacentSubtitle}
                onDraftChange={text => { setDraftTextPreview(text); }}
                onSelectText={() => {
                  setIsStylePanelOpen(false);
                  setIsTextEditing(true);
                  if (selectedSubtitle) {
                    setSelectedSubtitleId(selectedSubtitle.id);
                  }
                }}
                onSetEditing={value => {
                  if (!value) { setDraftTextPreview(null); }
                  setIsTextEditing(value);
                }}
                onUpdateText={updateSelectedSubtitleText}
                selectedSubtitle={selectedSubtitle}
                playbackPosition={playbackPosition}
                stylePreset={stylePreset}
              />
            </View>

            <View style={[styles.bottomEditorPage, { width }]}>
              <StyleSelectorsPanel
                currentStyle={stylePreset}
                onChangeStyle={setStylePreset}
                onUpdatePositionPreset={applyPositionPreset}
              />
            </View>

            <View style={[styles.bottomEditorPage, { width }]}>
              <LanguagePanel
                availableLocales={availableSpeechLocales}
                currentLocale={project.recognitionLocale}
                loading={loadingSpeechLocales}
                retrying={retryingSubtitles}
                selectedLocale={selectedRetryLocale}
                onSelectLocale={locale => {
                  setSelectedRetryLocale(locale);
                  const hasChanged = locale !== (project.recognitionLocale || AUTO_DETECT_LOCALE_VALUE);
                  setShowRegenerateButton(hasChanged);
                }}
              />
            </View>

            <View style={[styles.bottomEditorPage, { width }]}>
              <FXPanel
                currentEffect={stylePreset.effect || 'none'}
                onSelectEffect={effect => {
                  setStylePreset({ ...stylePreset, effect });
                }}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      <GestureDetector gesture={bottomEdgeGesture}>
        <View style={[styles.bottomHandleArea, { height: bottomInset + 16 }]}>
          <View style={styles.bottomHandle} />
        </View>
      </GestureDetector>

      {showRegenerateButton && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.floatingRegenerateButton, { bottom: bottomInset + 24, right: 16 }]}>
          <Pressable
            disabled={retryingSubtitles || availableSpeechLocales.length === 0}
            onPress={() => {
              setShowRegenerateButton(false);
              handleRetrySubtitleGeneration().catch(showRetryError);
            }}
            style={[
              styles.regenerateButton,
              (retryingSubtitles || availableSpeechLocales.length === 0) && styles.regenerateButtonDisabled,
            ]}>
            <Text style={styles.regenerateButtonText}>
              {retryingSubtitles ? 'Regenerating...' : 'Regenerate Subtitles'}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {showKeyboardDismissButton ? (
        <Animated.View style={[styles.keyboardDismissWrap, keyboardDismissAnimatedStyle]}>
          <Pressable
            onPress={() => Keyboard.dismiss()}
            style={styles.keyboardDismissButton}
            testID={KEYBOARD_DISMISS_BUTTON_ID}>
            <Feather color={palette.textPrimary} name="chevron-down" size={16} />
            <Text style={styles.keyboardDismissLabel}>Done</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <ExportSheet
        highlightEditedWords={highlightEditedWords}
        onChangeResolution={setResolution}
        onClose={() => setIsExportSheetOpen(false)}
        onExport={handleExport}
        project={project}
        resolution={resolution}
        stylePreset={stylePreset}
        visible={isExportSheetOpen || exporting}
      />

      <LocaleRetrySheet
        loading={loadingSpeechLocales}
        localeOptions={availableSpeechLocales}
        onClose={closeLocaleRetrySheet}
        onRetry={() => {
          handleRetrySubtitleGeneration().catch(showRetryError);
        }}
        onSelectLocale={setSelectedRetryLocale}
        retrying={retryingSubtitles}
        selectedLocale={selectedRetryLocale}
        visible={localeRetrySheetVisible}
      />
    </Animated.View>
  );
}

function TimelineTrackSection({
  width,
  timelineTrackHeight,
  playhead,
  timelineZoom,
  pixelsPerMs,
  contentWidth,
  waveform,
  onScroll,
  onScrubStart,
  onScrubEnd,
  setTimelineZoom,
  timelineRef,
}: {
  width: number;
  timelineTrackHeight: number;
  playhead: number;
  timelineZoom: number;
  pixelsPerMs: number;
  contentWidth: number;
  waveform: number[];
  onScroll: (offsetX: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  setTimelineZoom: (value: number) => void;
  timelineRef: React.RefObject<ScrollView | null>;
}) {
  const pinchStartZoom = useRef(1);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZoom.current = timelineZoom;
    })
    .onUpdate(event => {
      runOnJS(setTimelineZoom)(clamp(pinchStartZoom.current * event.scale, 0.75, 2.4));
    });

  return (
    <View style={styles.timelineZone}>
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.timelineViewport}>
          <View style={[styles.timelineTrack, { height: timelineTrackHeight }]}>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: width / 2,
                height: timelineTrackHeight,
              }}
              horizontal
              onMomentumScrollEnd={onScrubEnd}
              onScroll={event => onScroll(event.nativeEvent.contentOffset.x)}
              onScrollBeginDrag={onScrubStart}
              onScrollEndDrag={onScrubEnd}
              ref={timelineRef}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}>
              <View style={{ width: contentWidth, height: timelineTrackHeight }}>
                <View pointerEvents="none" style={styles.waveformLayer}>
                  {waveform.map((value, index) => {
                    const barWidth = contentWidth / Math.max(1, waveform.length);
                    const minAmplitude = timelineTrackHeight * 0.52;
                    const maxAmplitude = timelineTrackHeight * 0.92;
                    const amplitude = clamp(
                      value * timelineTrackHeight * 1.05,
                      minAmplitude,
                      maxAmplitude,
                    );
                    const x = index * barWidth;
                    const y = (timelineTrackHeight - amplitude) / 2;
                    const barColor =
                      Math.abs((x / pixelsPerMs) - playhead) < 1300
                        ? 'rgba(0, 240, 255, 0.5)'
                        : 'rgba(255, 255, 255, 0.16)';

                    return (
                      <View
                        key={`wave-${index}`}
                        style={[
                          styles.waveformBar,
                          {
                            left: x,
                            top: y,
                            width: Math.max(2, barWidth * 0.68),
                            height: amplitude,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View pointerEvents="none" style={styles.playhead}>
              <View style={styles.playheadGlow} />
            </View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

function TimelineControlsPanel({
  wordHighlightEnabled,
  wordHighlightAvailable,
  onToggleWordHighlight,
}: {
  wordHighlightEnabled: boolean;
  wordHighlightAvailable: boolean;
  onToggleWordHighlight: (value: boolean) => void;
}) {
  return (
    <View style={styles.timelineControlsCard}>
      <View style={styles.timelineControlDock}>
        <View style={styles.timelineControlRow}>
          <View style={styles.timelineControlCopy}>
            <Text style={styles.timelineControlLabel}>Word Highlight</Text>
            <Text style={styles.timelineControlHint}>
              {wordHighlightAvailable
                ? 'Accent the currently spoken word.'
                : 'Word timing unavailable'}
            </Text>
          </View>
          <Switch
            disabled={!wordHighlightAvailable}
            ios_backgroundColor="rgba(255, 255, 255, 0.12)"
            onValueChange={onToggleWordHighlight}
            testID={WORD_HIGHLIGHT_SWITCH_ID}
            thumbColor={
              wordHighlightAvailable ? palette.textPrimary : 'rgba(255, 255, 255, 0.32)'
            }
            trackColor={{
              false: 'rgba(255, 255, 255, 0.16)',
              true: 'rgba(0, 240, 255, 0.42)',
            }}
            value={wordHighlightEnabled && wordHighlightAvailable}
          />
        </View>
      </View>
    </View>
  );
}

function FXPanel({
  currentEffect,
  onSelectEffect,
}: {
  currentEffect: string;
  onSelectEffect: (effect: SubtitleEffect) => void;
}) {
  const effects: Array<{ value: SubtitleEffect; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'neon', label: 'Neon' },
    { value: 'chrome', label: 'Chrome' },
    { value: 'glow', label: 'Glow' },
    { value: 'shadow', label: 'Shadow' },
  ];

  return (
    <View style={styles.fxPanel}>
      <Text style={styles.fxPanelTitle}>Text Effects</Text>
      <View style={styles.fxOptions}>
        {effects.map(effect => (
          <Pressable
            key={effect.value}
            onPress={() => onSelectEffect(effect.value)}
            style={[
              styles.fxOption,
              currentEffect === effect.value && styles.fxOptionActive,
            ]}>
            <Text
              style={[
                styles.fxOptionLabel,
                currentEffect === effect.value && styles.fxOptionLabelActive,
              ]}>
              {effect.label}
            </Text>
            {currentEffect === effect.value && (
              <Feather color={palette.cyan} name="check" size={16} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function LanguagePanel({
  availableLocales,
  currentLocale,
  loading,
  retrying,
  selectedLocale,
  onSelectLocale,
}: {
  availableLocales: SpeechLocaleOption[];
  currentLocale?: string;
  loading: boolean;
  retrying: boolean;
  selectedLocale: string;
  onSelectLocale: (locale: string) => void;
}) {
  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={styles.languagePanel}
      showsVerticalScrollIndicator={false}>
      <View style={styles.languagePanelHeader}>
        <Text style={styles.languagePanelTitle}>Recognition Language</Text>
        <Text style={styles.languagePanelHint}>
          {currentLocale
            ? `Current: ${availableLocales.find(l => l.value === currentLocale)?.label || currentLocale}`
            : 'Choose a language to regenerate subtitles'}
        </Text>
      </View>

      <View style={styles.localeOptions}>
        <Pressable
          onPress={() => onSelectLocale(AUTO_DETECT_LOCALE_VALUE)}
          style={[
            styles.localeOption,
            selectedLocale === AUTO_DETECT_LOCALE_VALUE && styles.localeOptionActive,
          ]}>
          <Text
            style={[
              styles.localeOptionLabel,
              selectedLocale === AUTO_DETECT_LOCALE_VALUE && styles.localeOptionLabelActive,
            ]}>
            Auto Detect
          </Text>
          {selectedLocale === AUTO_DETECT_LOCALE_VALUE && (
            <Feather color={palette.cyan} name="check" size={16} />
          )}
        </Pressable>

        {availableLocales.map(option => (
          <Pressable
            key={option.value}
            onPress={() => onSelectLocale(option.value)}
            style={[
              styles.localeOption,
              selectedLocale === option.value && styles.localeOptionActive,
            ]}>
            <Text
              style={[
                styles.localeOptionLabel,
                selectedLocale === option.value && styles.localeOptionLabelActive,
              ]}>
              {option.label}
            </Text>
            {selectedLocale === option.value && (
              <Feather color={palette.cyan} name="check" size={16} />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.languagePanelFootnote}>
        {loading
          ? 'Loading on-device languages...'
          : `${availableLocales.length} on-device languages available`}
      </Text>
    </ScrollView>
  );
}

function BottomEditorTabs({
  activeTab,
  onSelectTab,
}: {
  activeTab: 'subtitle' | 'style' | 'language' | 'fx';
  onSelectTab: (tab: 'subtitle' | 'style' | 'language' | 'fx') => void;
}) {
  const [tabTrackWidth, setTabTrackWidth] = useState(0);
  const activeTabProgress = useSharedValue(
    activeTab === 'subtitle' ? 0 : activeTab === 'style' ? 1 : activeTab === 'language' ? 2 : 3
  );

  useEffect(() => {
    const nextProgress = activeTab === 'subtitle' ? 0 : activeTab === 'style' ? 1 : activeTab === 'language' ? 2 : 3;
    const direction = nextProgress - activeTabProgress.value;

    activeTabProgress.value = withSpring(nextProgress, {
      stiffness: 320,
      damping: 26,
      mass: 0.78,
      velocity: direction === 0 ? 0 : direction * 3.6,
    });
  }, [activeTabProgress, activeTab]);

  const tabIndicatorWidth = tabTrackWidth > 12 ? (tabTrackWidth - 12) / 4 : 0;
  const tabIndicatorTravel = tabIndicatorWidth + 4;
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const bounceDistance = Math.abs(activeTabProgress.value - Math.round(activeTabProgress.value));
    const scale = 1 + bounceDistance * 0.04;

    return {
      opacity: tabIndicatorWidth > 0 ? 1 : 0,
      width: tabIndicatorWidth,
      transform: [
        {
          translateX: activeTabProgress.value * tabIndicatorTravel,
        },
        {
          scale,
        },
      ],
    };
  });
  const subtitleLabelAnimatedStyle = useAnimatedStyle(() => {
    const emphasis = Math.max(0, 1 - Math.abs(activeTabProgress.value));

    return {
      opacity: 0.64 + emphasis * 0.36,
      transform: [
        {
          scale: 0.965 + emphasis * 0.035,
        },
        {
          translateY: (1 - emphasis) * 1.5,
        },
      ],
    };
  });
  const styleLabelAnimatedStyle = useAnimatedStyle(() => {
    const emphasis = Math.max(0, 1 - Math.abs(activeTabProgress.value - 1));

    return {
      opacity: 0.64 + emphasis * 0.36,
      transform: [
        {
          scale: 0.965 + emphasis * 0.035,
        },
        {
          translateY: (1 - emphasis) * 1.5,
        },
      ],
    };
  });
  const languageLabelAnimatedStyle = useAnimatedStyle(() => {
    const emphasis = Math.max(0, 1 - Math.abs(activeTabProgress.value - 2));

    return {
      opacity: 0.64 + emphasis * 0.36,
      transform: [
        {
          scale: 0.965 + emphasis * 0.035,
        },
        {
          translateY: (1 - emphasis) * 1.5,
        },
      ],
    };
  });
  const fxLabelAnimatedStyle = useAnimatedStyle(() => {
    const emphasis = Math.max(0, 1 - Math.abs(activeTabProgress.value - 3));

    return {
      opacity: 0.64 + emphasis * 0.36,
      transform: [
        {
          scale: 0.965 + emphasis * 0.035,
        },
        {
          translateY: (1 - emphasis) * 1.5,
        },
      ],
    };
  });

  return (
    <View
      onLayout={event => {
        const nextWidth = event.nativeEvent.layout.width;
        if (Math.abs(nextWidth - tabTrackWidth) > 1) {
          setTabTrackWidth(nextWidth);
        }
      }}
      style={styles.bottomEditorTabs}>
      <Animated.View
        pointerEvents="none"
        style={[styles.bottomEditorTabIndicator, indicatorAnimatedStyle]}
      />
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'subtitle' }}
        onPress={() => onSelectTab('subtitle')}
        style={styles.bottomEditorTab}
        testID={BOTTOM_EDITOR_PRIMARY_TAB_ID}>
        <Animated.View style={subtitleLabelAnimatedStyle}>
          <Text
            style={[
              styles.bottomEditorTabLabel,
              activeTab === 'subtitle' && styles.bottomEditorTabLabelActive,
            ]}>
            Subtitle
          </Text>
        </Animated.View>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'style' }}
        onPress={() => onSelectTab('style')}
        style={styles.bottomEditorTab}
        testID={BOTTOM_EDITOR_STYLE_TAB_ID}>
        <Animated.View style={styleLabelAnimatedStyle}>
          <Text
            style={[
              styles.bottomEditorTabLabel,
              activeTab === 'style' && styles.bottomEditorTabLabelActive,
            ]}>
            Style
          </Text>
        </Animated.View>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'language' }}
        onPress={() => onSelectTab('language')}
        style={styles.bottomEditorTab}
        testID={BOTTOM_EDITOR_LANGUAGE_TAB_ID}>
        <Animated.View style={languageLabelAnimatedStyle}>
          <Text
            style={[
              styles.bottomEditorTabLabel,
              activeTab === 'language' && styles.bottomEditorTabLabelActive,
            ]}>
            Language
          </Text>
        </Animated.View>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'fx' }}
        onPress={() => onSelectTab('fx')}
        style={styles.bottomEditorTab}
        testID={BOTTOM_EDITOR_FX_TAB_ID}>
        <Animated.View style={fxLabelAnimatedStyle}>
          <Text
            style={[
              styles.bottomEditorTabLabel,
              activeTab === 'fx' && styles.bottomEditorTabLabelActive,
            ]}>
            FX
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function TextEditorSection({
  canNavigateNext,
  canNavigatePrev,
  containerAnimatedStyle,
  selectedSubtitle,
  isEditing,
  keyboardVisible,
  onSelectText,
  onSetEditing,
  onUpdateText,
  onDraftChange,
  onNavigate,
  playbackPosition,
  stylePreset,
}: {
  canNavigateNext: boolean;
  canNavigatePrev: boolean;
  containerAnimatedStyle?: StyleProp<ViewStyle>;
  selectedSubtitle: SubtitleBlock | null;
  isEditing: boolean;
  keyboardVisible: boolean;
  onSelectText: () => void;
  onSetEditing: (value: boolean) => void;
  onUpdateText: (text: string) => void;
  onDraftChange: (text: string) => void;
  onNavigate: (direction: -1 | 1, keepEditing: boolean) => void;
  playbackPosition: number;
  stylePreset: Project['globalStyle'];
}) {
  const [draftText, setDraftText] = useState(selectedSubtitle?.text ?? '');

  useEffect(() => {
    setDraftText(selectedSubtitle?.text ?? '');
  }, [selectedSubtitle?.id, selectedSubtitle?.text]);

  const activeEditWordIndexRef = useRef(-1);

  const commitDraftTextIfChanged = useCallback(() => {
    if (!selectedSubtitle) {
      return;
    }
    if (isSameEditableSubtitleText(selectedSubtitle.text, draftText)) {
      return;
    }
    onUpdateText(draftText);
  }, [draftText, onUpdateText, selectedSubtitle]);

  const textInputRef = useRef<TextInput>(null);

  const handlePanelPress = () => {
    if (keyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    onSelectText();
    textInputRef.current?.focus();
  };
  const handleNavigate = (direction: -1 | 1) => {
    if (isEditing) {
      commitDraftTextIfChanged();
    }
    onNavigate(direction, isEditing);
  };

  return (
    <Animated.View
      testID={ACTIVE_SUBTITLE_SECTION_ID}
      style={[
        styles.textZone,
        containerAnimatedStyle,
      ]}>
      <GlassPanel style={styles.textPanel}>
        <View style={styles.textPanelHeader}>
          <Pressable
            onPress={handlePanelPress}
            style={styles.textPanelHeaderCopy}
            testID={ACTIVE_SUBTITLE_HEADER_ID}>
            <View>
              <Text style={styles.textLabel}>Active Subtitle</Text>
              <Text style={styles.textTiming}>
                {selectedSubtitle
                  ? `${formatDuration(selectedSubtitle.startTime)} - ${formatDuration(selectedSubtitle.endTime)}`
                  : 'No subtitle selected'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.subtitleNavRow}>
            <Pressable
              disabled={!canNavigatePrev}
              onPress={() => handleNavigate(-1)}
              style={[
                styles.subtitleNavButton,
                !canNavigatePrev && styles.subtitleNavButtonDisabled,
              ]}
              testID={ACTIVE_SUBTITLE_PREV_BUTTON_ID}>
              <Feather color={palette.textPrimary} name="chevron-left" size={16} />
            </Pressable>
            <Pressable
              disabled={!canNavigateNext}
              onPress={() => handleNavigate(1)}
              style={[
                styles.subtitleNavButton,
                !canNavigateNext && styles.subtitleNavButtonDisabled,
              ]}
              testID={ACTIVE_SUBTITLE_NEXT_BUTTON_ID}>
              <Feather color={palette.textPrimary} name="chevron-right" size={16} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          bounces={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps={keyboardVisible ? 'never' : 'handled'}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={styles.textPanelBody}
          contentContainerStyle={styles.textPanelBodyContent}>
          {selectedSubtitle ? (
            <View>
              <TextInput
                ref={textInputRef}
                multiline
                value={draftText}
                onFocus={() => {
                  if (!isEditing) {
                    onSelectText();
                    activeEditWordIndexRef.current = findActiveSubtitleWordIndex(
                      selectedSubtitle,
                      playbackPosition,
                    );
                  }
                }}
                onBlur={() => {
                  commitDraftTextIfChanged();
                  onSetEditing(false);
                  activeEditWordIndexRef.current = -1;
                }}
                onChangeText={text => {
                  setDraftText(text);
                  onDraftChange(text);
                }}
                placeholder="Rewrite subtitle text"
                placeholderTextColor={palette.textSecondary}
                style={[styles.subtitlePreview, styles.textInput, styles.textInputTransparent]}
              />
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {isEditing ? (
                  <Text style={[styles.subtitlePreview, styles.textInput]}>
                    {draftText.split(/(\s+)/).reduce<{ nodes: React.ReactNode[]; wordIdx: number }>(
                      (acc, token) => {
                        if (/\S/.test(token)) {
                          acc.nodes.push(
                            <Text
                              key={acc.wordIdx}
                              style={acc.wordIdx === activeEditWordIndexRef.current ? { color: stylePreset.accentColor } : undefined}>
                              {token}
                            </Text>,
                          );
                          acc.wordIdx++;
                        } else {
                          acc.nodes.push(token);
                        }
                        return acc;
                      },
                      { nodes: [], wordIdx: 0 },
                    ).nodes}
                  </Text>
                ) : (
                  <HighlightedSubtitleText
                    playheadPosition={playbackPosition}
                    style={styles.subtitlePreview}
                    stylePreset={stylePreset}
                    subtitle={{ ...selectedSubtitle, text: draftText }}
                  />
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.subtitlePreview}>Select a subtitle block to edit.</Text>
          )}
        </ScrollView>
      </GlassPanel>
    </Animated.View>
  );
}

function StyleSelectorsPanel({
  currentStyle,
  onChangeStyle,
  onUpdatePositionPreset,
}: {
  currentStyle: Project['globalStyle'];
  onChangeStyle: (style: Project['globalStyle']) => void;
  onUpdatePositionPreset: (position: Project['globalStyle']['position']) => void;
}) {
  return (
    <GlassPanel style={styles.styleSelectorsCard}>
      <Text style={styles.styleSelectorsTitle}>Style Controls</Text>
      <ScrollView
        bounces
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.styleSelectorsContent}>
        <StyleRow
          label="Fonts"
          options={subtitleFontOptions.map(option => ({
            id: option.id,
            label: option.label,
            active: currentStyle.fontPresetId === option.id,
            onPress: () =>
              onChangeStyle({
                ...currentStyle,
                fontPresetId: option.id,
                fontFamily: option.fontFamily,
                fontWeight: option.fontWeight,
                letterSpacing: option.letterSpacing,
              }),
          }))}
        />

        <StyleRow
          label="Size"
          options={subtitleSizeOptions.map(option => ({
            id: option.id,
            label: option.label,
            active: currentStyle.fontSize === option.fontSize,
            onPress: () =>
              onChangeStyle({
                ...currentStyle,
                fontSize: option.fontSize,
              }),
          }))}
        />

        <StyleRow
          label="Text Color"
          options={subtitleTextColorOptions.map(option => ({
            id: option.id,
            label: option.label,
            active: currentStyle.textColor === option.textColor,
            swatch: option.textColor,
            onPress: () =>
              onChangeStyle({
                ...currentStyle,
                textColor: option.textColor,
              }),
          }))}
        />

        <StyleRow
          label="Highlight"
          options={subtitleHighlightColorOptions.map(option => ({
            id: option.id,
            label: option.label,
            active: currentStyle.accentColor === option.accentColor,
            swatch: option.accentColor,
            onPress: () =>
              onChangeStyle({
                ...currentStyle,
                accentColor: option.accentColor,
              }),
          }))}
        />

        <StyleRow
          label="Background"
          options={subtitleBackgroundColorOptions.map(option => ({
            id: option.id,
            label: option.label,
            active: currentStyle.backgroundColor === option.backgroundColor,
            swatch: option.backgroundColor === 'transparent' ? undefined : option.backgroundColor,
            onPress: () =>
              onChangeStyle({
                ...currentStyle,
                backgroundColor: option.backgroundColor,
              }),
          }))}
        />

        <StyleRow
          label="Positions"
          options={subtitlePositionOptions.map(option => ({
            id: option.value,
            label: option.label,
            active: currentStyle.position === option.value,
            onPress: () => onUpdatePositionPreset(option.value),
          }))}
        />

        <StyleRow
          label="Casing"
          options={[
            {
              id: 'sentence',
              label: 'Sentence',
              active: currentStyle.casing === 'sentence',
              onPress: () =>
                onChangeStyle({
                  ...currentStyle,
                  casing: 'sentence',
                }),
            },
            {
              id: 'uppercase',
              label: 'Uppercase',
              active: currentStyle.casing === 'uppercase',
              onPress: () =>
                onChangeStyle({
                  ...currentStyle,
                  casing: 'uppercase',
                }),
            },
          ]}
        />
      </ScrollView>
    </GlassPanel>
  );
}

function StyleRow({
  label,
  options,
}: {
  label: string;
  options: Array<{
    id: string;
    label: string;
    active: boolean;
    onPress: () => void;
    swatch?: string;
  }>;
}) {
  return (
    <View style={styles.styleRow}>
      <Text style={styles.styleRowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.styleOptionList}>
          {options.map(option => (
            <Pressable
              key={option.id}
              onPress={option.onPress}
              style={[
                styles.styleOption,
                option.active ? styles.styleOptionActive : undefined,
              ]}>
              {option.swatch ? (
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: option.swatch },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.styleOptionText,
                  option.active ? styles.styleOptionTextActive : undefined,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  topBarShell: {
    overflow: 'hidden',
  },
  topBar: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarMeta: {
    alignItems: 'center',
  },
  topBarSubtitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  banner: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bannerCopy: {
    flex: 1,
    gap: 6,
  },
  bannerText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerMeta: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  bannerAction: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 240, 255, 0.28)',
  },
  bannerActionDisabled: {
    opacity: 0.55,
  },
  bannerActionLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  contentStack: {
    flex: 1,
    paddingTop: 8,
  },
  videoZone: {
    marginHorizontal: 16,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#121317',
  },
  videoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  doubleTapRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  videoHalf: {
    flex: 1,
  },
  playPauseWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 9, 14, 0.55)',
  },
  skipFlash: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(5, 9, 14, 0.72)',
  },
  skipFlashText: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  overlaySubtitleWrap: {
    ...StyleSheet.absoluteFillObject,
    left: 18,
    right: 18,
  },
  overlaySubtitleBubble: {
    position: 'absolute',
    alignSelf: 'center',
  },
  overlaySubtitleText: {
    overflow: 'hidden',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    textAlign: 'center',
  },
  timelineZone: {
    marginTop: 0,
  },
  timelineSectionShell: {
    overflow: 'hidden',
  },
  bottomEditorShell: {
    overflow: 'hidden',
  },
  bottomEditorTabs: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 4,
    borderRadius: 999,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomEditorTabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.16)',
    shadowColor: palette.cyan,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  bottomEditorTab: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEditorTabLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomEditorTabLabelActive: {
    color: palette.textPrimary,
  },
  bottomEditorPager: {
    flex: 1,
  },
  bottomEditorPage: {
    height: '100%',
    gap: 10,
  },
  timelineViewport: {
    marginHorizontal: 12,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 18, 21, 0.74)',
  },
  timelineControlsCard: {
    marginHorizontal: 12,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 18, 21, 0.74)',
    overflow: 'hidden',
  },
  timelineTrack: {
    overflow: 'hidden',
  },
  waveformLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  waveformBar: {
    position: 'absolute',
    borderRadius: 999,
  },
  playhead: {
    ...StyleSheet.absoluteFillObject,
    left: '50%',
    marginLeft: -1,
    width: 2,
    alignItems: 'center',
  },
  playheadGlow: {
    width: 2,
    flex: 1,
    backgroundColor: palette.cyan,
    shadowColor: palette.cyan,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  timelineControlDock: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
    gap: 8,
  },
  timelineControlRow: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 12, 17, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timelineControlCopy: {
    flex: 1,
    gap: 2,
  },
  timelineControlLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  timelineControlHint: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  fontChipScroll: {
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  fontChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 12, 17, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fontChipActive: {
    borderColor: palette.cyan,
    borderWidth: 1.5,
  },
  fontChipLabel: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  fontChipLabelActive: {
    color: palette.textPrimary,
  },
  textZone: {
    marginHorizontal: 12,
  },
  styleSelectorsCard: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  styleSelectorsTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  styleSelectorsContent: {
    gap: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  textPanel: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 14,
  },
  textPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textPanelHeaderCopy: {
    flex: 1,
  },
  textLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textTiming: {
    marginTop: 6,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  textPanelBody: {
    flex: 1,
  },
  textPanelBodyContent: {
    gap: 16,
    paddingBottom: 2,
  },
  subtitlePreview: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  textInput: {
    minHeight: 86,
    margin: 0,
    padding: 0,
    textAlignVertical: 'top',
  },
  textInputTransparent: {
    color: 'transparent',
  },
  subtitleNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  subtitleNavButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  subtitleNavButtonDisabled: {
    opacity: 0.35,
  },
  styleRow: {
    gap: 8,
  },
  styleRowLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  styleOptionList: {
    flexDirection: 'row',
    gap: 10,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  styleOptionActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  styleOptionText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  styleOptionTextActive: {
    color: palette.textPrimary,
  },
  colorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  bottomHandleArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  keyboardDismissWrap: {
    position: 'absolute',
    right: 16,
  },
  keyboardDismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 12, 17, 0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  keyboardDismissLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  languagePanel: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },
  languagePanelHeader: {
    gap: 6,
  },
  languagePanelTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  languagePanelHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  localeOptions: {
    gap: 10,
  },
  localeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  localeOptionActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  localeOptionLabel: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  localeOptionLabelActive: {
    color: palette.textPrimary,
  },
  languagePanelFootnote: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  fxPanel: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },
  fxPanelTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  fxOptions: {
    gap: 10,
  },
  fxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  fxOptionActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  fxOptionLabel: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  fxOptionLabelActive: {
    color: palette.textPrimary,
  },
  floatingRegenerateButton: {
    position: 'absolute',
    zIndex: 10,
  },
  regenerateButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  regenerateButtonText: {
    color: palette.canvas,
    fontSize: 15,
    fontWeight: '800',
  },
  regenerateButtonDisabled: {
    opacity: 0.55,
  },
  retryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  retryButtonText: {
    color: palette.canvas,
    fontSize: 15,
    fontWeight: '800',
  },
  retryButtonDisabled: {
    opacity: 0.55,
  },
});
