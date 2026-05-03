import React from 'react';
import { MenuView, type MenuAction } from '@react-native-menu/menu';
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
import { useTranslation } from '../../i18n/useTranslation';
import { emptyStateImage, palette, springConfig } from '../../theme/tokens';
import type { Project } from '../../types/models';
import { countRenderableSubtitles, formatDuration } from '../../lib/project';
import { GlassPanel } from '../common/GlassPanel';

interface ProjectCardProps {
  project: Project;
  width: number;
  height: number;
  contextMenuActions?: MenuAction[];
  contextMenuTitle?: string;
  onContextMenuAction?: (actionId: string, projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onOpen?: (projectId: string) => void;
  removeLabel?: string;
  swipeEnabled?: boolean;
}

export function ProjectCard({
  project,
  width,
  height,
  contextMenuActions = [],
  contextMenuTitle,
  onContextMenuAction,
  onDelete,
  onOpen,
  removeLabel,
  swipeEnabled = true,
}: ProjectCardProps) {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const subtitleCount = countRenderableSubtitles(project.subtitles);
  const displayTitle = project.title === 'Untitled Cut' ? t('untitledCut') : project.title;
  const resolvedRemoveLabel = removeLabel ?? t('projectRemove');

  const panGesture = Gesture.Pan()
    .enabled(swipeEnabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate(event => {
      if (!swipeEnabled) {
        return;
      }

      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      const shouldDelete = Math.abs(translateX.value) > width * 0.4;
      if (shouldDelete && swipeEnabled && onDelete) {
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
    if (!onOpen) {
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

  const card = (
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
              {displayTitle}
            </Text>
            <Text style={styles.subtitleMeta}>
              {subtitleCount} {subtitleCount === 1 ? t('projectSubtitleBlock') : t('projectSubtitleBlocks')}
            </Text>
          </View>
        </GlassPanel>
      </Animated.View>
    </GestureDetector>
  );

  return (
    <View style={{ width, height }}>
      {swipeEnabled && onDelete ? (
        <Animated.View style={[styles.deleteAction, deleteStyle]}>
          <Feather color={palette.textPrimary} name="trash-2" size={18} />
          <Text style={styles.deleteText}>{resolvedRemoveLabel}</Text>
        </Animated.View>
      ) : null}

      {contextMenuActions.length > 0 && onContextMenuAction ? (
        <MenuView
          actions={contextMenuActions}
          onPressAction={({ nativeEvent }) => {
            onContextMenuAction(nativeEvent.event, project.id);
          }}
          shouldOpenOnLongPress
          title={contextMenuTitle ?? displayTitle}>
          {card}
        </MenuView>
      ) : (
        card
      )}
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
