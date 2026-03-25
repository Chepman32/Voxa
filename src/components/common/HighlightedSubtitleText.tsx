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
import type { SubtitleBlock, SubtitleEffect, SubtitleStyle } from '../../types/models';

function getEffectStyle(effect?: SubtitleEffect): TextStyle {
  switch (effect) {
    case 'neon':
      return {
        textShadowColor: '#00f0ff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
      };
    case 'chrome':
      return {
        textShadowColor: '#ffffff',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      };
    case 'glow':
      return {
        textShadowColor: '#ffff00',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
      };
    case 'shadow':
      return {
        textShadowColor: '#000000',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 6,
      };
    default:
      return {};
  }
}

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
  const effectStyle = getEffectStyle(stylePreset.effect);
  
  if (!words || !stylePreset.wordHighlightEnabled) {
    return (
      <Text onLayout={onLayout} style={[style, effectStyle]}>
        {applySubtitleCasing(subtitle.text, stylePreset)}
      </Text>
    );
  }

  const activeWordIndex = findActiveSubtitleWordIndex(subtitle, playheadPosition, {
    allowSyntheticWords,
  });

  return (
    <Text onLayout={onLayout} style={[style, effectStyle]}>
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
