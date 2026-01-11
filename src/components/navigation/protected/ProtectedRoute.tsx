'use client';

import { useMemo } from 'react';

import { Session } from 'next-auth';
import { usePathname } from 'next/navigation';

import { useMenuAccess } from '@/src/hooks/useMenuAccess';
import getPermission from '@/src/utils/getPermission';

import NoPermissionWarning from './NoPermissionWarning';

export default function ProtectedRoute({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const pathname = usePathname();
  const { user } = useMenuAccess(session);

  const pagePermission = useMemo(() => {
    if (!pathname) return null;

    // Extrair a primeira parte da URL (ex: /dashboard -> dashboard)
    const pathParts = pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    if (!firstPart) return null;

    // Retornar no formato "section.view" (ex: dashboard.read)
    return `${firstPart}.read`;
  }, [pathname]);

  const havePermission = useMemo(() => {
    if (!user || !pagePermission) return false;

    return getPermission({
      permissions: user.permissions,
      permission: pagePermission,
      role: user.role,
    });
  }, [user, pagePermission]);

  if (!user || !havePermission) {
    return <NoPermissionWarning />;
  }

  return <>{children}</>;
}
