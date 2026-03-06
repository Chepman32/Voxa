import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { emptyStateImage, palette, springConfig } from '../../theme/tokens';
import type { Project } from '../../types/models';
import { countRenderableSubtitles, formatDuration } from '../../lib/project';
import { GlassPanel } from '../common/GlassPanel';

interface ProjectCardProps {
  project: Project;
  width: number;
  height: number;
  onDelete: (projectId: string) => void;
  onOpen: (projectId: string) => void;
}

export function ProjectCard({
  project,
  width,
  height,
  onDelete,
  onOpen,
}: ProjectCardProps) {
  const translateX = useSharedValue(0);
  const subtitleCount = countRenderableSubtitles(project.subtitles);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate(event => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      const shouldDelete = Math.abs(translateX.value) > width * 0.4;
      if (shouldDelete) {
        translateX.value = withSpring(-width * 1.15, springConfig);
        runOnJS(haptics.heavy)();
        runOnJS(onDelete)(project.id);
        return;
      }
      translateX.value = withSpring(0, springConfig);
    });

  const tapGesture = Gesture.Tap().onEnd((_event, success) => {
    if (!success) {
      return;
    }
    runOnJS(haptics.light)();
    runOnJS(onOpen)(project.id);
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(translateX.value), [0, width * 0.48], [0.18, 1]),
  }));

  return (
    <View style={{ width, height }}>
      <Animated.View style={[styles.deleteAction, deleteStyle]}>
        <Feather color={palette.textPrimary} name="trash-2" size={18} />
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={Gesture.Simultaneous(panGesture, tapGesture)}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <GlassPanel style={styles.card}>
            <ImageBackground
              source={{ uri: project.thumbnailUri ?? emptyStateImage }}
              style={styles.media}
              imageStyle={styles.mediaImage}>
              <View style={styles.mediaShade} />
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{formatDuration(project.duration)}</Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    project.recognitionStatus === 'ready'
                      ? styles.statusReady
                      : project.recognitionStatus === 'failed'
                      ? styles.statusFailed
                      : styles.statusManual,
                  ]}
                />
              </View>
            </ImageBackground>

            <View style={styles.meta}>
              <Text numberOfLines={2} style={styles.title}>
                {project.title}
              </Text>
              <Text style={styles.subtitleMeta}>
                {subtitleCount} subtitle blocks
              </Text>
            </View>
          </GlassPanel>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    flex: 1,
  },
  deleteAction: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 22,
    gap: 6,
    backgroundColor: 'rgba(255, 69, 58, 0.92)',
  },
  deleteText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  card: {
    flex: 1,
    padding: 10,
    gap: 12,
  },
  media: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  mediaImage: {
    borderRadius: 20,
  },
  mediaShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  badgeRow: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 5, 8, 0.58)',
  },
  badgeText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  statusReady: {
    backgroundColor: palette.cyan,
  },
  statusFailed: {
    backgroundColor: palette.danger,
  },
  statusManual: {
    backgroundColor: palette.amber,
  },
  meta: {
    paddingHorizontal: 6,
    paddingBottom: 6,
    gap: 4,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitleMeta: {
    color: palette.textSecondary,
    fontSize: 13,
  },
});
