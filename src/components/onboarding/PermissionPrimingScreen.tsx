import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useTranslation } from '../../i18n/useTranslation';
import { haptics } from '../../services/haptics';
import { requestAuthorizations } from '../../services/native-localsub';
import { palette } from '../../theme/tokens';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface PermissionPrimingScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
}

function getPermissionStatusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case 'authorized':
      return t('permGranted');
    case 'limited':
      return t('permLimited');
    case 'denied':
      return t('permDenied');
    case 'restricted':
      return t('permRestricted');
    case 'not_determined':
      return t('permNotDetermined');
    default:
      return t('permUnavailable');
  }
}

export function PermissionPrimingScreen({
  onNext,
  onBack,
  onSkip,
  progress,
}: PermissionPrimingScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [requesting, setRequesting] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  const buttonScale = useSharedValue(1);

  const handleEnable = async () => {
    setRequesting(true);
    haptics.medium();
    try {
      const summary = await requestAuthorizations();
      setPhotoStatus(summary.photoLibrary);
      setSpeechStatus(summary.speech);

      if (summary.photoLibrary === 'authorized' && summary.speech === 'authorized') {
        haptics.success();
        setTimeout(() => onNext(), 400);
      } else {
        haptics.light();
      }
    } catch {
      Alert.alert(t('permHeadline'), t('permSubheadline'));
    } finally {
      setRequesting(false);
    }
  };

  const handleNotNow = () => {
    haptics.light();
    onNext();
  };

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const allGranted = photoStatus === 'authorized' && speechStatus === 'authorized';

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} onSkip={onSkip} />

      <View style={styles.content}>
        <Text style={styles.headline}>{t('permHeadline')}</Text>
        <Text style={styles.subheadline}>
          {t('permSubheadline')}
        </Text>

        <View style={styles.cards}>
          <GlassPanel style={styles.card} blurAmount={18}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Feather color={palette.cyan} name="image" size={20} />
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>{t('permPhotoTitle')}</Text>
                <Text style={styles.cardBody}>
                  {t('permPhotoBody')}
                </Text>
              </View>
            </View>
            {photoStatus && (
              <View style={styles.statusRow}>
                <Feather
                  color={photoStatus === 'authorized' ? palette.success : palette.amber}
                  name={photoStatus === 'authorized' ? 'check-circle' : 'alert-circle'}
                  size={14}
                />
                <Text
                  style={[
                    styles.statusText,
                    photoStatus === 'authorized' && styles.statusTextGranted,
                  ]}>
                  {getPermissionStatusLabel(photoStatus, t)}
                </Text>
              </View>
            )}
          </GlassPanel>

          <GlassPanel style={styles.card} blurAmount={18}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Feather color={palette.violet} name="mic" size={20} />
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>{t('permSpeechTitle')}</Text>
                <Text style={styles.cardBody}>
                  {t('permSpeechBody')}
                </Text>
              </View>
            </View>
            {speechStatus && (
              <View style={styles.statusRow}>
                <Feather
                  color={speechStatus === 'authorized' ? palette.success : palette.amber}
                  name={speechStatus === 'authorized' ? 'check-circle' : 'alert-circle'}
                  size={14}
                />
                <Text
                  style={[
                    styles.statusText,
                    speechStatus === 'authorized' && styles.statusTextGranted,
                  ]}>
                  {getPermissionStatusLabel(speechStatus, t)}
                </Text>
              </View>
            )}
          </GlassPanel>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Animated.View style={ctaStyle}>
          <Pressable
            disabled={requesting || allGranted}
            onPress={handleEnable}
            style={[
              styles.primaryButton,
              (requesting || allGranted) && styles.primaryButtonDisabled,
            ]}>
            <Text style={styles.primaryButtonText}>
              {allGranted
                ? t('permAllSet')
                : requesting
                ? t('permRequesting')
                : t('permEnable')}
            </Text>
          </Pressable>
        </Animated.View>

        {!allGranted && (
          <Pressable onPress={handleNotNow} style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>{t('permNotNow')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  headline: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheadline: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  cards: {
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  statusText: {
    color: palette.amber,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextGranted: {
    color: palette.success,
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    gap: 8,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  primaryButtonText: {
    color: palette.canvas,
    fontSize: 16,
    fontWeight: '800',
  },
  ghostButton: {
    minHeight: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
