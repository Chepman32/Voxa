import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { HighlightedSubtitleText } from '../src/components/common/HighlightedSubtitleText';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { SubtitleBlock } from '../src/types/models';

describe('HighlightedSubtitleText', () => {
  function renderSubtitle(
    subtitle: SubtitleBlock,
    playheadPosition: number,
  ) {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <HighlightedSubtitleText
          playheadPosition={playheadPosition}
          style={{ color: defaultSubtitleStyle.textColor }}
          stylePreset={defaultSubtitleStyle}
          subtitle={subtitle}
          wordTestIDPrefix="subtitle-word"
        />,
      );
    });

    return renderer!;
  }

  it('applies the accent color to the currently spoken word', () => {
    const renderer = renderSubtitle(
      {
        id: 'subtitle-1',
        startTime: 0,
        endTime: 2200,
        text: 'hello bright world',
        words: [
          { text: 'hello', startTime: 0, endTime: 500 },
          { text: 'bright', startTime: 600, endTime: 1200 },
          { text: 'world', startTime: 1300, endTime: 1900 },
        ],
      },
      900,
    );

    const wordOne = renderer.root.findByProps({ testID: 'subtitle-word-1' });
    const wordZero = renderer.root.findByProps({ testID: 'subtitle-word-0' });

    expect(wordOne.props.style).toEqual({ color: defaultSubtitleStyle.accentColor });
    expect(wordZero.props.style).toBeUndefined();
  });

  it('keeps the plain subtitle style when no word timings exist', () => {
    const renderer = renderSubtitle(
      {
        id: 'subtitle-2',
        startTime: 0,
        endTime: 1800,
        text: 'plain subtitle',
      },
      700,
    );

    const textNodes = renderer.root.findAllByType(Text);

    expect(textNodes).toHaveLength(1);
    expect(textNodes[0]?.props.children).toBe('plain subtitle');
    expect(textNodes[0]?.props.style).toEqual({ color: defaultSubtitleStyle.textColor });
  });
});
