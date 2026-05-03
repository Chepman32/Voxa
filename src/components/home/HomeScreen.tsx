import React, { useDeferredValue, useMemo, useRef, useState } from 'react';
import { MenuView, type MenuAction } from '@react-native-menu/menu';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
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

import { sortProjects } from '../../lib/project';
import { useTranslation } from '../../i18n/useTranslation';
import { haptics } from '../../services/haptics';
import { emptyStateImage, palette } from '../../theme/tokens';
import type { Project, ProjectFolder } from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { ProjectCard } from './ProjectCard';

const ALL_PROJECTS_SECTION_ID = 'all-projects';
const TRASH_SECTION_ID = 'trash';
const MOVE_TO_FOLDER_PREFIX = 'move-to-folder:';

type HomeSection =
  | {
      id: typeof ALL_PROJECTS_SECTION_ID;
      title: string;
      type: 'all';
      projects: Project[];
    }
  | {
      folder: ProjectFolder;
      id: string;
      title: string;
      type: 'folder';
      projects: Project[];
    }
  | {
      id: typeof TRASH_SECTION_ID;
      title: string;
      type: 'trash';
      projects: Project[];
    };

interface HomeScreenProps {
  projects: Project[];
  folders: ProjectFolder[];
  processingVisible: boolean;
  onCleanTrash: () => void;
  onCreateFolder: (title: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteProjectPermanently: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onMoveProjectToFolder: (projectId: string, folderId: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenSettings: () => void;
  onRecoverProject: (projectId: string) => void;
  onRemoveFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, title: string) => void;
  onRenameProject: (projectId: string, title: string) => void;
}

function icon(ios: string, android?: string) {
  return Platform.select({
    ios,
    android,
    default: ios,
  });
}

function splitProjects(projects: Project[]) {
  return projects.reduce<[Project[], Project[]]>(
    (columns, project, index) => {
      columns[index % 2].push(project);
      return columns;
    },
    [[], []],
  );
}

export function HomeScreen({
  projects,
  folders,
  processingVisible,
  onCleanTrash,
  onCreateFolder,
  onCreateProject,
  onDeleteProject,
  onDeleteProjectPermanently,
  onDuplicateProject,
  onMoveProjectToFolder,
  onOpenProject,
  onOpenSettings,
  onRecoverProject,
  onRemoveFolder,
  onRenameFolder,
  onRenameProject,
}: HomeScreenProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const armedRef = useRef(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [ALL_PROJECTS_SECTION_ID]: true,
  });

  const deferredProjects = useDeferredValue(sortProjects(projects));
  const cardWidth = (width - 52) / 2;
  const headerTop = insets.top + 8;
  const contentTop = headerTop + 100;
  const pullIndicatorTop = insets.top + 12;
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t('greetingMorning')
    : hour < 18
    ? t('greetingAfternoon')
    : t('greetingEvening');

  const activeProjects = useMemo(
    () => deferredProjects.filter(project => !project.deletedAt),
    [deferredProjects],
  );
  const trashProjects = useMemo(
    () => deferredProjects.filter(project => project.deletedAt),
    [deferredProjects],
  );
  const sections = useMemo<HomeSection[]>(() => {
    const folderSections = folders.map(folder => ({
      folder,
      id: folder.id,
      title: folder.title,
      type: 'folder' as const,
      projects: activeProjects.filter(project => project.folderId === folder.id),
    }));
    const nextSections: HomeSection[] = [
      {
        id: ALL_PROJECTS_SECTION_ID,
        title: t('homeAllProjectsFolder'),
        type: 'all' as const,
        projects: activeProjects,
      },
      ...folderSections,
    ];

    if (trashProjects.length > 0) {
      nextSections.push({
        id: TRASH_SECTION_ID,
        title: t('homeTrashFolder'),
        type: 'trash',
        projects: trashProjects,
      });
    }

    return nextSections;
  }, [activeProjects, folders, t, trashProjects]);

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

