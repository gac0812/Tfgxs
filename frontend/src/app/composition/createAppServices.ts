import { AppRuntime } from '../orchestration/AppRuntime';
import type {
  ReminderApplicationDependencies,
  ReminderApplicationPort,
} from '../../features/reminder/application/interfaces';
import { LocalReminderApplication } from '../../features/reminder/application';
import {
  MemoryReminderStateStore,
  MockLocalScheduleReader,
  MockReminderDispositionSync,
} from '../../features/reminder/data/local';
import { ExpoAudioPlayback } from '../../infrastructure/audio';
import { MockLocationMonitor } from '../../infrastructure/location';
import {
  MockPopup,
  MockReminderDelivery,
  MockReminderRecovery,
  MockSystemNotification,
  NativeAlarmScheduler,
  NativeDeviceCapability,
  ReactNativeAlertDialog,
  ReactNativeVibration,
} from '../../infrastructure/notifications';
import { IntervalTimeListener } from '../../infrastructure/time';
import { AlertReminderPresenter } from '../../features/reminder/presentation';

export type AppServices = {
  runtime: AppRuntime;
  reminder: ReminderApplicationPort;
  reminderPorts: ReminderApplicationDependencies;
  alertDialog: import('../../features/reminder/application/interfaces').AlertDialogPort;
};

/** 提醒组合根：LocalReminderApplication + 可替换适配器。 */
export function createAppServices(): AppServices {
  const alertDialog = new ReactNativeAlertDialog();
  const reminderPorts: ReminderApplicationDependencies = {
    schedules: new MockLocalScheduleReader(),
    time: new IntervalTimeListener(),
    location: new MockLocationMonitor(),
    alarms: new NativeAlarmScheduler(),
    delivery: new MockReminderDelivery(),
    audio: new ExpoAudioPlayback(),
    device: new NativeDeviceCapability(),
    presenter: new AlertReminderPresenter(alertDialog),
    systemNotification: new MockSystemNotification(),
    popup: new MockPopup(),
    vibration: new ReactNativeVibration(),
    recovery: new MockReminderRecovery(),
    state: new MemoryReminderStateStore(),
    dispositionSync: new MockReminderDispositionSync(),
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
    alertDialog,
  };
}
