import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useTranslation } from '../../i18n/useTranslation';
import { supportedLocales } from '../../i18n/translations';
import {
  exportResolutions,
  palette,
} from '../../theme/tokens';
import type {
  ExportResolution,
  SupportedLocale,
  TranscriptionLanguageMode,
} from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';

interface SettingsScreenProps {
  preferredExportResolution: ExportResolution;
  highlightEditedWords: boolean;
  transcriptionLanguageMode: TranscriptionLanguageMode;
  rememberLastTranscriptionLanguage: boolean;
  lastTranscriptionLanguageLabel?: string;
  uiLocale: SupportedLocale;
  onClose: () => void;
  onResolutionChange: (resolution: ExportResolution) => void;
  onHighlightEditedWordsChange: (value: boolean) => void;
  onTranscriptionLanguageModeChange: (mode: TranscriptionLanguageMode) => void;
  onRememberLastTranscriptionLanguageChange: (value: boolean) => void;
  onUiLocaleChange: (locale: SupportedLocale) => void;
  onResetOnboarding: () => void;
}

export function SettingsScreen({
  preferredExportResolution,
  highlightEditedWords,
  transcriptionLanguageMode,
  rememberLastTranscriptionLanguage,
  lastTranscriptionLanguageLabel,
  uiLocale,
  onClose,
  onResolutionChange,
  onHighlightEditedWordsChange,
  onTranscriptionLanguageModeChange,
  onRememberLastTranscriptionLanguageChange,
  onUiLocaleChange,
  onResetOnboarding,
}: SettingsScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AtmosphereCanvas intensity={1.04} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          accessibilityLabel={t('back')}
          onPress={onClose}
          style={styles.backButton}>
          <Feather color={palette.textPrimary} name="chevron-left" size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 18) + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsAppLanguage')}</Text>
          <Text style={styles.sectionHint}>{t('settingsAppLanguageDescription')}</Text>
          <View style={styles.optionStack}>
            {supportedLocales.map(locale => (
              <SettingsOption
                key={locale}
                active={uiLocale === locale}
                description={t(`languageNative_${locale}`)}
                icon="globe"
                onPress={() => onUiLocaleChange(locale)}
                title={t(`languageName_${locale}`)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsDefaultExport')}</Text>
          <View style={styles.pillRow}>
            {exportResolutions.map(option => (
              <Pressable
                key={option.value}
                onPress={() => onResolutionChange(option.value)}
                style={[
                  styles.pill,
                  preferredExportResolution === option.value
                    ? styles.pillActive
                    : undefined,
                ]}>
                <Text
                  style={[
                    styles.pillText,
                    preferredExportResolution === option.value
                      ? styles.pillTextActive
                      : undefined,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('transcribingLanguageTitle')}</Text>
          <View style={styles.optionStack}>
            <SettingsOption
              active={transcriptionLanguageMode === 'app'}
              description={t('settingsUseAppLanguageDescription')}
              icon="smartphone"
              onPress={() => onTranscriptionLanguageModeChange('app')}
              title={t('settingsUseAppLanguage')}
            />
            <SettingsOption
              active={transcriptionLanguageMode === 'ask'}
              description={t('settingsAskBeforeTranscriptionDescription')}
              icon="message-square"
              onPress={() => onTranscriptionLanguageModeChange('ask')}
              title={t('settingsAskBeforeTranscription')}
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleLabel}>{t('settingsRememberLastLanguage')}</Text>
              <Text style={styles.toggleHint}>
                {lastTranscriptionLanguageLabel
                  ? `${t('settingsLastUsed')}: ${lastTranscriptionLanguageLabel}.`
                  : t('settingsRememberLastLanguageDescription')}
              </Text>
            </View>
            <Switch
              ios_backgroundColor="rgba(255, 255, 255, 0.12)"
              onValueChange={onRememberLastTranscriptionLanguageChange}
              thumbColor={palette.textPrimary}
              trackColor={{
                false: 'rgba(255, 255, 255, 0.16)',
                true: 'rgba(0, 240, 255, 0.42)',
              }}
              value={rememberLastTranscriptionLanguage}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsSubtitleHighlighting')}</Text>
          <View style={styles.toggleCard}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleLabel}>{t('settingsHighlightEditedWords')}</Text>
              <Text style={styles.toggleHint}>
                {t('settingsHighlightEditedWordsDescription')}
              </Text>
            </View>
            <Switch
              ios_backgroundColor="rgba(255, 255, 255, 0.12)"
              onValueChange={onHighlightEditedWordsChange}
              thumbColor={palette.textPrimary}
              trackColor={{
                false: 'rgba(255, 255, 255, 0.16)',
                true: 'rgba(0, 240, 255, 0.42)',
              }}
              value={highlightEditedWords}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsPrivacy')}</Text>
          <Text style={styles.bodyText}>{t('settingsPrivacyBody')}</Text>
        </View>

        <Pressable onPress={onResetOnboarding} style={styles.resetRow}>
          <Feather color={palette.cyan} name="refresh-ccw" size={16} />
          <Text style={styles.resetText}>{t('settingsReplayOnboarding')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingsOption({
  active,
  description,
  icon,
  onPress,
  title,
}: {
  active: boolean;
  description: string;
  icon: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionCard, active ? styles.optionCardActive : undefined]}>
      <View style={styles.optionIcon}>
        <Feather color={active ? palette.cyan : palette.textSecondary} name={icon} size={16} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, active ? styles.optionTitleActive : undefined]}>
          {title}
        </Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      {active ? <Feather color={palette.cyan} name="check" size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  pillActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  pillText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: palette.textPrimary,
  },
  optionStack: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  optionCardActive: {
    borderColor: 'rgba(0, 240, 255, 0.34)',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTitleActive: {
    color: palette.cyan,
  },
  optionDescription: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  bodyText: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetText: {
    color: palette.cyan,
    fontSize: 14,
    fontWeight: '700',
  },
});
