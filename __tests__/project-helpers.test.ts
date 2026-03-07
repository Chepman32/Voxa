import {
  createPlaceholderSubtitle,
  ensureSubtitles,
  mergeSegmentsIntoBlocks,
  snapSubtitleRange,
} from '../src/lib/project';

describe('project helpers', () => {
  it('merges tightly grouped transcript segments into readable subtitle blocks', () => {
    const blocks = mergeSegmentsIntoBlocks([
      { id: '1', startTime: 0, endTime: 420, text: 'offline' },
      { id: '2', startTime: 470, endTime: 840, text: 'editing' },
      { id: '3', startTime: 1800, endTime: 2300, text: 'starts' },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.text).toBe('offline editing');
  });

  it('creates a placeholder subtitle when no blocks are available', () => {
    const subtitles = ensureSubtitles([], 2400);

    expect(subtitles).toHaveLength(1);
    expect(subtitles[0]?.text).toBe(createPlaceholderSubtitle(2400).text);
  });

  it('applies a known transcript offset before clamping subtitle timings', () => {
    const subtitles = ensureSubtitles(
      [
        { id: 'late-1', startTime: 6080, endTime: 6760, text: 'hello' },
        { id: 'late-2', startTime: 11200, endTime: 12120, text: 'world' },
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
