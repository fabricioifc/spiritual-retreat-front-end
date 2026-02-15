import { ActionType, ResourceType, UserObject, UserRoles } from 'next-auth';

export type MenuPermission = {
  // Permissions necessárias (OR logic - qualquer uma serve)
  permissions?: Partial<Record<ResourceType, ActionType[]>>;
  // Roles necessárias (OR logic - qualquer uma serve)
  roles?: UserRoles[];
  // Lógica customizada (opcional)
  customCheck?: (user: UserObject) => boolean;
};

export type MenuItem = {
  id: string;
  label: string;
  labelKey?: string;
  icon: string;
  path: string;
  access: MenuPermission;
  children?: MenuItem[];
  customCheck?: (user: UserObject) => boolean;
};

export const menuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelKey: 'menu.dashboard',
    icon: 'material-symbols:dashboard',
    path: '/dashboard',
    access: {
      permissions: {
        dashboard: ['read'],
      },
      roles: ['admin', 'manager', 'consultant'],
    },
  },
  {
    id: 'reports',
    label: 'Relatórios',
    labelKey: 'menu.reports',
    icon: 'lucide:bar-chart',
    path: '/reports',
    access: {
      permissions: {
        reports: ['read'],
      },
      roles: ['admin', 'manager', 'consultant'],
    },
  },
  {
    id: 'user-management',
    label: 'Gestão de Usuários',
    labelKey: 'menu.user-management',
    icon: 'solar:user-bold-duotone',
    path: '/users',
    access: {
      // ✅ Prioridade para permissions específicas
      permissions: {
        users: ['read'],
      },
      // ✅ Fallback para roles (caso não tenha permission específica)
      roles: ['admin'],
    },
  },
  // {
  //   id: "user-management-edit",
  //   label: "Edição de Usuários",
  //   icon: "solar:user-bold-duotone",
  //   path: "/users/[id]",
  //   access: {
  //     // ✅ Prioridade para permissions específicas
  //     permissions: {
  //       users: ["read"],
  //     },
  //     // ✅ Fallback para roles (caso não tenha permission específica)
  //     roles: ["admin", "manager", "consultant"],
  //   },
  //   customCheck: (user: UserObject) => {
  //     const currentPath = window.location.pathname;
  //     const pathRegex = /^\/users\/\d+$/; // Matches /users/{numeric-id}
  //     return pathRegex.test(currentPath);
  //   },
  // },
  {
    id: 'retreat-management',
    label: 'Gestão de Retiros',
    labelKey: 'menu.retreat-management',
    icon: 'material-symbols:temple-buddhist',
    path: '/retreats',
    access: {
      permissions: {
        retreats: ['read'],
      },
      roles: ['admin', 'manager'],
    },
  },
  {
    id: 'outbox',
    label: 'Gestão de OutBox',
    labelKey: 'menu.outbox',
    icon: 'ic:round-payments',
    path: '/outbox',
    access: {
      permissions: {
        outbox: ['read'],
      },
      roles: ['admin'],
    },
  },
  {
    id: 'profile-management',
    label: 'Gestão de Perfil',
    labelKey: 'menu.profile-management',
    icon: 'material-symbols:person',
    path: '/profile',
    access: {
      // ✅ Todos têm acesso ao próprio perfil
      permissions: {
        profile: ['read'],
      },
      // Sem roles necessárias - qualquer usuário logado
      roles: ['admin', 'manager', 'consultant'],
    },
  },
  {
    id: 'settings',
    label: 'Configurações',
    labelKey: 'menu.settings',
    icon: 'material-symbols:settings',
    path: '/settings',
    access: {
      permissions: {
        settings: ['read', 'update'],
      },
      roles: ['admin'], // Só admin por padrão
    },
  },
];
