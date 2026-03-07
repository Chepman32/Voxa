import React, { useDeferredValue, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { getGreeting, sortProjects } from '../../lib/project';
import { haptics } from '../../services/haptics';
import { emptyStateImage, palette } from '../../theme/tokens';
import type { Project } from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { ProjectCard } from './ProjectCard';

interface HomeScreenProps {
  projects: Project[];
  processingVisible: boolean;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenSettings: () => void;
}

export function HomeScreen({
  projects,
  processingVisible,
  onCreateProject,
  onDeleteProject,
  onOpenProject,
  onOpenSettings,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const armedRef = useRef(false);

  const deferredProjects = useDeferredValue(sortProjects(projects));
  const cardWidth = (width - 52) / 2;
  const headerTop = insets.top + 8;
  const contentTop = headerTop + 100;
  const pullIndicatorTop = insets.top + 12;

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scrollY.value, [0, 90], [1, 0.84]) }],
  }));

  const pullIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pullDistance.value, [0, 120], [0, 1]),
    transform: [
      { translateY: interpolate(pullDistance.value, [0, 120], [-38, 12]) },
      { scale: interpolate(pullDistance.value, [0, 120], [0.62, 1.08]) },
    ],
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.value = Math.max(0, offsetY);
    pullDistance.value = Math.max(0, -offsetY);

    const armed = offsetY < -118;
    if (armed && !armedRef.current && !processingVisible) {
      armedRef.current = true;
      haptics.heavy();
    }
    if (!armed) {
      armedRef.current = false;
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY < -118 && !processingVisible) {
      onCreateProject();
    }
  };

  return (
    <View style={styles.root}>
      <AtmosphereCanvas intensity={1.08} />

      <Animated.View
        style={[styles.pullIndicator, { top: pullIndicatorTop }, pullIconStyle]}
      >
        <Feather color={palette.cyan} name="plus-circle" size={56} />
      </Animated.View>

      <Animated.View style={[styles.header, { top: headerTop }, headerStyle]}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.heading}>Projects</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityHint="Create a new project"
            accessibilityLabel="Create project"
            disabled={processingVisible}
            onPress={onCreateProject}
            style={[
              styles.createButton,
              processingVisible ? styles.actionButtonDisabled : undefined,
            ]}>
            <Feather color={palette.canvas} name="plus" size={20} />
          </Pressable>

          <Pressable
            accessibilityHint="Open app settings"
            accessibilityLabel="Open settings"
            onPress={onOpenSettings}
            style={styles.settingsButton}>
            <Feather color={palette.textPrimary} name="settings" size={18} />
          </Pressable>
        </View>
      </Animated.View>

      <FlatList
        contentContainerStyle={[styles.content, { paddingTop: contentTop }]}
        data={deferredProjects}
        keyExtractor={item => item.id}
        numColumns={2}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        renderItem={({ item, index }) => (
          <ProjectCard
            height={index % 2 === 0 ? 224 : 272}
            onDelete={onDeleteProject}
            onOpen={onOpenProject}
            project={item}
            width={cardWidth}
          />
        )}
        columnWrapperStyle={styles.column}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ProjectCard
              height={278}
              onDelete={() => {}}
              onOpen={() => {}}
              project={{
                id: 'empty-card',
                title: 'Pull down to create',
                sourceFileName: 'Empty',
                videoLocalURI: emptyStateImage,
                thumbnailUri: emptyStateImage,
                duration: 18000,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                subtitles: [],
                globalStyle: {
                  fontPresetId: 'display',
                  fontFamily: 'System',
                  fontWeight: '800',
                  fontSize: 32,
                  letterSpacing: 0.3,
                  textColor: '#FFFFFF',
                  backgroundColor: 'rgba(10, 10, 12, 0.62)',
                  accentColor: '#00F0FF',
                  wordHighlightEnabled: true,
                  position: 'bottom',
                  positionOffsetYRatio: 0,
                  casing: 'sentence',
                },
                waveform: [],
                recognitionStatus: 'manual',
                metrics: { width: 1080, height: 1920 },
              }}
              width={Math.min(cardWidth * 2 + 12, width - 40)}
            />
            <Text style={styles.emptyTitle}>Tap + to create.</Text>
            <Text style={styles.emptyText}>
              Import a local video and Voxa will build the subtitle timeline offline. You
              can still pull down for a quick create gesture.
            </Text>
          </View>
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  pullIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 2,
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: palette.textSecondary,
    fontSize: 13,
    letterSpacing: 1.4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heading: {
    marginTop: 6,
    color: palette.textPrimary,
    fontSize: 34,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cyan,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  column: {
    gap: 12,
    marginBottom: 12,
  },
  emptyState: {
    paddingTop: 42,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    maxWidth: 280,
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
