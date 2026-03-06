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
