import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { palette } from '../../theme/tokens';
import { GlassPanel } from './GlassPanel';

export const TEXT_PROMPT_INPUT_TEST_ID = 'text-prompt-input';
export const TEXT_PROMPT_CANCEL_TEST_ID = 'text-prompt-cancel';
export const TEXT_PROMPT_CONFIRM_TEST_ID = 'text-prompt-confirm';

const ENTER_SPRING = {
  damping: 21,
  energyThreshold: 0.0006,
  mass: 0.78,
  overshootClamping: false,
  reduceMotion: ReduceMotion.System,
  stiffness: 280,
  velocity: 2.4,
};

const EXIT_SPRING = {
  damping: 30,
  energyThreshold: 0.0006,
  mass: 0.7,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
  stiffness: 340,
  velocity: -2.2,
};

interface TextPromptModalProps {
  cancelLabel: string;
  confirmLabel: string;
  defaultValue?: string;
  icon?: string;
  message: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  title: string;
  visible: boolean;
}

export function TextPromptModal({
  cancelLabel,
  confirmLabel,
  defaultValue = '',
  icon = 'edit-3',
  message,
  onClose,
  onSubmit,
  placeholder,
  title,
  visible,
}: TextPromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const closingRef = useRef(false);
  const backdropProgress = useSharedValue(0);
  const modalProgress = useSharedValue(0);
  const trimmedValue = value.trim();
  const canSubmit = trimmedValue.length > 0;

  const finishClose = useCallback(() => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    closingRef.current = false;
    pendingAction?.();
    onClose();
  }, [onClose]);

  const requestClose = useCallback(
    (pendingAction?: () => void) => {
      if (closingRef.current) {
        return;
      }

      closingRef.current = true;
      pendingActionRef.current = pendingAction ?? null;
      Keyboard.dismiss();
      backdropProgress.value = withTiming(0, {
        duration: 150,
        reduceMotion: ReduceMotion.System,
      });
      modalProgress.value = withSpring(0, EXIT_SPRING, finished => {
        if (finished) {
          runOnJS(finishClose)();
        }
      });
    },
    [backdropProgress, finishClose, modalProgress],
  );

  useEffect(() => {
    cancelAnimation(backdropProgress);
    cancelAnimation(modalProgress);

    if (!visible) {
      backdropProgress.value = 0;
      modalProgress.value = 0;
      closingRef.current = false;
      pendingActionRef.current = null;
      return;
    }

    setValue(defaultValue);
    backdropProgress.value = 0;
    modalProgress.value = 0;
    backdropProgress.value = withTiming(1, {
      duration: 220,
      reduceMotion: ReduceMotion.System,
    });
    modalProgress.value = withSpring(1, ENTER_SPRING);
  }, [backdropProgress, defaultValue, modalProgress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backdropProgress.value, [0, 1], [0, 1]),
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modalProgress.value, [0, 0.28, 1], [0, 1, 1]),
    transform: [
      {
        translateY: interpolate(modalProgress.value, [0, 1], [24, 0]),
      },
      {
        scale: interpolate(modalProgress.value, [0, 1], [0.92, 1]),
      },
    ],
  }));

  const handleCancel = () => {
    haptics.light();
    requestClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    haptics.medium();
    requestClose(() => onSubmit(trimmedValue));
  };

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      onRequestClose={handleCancel}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityLabel={cancelLabel}
            onPress={handleCancel}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          pointerEvents="box-none"
          style={styles.keyboardAvoider}
        >
          <Animated.View style={[styles.modalWrap, modalStyle]}>
            <GlassPanel
              accessibilityViewIsModal
              blurAmount={34}
              style={styles.modal}
            >
              <View style={styles.iconWrap}>
                <Feather color={palette.cyan} name={icon} size={22} />
              </View>

              <View style={styles.copy}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
              </View>

              <TextInput
                autoCapitalize="sentences"
                autoCorrect={false}
                autoFocus
                maxLength={80}
                onChangeText={setValue}
                onSubmitEditing={handleSubmit}
                placeholder={placeholder}
                placeholderTextColor={palette.textSecondary}
                returnKeyType="done"
                selectTextOnFocus={defaultValue.length > 0}
                selectionColor={palette.cyan}
                style={styles.input}
                testID={TEXT_PROMPT_INPUT_TEST_ID}
                value={value}
              />

              <View style={styles.actions}>
                <Pressable
                  onPress={handleCancel}
                  style={({ pressed }) => [
                    styles.button,
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                  ]}
                  testID={TEXT_PROMPT_CANCEL_TEST_ID}
                >
                  <Text style={styles.cancelLabel}>{cancelLabel}</Text>
                </Pressable>
                <Pressable
                  disabled={!canSubmit}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.button,
                    styles.confirmButton,
                    !canSubmit && styles.buttonDisabled,
                    pressed && canSubmit && styles.buttonPressed,
                  ]}
                  testID={TEXT_PROMPT_CONFIRM_TEST_ID}
                >
                  <Text style={styles.confirmLabel}>{confirmLabel}</Text>
                  <Feather color={palette.canvas} name="arrow-up-right" size={16} />
                </Pressable>
              </View>
            </GlassPanel>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  keyboardAvoider: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalWrap: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.55,
    shadowRadius: 34,
    elevation: 24,
  },
  modal: {
    padding: 22,
    borderRadius: 30,
    gap: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 240, 255, 0.28)',
  },
  copy: {
    gap: 7,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  message: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 0.76,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  confirmButton: {
    flex: 1.24,
    backgroundColor: palette.cyan,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.34,
  },
  cancelLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmLabel: {
    color: palette.canvas,
    fontSize: 14,
    fontWeight: '800',
  },
});
