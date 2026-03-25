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

export const emptyStateImage =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop';

export interface OnboardingCard {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  kind: 'default' | 'permissions' | 'cta';
  ctaLabel?: string;
}

export const onboardingCards: OnboardingCard[] = [
  {
    id: 'privacy',
    image:
      'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1600',
    eyebrow: 'Offline by Default',
    title: 'Your footage never leaves the device.',
    description:
      'Audio extraction, speech recognition, editing, and export stay on the phone. No uploads, no cloud queue, no third-party processing.',
    kind: 'default',
  },
  {
    id: 'gestures',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1600&auto=format&fit=crop',
    eyebrow: 'Gesture-First Editing',
    title: 'Scrub, pinch, trim, and snap subtitles with your hands.',
    description:
      'Voxa keeps controls out of the way. Pull to create, drag blocks to retime, and swipe through edits without breaking focus.',
    kind: 'default',
  },
  {
    id: 'permissions',
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop',
    eyebrow: 'Ready to Process',
    title: 'Grant library and speech access to unlock local subtitle generation.',
    description:
      'Swipe up on this card to request permissions. You can still edit manually if on-device recognition is unavailable for a selected language.',
    kind: 'permissions',
  },
  {
    id: 'start',
    image: emptyStateImage,
    eyebrow: 'All Set',
    title: 'You are ready to start building subtitles.',
    description:
      'Import a clip, refine timing with gestures, and export polished captions without sending your footage anywhere.',
    kind: 'cta',
    ctaLabel: 'Get Started',
  },
];

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

export const subtitleTextColorOptions = [
  {
    id: 'white',
    label: 'White',
    textColor: '#FFFFFF',
  },
  {
    id: 'coral',
    label: 'Coral',
    textColor: '#FF7A6B',
  },
  {
    id: 'black',
    label: 'Black',
    textColor: '#111111',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    textColor: '#FFD84D',
  },
  {
    id: 'beige',
    label: 'Beige',
    textColor: '#E8D3B2',
  },
];

export const subtitleHighlightColorOptions = [
  {
    id: 'cyan',
    label: 'Cyan',
    accentColor: '#00F0FF',
  },
  {
    id: 'violet',
    label: 'Violet',
    accentColor: '#8A2BE2',
  },
  {
    id: 'amber',
    label: 'Amber',
    accentColor: '#FFB340',
  },
  {
    id: 'clean',
    label: 'Silver',
    accentColor: '#C7C7CC',
  },
  {
    id: 'lime',
    label: 'Lime',
    accentColor: '#C7FF52',
  },
];

export const subtitleBackgroundColorOptions = [
  {
    id: 'dark',
    label: 'Dark',
    backgroundColor: 'rgba(10, 10, 12, 0.62)',
  },
  {
    id: 'none',
    label: 'None',
    backgroundColor: 'transparent',
  },
  {
    id: 'black',
    label: 'Black',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  {
    id: 'white',
    label: 'White',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  {
    id: 'navy',
    label: 'Navy',
    backgroundColor: 'rgba(10, 20, 60, 0.80)',
  },
];

export const subtitleSizeOptions = [
  {
    id: 'default',
    label: '34',
    fontSize: 34,
  },
  {
    id: 'large',
    label: '40',
    fontSize: 40,
  },
  {
    id: 'x-large',
    label: '46',
    fontSize: 46,
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
