import {
  applyManualSubtitleTextEdit,
  clampSubtitleWordsToRange,
  createPlaceholderSubtitle,
  ensureSubtitles,
  getSubtitleVerticalOrigin,
  mergeSegmentsIntoBlocks,
  normalizeSubtitleStyle,
  offsetSubtitleWords,
  resolveSubtitleStyleFromVerticalOrigin,
  setSubtitlePositionPreset,
  snapSubtitleRange,
} from '../src/lib/project';
import { defaultSubtitleStyle } from '../src/theme/tokens';

describe('project helpers', () => {
  it('merges tightly grouped transcript segments into readable subtitle blocks', () => {
    const blocks = mergeSegmentsIntoBlocks([
      {
        id: '1',
        startTime: 0,
        endTime: 420,
        text: 'offline',
        words: [{ text: 'offline', startTime: 0, endTime: 420 }],
      },
      {
        id: '2',
        startTime: 470,
        endTime: 840,
        text: 'editing',
        words: [{ text: 'editing', startTime: 470, endTime: 840 }],
      },
      { id: '3', startTime: 1800, endTime: 2300, text: 'starts' },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.text).toBe('offline editing');
    expect(blocks[0]?.words).toEqual([
      { text: 'offline', startTime: 0, endTime: 420 },
      { text: 'editing', startTime: 470, endTime: 840 },
    ]);
  });

  it('creates a placeholder subtitle when no blocks are available', () => {
    const subtitles = ensureSubtitles([], 2400);

    expect(subtitles).toHaveLength(1);
    expect(subtitles[0]?.text).toBe(createPlaceholderSubtitle(2400).text);
  });

  it('applies a known transcript offset before clamping subtitle timings', () => {
    const subtitles = ensureSubtitles(
      [
        {
          id: 'late-1',
          startTime: 6080,
          endTime: 6760,
          text: 'hello',
          words: [{ text: 'hello', startTime: 6080, endTime: 6760 }],
        },
        {
          id: 'late-2',
          startTime: 11200,
          endTime: 12120,
          text: 'world',
          words: [{ text: 'world', startTime: 11200, endTime: 12120 }],
        },
      ],
      14000,
      { knownOffsetMs: 6080 },
    );

    expect(subtitles[0]).toMatchObject({
      id: 'late-1',
      startTime: 0,
      endTime: 680,
      text: 'hello',
    });
    expect(subtitles[1]).toMatchObject({
      id: 'late-2',
      startTime: 5120,
      endTime: 6040,
      text: 'world',
    });
    expect(subtitles[0]).toEqual(
      expect.objectContaining({
        words: [{ text: 'hello', startTime: 0, endTime: 680 }],
      }),
    );
    expect(subtitles[1]).toEqual(
      expect.objectContaining({
        words: [{ text: 'world', startTime: 5120, endTime: 6040 }],
      }),
    );
  });

  it('does not relocate a short late transcript window to the start of the video', () => {
    const subtitles = ensureSubtitles(
      [
        { id: 'late-window-1', startTime: 362000, endTime: 365000, text: 'tail' },
        { id: 'late-window-2', startTime: 366200, endTime: 368400, text: 'only' },
      ],
      375000,
      { knownOffsetMs: 362000 },
    );

    expect(subtitles[0]?.startTime).toBe(362000);
    expect(subtitles[1]?.startTime).toBe(366200);
  });

  it('shifts obviously overflowed legacy subtitle timelines back to zero', () => {
    const subtitles = ensureSubtitles(
      [
        { id: 'legacy-1', startTime: 9800, endTime: 10600, text: 'late' },
        { id: 'legacy-2', startTime: 10820, endTime: 11480, text: 'timeline' },
      ],
      7200,
    );

    expect(subtitles[0]).toMatchObject({
      id: 'legacy-1',
      startTime: 0,
      endTime: 800,
      text: 'late',
    });
    expect(subtitles[1]).toMatchObject({
      id: 'legacy-2',
      startTime: 1020,
      endTime: 1680,
      text: 'timeline',
    });
  });

  it('keeps ordinary leading silence instead of forcing an offset correction', () => {
    const subtitles = ensureSubtitles(
      [
        { id: 'speech-1', startTime: 1800, endTime: 2600, text: 'real' },
        { id: 'speech-2', startTime: 2920, endTime: 3620, text: 'speech' },
      ],
      12000,
    );

    expect(subtitles[0]?.startTime).toBe(1800);
    expect(subtitles[1]?.startTime).toBe(2920);
  });

  it('moves and trims word timings with the subtitle range', () => {
    const movedWords = clampSubtitleWordsToRange(
      offsetSubtitleWords(
        [
          { text: 'hello', startTime: 1000, endTime: 1300 },
          { text: 'world', startTime: 1340, endTime: 1680 },
        ],
        700,
      ),
      1700,
      2150,
    );

    expect(movedWords).toEqual([
      { text: 'hello', startTime: 1700, endTime: 2000 },
      { text: 'world', startTime: 2040, endTime: 2150 },
    ]);
  });

  it('clears word timings after a manual subtitle text edit', () => {
    const subtitle = applyManualSubtitleTextEdit(
      {
        id: 'generated-1',
        startTime: 1200,
        endTime: 2200,
        text: 'original',
        words: [{ text: 'original', startTime: 1200, endTime: 2200 }],
        isGenerated: true,
      },
      'rewritten text',
    );

    expect(subtitle).toMatchObject({
      id: 'generated-1',
      text: 'rewritten text',
      isGenerated: false,
      isPlaceholder: false,
    });
    expect(subtitle.words).toBeUndefined();
  });

  it('fills missing subtitle style fields with defaults', () => {
    const style = normalizeSubtitleStyle({
      position: 'top',
      accentColor: '#123456',
    });

    expect(style).toMatchObject({
      position: 'top',
      accentColor: '#123456',
      wordHighlightEnabled: true,
      positionOffsetYRatio: 0,
    });
  });

  it('resets the drag offset when applying a position preset', () => {
    const style = setSubtitlePositionPreset(
      {
        ...defaultSubtitleStyle,
        position: 'middle',
        positionOffsetYRatio: 0.14,
      },
      'top',
    );

    expect(style).toMatchObject({
      position: 'top',
      positionOffsetYRatio: 0,
    });
  });

  it('resolves a dragged subtitle origin into the nearest preset and residual offset', () => {
    const style = resolveSubtitleStyleFromVerticalOrigin(
      defaultSubtitleStyle,
      30,
      320,
      60,
    );

    expect(style.position).toBe('top');
    expect(style.positionOffsetYRatio).toBeCloseTo((30 - 20) / 320);
  });

  it('computes subtitle vertical origin from preset and offset ratio', () => {
    const top = getSubtitleVerticalOrigin(
      {
        ...defaultSubtitleStyle,
        position: 'bottom',
        positionOffsetYRatio: -0.1,
      },
      300,
      50,
    );

    expect(top).toBe(202);
  });

  it('snaps subtitle edges to nearby neighbours', () => {
    const snapped = snapSubtitleRange(
      [
        { id: 'left', startTime: 0, endTime: 1200, text: 'left' },
        { id: 'current', startTime: 1400, endTime: 2200, text: 'current' },
        { id: 'right', startTime: 2400, endTime: 3200, text: 'right' },
      ],
      'current',
      1290,
      2320,
      4000,
    );

    expect(snapped.startTime).toBe(1200);
    expect(snapped.endTime).toBe(2400);
  });
});
