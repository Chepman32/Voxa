jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
    currentState: 'active',
  },
  NativeModules: {
    LocalSubOfflineModule: {
      cancelInactivityReminders: jest.fn(),
      getNotificationAuthorizationStatus: jest.fn(),
      requestNotificationAuthorization: jest.fn(),
      scheduleInactivityReminders: jest.fn(),
    },
  },
}));

import { AppState, NativeModules } from 'react-native';

import {
  buildInactivityReminders,
  cancelInactivityReminders,
  getNotificationAuthorizationStatus,
  requestNotificationAuthorization,
  scheduleInactivityReminders,
  startInactivityReminderLifecycle,
} from '../src/services/notifications';

const nativeModule = NativeModules.LocalSubOfflineModule as {
  cancelInactivityReminders: jest.Mock;
  getNotificationAuthorizationStatus: jest.Mock;
  requestNotificationAuthorization: jest.Mock;
  scheduleInactivityReminders: jest.Mock;
};

describe('notification reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds three gentle reminders with a sparse cadence', () => {
    const reminders = buildInactivityReminders(key => key);

    expect(reminders).toEqual([
      expect.objectContaining({
        body: 'notificationReminder1Body',
        delaySeconds: 4 * 24 * 60 * 60,
        id: 'localsub-inactivity-1',
        title: 'notificationReminder1Title',
      }),
      expect.objectContaining({
        body: 'notificationReminder2Body',
        delaySeconds: 10 * 24 * 60 * 60,
        id: 'localsub-inactivity-2',
        title: 'notificationReminder2Title',
      }),
      expect.objectContaining({
        body: 'notificationReminder3Body',
        delaySeconds: 21 * 24 * 60 * 60,
        id: 'localsub-inactivity-3',
        title: 'notificationReminder3Title',
      }),
    ]);
  });

  it('delegates permission and scheduling operations to the native module', async () => {
    const reminders = buildInactivityReminders(key => key);
    nativeModule.getNotificationAuthorizationStatus.mockResolvedValue(
      'not_determined',
    );
    nativeModule.requestNotificationAuthorization.mockResolvedValue(
      'authorized',
    );
    nativeModule.scheduleInactivityReminders.mockResolvedValue(true);
    nativeModule.cancelInactivityReminders.mockResolvedValue(undefined);

    await expect(getNotificationAuthorizationStatus()).resolves.toBe(
      'not_determined',
    );
    await expect(requestNotificationAuthorization()).resolves.toBe(
      'authorized',
    );
    await expect(scheduleInactivityReminders(reminders)).resolves.toBe(true);
    await expect(cancelInactivityReminders()).resolves.toBeUndefined();
    expect(nativeModule.scheduleInactivityReminders).toHaveBeenCalledWith(
      reminders,
    );
  });

  it('schedules only after backgrounding and cancels when the app returns', async () => {
    let onAppStateChange: ((state: string) => void) | undefined;
    const remove = jest.fn();
    const appState = {
      currentState: 'active' as const,
      addEventListener: jest.fn(
        (_event: string, listener: (state: string) => void) => {
          onAppStateChange = listener;
          return { remove };
        },
      ),
    };
    const dependencies = {
      appState,
      cancelReminders: jest.fn().mockResolvedValue(undefined),
      getAuthorizationStatus: jest.fn().mockResolvedValue('authorized'),
      scheduleReminders: jest.fn().mockResolvedValue(true),
    };
    const onAuthorizationStatus = jest.fn();

    const lifecycle = startInactivityReminderLifecycle(
      key => key,
      onAuthorizationStatus,
      dependencies,
    );
    await lifecycle.whenIdle();

    expect(dependencies.cancelReminders).toHaveBeenCalledTimes(1);
    expect(onAuthorizationStatus).toHaveBeenCalledWith('authorized');
    expect(dependencies.scheduleReminders).not.toHaveBeenCalled();

    onAppStateChange?.('inactive');
    await lifecycle.whenIdle();
    expect(dependencies.scheduleReminders).not.toHaveBeenCalled();
    expect(dependencies.cancelReminders).toHaveBeenCalledTimes(1);

    onAppStateChange?.('background');
    await lifecycle.whenIdle();

    expect(dependencies.scheduleReminders).toHaveBeenCalledWith(
      buildInactivityReminders(key => key),
    );

    onAppStateChange?.('background');
    await lifecycle.whenIdle();
    expect(dependencies.scheduleReminders).toHaveBeenCalledTimes(1);

    onAppStateChange?.('active');
    await lifecycle.whenIdle();

    expect(dependencies.cancelReminders).toHaveBeenCalledTimes(2);
    expect(dependencies.getAuthorizationStatus).toHaveBeenCalledTimes(2);

    lifecycle.remove();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('uses the native defaults when dependencies are omitted', async () => {
    const remove = jest.fn();
    jest.mocked(AppState.addEventListener).mockReturnValue({ remove });
    nativeModule.cancelInactivityReminders.mockResolvedValue(undefined);
    nativeModule.getNotificationAuthorizationStatus.mockResolvedValue(
      'authorized',
    );

    const onAuthorizationStatus = jest.fn();
    const lifecycle = startInactivityReminderLifecycle(
      key => key,
      onAuthorizationStatus,
    );
    await lifecycle.whenIdle();

    expect(nativeModule.cancelInactivityReminders).toHaveBeenCalledTimes(1);
    expect(onAuthorizationStatus).toHaveBeenCalledWith('authorized');

    lifecycle.remove();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('does not begin queued work after the lifecycle is removed', async () => {
    const cancelReminders = jest.fn().mockResolvedValue(undefined);
    const lifecycle = startInactivityReminderLifecycle(
      key => key,
      jest.fn(),
      {
        appState: {
          currentState: 'active',
          addEventListener: jest.fn(() => ({ remove: jest.fn() })),
        },
        cancelReminders,
        getAuthorizationStatus: jest.fn().mockResolvedValue('authorized'),
        scheduleReminders: jest.fn().mockResolvedValue(true),
      },
    );

    lifecycle.remove();
    await lifecycle.whenIdle();

    expect(cancelReminders).not.toHaveBeenCalled();
  });
});
