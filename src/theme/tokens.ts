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
  eyebrowKey: string;
  titleKey: string;
  descriptionKey: string;
  kind: 'default' | 'permissions' | 'cta';
  ctaLabelKey?: string;
}

export const onboardingCards: OnboardingCard[] = [
  {
    id: 'privacy',
    image:
      'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1600',
    eyebrowKey: 'carouselOfflineEyebrow',
    titleKey: 'carouselOfflineTitle',
    descriptionKey: 'carouselOfflineDescription',
    kind: 'default',
  },
  {
    id: 'gestures',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1600&auto=format&fit=crop',
    eyebrowKey: 'carouselGestureEyebrow',
    titleKey: 'carouselGestureTitle',
    descriptionKey: 'carouselGestureDescription',
    kind: 'default',
  },
  {
    id: 'permissions',
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop',
    eyebrowKey: 'carouselReadyEyebrow',
    titleKey: 'carouselReadyTitle',
    descriptionKey: 'carouselReadyDescription',
    kind: 'permissions',
  },
  {
    id: 'start',
    image: emptyStateImage,
    eyebrowKey: 'carouselAllSetEyebrow',
    titleKey: 'carouselAllSetTitle',
    descriptionKey: 'carouselAllSetDescription',
    kind: 'cta',
    ctaLabelKey: 'welcomeCta',
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
    labelKey: 'fontDefault',
    fontFamily: 'System',
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'homemade-apple',
    labelKey: 'fontApple',
    fontFamily: 'HomemadeApple-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  {
    id: 'oswald',
    labelKey: 'fontOswald',
    fontFamily: 'Oswald-Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'playfair',
    labelKey: 'fontPlayfair',
    fontFamily: 'PlayfairDisplay-Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'fjalla',
    labelKey: 'fontFjalla',
    fontFamily: 'FjallaOne-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'anton',
    labelKey: 'fontAnton',
    fontFamily: 'Anton-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  {
    id: 'pacifico',
    labelKey: 'fontPacifico',
    fontFamily: 'Pacifico-Regular',
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
];

export const subtitleTextColorOptions = [
  {
    id: 'white',
    labelKey: 'colorWhite',
    textColor: '#FFFFFF',
  },
  {
    id: 'coral',
    labelKey: 'colorCoral',
    textColor: '#FF7A6B',
  },
  {
    id: 'black',
    labelKey: 'colorBlack',
    textColor: '#111111',
  },
  {
    id: 'yellow',
    labelKey: 'colorYellow',
    textColor: '#FFD84D',
  },
  {
    id: 'beige',
    labelKey: 'colorBeige',
    textColor: '#E8D3B2',
  },
];

export const subtitleHighlightColorOptions = [
  {
    id: 'cyan',
    labelKey: 'colorCyan',
    accentColor: '#00F0FF',
  },
  {
    id: 'violet',
    labelKey: 'colorViolet',
    accentColor: '#8A2BE2',
  },
  {
    id: 'amber',
    labelKey: 'colorAmber',
    accentColor: '#FFB340',
  },
  {
    id: 'red',
    labelKey: 'colorRed',
    accentColor: '#FF453A',
  },
  {
    id: 'clean',
    labelKey: 'colorSilver',
    accentColor: '#C7C7CC',
  },
  {
    id: 'lime',
    labelKey: 'colorLime',
    accentColor: '#C7FF52',
  },
];

export const subtitleBackgroundColorOptions = [
  {
    id: 'dark',
    labelKey: 'backgroundDark',
    backgroundColor: 'rgba(10, 10, 12, 0.62)',
  },
  {
    id: 'none',
    labelKey: 'backgroundNone',
    backgroundColor: 'transparent',
  },
  {
    id: 'black',
    labelKey: 'colorBlack',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  {
    id: 'white',
    labelKey: 'colorWhite',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  {
    id: 'navy',
    labelKey: 'backgroundNavy',
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
  labelKey: string;
  value: SubtitlePosition;
}> = [
  { labelKey: 'positionTop', value: 'top' },
  { labelKey: 'positionMiddle', value: 'middle' },
  { labelKey: 'positionBottom', value: 'bottom' },
];

export const exportResolutions: Array<{
  label: string;
  value: ExportResolution;
}> = [
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
  { label: '4K', value: '4k' },
];
