import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Video, { type OnLoadData, type VideoRef } from 'react-native-video';

import {
  applyManualSubtitleTextEdit,
  clampSubtitleWordsToRange,
  clamp,
  formatDuration,
  getSubtitleVerticalBounds,
  getSubtitleVerticalOrigin,
  isPlaceholderSubtitle,
  offsetSubtitleWords,
  resolveSubtitleStyleFromVerticalOrigin,
  setSubtitlePositionPreset,
  snapSubtitleRange,
} from '../../lib/project';
import {
  exportProject,
  saveVideoToPhotos,
  type NativeSubtitleSegment,
} from '../../services/native-voxa';
import { haptics } from '../../services/haptics';
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
  springConfig,
  subtitleColorOptions,
  subtitleFontOptions,
  subtitlePositionOptions,
} from '../../theme/tokens';
import type {
  ExportResolution,
  Project,
  SubtitleBlock,
} from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { GlassPanel } from '../common/GlassPanel';
import { HighlightedSubtitleText } from '../common/HighlightedSubtitleText';
import { ExportSheet } from './ExportSheet';

const MAX_TIMELINE_SURFACE_WIDTH = 8192;
const WORD_HIGHLIGHT_SWITCH_ID = 'word-highlight-switch';

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
  const lastSeekMs = useRef(0);
  const isScrubbing = useRef(false);
  const [skipFlash, setSkipFlash] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [subtitleBubbleHeight, setSubtitleBubbleHeight] = useState(0);
  const subtitleCanvasPreviewTopY = useSharedValue(0);

  const [project, setProject] = useAtom(editorProjectAtom);
  const [playbackPosition, setPlaybackPosition] = useAtom(playbackPositionAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [selectedSubtitleId, setSelectedSubtitleId] = useAtom(selectedSubtitleIdAtom);
  const [subtitles, setSubtitles] = useAtom(subtitlesAtom);
  const [stylePreset, setStylePreset] = useAtom(globalStyleAtom);
  const [timelineZoom, setTimelineZoom] = useAtom(timelineZoomAtom);
  const [isTextEditing, setIsTextEditing] = useAtom(isTextEditingAtom);
  const [isStylePanelOpen, setIsStylePanelOpen] = useAtom(isStylePanelOpenAtom);
  const [isExportSheetOpen, setIsExportSheetOpen] = useAtom(isExportSheetOpenAtom);
  const activeSubtitle = useAtomValue(activeSubtitleAtom);
  const selectedSubtitle = useAtomValue(selectedSubtitleAtom);
  const setPlayback = useSetAtom(playbackPositionAtom);

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

  const handleVideoTap = useCallback(() => {
    if (isPlaying && !showControls) {
      setShowControls(true);
      scheduleHideControls();
    } else {
      togglePlayback();
    }
  }, [isPlaying, showControls, scheduleHideControls, togglePlayback]);

  const closeProject = useAppStore(state => state.closeProject);
  const upsertProject = useAppStore(state => state.upsertProject);
  const resolution = useAppStore(state => state.settings.preferredExportResolution);
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

  const zoneHeights = {
    video: height * 0.38,
    timeline: height * 0.32,
    text: height * 0.30,
  };
  const topBarOffset = insets.top + 2;
  const bottomInset = Math.max(insets.bottom, 12);

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
  const displaySubtitle = isPlaceholderSubtitle(activeDisplaySubtitle)
    ? null
    : activeDisplaySubtitle;
  const wordHighlightAvailable = subtitles.some(
    subtitle => !isPlaceholderSubtitle(subtitle) && (subtitle.words?.length ?? 0) > 0,
  );

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
    setPlaybackPosition(clamped);
    videoRef.current?.seek(clamped / 1000);
    syncTimelineToPosition(clamped);
  };

  const updateSubtitleSelection = (subtitleId: string) => {
    setSelectedSubtitleId(subtitleId);
    const subtitle = subtitles.find(item => item.id === subtitleId);
    if (subtitle) {
      seekTo(subtitle.startTime);
    }
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
        zoneHeights.video,
        nextSubtitleBubbleHeight,
      ),
    );
  };

  const updateProjectSubtitles = (updater: (current: SubtitleBlock[]) => SubtitleBlock[]) => {
    setSubtitles(current => updater(current));
  };

  const updateSelectedSubtitleText = (text: string) => {
    if (!selectedSubtitleId) {
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

  const navigateAdjacentSubtitle = (direction: -1 | 1) => {
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
    updateSelectedSubtitleSelection(nextSubtitle.id);
  };

  const updateSelectedSubtitleSelection = (subtitleId: string) => {
    setSelectedSubtitleId(subtitleId);
    setIsTextEditing(true);
    const subtitle = subtitles.find(item => item.id === subtitleId);
    if (subtitle) {
      seekTo(subtitle.startTime);
    }
  };

  const moveSubtitle = (subtitleId: string, nextStart: number, nextEnd: number) => {
    updateProjectSubtitles(current =>
      current.map(subtitle => {
        if (subtitle.id !== subtitleId || !project) {
          return subtitle;
        }
        const snapped = snapSubtitleRange(
          current,
          subtitleId,
          nextStart,
          nextEnd,
          project.duration,
        );
        const deltaMs = snapped.startTime - subtitle.startTime;
        return {
          ...subtitle,
          startTime: snapped.startTime,
          endTime: snapped.endTime,
          words: clampSubtitleWordsToRange(
            offsetSubtitleWords(subtitle.words, deltaMs),
            snapped.startTime,
            snapped.endTime,
          ),
          isGenerated: false,
        };
      }),
    );
  };

  const trimSubtitle = (
    subtitleId: string,
    edge: 'start' | 'end',
    deltaMs: number,
  ) => {
    updateProjectSubtitles(current =>
      current.map(subtitle => {
        if (subtitle.id !== subtitleId || !project) {
          return subtitle;
        }
        const proposedStart =
          edge === 'start' ? subtitle.startTime + deltaMs : subtitle.startTime;
        const proposedEnd =
          edge === 'end' ? subtitle.endTime + deltaMs : subtitle.endTime;
        const snapped = snapSubtitleRange(
          current,
          subtitleId,
          proposedStart,
          proposedEnd,
          project.duration,
        );
        return {
          ...subtitle,
          startTime: snapped.startTime,
          endTime: snapped.endTime,
          words: clampSubtitleWordsToRange(
            subtitle.words,
            snapped.startTime,
            snapped.endTime,
          ),
          isGenerated: false,
        };
      }),
    );
  };

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
  }, [isPlaying, playbackPosition]);

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
            words: subtitle.words,
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
    zoneHeights.video,
    effectiveSubtitleBubbleHeight,
  );
  const videoSubtitleTop = stylePreset && displaySubtitle
    ? getSubtitleVerticalOrigin(stylePreset, zoneHeights.video, effectiveSubtitleBubbleHeight)
    : 0;

  const subtitleBubbleAnimatedStyle = useAnimatedStyle(() => ({
    top: subtitleCanvasPreviewTopY.value,
  }));

  useLayoutEffect(() => {
    subtitleCanvasPreviewTopY.value = videoSubtitleTop;
  }, [
    displaySubtitle?.id,
    stylePreset?.position,
    stylePreset?.positionOffsetYRatio,
    subtitleBubbleHeight,
    videoSubtitleTop,
  ]);

  const subtitleDragGesture = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-28, 28])
    .onBegin(() => {
      subtitleCanvasPreviewTopY.value = videoSubtitleTop;
      runOnJS(haptics.light)();
    })
    .onUpdate(event => {
      const nextTop = Math.min(
        Math.max(videoSubtitleTop + event.translationY, videoSubtitleBounds.minTop),
        videoSubtitleBounds.maxTop,
      );
      subtitleCanvasPreviewTopY.value = nextTop;
    })
    .onEnd(event => {
      const nextTop = Math.min(
        Math.max(videoSubtitleTop + event.translationY, videoSubtitleBounds.minTop),
        videoSubtitleBounds.maxTop,
      );
      subtitleCanvasPreviewTopY.value = nextTop;
      runOnJS(commitSubtitleVerticalPosition)(nextTop);
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
      <View style={[styles.topBar, { marginTop: topBarOffset }]}>
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

      {project.importError ? (
        <GlassPanel style={styles.banner}>
          <Feather color={palette.amber} name="alert-triangle" size={16} />
          <Text style={styles.bannerText}>
            {project.importError}. Manual subtitle editing remains available.
          </Text>
        </GlassPanel>
      ) : null}

      <GestureDetector gesture={videoDismissGesture}>
        <View style={[styles.videoZone, { height: zoneHeights.video }]}>
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
            <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(220)} style={styles.skipFlash}>
              <Text style={styles.skipFlashText}>{skipFlash}</Text>
            </Animated.View>
          ) : null}

          {displaySubtitle ? (
            <View pointerEvents="box-none" style={styles.overlaySubtitleWrap}>
              <GestureDetector gesture={Gesture.Race(subtitleDragGesture, subtitleTapGesture)}>
                <Animated.View
                  onLayout={event => {
                    const nextHeight = event.nativeEvent.layout.height;
                    if (nextHeight !== subtitleBubbleHeight) {
                      setSubtitleBubbleHeight(nextHeight);
                    }
                  }}
                  style={[
                    styles.overlaySubtitleBubble,
                    subtitleBubbleAnimatedStyle,
                  ]}>
                  <HighlightedSubtitleText
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
                    stylePreset={stylePreset}
                    subtitle={displaySubtitle}
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          ) : null}
        </View>
      </GestureDetector>

      <TimelineSection
        contentWidth={contentWidth}
        onScrubEnd={() => {
          isScrubbing.current = false;
        }}
        onScrubStart={() => {
          isScrubbing.current = true;
          setIsPlaying(false);
        }}
        onScroll={handleTimelineScroll}
        pixelsPerMs={pixelsPerMs}
        playhead={playbackPosition}
        timelineZoom={timelineZoom}
        setTimelineZoom={setTimelineZoom}
        timelineRef={timelineRef}
        waveform={project.waveform}
        wordHighlightAvailable={wordHighlightAvailable}
        wordHighlightEnabled={stylePreset.wordHighlightEnabled}
        onToggleWordHighlight={updateWordHighlightEnabled}
        currentFontPresetId={stylePreset.fontPresetId}
        onSelectFont={option =>
          setStylePreset({
            ...stylePreset,
            fontPresetId: option.id,
            fontFamily: option.fontFamily,
            fontWeight: option.fontWeight,
            letterSpacing: option.letterSpacing,
          })
        }
        width={width}
        zoneHeight={zoneHeights.timeline}
      />

      <TextEditorSection
        bottomInset={bottomInset}
        currentStyle={stylePreset}
        isEditing={isTextEditing}
        isStylePanelOpen={isStylePanelOpen}
        onChangeStyle={setStylePreset}
        onNavigate={navigateAdjacentSubtitle}
        onOpenExport={openExportSheet}
        onSelectText={() => {
          setIsTextEditing(true);
          if (selectedSubtitle) {
            setSelectedSubtitleId(selectedSubtitle.id);
          }
        }}
        onSetEditing={setIsTextEditing}
        onToggleStylePanel={setIsStylePanelOpen}
        onUpdateText={updateSelectedSubtitleText}
        onUpdatePositionPreset={applyPositionPreset}
        selectedSubtitle={selectedSubtitle}
        zoneHeight={zoneHeights.text}
      />

      <GestureDetector gesture={bottomEdgeGesture}>
        <View style={[styles.bottomHandleArea, { height: bottomInset + 16 }]}>
          <View style={styles.bottomHandle} />
        </View>
      </GestureDetector>

      <ExportSheet
        onChangeResolution={setResolution}
        onClose={() => setIsExportSheetOpen(false)}
        onExport={handleExport}
        project={project}
        resolution={resolution}
        stylePreset={stylePreset}
        visible={isExportSheetOpen || exporting}
      />
    </Animated.View>
  );
}

