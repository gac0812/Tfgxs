import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';

import { useReminderPermissionsOnLaunch } from '../features/reminder';

import { createAppServices, type AppServices } from './composition/createAppServices';

const AppServicesContext = createContext<AppServices | null>(null);

export function useAppServices(): AppServices {
  const value = useContext(AppServicesContext);
  if (value == null) {
    throw new Error('useAppServices must be used within AppProviders');
  }
  return value;
}

/** 组合应用级提供器，并启动提醒运行时。 */
export function AppProviders({ children }: PropsWithChildren) {
  const services = useMemo(() => createAppServices(), []);
  const onPermissionsUpdated = useCallback(() => {
    void services.reminder.rebuild();
  }, [services]);
  useReminderPermissionsOnLaunch(
    services.reminderPorts.device,
    services.alertDialog,
    onPermissionsUpdated,
  );

  useEffect(() => {
    void services.runtime.start();
    return () => {
      void services.runtime.stop();
    };
  }, [services]);

  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}
