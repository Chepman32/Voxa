import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-menu/menu', () => ({
  MenuView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-reanimated', () => {
  const { ScrollView, View } = require('react-native');

  return {
    __esModule: true,
    default: { ScrollView, View },
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

jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/services/haptics', () => ({
  haptics: { heavy: jest.fn() },
}));

import { HomeScreen } from '../src/components/home/HomeScreen';
import { translations } from '../src/i18n/translations';
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

function renderHome(folders: ProjectFolder[]) {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <HomeScreen
        folders={folders}
        onCleanTrash={jest.fn()}
        onCreateFolder={jest.fn()}
        onCreateProject={jest.fn()}
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
        processingVisible={false}
        projects={[project]}
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
    jest.restoreAllMocks();
  });

  it('shows an enabled create-folder action when no folders exist', () => {
    const card = findProjectCard(renderHome([]));

    expect(card.props.contextMenuActions).toContainEqual(
      expect.objectContaining({
        id: 'create-folder',
        title: 'folderCreate',
      }),
    );
    expect(card.props.contextMenuActions).not.toContainEqual(
      expect.objectContaining({ id: 'move-to-folder' }),
    );
  });

  it('opens the existing create-folder prompt from the project menu', () => {
    const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(jest.fn());
    const card = findProjectCard(renderHome([]));

    ReactTestRenderer.act(() => {
      card.props.onContextMenuAction('create-folder', project.id);
    });

    expect(prompt).toHaveBeenCalledWith(
      'folderCreate',
      'folderCreateMessage',
      expect.any(Array),
      'plain-text',
      '',
    );
  });

  it('keeps the move-to-folder submenu when a folder exists', () => {
    const card = findProjectCard(renderHome([folder]));

    expect(card.props.contextMenuActions).toContainEqual(
      expect.objectContaining({
        id: 'move-to-folder',
        subactions: [
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
});
