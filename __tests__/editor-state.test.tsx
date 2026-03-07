import React from 'react';
import { useAtomValue } from 'jotai';
import ReactTestRenderer from 'react-test-renderer';

import {
  EditorStateProvider,
  playbackPositionAtom,
  selectedSubtitleAtom,
  selectedSubtitleIdAtom,
} from '../src/store/editor-atoms';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { Project } from '../src/types/models';

describe('editor state hydration', () => {
  it('opens at 00:00 without a selected subtitle', () => {
    let snapshot:
      | {
          playbackPosition: number;
          selectedSubtitleId: string | null;
          selectedSubtitleText: string | null;
        }
      | null = null;

    const project: Project = {
      id: 'project-1',
      title: 'Offset fix',
      sourceFileName: 'offset-fix.mov',
      videoLocalURI: 'file:///tmp/offset-fix.mov',
      duration: 6800,
      createdAt: 1,
      updatedAt: 1,
      subtitles: [
        { id: 'subtitle-1', startTime: 2400, endTime: 3200, text: 'first line' },
        { id: 'subtitle-2', startTime: 3600, endTime: 4400, text: 'second line' },
      ],
      globalStyle: defaultSubtitleStyle,
      waveform: [0.2, 0.4, 0.6],
      recognitionStatus: 'ready',
      metrics: { width: 1080, height: 1920 },
      lastEditedSubtitleId: 'subtitle-2',
    };

    function Probe() {
      snapshot = {
        playbackPosition: useAtomValue(playbackPositionAtom),
        selectedSubtitleId: useAtomValue(selectedSubtitleIdAtom),
        selectedSubtitleText: useAtomValue(selectedSubtitleAtom)?.text ?? null,
      };

      return null;
    }

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <EditorStateProvider project={project}>
          <Probe />
        </EditorStateProvider>,
      );
    });

    expect(snapshot).toEqual({
      playbackPosition: 0,
      selectedSubtitleId: null,
      selectedSubtitleText: null,
    });
  });
});
