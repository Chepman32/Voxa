import React, { useRef } from 'react';
import { atom, createStore, Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import { ensureSubtitles, findActiveSubtitle } from '../lib/project';
import type { Project, SubtitleBlock, SubtitleStyle } from '../types/models';

export const editorProjectAtom = atom<Project | null>(null);
export const playbackPositionAtom = atom(0);
export const isPlayingAtom = atom(false);
export const selectedSubtitleIdAtom = atom<string | null>(null);
export const timelineZoomAtom = atom(1);
export const isTextEditingAtom = atom(false);
export const isStylePanelOpenAtom = atom(false);
export const isExportSheetOpenAtom = atom(false);

export const subtitlesAtom = atom(
  get => get(editorProjectAtom)?.subtitles ?? [],
  (get, set, update: SubtitleBlock[] | ((current: SubtitleBlock[]) => SubtitleBlock[])) => {
    const project = get(editorProjectAtom);
    if (!project) {
      return;
    }
    const current = project.subtitles;
    const next =
      typeof update === 'function'
        ? (update as (current: SubtitleBlock[]) => SubtitleBlock[])(current)
        : update;
    set(editorProjectAtom, {
      ...project,
      subtitles: ensureSubtitles(next, project.duration),
      updatedAt: Date.now(),
    });
  },
);

export const globalStyleAtom = atom(
  get => get(editorProjectAtom)?.globalStyle,
  (get, set, style: SubtitleStyle) => {
    const project = get(editorProjectAtom);
    if (!project) {
      return;
    }
    set(editorProjectAtom, {
      ...project,
      globalStyle: style,
      updatedAt: Date.now(),
    });
  },
);

export const activeSubtitleAtom = atom(get => {
  const subtitles = get(subtitlesAtom);
  const playhead = get(playbackPositionAtom);
  return findActiveSubtitle(subtitles, playhead) ?? subtitles[0] ?? null;
});

export const selectedSubtitleAtom = atom(get => {
  const subtitles = get(subtitlesAtom);
  const selectedId = get(selectedSubtitleIdAtom);
  return (
    subtitles.find(subtitle => subtitle.id === selectedId) ??
    get(activeSubtitleAtom) ??
    null
  );
});

function HydrateEditorAtoms({ project, children }: React.PropsWithChildren<{ project: Project }>) {
  useHydrateAtoms([
    [editorProjectAtom, project],
    [selectedSubtitleIdAtom, project.lastEditedSubtitleId ?? project.subtitles[0]?.id ?? null],
    [playbackPositionAtom, project.subtitles[0]?.startTime ?? 0],
  ]);

  return children;
}

export function EditorStateProvider({
  project,
  children,
}: React.PropsWithChildren<{ project: Project }>) {
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  return (
    <Provider store={storeRef.current}>
      <HydrateEditorAtoms project={project}>{children}</HydrateEditorAtoms>
    </Provider>
  );
}
