import React from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-menu/menu', () => ({
  MenuView: (props: Record<string, unknown>) =>
    require('react').createElement('MenuViewMock', props),
}));

jest.mock('react-native-reanimated', () => {
  const { ScrollView: RNScrollView, View } = require('react-native');

  return {
    __esModule: true,
    default: { ScrollView: RNScrollView, View },
    interpolate: jest.fn(() => 0),
    useAnimatedStyle: jest.fn(callback => callback()),
    useSharedValue: jest.fn(value => ({ value })),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('react-native-vector-icons/Feather', () => () => null);

jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));

jest.mock('../src/components/home/ProjectCard', () => ({
  ProjectCard: (props: Record<string, unknown>) =>
    require('react').createElement('ProjectCardMock', props),
}));

jest.mock('../src/components/common/TextPromptModal', () => ({
  TextPromptModal: (props: Record<string, unknown>) =>
    require('react').createElement('TextPromptModalMock', props),
}));

jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/services/haptics', () => ({
  haptics: { heavy: jest.fn() },
}));

import { HomeScreen } from '../src/components/home/HomeScreen';
import { translations } from '../src/i18n/translations';
import { haptics } from '../src/services/haptics';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { Project, ProjectFolder } from '../src/types/models';

const project: Project = {
  id: 'project-1',
  title: 'Project',
  sourceFileName: 'project.mov',
  videoLocalURI: 'file:///tmp/project.mov',
  duration: 4200,
  createdAt: 1,
  updatedAt: 1,
  subtitles: [],
  globalStyle: defaultSubtitleStyle,
  waveform: [],
  recognitionStatus: 'ready',
  metrics: { width: 1080, height: 1920 },
};

const folder: ProjectFolder = {
  id: 'folder-1',
  title: 'Social',
  createdAt: 1,
  updatedAt: 1,
};

const deletedProject: Project = {
  ...project,
  id: 'project-2',
  deletedAt: 2,
};

function renderHome(
  folders: ProjectFolder[],
  onCreateFolder = jest.fn(),
  showFolderItemCounts = false,
  projects: Project[] = [project],
  onCreateProject = jest.fn(),
  processingVisible = false,
  overrides: Partial<React.ComponentProps<typeof HomeScreen>> = {},
) {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <HomeScreen
        folders={folders}
        onCleanTrash={jest.fn()}
        onCreateFolder={onCreateFolder}
        onCreateProject={onCreateProject}
        onDeleteProject={jest.fn()}
        onDeleteProjectPermanently={jest.fn()}
        onDuplicateProject={jest.fn()}
        onMoveProjectToFolder={jest.fn()}
        onOpenProject={jest.fn()}
        onOpenSettings={jest.fn()}
        onRecoverProject={jest.fn()}
        onRemoveFolder={jest.fn()}
        onRenameFolder={jest.fn()}
        onRenameProject={jest.fn()}
        processingVisible={processingVisible}
        projects={projects}
        showFolderItemCounts={showFolderItemCounts}
        {...overrides}
      />,
    );
  });

  return renderer!;
}

function findProjectCard(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findByType('ProjectCardMock' as never);
}

