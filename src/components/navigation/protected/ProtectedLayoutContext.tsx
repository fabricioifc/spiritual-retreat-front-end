import { auth } from '@/auth';

import SideMenuDrawer from '../SideMenu';

const ProtectedLayoutContent = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = await auth();
  return <SideMenuDrawer session={session}>{children}</SideMenuDrawer>;
};

export default ProtectedLayoutContent;
