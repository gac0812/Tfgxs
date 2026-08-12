import { AppRuntime } from '../orchestration/AppRuntime';
import type {
  AlertDialogPort,
  ReminderApplicationDependencies,
  ReminderApplicationPort,
} from '../../features/reminder/application/interfaces';
import { LocalReminderApplication } from '../../features/reminder/application';
import {
  InMemoryLocalScheduleReader,
  LocalReminderDelivery,
  LocalReminderDispositionSync,
  LocalReminderRecovery,
  LocalSystemNotification,
  MemoryReminderStateStore,
  NoopPopup,
} from '../../features/reminder/data/local';
import { AlertReminderPresenter } from '../../features/reminder/presentation';
import { ExpoAudioPlayback } from '../../infrastructure/audio';
import { NativeLocationMonitor } from '../../infrastructure/location';
import {
  NativeAlarmScheduler,
  NativeDeviceCapability,
  ReactNativeAlertDialog,
  ReactNativeVibration,
} from '../../infrastructure/notifications';
import { IntervalTimeListener } from '../../infrastructure/time';

export type CreateAppServicesOptions = {
  schedules?: ReminderApplicationDependencies['schedules'];
  overrides?: Partial<ReminderApplicationDependencies>;
};

export type AppServices = {
  runtime: AppRuntime;
  reminder: ReminderApplicationPort;
  reminderPorts: ReminderApplicationDependencies;
  schedules: ReminderApplicationDependencies['schedules'];
  alertDialog: AlertDialogPort;
};

/** 应用组合根：正式提醒栈，无 mock 日程；由调用方写入 schedules。 */
export function createAppServices(options: CreateAppServicesOptions = {}): AppServices {
  const alertDialog = new ReactNativeAlertDialog();
  const schedules = options.schedules ?? new InMemoryLocalScheduleReader();
  const presenter =
    (options.overrides?.presenter as AlertReminderPresenter | undefined) ??
    new AlertReminderPresenter(alertDialog);

  const {
    schedules: _ignoredSchedules,
    presenter: _ignoredPresenter,
    ...restOverrides
  } = options.overrides ?? {};

  const reminderPorts: ReminderApplicationDependencies = {
    time: new IntervalTimeListener(),
    location: new NativeLocationMonitor(),
    alarms: new NativeAlarmScheduler(),
    delivery: new LocalReminderDelivery(),
    audio: new ExpoAudioPlayback(),
    device: new NativeDeviceCapability(),
    systemNotification: new LocalSystemNotification(),
    popup: new NoopPopup(),
    vibration: new ReactNativeVibration(),
    recovery: new LocalReminderRecovery(),
    state: new MemoryReminderStateStore(),
    dispositionSync: new LocalReminderDispositionSync(),
    ...restOverrides,
    schedules,
    presenter,
  };

  const reminder = new LocalReminderApplication(reminderPorts);

  return {
    runtime: new AppRuntime([
      {
        start: () => reminder.start(),
        stop: () => reminder.stop(),
      },
    ]),
    reminder,
    reminderPorts,
    schedules,
    alertDialog,
  };
}
