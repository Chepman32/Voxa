import {
  AppState,
  NativeModules,
  type AppStateStatus,
} from 'react-native';

export type NotificationAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'not_determined';

export interface InactivityReminder {
  body: string;
  delaySeconds: number;
  id: string;
  title: string;
}

interface LocalSubNotificationNativeModule {
  cancelInactivityReminders(): Promise<void>;
  getNotificationAuthorizationStatus(): Promise<NotificationAuthorizationStatus>;
  requestNotificationAuthorization(): Promise<NotificationAuthorizationStatus>;
  scheduleInactivityReminders(
    reminders: InactivityReminder[],
  ): Promise<boolean>;
}

interface AppStateSource {
  currentState: AppStateStatus;
  addEventListener(
    event: 'change',
    listener: (state: AppStateStatus) => void,
  ): { remove(): void };
}

interface InactivityReminderDependencies {
  appState: AppStateSource;
  cancelReminders: () => Promise<void>;
  getAuthorizationStatus: () => Promise<NotificationAuthorizationStatus>;
  scheduleReminders: (reminders: InactivityReminder[]) => Promise<boolean>;
}

interface InactivityReminderLifecycle {
  remove(): void;
  whenIdle(): Promise<void>;
}

type Translate = (key: string) => string;

const SECONDS_PER_DAY = 24 * 60 * 60;
const nativeModule = NativeModules.LocalSubOfflineModule as
  | LocalSubNotificationNativeModule
  | undefined;

function requireNotificationNativeModule() {
  if (!nativeModule) {
    throw new Error('LocalSub notification services are unavailable.');
  }

  return nativeModule;
}

export function buildInactivityReminders(
  t: Translate,
): InactivityReminder[] {
  return [
    {
      body: t('notificationReminder1Body'),
      delaySeconds: 4 * SECONDS_PER_DAY,
      id: 'localsub-inactivity-1',
      title: t('notificationReminder1Title'),
    },
    {
      body: t('notificationReminder2Body'),
      delaySeconds: 10 * SECONDS_PER_DAY,
      id: 'localsub-inactivity-2',
      title: t('notificationReminder2Title'),
    },
    {
      body: t('notificationReminder3Body'),
      delaySeconds: 21 * SECONDS_PER_DAY,
      id: 'localsub-inactivity-3',
      title: t('notificationReminder3Title'),
    },
  ];
}

export function getNotificationAuthorizationStatus() {
  return requireNotificationNativeModule().getNotificationAuthorizationStatus();
}

export function requestNotificationAuthorization() {
  return requireNotificationNativeModule().requestNotificationAuthorization();
}

export function scheduleInactivityReminders(
  reminders: InactivityReminder[],
) {
  return requireNotificationNativeModule().scheduleInactivityReminders(
    reminders,
  );
}

export function cancelInactivityReminders() {
  return requireNotificationNativeModule().cancelInactivityReminders();
}

const defaultDependencies: InactivityReminderDependencies = {
  appState: AppState,
  cancelReminders: cancelInactivityReminders,
  getAuthorizationStatus: getNotificationAuthorizationStatus,
  scheduleReminders: scheduleInactivityReminders,
};

export function startInactivityReminderLifecycle(
  t: Translate,
  onAuthorizationStatus: (status: NotificationAuthorizationStatus) => void,
  dependencies: InactivityReminderDependencies = defaultDependencies,
): InactivityReminderLifecycle {
  let currentState = dependencies.appState.currentState;
  let disposed = false;
  let operation = Promise.resolve();

  const enqueue = (task: () => Promise<unknown>) => {
    operation = operation
      .then(async () => {
        if (!disposed) {
          await task();
        }
      })
      .catch(() => undefined);
  };

  const cancelAndRefresh = async () => {
    await dependencies.cancelReminders();
    const status = await dependencies.getAuthorizationStatus();
    if (!disposed) {
      onAuthorizationStatus(status);
    }
  };

  enqueue(cancelAndRefresh);

  const subscription = dependencies.appState.addEventListener(
    'change',
    nextState => {
      if (nextState === currentState) {
        return;
      }

      currentState = nextState;
      if (nextState === 'background') {
        enqueue(() =>
          dependencies.scheduleReminders(buildInactivityReminders(t)),
        );
      } else if (nextState === 'active') {
        enqueue(cancelAndRefresh);
      }
    },
  );

  return {
    remove() {
      disposed = true;
      subscription.remove();
    },
    whenIdle() {
      return operation;
    },
  };
}
