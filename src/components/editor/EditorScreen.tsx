import React, {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
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
  applySubtitleCasing,
  clamp,
  formatDuration,
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
import { ExportSheet } from './ExportSheet';

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
    timeline: height * 0.4,
    text: height * 0.22,
  };
  const topBarOffset = insets.top + 8;
  const bottomInset = Math.max(insets.bottom, 12);

  const pixelsPerSecond = 82 * timelineZoom;
  const pixelsPerMs = pixelsPerSecond / 1000;
  const contentWidth = Math.max(width, (project?.duration ?? 0) * pixelsPerMs + width);

  const displaySubtitle = isTextEditing ? selectedSubtitle ?? activeSubtitle : activeSubtitle;

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
          ? { ...subtitle, text, isGenerated: false }
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
        return {
          ...subtitle,
          startTime: snapped.startTime,
          endTime: snapped.endTime,
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
  };

  const handleVideoProgress = (currentTimeMs: number) => {
    if (isScrubbing.current) {
      return;
    }
    setPlayback(currentTimeMs);
    syncTimelineToPosition(currentTimeMs);
  };

  const handleTimelineScroll = (offsetX: number) => {
    if (!project) {
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

  const togglePlayback = () => {
    setIsPlaying(current => !current);
  };

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
        subtitles: project.subtitles.map(subtitle => ({
          id: subtitle.id,
          startTime: subtitle.startTime,
          endTime: subtitle.endTime,
          text: subtitle.text,
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
          <Text style={styles.topBarTitle}>{project.title}</Text>
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

          <Pressable onPress={togglePlayback} style={StyleSheet.absoluteFill} />

          {skipFlash ? (
            <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(220)} style={styles.skipFlash}>
              <Text style={styles.skipFlashText}>{skipFlash}</Text>
            </Animated.View>
          ) : null}

          {displaySubtitle ? (
            <View
              style={[
                styles.overlaySubtitleWrap,
                stylePreset.position === 'top'
                  ? styles.overlaySubtitleTop
                  : stylePreset.position === 'middle'
                  ? styles.overlaySubtitleMiddle
                  : styles.overlaySubtitleBottom,
              ]}>
              <Text
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
                ]}>
                {applySubtitleCasing(displaySubtitle.text, stylePreset)}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>

      <TimelineSection
        contentWidth={contentWidth}
        onMoveSubtitle={moveSubtitle}
        onScrubEnd={() => {
          isScrubbing.current = false;
        }}
        onScrubStart={() => {
          isScrubbing.current = true;
          setIsPlaying(false);
        }}
        onScroll={handleTimelineScroll}
        onSelectSubtitle={updateSubtitleSelection}
        onTrimSubtitle={trimSubtitle}
        pixelsPerMs={pixelsPerMs}
        playhead={playbackPosition}
        selectedSubtitleId={selectedSubtitleId}
        setTimelineZoom={setTimelineZoom}
        subtitles={subtitles}
        timelineRef={timelineRef}
        waveform={project.waveform}
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
  pixelsPerMs,
  contentWidth,
  waveform,
  subtitles,
  selectedSubtitleId,
  onSelectSubtitle,
  onMoveSubtitle,
  onTrimSubtitle,
  onScroll,
  onScrubStart,
  onScrubEnd,
  setTimelineZoom,
  timelineRef,
}: {
  width: number;
  zoneHeight: number;
  playhead: number;
  pixelsPerMs: number;
  contentWidth: number;
  waveform: number[];
  subtitles: SubtitleBlock[];
  selectedSubtitleId: string | null;
  onSelectSubtitle: (subtitleId: string) => void;
  onMoveSubtitle: (subtitleId: string, nextStart: number, nextEnd: number) => void;
  onTrimSubtitle: (subtitleId: string, edge: 'start' | 'end', deltaMs: number) => void;
  onScroll: (offsetX: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  setTimelineZoom: (value: number) => void;
  timelineRef: React.RefObject<ScrollView | null>;
}) {
  const pinchStartZoom = useRef(1);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZoom.current = pixelsPerMs / 0.082;
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
              <Canvas style={{ width: contentWidth, height: zoneHeight }}>
                {waveform.map((value, index) => {
                  const barWidth = contentWidth / Math.max(1, waveform.length);
                  const amplitude = Math.max(12, value * (zoneHeight * 0.48));
                  const x = index * barWidth;
                  const y = zoneHeight / 2 - amplitude / 2;
                  return (
                    <Rect
                      color={
                        Math.abs((x / pixelsPerMs) - playhead) < 1300
                          ? 'rgba(0, 240, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.16)'
                      }
                      height={amplitude}
                      key={`wave-${index}`}
                      width={Math.max(2, barWidth * 0.68)}
                      x={x}
                      y={y}
                    />
                  );
                })}
              </Canvas>

              <View style={styles.blocksLayer}>
                {subtitles.map(subtitle => (
                  <TimelineSubtitleBlock
                    key={subtitle.id}
                    block={subtitle}
                    isSelected={selectedSubtitleId === subtitle.id}
                    onMove={onMoveSubtitle}
                    onSelect={onSelectSubtitle}
                    onTrim={onTrimSubtitle}
                    pixelsPerMs={pixelsPerMs}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View pointerEvents="none" style={styles.playhead}>
            <View style={styles.playheadGlow} />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

function TimelineSubtitleBlock({
  block,
  pixelsPerMs,
  isSelected,
  onSelect,
  onMove,
  onTrim,
}: {
  block: SubtitleBlock;
  pixelsPerMs: number;
  isSelected: boolean;
  onSelect: (subtitleId: string) => void;
  onMove: (subtitleId: string, nextStart: number, nextEnd: number) => void;
  onTrim: (subtitleId: string, edge: 'start' | 'end', deltaMs: number) => void;
}) {
  const translateX = useSharedValue(0);
  const [trimPreview, setTrimPreview] = useState({ left: 0, right: 0 });
  const baseWidth = Math.max(72, (block.endTime - block.startTime) * pixelsPerMs);

  const bodyGesture = Gesture.Pan()
    .activateAfterLongPress(120)
    .onBegin(() => {
      runOnJS(onSelect)(block.id);
      runOnJS(haptics.medium)();
    })
    .onUpdate(event => {
      translateX.value = event.translationX;
    })
    .onEnd(event => {
      translateX.value = withSpring(0, springConfig);
      runOnJS(onMove)(
        block.id,
        block.startTime + event.translationX / pixelsPerMs,
        block.endTime + event.translationX / pixelsPerMs,
      );
    });

  const tapGesture = Gesture.Tap().onEnd((_event, success) => {
    if (!success) {
      return;
    }
    runOnJS(onSelect)(block.id);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftHandleGesture = Gesture.Pan()
    .onUpdate(event => {
      runOnJS(setTrimPreview)({ left: event.translationX, right: 0 });
    })
    .onEnd(event => {
      runOnJS(setTrimPreview)({ left: 0, right: 0 });
      runOnJS(onTrim)(block.id, 'start', event.translationX / pixelsPerMs);
    });

  const rightHandleGesture = Gesture.Pan()
    .onUpdate(event => {
      runOnJS(setTrimPreview)({ left: 0, right: event.translationX });
    })
    .onEnd(event => {
      runOnJS(setTrimPreview)({ left: 0, right: 0 });
      runOnJS(onTrim)(block.id, 'end', event.translationX / pixelsPerMs);
    });

  const visualLeft = block.startTime * pixelsPerMs + trimPreview.left;
  const visualWidth = Math.max(72, baseWidth + trimPreview.right - trimPreview.left);

  return (
    <Animated.View
      style={[
        styles.subtitleBlockWrap,
        {
          left: visualLeft,
          width: visualWidth,
        },
        animatedStyle,
      ]}>
      <GestureDetector gesture={Gesture.Simultaneous(tapGesture, bodyGesture)}>
        <Animated.View
          style={[
            styles.subtitleBlock,
            isSelected ? styles.subtitleBlockSelected : undefined,
          ]}>
          <Text numberOfLines={1} style={styles.subtitleBlockText}>
            {block.text}
          </Text>
        </Animated.View>
      </GestureDetector>

      {isSelected ? (
        <>
          <GestureDetector gesture={leftHandleGesture}>
            <View style={[styles.trimHandle, styles.trimHandleLeft]} />
          </GestureDetector>
          <GestureDetector gesture={rightHandleGesture}>
            <View style={[styles.trimHandle, styles.trimHandleRight]} />
          </GestureDetector>
        </>
      ) : null}
    </Animated.View>
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
                  onPress: () =>
                    onChangeStyle({
                      ...currentStyle,
                      position: option.value,
                    }),
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
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarMeta: {
    alignItems: 'center',
    gap: 2,
  },
  topBarTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  topBarSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 14,
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
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  overlaySubtitleTop: {
    top: 20,
  },
  overlaySubtitleMiddle: {
    top: '42%',
  },
  overlaySubtitleBottom: {
    bottom: 18,
  },
  overlaySubtitleText: {
    overflow: 'hidden',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    textAlign: 'center',
  },
  timelineZone: {
    marginTop: 12,
  },
  timelineViewport: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 18, 21, 0.74)',
  },
  blocksLayer: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 46,
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
  subtitleBlockWrap: {
    position: 'absolute',
    top: 52,
    height: 56,
  },
  subtitleBlock: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(24, 28, 38, 0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subtitleBlockSelected: {
    borderColor: 'rgba(0, 240, 255, 0.42)',
    shadowColor: palette.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  subtitleBlockText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  trimHandle: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.8)',
  },
  trimHandleLeft: {
    left: -4,
  },
  trimHandleRight: {
    right: -4,
  },
  textZone: {
    marginHorizontal: 12,
    marginTop: 12,
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
