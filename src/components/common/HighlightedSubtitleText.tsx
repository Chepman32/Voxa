import React from 'react';
import {
  type LayoutChangeEvent,
  Text,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import {
  applySubtitleCasing,
  findActiveSubtitleWordIndex,
  getRenderableSubtitleWords,
} from '../../lib/project';
import type { SubtitleBlock, SubtitleStyle } from '../../types/models';

interface HighlightedSubtitleTextProps {
  subtitle: SubtitleBlock;
  playheadPosition: number;
  stylePreset: SubtitleStyle;
  allowSyntheticWords?: boolean;
  style?: StyleProp<TextStyle>;
  wordTestIDPrefix?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function HighlightedSubtitleText({
  subtitle,
  playheadPosition,
  stylePreset,
  allowSyntheticWords = true,
  style,
  wordTestIDPrefix,
  onLayout,
}: HighlightedSubtitleTextProps) {
  const words = getRenderableSubtitleWords(subtitle, {
    allowSyntheticWords,
  });
  if (!words || !stylePreset.wordHighlightEnabled) {
    return (
      <Text onLayout={onLayout} style={style}>
        {applySubtitleCasing(subtitle.text, stylePreset)}
      </Text>
    );
  }

  const activeWordIndex = findActiveSubtitleWordIndex(subtitle, playheadPosition, {
    allowSyntheticWords,
  });

  return (
    <Text onLayout={onLayout} style={style}>
      {words.map((word, index) => (
        <Text
          key={`${subtitle.id}-word-${index}-${word.startTime}`}
          style={index === activeWordIndex ? { color: stylePreset.accentColor } : undefined}
          testID={wordTestIDPrefix ? `${wordTestIDPrefix}-${index}` : undefined}>
          {index > 0 ? ' ' : ''}
          {applySubtitleCasing(word.text, stylePreset)}
        </Text>
      ))}
    </Text>
  );
}