function TimelineSection({
  width,
  zoneHeight,
  playhead,
  timelineZoom,
  pixelsPerMs,
  contentWidth,
  waveform,
  wordHighlightEnabled,
  wordHighlightAvailable,
  currentFontPresetId,
  onToggleWordHighlight,
  onSelectFont,
  onScroll,
  onScrubStart,
  onScrubEnd,
  setTimelineZoom,
  timelineRef,
}: {
  width: number;
  zoneHeight: number;
  playhead: number;
  timelineZoom: number;
  pixelsPerMs: number;
  contentWidth: number;
  waveform: number[];
  wordHighlightEnabled: boolean;
  wordHighlightAvailable: boolean;
  currentFontPresetId: string;
  onToggleWordHighlight: (value: boolean) => void;
  onSelectFont: (option: (typeof subtitleFontOptions)[number]) => void;
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
    <View style={[styles.timelineZone, { height: zoneHeight }]}>
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.timelineViewport}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: width / 2,
              height: zoneHeight,
            }}
            horizontal
            onMomentumScrollEnd={onScrubEnd}
            onScroll={event => onScroll(event.nativeEvent.contentOffset.x)}
            onScrollBeginDrag={onScrubStart}
            onScrollEndDrag={onScrubEnd}
            ref={timelineRef}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}>
            <View style={{ width: contentWidth, height: zoneHeight }}>
              <View pointerEvents="none" style={styles.waveformLayer}>
                {waveform.map((value, index) => {
                  const barWidth = contentWidth / Math.max(1, waveform.length);
                  const amplitude = Math.max(12, value * (zoneHeight * 0.48));
                  const x = index * barWidth;
                  const y = zoneHeight * 0.3 - amplitude / 2;
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fontChipScroll}>
              {subtitleFontOptions.map(option => {
                const isActive = currentFontPresetId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => onSelectFont(option)}
                    style={[
                      styles.fontChip,
                      isActive && styles.fontChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.fontChipLabel,
                        option.fontFamily !== 'System' && {
                          fontFamily: option.fontFamily,
                        },
                        isActive && styles.fontChipLabelActive,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

function TextEditorSection({
  bottomInset,
  selectedSubtitle,
  currentStyle,
  isEditing,
  isStylePanelOpen,
  zoneHeight,
  onSelectText,
  onSetEditing,
  onUpdateText,
  onUpdatePositionPreset,
  onNavigate,
  onToggleStylePanel,
  onChangeStyle,
  onOpenExport,
}: {
  bottomInset: number;
  selectedSubtitle: SubtitleBlock | null;
  currentStyle: Project['globalStyle'];
  isEditing: boolean;
  isStylePanelOpen: boolean;
  zoneHeight: number;
  onSelectText: () => void;
  onSetEditing: (value: boolean) => void;
  onUpdateText: (text: string) => void;
  onUpdatePositionPreset: (position: Project['globalStyle']['position']) => void;
  onNavigate: (direction: -1 | 1) => void;
  onToggleStylePanel: (value: boolean) => void;
  onChangeStyle: (style: Project['globalStyle']) => void;
  onOpenExport: () => void;
}) {
  const [draftText, setDraftText] = useState(selectedSubtitle?.text ?? '');

  useEffect(() => {
    setDraftText(selectedSubtitle?.text ?? '');
  }, [selectedSubtitle?.id, selectedSubtitle?.text]);

  const panelHeight = isStylePanelOpen ? zoneHeight + 112 : zoneHeight;
  const swipeGesture = Gesture.Pan().onEnd(event => {
    if (Math.abs(event.translationX) > 58 && isEditing) {
      onUpdateText(draftText);
      onNavigate(event.translationX < 0 ? 1 : -1);
    }
    if (event.translationY < -48) {
      onToggleStylePanel(true);
    }
    if (event.translationY > 48) {
      onToggleStylePanel(false);
    }
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View
        style={[
          styles.textZone,
          { minHeight: panelHeight, marginBottom: bottomInset + 10 },
        ]}>
        <GlassPanel style={styles.textPanel}>
          <Pressable onPress={onSelectText} style={styles.textPanelHeader}>
            <View>
              <Text style={styles.textLabel}>Active Subtitle</Text>
              <Text style={styles.textTiming}>
                {selectedSubtitle
                  ? `${formatDuration(selectedSubtitle.startTime)} - ${formatDuration(selectedSubtitle.endTime)}`
                  : 'No subtitle selected'}
              </Text>
            </View>
            <Pressable onPress={onOpenExport} style={styles.exportChip}>
              <Feather color={palette.cyan} name="arrow-up-circle" size={16} />
              <Text style={styles.exportChipText}>Export</Text>
            </Pressable>
          </Pressable>

          {selectedSubtitle ? (
            isEditing ? (
              <TextInput
                defaultValue={selectedSubtitle.text}
                key={selectedSubtitle.id}
                multiline
                onBlur={() => {
                  onUpdateText(draftText);
                  onSetEditing(false);
                }}
                onChangeText={text => {
                  setDraftText(text);
                }}
                placeholder="Rewrite subtitle text"
                placeholderTextColor={palette.textSecondary}
                style={styles.textInput}
              />
            ) : (
              <Pressable onPress={onSelectText}>
                <Text style={styles.subtitlePreview}>{selectedSubtitle.text}</Text>
              </Pressable>
            )
          ) : (
            <Text style={styles.subtitlePreview}>Select a subtitle block to edit.</Text>
          )}

          <View style={styles.panelHintRow}>
            <Text style={styles.panelHint}>Swipe left or right to move between blocks.</Text>
            <Text style={styles.panelHint}>Swipe up for style controls.</Text>
          </View>

          {isStylePanelOpen ? (
            <View style={styles.stylePanel}>
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
                label="Colors"
                options={subtitleColorOptions.map(option => ({
                  id: option.id,
                  label: option.label,
                  active: currentStyle.accentColor === option.accentColor,
                  swatch: option.accentColor,
                  onPress: () =>
                    onChangeStyle({
                      ...currentStyle,
                      textColor: option.textColor,
                      accentColor: option.accentColor,
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
            </View>
          ) : null}
        </GlassPanel>
      </View>
    </GestureDetector>
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
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  videoZone: {
    marginTop: 8,
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
  timelineViewport: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 18, 21, 0.74)',
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
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
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
    marginTop: 0,
  },
  textPanel: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },
  textPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  exportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  exportChipText: {
    color: palette.cyan,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitlePreview: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  textInput: {
    minHeight: 86,
    color: palette.textPrimary,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '700',
  },
  panelHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  panelHint: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  stylePanel: {
    gap: 14,
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
});
