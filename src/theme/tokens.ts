import type { ExportResolution, SubtitlePosition, SubtitleStyle } from '../types/models';

export const palette = {
  canvas: '#05060A',
  black: '#000000',
  surface: 'rgba(16, 18, 24, 0.72)',
  surfaceStrong: 'rgba(28, 32, 40, 0.82)',
  surfaceMuted: 'rgba(18, 19, 23, 0.62)',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  cyan: '#00F0FF',
  violet: '#8A2BE2',
  danger: '#FF453A',
  success: '#32D74B',
  amber: '#FFB340',
};

export const springConfig = {
  mass: 1,
  damping: 15,
  stiffness: 120,
};

export const onboardingCards = [
  {
    id: 'privacy',
    image:
      'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1600',
    eyebrow: 'Offline by Default',
    title: 'Your footage never leaves the device.',
    description:
      'Audio extraction, speech recognition, editing, and export stay on the phone. No uploads, no cloud queue, no third-party processing.',
  },
  {
    id: 'gestures',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1600&auto=format&fit=crop',
    eyebrow: 'Gesture-First Editing',
    title: 'Scrub, pinch, trim, and snap subtitles with your hands.',
    description:
      'Voxa keeps controls out of the way. Pull to create, drag blocks to retime, and swipe through edits without breaking focus.',
  },
  {
    id: 'permissions',
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop',
    eyebrow: 'Ready to Process',
    title: 'Grant library and speech access to unlock local subtitle generation.',
    description:
      'Swipe up on this card to request permissions. You can still edit manually if on-device recognition is unavailable for a selected language.',
  },
];

export const emptyStateImage =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop';

export const defaultSubtitleStyle: SubtitleStyle = {
  fontPresetId: 'display',
  fontFamily: 'System',
  fontWeight: '800',
  fontSize: 34,
  letterSpacing: 0.3,
  textColor: '#FFFFFF',
  backgroundColor: 'rgba(10, 10, 12, 0.62)',
  accentColor: '#00F0FF',
  wordHighlightEnabled: true,
  position: 'bottom',
  positionOffsetYRatio: 0,
  casing: 'sentence',
};

export const subtitleFontOptions = [
  {
    id: 'display',
    label: 'Default',
    fontFamily: 'System',
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'homemade-apple',
    label: 'Apple',
    fontFamily: 'HomemadeApple-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  {
    id: 'oswald',
    label: 'Oswald',
    fontFamily: 'Oswald-Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'playfair',
    label: 'Playfair',
    fontFamily: 'PlayfairDisplay-Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'fjalla',
    label: 'Fjalla',
    fontFamily: 'FjallaOne-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'anton',
    label: 'Anton',
    fontFamily: 'Anton-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'pacifico',
    label: 'Pacifico',
    fontFamily: 'Pacifico-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
];

export const subtitleColorOptions = [
  {
    id: 'cyan',
    label: 'Cyan',
    textColor: '#FFFFFF',
    accentColor: '#00F0FF',
    backgroundColor: 'rgba(0, 15, 19, 0.72)',
  },
  {
    id: 'violet',
    label: 'Violet',
    textColor: '#FFFFFF',
    accentColor: '#8A2BE2',
    backgroundColor: 'rgba(18, 8, 28, 0.72)',
  },
  {
    id: 'amber',
    label: 'Amber',
    textColor: '#FFF9F2',
    accentColor: '#FFB340',
    backgroundColor: 'rgba(28, 18, 7, 0.72)',
  },
  {
    id: 'clean',
    label: 'Clean',
    textColor: '#FFFFFF',
    accentColor: '#C7C7CC',
    backgroundColor: 'rgba(12, 12, 15, 0.72)',
  },
];

export const subtitlePositionOptions: Array<{
  label: string;
  value: SubtitlePosition;
}> = [
  { label: 'Top', value: 'top' },
  { label: 'Middle', value: 'middle' },
  { label: 'Bottom', value: 'bottom' },
];

export const exportResolutions: Array<{
  label: string;
  value: ExportResolution;
}> = [
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
  { label: '4K', value: '4k' },
];

export const speechLocales = [
  { label: 'US English', value: 'en-US' },
  { label: 'UK English', value: 'en-GB' },
  { label: 'Russian', value: 'ru-RU' },
];
