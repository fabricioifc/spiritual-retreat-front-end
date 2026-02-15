import { Metadata } from 'next';

import ProtectedLayoutContent from '@/src/components/navigation/protected/ProtectedLayoutContext';
// import NotificationListener from '@/src/components/notifications/NotificationListener';
import { DrawerProvider } from '@/src/contexts/DrawerContext';

// import { NotificationsProvider } from '@/src/contexts/NotificationsContext';

export const metadata: Metadata = {
  title: 'Protected Routes',
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DrawerProvider>
      {/* <NotificationsProvider> */}

      {/* <NotificationListener /> */}
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>

      {/* </NotificationsProvider> */}
    </DrawerProvider>
  );
}
