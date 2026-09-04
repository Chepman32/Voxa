import {
  EXPORT_HOLD_BUTTON_HEIGHT,
  EXPORT_HOLD_DURATION_MS,
  resolveExportHoldFillTranslateY,
} from '../src/components/editor/export-hold-progress';

describe('ExportSheet hold progress', () => {
  it('starts with the color fill fully below the export button', () => {
    expect(resolveExportHoldFillTranslateY(0)).toBe(
      EXPORT_HOLD_BUTTON_HEIGHT,
    );
  });

  it('fills half the button after half of the hold gesture', () => {
    expect(resolveExportHoldFillTranslateY(0.5)).toBe(
      EXPORT_HOLD_BUTTON_HEIGHT / 2,
    );
  });

  it('fills the complete button over the existing hold duration', () => {
    expect({
      duration: EXPORT_HOLD_DURATION_MS,
      finalTranslateY: resolveExportHoldFillTranslateY(1),
    }).toEqual({
      duration: 1500,
      finalTranslateY: 0,
    });
  });
});
