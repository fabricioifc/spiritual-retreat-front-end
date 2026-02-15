'use client';

import { useMemo } from 'react';

import { useSession } from 'next-auth/react';

import getPermission from '@/src/utils/getPermission';

type AllowEditProps = {
  permission: string;
};

const useAllowEdit = ({ permission }: AllowEditProps) => {
  const { data: userData } = useSession();

  const hasPermission = useMemo(() => {
    if (!userData || !userData.user) {
      return false;
    }
    const { permissions: userPermissions, role: userRole } = userData.user;
    return getPermission({
      permissions: userPermissions,
      permission,
      role: userRole,
    });
  }, [userData, permission]);

  return {
    allowEdit: hasPermission,
  };
};

export default useAllowEdit;
