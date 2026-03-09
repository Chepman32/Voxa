import { clamp } from '../../lib/project';

interface EditorVerticalLayoutInput {
  screenHeight: number;
  topInset: number;
  bottomInset: number;
  bannerHeight?: number;
  timelineCollapsed?: boolean;
  topBarCollapsed?: boolean;
}

export interface EditorVerticalLayout {
  contentHeight: number;
  contentPaddingBottom: number;
  stackGap: number;
  videoHeight: number;
  bottomEditorTabsHeight: number;
  timelineTrackHeight: number;
  timelineControlsHeight: number;
  timelineHeight: number;
  textHeight: number;
}

const TOP_BAR_HEIGHT = 34;
const TOP_BAR_TOP_OFFSET = 2;
const CONTENT_TOP_PADDING = 8;
const CONTENT_STACK_GAP = 10;
const BANNER_SPACING = 12;
const TIMELINE_CONTROLS_HEIGHT = 128;
const BOTTOM_EDITOR_TABS_HEIGHT = 54;
const TEXT_MIN_HEIGHT = 180;
const VIDEO_TARGET_MIN_HEIGHT = 280;
const VIDEO_TARGET_MAX_HEIGHT = 340;
const VIDEO_COMPACT_MIN_HEIGHT = 224;
const VIDEO_TIGHT_MIN_HEIGHT = 180;
const TRACK_TARGET_MIN_HEIGHT = 56;
const TRACK_TARGET_MAX_HEIGHT = 72;
const TRACK_COMPACT_MIN_HEIGHT = 48;
const TRACK_TIGHT_MIN_HEIGHT = 40;
const BOTTOM_HANDLE_CLEARANCE = 10;

export function calculateEditorVerticalLayout({
  screenHeight,
  topInset,
  bottomInset,
  bannerHeight = 0,
  timelineCollapsed = false,
  topBarCollapsed = false,
}: EditorVerticalLayoutInput): EditorVerticalLayout {
  const contentPaddingBottom = bottomInset + BOTTOM_HANDLE_CLEARANCE;
  const reservedHeight =
    topInset +
    (topBarCollapsed ? 0 : TOP_BAR_TOP_OFFSET + TOP_BAR_HEIGHT) +
    CONTENT_TOP_PADDING +
    contentPaddingBottom +
    (bannerHeight > 0 ? bannerHeight + BANNER_SPACING : 0);

  const contentHeight = Math.max(0, screenHeight - reservedHeight);

  const timelineControlsHeight = timelineCollapsed ? 0 : TIMELINE_CONTROLS_HEIGHT;
  let videoHeight = clamp(
    contentHeight * 0.42,
    VIDEO_TARGET_MIN_HEIGHT,
    VIDEO_TARGET_MAX_HEIGHT,
  );
  let timelineTrackHeight = clamp(
    contentHeight * 0.16,
    TRACK_TARGET_MIN_HEIGHT,
    TRACK_TARGET_MAX_HEIGHT,
  );

  const totalStaticHeight = () =>
    videoHeight +
    timelineTrackHeight +
    TIMELINE_CONTROLS_HEIGHT +
    BOTTOM_EDITOR_TABS_HEIGHT +
    TEXT_MIN_HEIGHT +
    CONTENT_STACK_GAP * 2;

  let shortage = Math.max(0, totalStaticHeight() - contentHeight);

  if (shortage > 0) {
    const videoReduction = Math.min(shortage, videoHeight - VIDEO_TARGET_MIN_HEIGHT);
    videoHeight -= videoReduction;
    shortage -= videoReduction;
  }

  if (shortage > 0) {
    const trackReduction = Math.min(
      shortage,
      timelineTrackHeight - TRACK_TARGET_MIN_HEIGHT,
    );
    timelineTrackHeight -= trackReduction;
    shortage -= trackReduction;
  }

  // Keep the text panel fully visible when other chrome (like the import banner)
  // leaves less room than the default target heights expect.
  if (shortage > 0) {
    const compactVideoReduction = Math.min(shortage, videoHeight - VIDEO_COMPACT_MIN_HEIGHT);
    videoHeight -= compactVideoReduction;
    shortage -= compactVideoReduction;
  }

  if (shortage > 0) {
    const compactTrackReduction = Math.min(
      shortage,
      timelineTrackHeight - TRACK_COMPACT_MIN_HEIGHT,
    );
    timelineTrackHeight -= compactTrackReduction;
    shortage -= compactTrackReduction;
  }

  if (shortage > 0) {
    const tightVideoReduction = Math.min(shortage, videoHeight - VIDEO_TIGHT_MIN_HEIGHT);
    videoHeight -= tightVideoReduction;
    shortage -= tightVideoReduction;
  }

  if (shortage > 0) {
    const tightTrackReduction = Math.min(shortage, timelineTrackHeight - TRACK_TIGHT_MIN_HEIGHT);
    timelineTrackHeight -= tightTrackReduction;
    shortage -= tightTrackReduction;
  }

  if (timelineCollapsed) {
    timelineTrackHeight = 0;
  }

  const timelineHeight = timelineTrackHeight + timelineControlsHeight;
  const textHeight = Math.max(
    TEXT_MIN_HEIGHT,
    contentHeight -
      videoHeight -
      timelineHeight -
      BOTTOM_EDITOR_TABS_HEIGHT -
      CONTENT_STACK_GAP * 2,
  );

  return {
    contentHeight,
    contentPaddingBottom,
    stackGap: CONTENT_STACK_GAP,
    videoHeight,
    bottomEditorTabsHeight: BOTTOM_EDITOR_TABS_HEIGHT,
    timelineTrackHeight,
    timelineControlsHeight,
    timelineHeight,
    textHeight,
  };
}
