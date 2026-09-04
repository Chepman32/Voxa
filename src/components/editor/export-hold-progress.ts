export const EXPORT_HOLD_BUTTON_HEIGHT = 144;
export const EXPORT_HOLD_DURATION_MS = 1500;

export function resolveExportHoldFillTranslateY(progress: number) {
  'worklet';

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  return EXPORT_HOLD_BUTTON_HEIGHT * (1 - clampedProgress);
}
