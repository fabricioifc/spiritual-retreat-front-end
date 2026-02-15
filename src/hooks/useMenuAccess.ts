'use client';

import { useMemo } from 'react';

import { Session, UserObject, UserRoles } from 'next-auth';

import {
  MenuItem,
  MenuPermission,
  menuConfig,
} from '../components/navigation/SideMenu/shared';

export function useMenuAccess(session: Session | null = null) {
  const user = useMemo(() => {
    return session?.user as UserObject | null;
  }, [session]);
  if (!session) {
    return {
      hasAccess: () => false,
      getAccessibleMenus: () => [],
      canAccessMenu: () => false,
      isLoading: false,
      user: null,
      status: 'unauthenticated' as const,
      debugUserAccess: () => {},
    };
  }

  const hasAccess = (access: MenuPermission): boolean => {
    if (!user) return false;

    try {
      if (access.permissions && hasAnyPermission(access.permissions)) {
        return true;
      }

      if (access.roles && hasAnyRole(access.roles)) {
        return true;
      }

      if (access.customCheck && access.customCheck(user)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return false;
    }
  };

  const hasAnyPermission = (
    permissions: MenuPermission['permissions']
  ): boolean => {
    if (!permissions || !user?.permissions) return false;

    try {
      return Object.entries(permissions).some(([resource, actions]) => {
        return actions.some((action) => {
          const resourceKey = resource as keyof typeof user.permissions;
          const resourcePermissions = user.permissions[resourceKey];
          if (!resourcePermissions) return false;
          return (
            (resourcePermissions as Record<string, boolean>)[action] === true
          );
        });
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  };

  const hasAnyRole = (roles: UserRoles[]): boolean => {
    if (!user?.role) return false;

    try {
      return roles.some((role) => user.role === role);
    } catch (error) {
      console.error('Erro ao verificar roles:', error);
      return false;
    }
  };

  const getAccessibleMenus = (
    resolveLabel?: (menu: MenuItem) => string
  ): MenuItem[] => {
    try {
      const menus = menuConfig.filter((menu) => hasAccess(menu.access));
      if (!resolveLabel) return menus;

      return menus.map((menu) => ({
        ...menu,
        label: resolveLabel(menu),
      }));
    } catch (error) {
      console.error('Erro ao obter menus acessíveis:', error);
      return [];
    }
  };

  const canAccessMenu = (menuId: string): boolean => {
    try {
      const menu = menuConfig.find((m) => m.id === menuId);
      return menu ? hasAccess(menu.access) : false;
    } catch (error) {
      console.error('Erro ao verificar acesso ao menu:', error);
      return false;
    }
  };

  const debugUserAccess = () => {
    if (process.env.NODE_ENV === 'development') {
      // console.log("🔍 User Access Debug:", {
      //   status,
      //   user: user ? { id: user.id, role: user.role } : null,
      //   accessibleMenus: getAccessibleMenus().map((m) => m.label),
      // });
    }
  };

  return {
    hasAccess,
    getAccessibleMenus,
    canAccessMenu,
    debugUserAccess,
    user,
    isLoading: false,
    status: 'authenticated' as const,
  };
}
