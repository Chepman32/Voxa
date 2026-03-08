import { clamp } from '../../lib/project';

interface EditorVerticalLayoutInput {
  screenHeight: number;
  topInset: number;
  bottomInset: number;
  bannerHeight?: number;
}

export interface EditorVerticalLayout {
  contentHeight: number;
  contentPaddingBottom: number;
  stackGap: number;
  videoHeight: number;
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
const TIMELINE_CONTROLS_HEIGHT = 92;
const TEXT_MIN_HEIGHT = 180;
const VIDEO_TARGET_MIN_HEIGHT = 280;
const VIDEO_TARGET_MAX_HEIGHT = 340;
const VIDEO_COMPACT_MIN_HEIGHT = 224;
const TRACK_TARGET_MIN_HEIGHT = 104;
const TRACK_TARGET_MAX_HEIGHT = 136;
const TRACK_COMPACT_MIN_HEIGHT = 92;
const BOTTOM_HANDLE_CLEARANCE = 10;

export function calculateEditorVerticalLayout({
  screenHeight,
  topInset,
  bottomInset,
  bannerHeight = 0,
}: EditorVerticalLayoutInput): EditorVerticalLayout {
  const contentPaddingBottom = bottomInset + BOTTOM_HANDLE_CLEARANCE;
  const reservedHeight =
    topInset +
    TOP_BAR_TOP_OFFSET +
    TOP_BAR_HEIGHT +
    CONTENT_TOP_PADDING +
    contentPaddingBottom +
    (bannerHeight > 0 ? bannerHeight + BANNER_SPACING : 0);

  const contentHeight = Math.max(0, screenHeight - reservedHeight);

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

  const timelineHeight = timelineTrackHeight + TIMELINE_CONTROLS_HEIGHT;
  const textHeight = Math.max(
    TEXT_MIN_HEIGHT,
    contentHeight - videoHeight - timelineHeight - CONTENT_STACK_GAP * 2,
  );

  return {
    contentHeight,
    contentPaddingBottom,
    stackGap: CONTENT_STACK_GAP,
    videoHeight,
    timelineTrackHeight,
    timelineControlsHeight: TIMELINE_CONTROLS_HEIGHT,
    timelineHeight,
    textHeight,
  };
}
