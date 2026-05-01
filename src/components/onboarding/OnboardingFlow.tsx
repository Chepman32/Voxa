import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

import { useAppStore } from '../../store/app-store';
import { palette } from '../../theme/tokens';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { WelcomeScreen } from './WelcomeScreen';
import { GoalQuestionScreen } from './GoalQuestionScreen';
import { PainPointsScreen } from './PainPointsScreen';
import { SocialProofScreen } from './SocialProofScreen';
import { PreferenceConfigScreen } from './PreferenceConfigScreen';
import { PermissionPrimingScreen } from './PermissionPrimingScreen';
import { ProcessingMomentScreen } from './ProcessingMomentScreen';
import { AppDemoScreen } from './AppDemoScreen';
import { ValueDeliveryScreen } from './ValueDeliveryScreen';

const TOTAL_STEPS = 9;

export function OnboardingFlow() {
  const step = useAppStore(state => state.onboardingStep);
  const setStep = useAppStore(state => state.setOnboardingStep);
  const completeOnboarding = useAppStore(state => state.completeOnboarding);
  const setAnswers = useAppStore(state => state.setOnboardingAnswers);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  }, [step, setStep, completeOnboarding]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step, setStep]);

  const skipToEnd = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const renderScreen = () => {
    switch (step) {
      case 0:
        return (
          <WelcomeScreen
            onNext={goNext}
            onSkip={skipToEnd}
            progress={1 / TOTAL_STEPS}
          />
        );
      case 1:
        return (
          <GoalQuestionScreen
            onNext={goNext}
            onBack={goBack}
            onSkip={skipToEnd}
            progress={2 / TOTAL_STEPS}
            onSelectGoal={goal => setAnswers({ goal })}
          />
        );
      case 2:
        return (
          <PainPointsScreen
            onNext={goNext}
            onBack={goBack}
            onSkip={skipToEnd}
            progress={3 / TOTAL_STEPS}
            onSelectPainPoints={painPoints => setAnswers({ painPoints })}
          />
        );
      case 3:
        return (
          <SocialProofScreen
            onNext={goNext}
            onBack={goBack}
            onSkip={skipToEnd}
            progress={4 / TOTAL_STEPS}
          />
        );
      case 4:
        return (
          <PreferenceConfigScreen
            onNext={goNext}
            onBack={goBack}
            onSkip={skipToEnd}
            progress={5 / TOTAL_STEPS}
            onSelectPreferences={prefs =>
              setAnswers({
                preferences: {
                  stylePreset: prefs.stylePreset,
                  fontPreset: prefs.fontPreset,
                  effect: prefs.effect,
                },
              })
            }
          />
        );
      case 5:
        return (
          <PermissionPrimingScreen
            onNext={goNext}
            onBack={goBack}
            onSkip={skipToEnd}
            progress={6 / TOTAL_STEPS}
          />
        );
      case 6:
        return (
          <ProcessingMomentScreen
            onComplete={goNext}
            progress={7 / TOTAL_STEPS}
          />
        );
      case 7:
        return (
          <AppDemoScreen
            onNext={goNext}
            onBack={goBack}
            onSkip={skipToEnd}
            progress={8 / TOTAL_STEPS}
          />
        );
      case 8:
        return (
          <ValueDeliveryScreen
            onComplete={completeOnboarding}
            onBack={goBack}
            progress={1}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <AtmosphereCanvas intensity={1.06} />
      <Animated.View
        key={step}
        entering={SlideInRight.springify().damping(18).stiffness(100)}
        exiting={SlideOutLeft.springify().damping(18).stiffness(100)}
        style={styles.screen}>
        {renderScreen()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  screen: {
    flex: 1,
  },
});