  const promptForText = (
    title: string,
    message: string,
    defaultValue: string,
    onSubmit: (value: string) => void,
  ) => {
    if (Platform.OS !== 'ios' || typeof Alert.prompt !== 'function') {
      Alert.alert(title, message);
      return;
    }

    Alert.prompt(
      title,
      message,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: (value?: string) => {
            const nextValue = value?.trim() ?? '';
            if (nextValue.length > 0) {
              onSubmit(nextValue);
            }
          },
        },
      ],
      'plain-text',
      defaultValue,
    );
  };

  const confirmDestructive = (
    title: string,
    message: string,
    actionTitle: string,
    onConfirm: () => void,
  ) => {
    Alert.alert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      { text: actionTitle, style: 'destructive', onPress: onConfirm },
    ]);
  };

  const promptCreateFolder = () => {
    promptForText(
      t('folderCreate'),
      t('folderCreateMessage'),
      '',
      onCreateFolder,
    );
  };

  const promptRenameProject = (project: Project) => {
    promptForText(
      t('projectRename'),
      t('projectRenameMessage'),
      project.title,
      title => onRenameProject(project.id, title),
    );
  };

  const promptRenameFolder = (folder: ProjectFolder) => {
    promptForText(
      t('folderRename'),
      t('folderRenameMessage'),
      folder.title,
      title => onRenameFolder(folder.id, title),
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(current => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? true),
    }));
  };

  const isSectionExpanded = (sectionId: string) =>
    expandedSections[sectionId] ?? true;

  const buildProjectMenuActions = (project: Project): MenuAction[] => {
    if (project.deletedAt) {
      return [
        {
          id: 'recover',
          title: t('projectRecover'),
          image: icon('arrow.uturn.backward', 'ic_menu_revert'),
        },
        {
          id: 'remove-permanently',
          title: t('projectRemovePermanently'),
          image: icon('trash', 'ic_menu_delete'),
          attributes: { destructive: true },
        },
      ];
    }

    const folderTargets = folders.map(folder => ({
      id: `${MOVE_TO_FOLDER_PREFIX}${folder.id}`,
      title: folder.title,
      image: icon('folder', 'ic_menu_upload'),
      state: project.folderId === folder.id ? 'on' : 'off',
    } satisfies MenuAction));

    return [
      {
        id: 'rename',
        title: t('projectRename'),
        image: icon('pencil', 'ic_menu_edit'),
      },
      {
        id: 'duplicate',
        title: t('projectDuplicate'),
        image: icon('plus.square.on.square', 'ic_menu_add'),
      },
      {
        id: 'move-to-folder',
        title: t('projectMoveToFolder'),
        image: icon('folder', 'ic_menu_upload'),
        attributes: folderTargets.length === 0 ? { disabled: true } : undefined,
        subactions: folderTargets,
      },
      {
        id: 'remove',
        title: t('projectRemove'),
        image: icon('trash', 'ic_menu_delete'),
        attributes: { destructive: true },
      },
    ];
  };

  const handleProjectMenuAction = (actionId: string, projectId: string) => {
    const project = projects.find(item => item.id === projectId);
    if (!project) {
      return;
    }

    if (actionId.startsWith(MOVE_TO_FOLDER_PREFIX)) {
      onMoveProjectToFolder(projectId, actionId.replace(MOVE_TO_FOLDER_PREFIX, ''));
      return;
    }

    switch (actionId) {
      case 'rename':
        promptRenameProject(project);
        break;
      case 'duplicate':
        onDuplicateProject(projectId);
        break;
      case 'remove':
        onDeleteProject(projectId);
        break;
      case 'recover':
        onRecoverProject(projectId);
        break;
      case 'remove-permanently':
        confirmDestructive(
          t('projectRemovePermanently'),
          t('projectRemovePermanentlyMessage'),
          t('projectRemovePermanently'),
          () => onDeleteProjectPermanently(projectId),
        );
        break;
      default:
        break;
    }
  };

  const buildFolderMenuActions = (section: HomeSection): MenuAction[] => {
    if (section.type === 'trash') {
      return [
        {
          id: 'clean-trash',
          title: t('folderCleanTrash'),
          image: icon('trash', 'ic_menu_delete'),
          attributes: { destructive: true },
        },
      ];
    }

    if (section.type !== 'folder') {
      return [];
    }

    return [
      {
        id: 'rename-folder',
        title: t('folderRename'),
        image: icon('pencil', 'ic_menu_edit'),
      },
      {
        id: 'remove-folder',
        title: t('folderRemove'),
        image: icon('trash', 'ic_menu_delete'),
        attributes: { destructive: true },
      },
    ];
  };

  const handleFolderMenuAction = (actionId: string, section: HomeSection) => {
    if (section.type === 'folder') {
      if (actionId === 'rename-folder') {
        promptRenameFolder(section.folder);
        return;
      }

      if (actionId === 'remove-folder') {
        confirmDestructive(
          t('folderRemove'),
          t('folderRemoveMessage'),
          t('folderRemove'),
          () => onRemoveFolder(section.folder.id),
        );
      }
      return;
    }

    if (section.type === 'trash' && actionId === 'clean-trash') {
      confirmDestructive(
        t('folderCleanTrash'),
        t('folderCleanTrashMessage'),
        t('folderCleanTrash'),
        onCleanTrash,
      );
    }
  };

  const emptyProject = useMemo<Project>(() => ({
    id: 'empty-card',
    title: t('homeEmptyProjectTitle'),
    sourceFileName: t('homeEmptyProjectFileName'),
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
  }), [t]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ProjectCard
        height={278}
        onDelete={() => {}}
        onOpen={() => {}}
        project={emptyProject}
        swipeEnabled={false}
        width={Math.min(cardWidth * 2 + 12, width - 40)}
      />
      <Text style={styles.emptyTitle}>{t('homeEmptyTitle')}</Text>
      <Text style={styles.emptyText}>{t('homeEmptyText')}</Text>
    </View>
  );

  const renderProject = (
    project: Project,
    section: HomeSection,
    index: number,
  ) => {
    const isTrashProject = section.type === 'trash' || Boolean(project.deletedAt);

    return (
      <View key={`${section.id}-${project.id}`} style={styles.projectSlot}>
        <ProjectCard
          contextMenuActions={buildProjectMenuActions(project)}
          contextMenuTitle={project.title}
          height={index % 2 === 0 ? 224 : 272}
          onContextMenuAction={handleProjectMenuAction}
          onDelete={onDeleteProject}
          onOpen={isTrashProject ? undefined : onOpenProject}
          project={project}
          removeLabel={t('projectRemove')}
          swipeEnabled={!isTrashProject}
          width={cardWidth}
        />
      </View>
    );
  };

  const renderSectionProjects = (section: HomeSection) => {
    if (!isSectionExpanded(section.id)) {
      return null;
    }

    if (section.type === 'all' && section.projects.length === 0) {
      return renderEmptyState();
    }

    if (section.projects.length === 0) {
      return (
        <Text style={styles.emptyFolderText}>
          {t('folderEmpty')}
        </Text>
      );
    }

    const [leftColumn, rightColumn] = splitProjects(section.projects);

    return (
      <View style={styles.projectGrid}>
        <View style={styles.projectColumn}>
          {leftColumn.map((project, index) => renderProject(project, section, index * 2))}
        </View>
        <View style={styles.projectColumn}>
          {rightColumn.map((project, index) => renderProject(project, section, index * 2 + 1))}
        </View>
      </View>
    );
  };

  const renderSectionHeader = (section: HomeSection) => {
    const expanded = isSectionExpanded(section.id);
    const actions = buildFolderMenuActions(section);
    const header = (
      <Pressable
        accessibilityLabel={section.title}
        onPress={() => toggleSection(section.id)}
        style={styles.folderHeader}>
        <View style={styles.folderTitleRow}>
          <Feather
            color={palette.textSecondary}
            name={expanded ? 'chevron-down' : 'chevron-right'}
            size={20}
          />
          <Feather
            color={section.type === 'trash' ? palette.danger : palette.cyan}
            name={section.type === 'trash' ? 'trash-2' : 'folder'}
            size={18}
          />
          <Text numberOfLines={1} style={styles.folderTitle}>
            {section.title}
          </Text>
        </View>
        <Text style={styles.folderCount}>{section.projects.length}</Text>
      </Pressable>
    );

    if (actions.length === 0) {
      return header;
    }

    return (
      <MenuView
        actions={actions}
        onPressAction={({ nativeEvent }) => {
          handleFolderMenuAction(nativeEvent.event, section);
        }}
        shouldOpenOnLongPress
        title={section.title}>
        {header}
      </MenuView>
    );
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
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.heading}>{t('homeProjects')}</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityHint={t('homeCreateProjectHint')}
            accessibilityLabel={t('homeCreateProjectLabel')}
            disabled={processingVisible}
            onPress={onCreateProject}
            style={[
              styles.createButton,
              processingVisible ? styles.actionButtonDisabled : undefined,
            ]}>
            <Feather color={palette.canvas} name="plus" size={20} />
          </Pressable>

          <Pressable
            accessibilityHint={t('folderCreateHint')}
            accessibilityLabel={t('folderCreate')}
            onPress={promptCreateFolder}
            style={styles.secondaryHeaderButton}>
            <Feather color={palette.textPrimary} name="folder-plus" size={18} />
          </Pressable>

          <Pressable
            accessibilityHint={t('homeOpenSettingsHint')}
            accessibilityLabel={t('homeOpenSettingsLabel')}
            onPress={onOpenSettings}
            style={styles.secondaryHeaderButton}>
            <Feather color={palette.textPrimary} name="settings" size={18} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: contentTop }]}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.id} style={styles.folderSection}>
            {renderSectionHeader(section)}
            {renderSectionProjects(section)}
          </View>
        ))}
      </Animated.ScrollView>
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
  secondaryHeaderButton: {
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
    gap: 18,
  },
  folderSection: {
    gap: 12,
  },
  folderHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  folderTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderTitle: {
    flex: 1,
    minWidth: 0,
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  folderCount: {
    minWidth: 28,
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  projectGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  projectColumn: {
    flex: 1,
    gap: 12,
  },
  projectSlot: {
    alignItems: 'center',
  },
  emptyFolderText: {
    paddingVertical: 22,
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    paddingTop: 30,
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