describe('HomeScreen project folder actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('nests an enabled create-folder action under move-to-folder when no folders exist', () => {
    const card = findProjectCard(renderHome([]));

    expect(card.props.contextMenuActions).toContainEqual(
      expect.objectContaining({
        id: 'move-to-folder',
        title: 'projectMoveToFolder',
        subactions: [
          expect.objectContaining({
            id: 'create-folder',
            title: 'folderCreate',
          }),
        ],
      }),
    );
  });

  it('opens the friendly create-folder modal from the project menu', () => {
    const onCreateFolder = jest.fn();
    const renderer = renderHome([], onCreateFolder);
    const card = findProjectCard(renderer);

    ReactTestRenderer.act(() => {
      card.props.onContextMenuAction('create-folder', project.id);
    });

    const modal = renderer.root.findByType('TextPromptModalMock' as never);

    expect(modal.props).toMatchObject({
      cancelLabel: 'cancel',
      confirmLabel: 'folderCreateAction',
      icon: 'folder-plus',
      message: 'folderCreateMessage',
      placeholder: 'folderNamePlaceholder',
      title: 'folderCreate',
      visible: true,
    });

    ReactTestRenderer.act(() => {
      modal.props.onSubmit('Social clips');
    });

    expect(onCreateFolder).toHaveBeenCalledWith('Social clips');
  });

  it('keeps the move-to-folder submenu when a folder exists', () => {
    const card = findProjectCard(renderHome([folder]));

    expect(card.props.contextMenuActions).toContainEqual(
      expect.objectContaining({
        id: 'move-to-folder',
        subactions: [
          expect.objectContaining({
            id: 'create-folder',
            title: 'folderCreate',
          }),
          expect.objectContaining({
            id: 'move-to-folder:folder-1',
            title: 'Social',
          }),
        ],
      }),
    );
  });

  it('uses the requested English label', () => {
    expect(translations.en.folderCreate).toBe('Create New Folder');
  });

  it('hides folder item counts by default', () => {
    const renderer = renderHome(
      [folder],
      jest.fn(),
      false,
      [project, deletedProject],
    );
    const numericLabels = renderer.root.findAll(
      node => node.type === Text && typeof node.props.children === 'number',
    );

    expect(numericLabels).toHaveLength(0);
  });

  it('shows folder item counts when the preference is enabled', () => {
    const renderer = renderHome(
      [folder],
      jest.fn(),
      true,
      [project, deletedProject],
    );
    const numericLabels = renderer.root
      .findAll(
        node => node.type === Text && typeof node.props.children === 'number',
      )
      .map(node => node.props.children);

    expect(numericLabels).toEqual([1, 0, 1]);
  });

  it('does not render a synthetic project card in the empty state', () => {
    const renderer = renderHome([], jest.fn(), false, []);

    expect(
      renderer.root.findAllByType('ProjectCardMock' as never),
    ).toHaveLength(0);
  });

  it('renders the create-project action as a floating button', () => {
    const onCreateProject = jest.fn();
    const renderer = renderHome(
      [],
      jest.fn(),
      false,
      [project],
      onCreateProject,
    );
    const createButton = renderer.root.findByProps({
      testID: 'home-create-project-fab',
    });

    expect(StyleSheet.flatten(createButton.props.style)).toMatchObject({
      bottom: 20,
      position: 'absolute',
      right: 20,
    });

    ReactTestRenderer.act(() => {
      createButton.props.onPress();
    });

    expect(onCreateProject).toHaveBeenCalledTimes(1);
  });

  it('keeps the floating create button disabled while processing', () => {
    const renderer = renderHome([], jest.fn(), false, [project], jest.fn(), true);
    const createButton = renderer.root.findByProps({
      testID: 'home-create-project-fab',
    });

    expect(createButton.props.disabled).toBe(true);
    expect(StyleSheet.flatten(createButton.props.style)).toMatchObject({
      opacity: 0.45,
    });
  });

  it('preserves pull-to-create behavior alongside the floating button', () => {
    const onCreateProject = jest.fn();
    const renderer = renderHome(
      [],
      jest.fn(),
      false,
      [project],
      onCreateProject,
    );
    const scrollView = renderer.root.findByType(ScrollView);
    const scrollEvent = (y: number) => ({
      nativeEvent: { contentOffset: { y } },
    });

    ReactTestRenderer.act(() => {
      scrollView.props.onScroll(scrollEvent(-119));
      scrollView.props.onScroll(scrollEvent(-130));
      scrollView.props.onScroll(scrollEvent(1));
      scrollView.props.onScroll(scrollEvent(-119));
      scrollView.props.onScrollEndDrag(scrollEvent(-119));
      scrollView.props.onScrollEndDrag(scrollEvent(0));
    });

    expect(haptics.heavy).toHaveBeenCalledTimes(2);
    expect(onCreateProject).toHaveBeenCalledTimes(1);
  });

  it('dispatches project menu actions to their callbacks', () => {
    const onDeleteProject = jest.fn();
    const onDuplicateProject = jest.fn();
    const onMoveProjectToFolder = jest.fn();
    const onRenameProject = jest.fn();
    const renderer = renderHome(
      [folder],
      jest.fn(),
      false,
      [{ ...project, folderId: folder.id }],
      jest.fn(),
      false,
      {
        onDeleteProject,
        onDuplicateProject,
        onMoveProjectToFolder,
        onRenameProject,
      },
    );
    const card = findProjectCard(renderer);

    expect(
      card.props.contextMenuActions.find(
        (action: { id: string }) => action.id === 'move-to-folder',
      ).subactions,
    ).toContainEqual(
      expect.objectContaining({ id: 'move-to-folder:folder-1', state: 'on' }),
    );

    ReactTestRenderer.act(() => {
      card.props.onContextMenuAction('move-to-folder:folder-1', project.id);
      card.props.onContextMenuAction('duplicate', project.id);
      card.props.onContextMenuAction('remove', project.id);
      card.props.onContextMenuAction('unknown', project.id);
      card.props.onContextMenuAction('rename', project.id);
      card.props.onContextMenuAction('remove', 'missing-project');
    });

    const modal = renderer.root.findByType('TextPromptModalMock' as never);
    ReactTestRenderer.act(() => {
      modal.props.onSubmit('Renamed project');
    });

    expect(onMoveProjectToFolder).toHaveBeenCalledWith(project.id, folder.id);
    expect(onDuplicateProject).toHaveBeenCalledWith(project.id);
    expect(onDeleteProject).toHaveBeenCalledWith(project.id);
    expect(onRenameProject).toHaveBeenCalledWith(project.id, 'Renamed project');
  });

  it('supports recovery and permanent removal from trash', () => {
    const onDeleteProjectPermanently = jest.fn();
    const onRecoverProject = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert');
    const renderer = renderHome(
      [],
      jest.fn(),
      false,
      [deletedProject],
      jest.fn(),
      false,
      { onDeleteProjectPermanently, onRecoverProject },
    );

    ReactTestRenderer.act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'homeTrashFolder' }).props.onPress();
    });

    const card = findProjectCard(renderer);
    expect(card.props.contextMenuActions.map((action: { id: string }) => action.id)).toEqual([
      'recover',
      'remove-permanently',
    ]);

    ReactTestRenderer.act(() => {
      card.props.onContextMenuAction('recover', deletedProject.id);
      card.props.onContextMenuAction('remove-permanently', deletedProject.id);
      alertSpy.mock.calls[0][2]?.[1]?.onPress?.();
    });

    expect(onRecoverProject).toHaveBeenCalledWith(deletedProject.id);
    expect(onDeleteProjectPermanently).toHaveBeenCalledWith(deletedProject.id);
  });

  it('supports folder rename, removal, and empty-folder expansion', () => {
    const onRemoveFolder = jest.fn();
    const onRenameFolder = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert');
    const renderer = renderHome(
      [folder],
      jest.fn(),
      false,
      [project],
      jest.fn(),
      false,
      { onRemoveFolder, onRenameFolder },
    );
    const folderMenu = renderer.root.findByProps({ title: folder.title });

    ReactTestRenderer.act(() => {
      folderMenu.props.onPressAction({ nativeEvent: { event: 'rename-folder' } });
    });

    const modal = renderer.root.findByType('TextPromptModalMock' as never);
    ReactTestRenderer.act(() => {
      modal.props.onSubmit('Renamed folder');
      folderMenu.props.onPressAction({ nativeEvent: { event: 'remove-folder' } });
      alertSpy.mock.calls[0][2]?.[1]?.onPress?.();
      renderer.root.findByProps({ accessibilityLabel: folder.title }).props.onPress();
    });

    expect(onRenameFolder).toHaveBeenCalledWith(folder.id, 'Renamed folder');
    expect(onRemoveFolder).toHaveBeenCalledWith(folder.id);
    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'folderEmpty',
      ),
    ).toHaveLength(1);
  });
});
