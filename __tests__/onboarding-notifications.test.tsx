import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

const mockCompleteOnboarding = jest.fn();
const mockRequestNotificationAuthorization = jest.fn();
const mockOnboardingState = {
  completeOnboarding: mockCompleteOnboarding,
  onboardingStep: 7,
  setOnboardingAnswers: jest.fn(),
  setOnboardingStep: jest.fn(),
};

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  SlideInRight: {
    springify: () => ({ damping: () => ({ stiffness: () => undefined }) }),
  },
  SlideOutLeft: {
    springify: () => ({ damping: () => ({ stiffness: () => undefined }) }),
  },
}));

jest.mock('../src/store/app-store', () => ({
  useAppStore: (selector: (state: typeof mockOnboardingState) => unknown) =>
    selector(mockOnboardingState),
}));

jest.mock('../src/services/notifications', () => ({
  requestNotificationAuthorization: (...args: unknown[]) =>
    mockRequestNotificationAuthorization(...args),
}));

jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));

jest.mock('../src/components/onboarding/WelcomeScreen', () => ({
  WelcomeScreen: (props: Record<string, unknown>) =>
    require('react').createElement('WelcomeScreenMock', props),
}));

jest.mock('../src/components/onboarding/GoalQuestionScreen', () => ({
  GoalQuestionScreen: () => null,
}));
jest.mock('../src/components/onboarding/PainPointsScreen', () => ({
  PainPointsScreen: () => null,
}));
jest.mock('../src/components/onboarding/SocialProofScreen', () => ({
  SocialProofScreen: () => null,
}));
jest.mock('../src/components/onboarding/PreferenceConfigScreen', () => ({
  PreferenceConfigScreen: () => null,
}));
jest.mock('../src/components/onboarding/PermissionPrimingScreen', () => ({
  PermissionPrimingScreen: () => null,
}));
jest.mock('../src/components/onboarding/ProcessingMomentScreen', () => ({
  ProcessingMomentScreen: () => null,
}));
jest.mock('../src/components/onboarding/ValueDeliveryScreen', () => ({
  ValueDeliveryScreen: (props: Record<string, unknown>) =>
    require('react').createElement('ValueDeliveryScreenMock', props),
}));

import { OnboardingFlow } from '../src/components/onboarding/OnboardingFlow';

describe('onboarding notification permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnboardingState.onboardingStep = 7;
    mockRequestNotificationAuthorization.mockResolvedValue('authorized');
  });

  it('requests notification permission after the final onboarding slide', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<OnboardingFlow />);
    });

    const finalSlide = renderer!.root.findByType(
      'ValueDeliveryScreenMock' as never,
    );

    await ReactTestRenderer.act(async () => {
      await finalSlide.props.onComplete();
    });

    expect(mockRequestNotificationAuthorization).toHaveBeenCalledTimes(1);
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    expect(mockRequestNotificationAuthorization.mock.invocationCallOrder[0]).toBeLessThan(
      mockCompleteOnboarding.mock.invocationCallOrder[0],
    );
  });

  it('still completes onboarding if the permission request fails', async () => {
    mockRequestNotificationAuthorization.mockRejectedValue(
      new Error('permission unavailable'),
    );
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<OnboardingFlow />);
    });

    const finalSlide = renderer!.root.findByType(
      'ValueDeliveryScreenMock' as never,
    );
    await ReactTestRenderer.act(async () => {
      await finalSlide.props.onComplete();
    });

    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not request notification permission when onboarding is skipped early', async () => {
    mockOnboardingState.onboardingStep = 0;
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<OnboardingFlow />);
    });

    const welcome = renderer!.root.findByType('WelcomeScreenMock' as never);
    ReactTestRenderer.act(() => {
      welcome.props.onSkip();
    });

    expect(mockRequestNotificationAuthorization).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
  });
});
