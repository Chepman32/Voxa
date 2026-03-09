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
    allowSyntheticWords = true,
  ) {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <HighlightedSubtitleText
          allowSyntheticWords={allowSyntheticWords}
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

  it('renders plain text when word highlighting is disabled', () => {
    const renderer = renderSubtitle(
      {
        id: 'subtitle-3',
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

    ReactTestRenderer.act(() => {
      renderer.update(
        <HighlightedSubtitleText
          playheadPosition={900}
          style={{ color: defaultSubtitleStyle.textColor }}
          stylePreset={{ ...defaultSubtitleStyle, wordHighlightEnabled: false }}
          subtitle={{
            id: 'subtitle-3',
            startTime: 0,
            endTime: 2200,
            text: 'hello bright world',
            words: [
              { text: 'hello', startTime: 0, endTime: 500 },
              { text: 'bright', startTime: 600, endTime: 1200 },
              { text: 'world', startTime: 1300, endTime: 1900 },
            ],
          }}
          wordTestIDPrefix="subtitle-word"
        />,
      );
    });

    const textNodes = renderer.root.findAllByType(Text);

    expect(textNodes).toHaveLength(1);
    expect(textNodes[0]?.props.children).toBe('hello bright world');
  });

  it('synthesizes word highlighting when no word timings exist', () => {
    const renderer = renderSubtitle(
      {
        id: 'subtitle-2',
        startTime: 0,
        endTime: 1800,
        text: 'plain subtitle',
      },
      700,
    );

    const firstWord = renderer.root.findByProps({ testID: 'subtitle-word-0' });
    const secondWord = renderer.root.findByProps({ testID: 'subtitle-word-1' });

    expect(firstWord.props.children.join('')).toBe('plain');
    expect(firstWord.props.style).toEqual({ color: defaultSubtitleStyle.accentColor });
    expect(secondWord.props.children.join('')).toBe(' subtitle');
    expect(secondWord.props.style).toBeUndefined();
  });

  it('renders plain text for subtitles without timings when synthetic words are disabled', () => {
    const renderer = renderSubtitle(
      {
        id: 'subtitle-4',
        startTime: 0,
        endTime: 1800,
        text: 'plain subtitle',
      },
      700,
      false,
    );

    const textNodes = renderer.root.findAllByType(Text);

    expect(textNodes).toHaveLength(1);
    expect(textNodes[0]?.props.children).toBe('plain subtitle');
  });
});
