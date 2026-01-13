import { UserPermissions, UserRoles } from 'next-auth';

export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    id: 'users',
    label: 'Usuários',
    icon: 'solar:user-bold-duotone',
    permissions: [
      {
        id: 'users.read',
        label: 'Visualizar usuários',
        description: 'Pode ver a lista de usuários',
        icon: 'solar:eye-bold',
      },
      {
        id: 'users.create',
        label: 'Criar usuários',
        description: 'Pode criar novos usuários',
        icon: 'solar:user-plus-bold',
      },
      {
        id: 'users.update',
        label: 'Editar usuários',
        description: 'Pode editar dados de usuários',
        icon: 'solar:pen-bold',
      },
      {
        id: 'users.delete',
        label: 'Deletar usuários',
        description: 'Pode excluir usuários',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
  {
    id: 'retreats',
    label: 'Retiros',
    icon: 'material-symbols:temple-buddhist',
    permissions: [
      {
        id: 'retreats.read',
        label: 'Visualizar retiros',
        description: 'Pode ver a lista de retiros',
        icon: 'solar:eye-bold',
      },
      {
        id: 'retreats.create',
        label: 'Criar retiros',
        description: 'Pode criar novos retiros',
        icon: 'solar:add-circle-bold',
      },
      {
        id: 'retreats.update',
        label: 'Editar retiros',
        description: 'Pode editar retiros existentes',
        icon: 'solar:pen-bold',
      },
      {
        id: 'retreats.delete',
        label: 'Deletar retiros',
        description: 'Pode excluir retiros',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: 'solar:chart-bold-duotone',
    permissions: [
      {
        id: 'reports.read',
        label: 'Visualizar relatórios',
        description: 'Pode acessar relatórios',
        icon: 'solar:document-text-bold',
      },
      {
        id: 'reports.create',
        label: 'Criar relatórios',
        description: 'Pode criar novos relatórios',
        icon: 'solar:add-circle-bold',
      },
      {
        id: 'reports.update',
        label: 'Editar relatórios',
        description: 'Pode editar relatórios existentes',
        icon: 'solar:pen-bold',
      },
      {
        id: 'reports.delete',
        label: 'Deletar relatórios',
        description: 'Pode excluir relatórios',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: 'solar:settings-bold-duotone',
    permissions: [
      {
        id: 'settings.read',
        label: 'Visualizar configurações',
        description: 'Pode ver configurações do sistema',
        icon: 'solar:eye-bold',
      },
      {
        id: 'settings.create',
        label: 'Criar configurações',
        description: 'Pode criar novas configurações',
        icon: 'solar:add-circle-bold',
      },
      {
        id: 'settings.update',
        label: 'Editar configurações',
        description: 'Pode modificar configurações do sistema',
        icon: 'solar:pen-bold',
      },
      {
        id: 'settings.delete',
        label: 'Deletar configurações',
        description: 'Pode excluir configurações',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
  {
    id: 'outbox',
    label: 'Outbox',
    icon: 'solar:outbox-bold-duotone',
    permissions: [
      {
        id: 'outbox.read',
        label: 'Visualizar outbox',
        description: 'Pode ver mensagens na outbox',
        icon: 'solar:eye-bold',
      },
      {
        id: 'outbox.create',
        label: 'Criar mensagens',
        description: 'Pode criar novas mensagens na outbox',
        icon: 'solar:add-circle-bold',
      },
      {
        id: 'outbox.update',
        label: 'Editar mensagens',
        description: 'Pode editar mensagens na outbox',
        icon: 'solar:pen-bold',
      },
      {
        id: 'outbox.delete',
        label: 'Deletar mensagens',
        description: 'Pode excluir mensagens da outbox',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: 'solar:user-circle-bold-duotone',
    permissions: [
      {
        id: 'profile.read',
        label: 'Visualizar perfil',
        description: 'Pode ver dados do próprio perfil',
        icon: 'solar:eye-bold',
      },
      {
        id: 'profile.create',
        label: 'Criar perfil',
        description: 'Pode criar perfil',
        icon: 'solar:user-plus-bold',
      },
      {
        id: 'profile.update',
        label: 'Editar perfil',
        description: 'Pode editar dados do próprio perfil',
        icon: 'solar:pen-bold',
      },
      {
        id: 'profile.delete',
        label: 'Deletar perfil',
        description: 'Pode excluir o próprio perfil',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'solar:widget-bold-duotone',
    permissions: [
      {
        id: 'dashboard.read',
        label: 'Visualizar dashboard',
        description: 'Pode acessar o dashboard',
        icon: 'solar:eye-bold',
      },
      {
        id: 'dashboard.create',
        label: 'Criar widgets',
        description: 'Pode criar novos widgets no dashboard',
        icon: 'solar:add-circle-bold',
      },
      {
        id: 'dashboard.update',
        label: 'Editar dashboard',
        description: 'Pode personalizar o dashboard',
        icon: 'solar:pen-bold',
      },
      {
        id: 'dashboard.delete',
        label: 'Remover widgets',
        description: 'Pode remover widgets do dashboard',
        icon: 'solar:trash-bin-minimalistic-bold',
      },
    ],
  },
];

export const ROLE_PERMISSIONS: Record<UserRoles, string[]> = {
  admin: PERMISSION_SECTIONS.flatMap((section) =>
    section.permissions.map((p) => p.id)
  ),
  manager: [
    'users.view',
    'users.edit',
    'user.create',
    'retreats.view',
    'retreats.create',
    'retreats.edit',
    'reports.view',
    'reports.export',
    //"enrollment.view",
    //"enrollment.manage",
    //"contemplation.view",
    //"contemplation.manage",
    //"payments.view",
    //"families.view",
    // "families.manage",
    // "teams.view",
    // "teams.manage",
    //  "accommodations.view",
    // "accommodations.manage",
    //"messages.view",
    //"messages.send",
  ],
  consultant: [
    'users.view',
    'retreats.view',
    'retreats.create',
    'retreats.edit',
    'reports.view',
    // "enrollment.view",
    // "enrollment.manage",
    // "contemplation.view",
    // "contemplation.manage",
    // "families.view",
    // "families.manage",
    // "teams.view",
    // "teams.manage",
    // "accommodations.view",
    // "messages.view",
  ],
  participant: [
    'retreats.view',
    // "enrollment.view",
    // "contemplation.view",
    // "messages.view",
  ],
};

const isPermissionFromRole = (
  permissionId: string[],
  role: UserRoles,
  permissions?: string[]
): boolean => {
  return permissions?.includes(permissionId.join('.') || '') || false;
};

const getPermission = ({
  permissions,
  permission,
  role,
}: {
  permissions: UserPermissions | null | undefined;
  permission: string;
  role: UserRoles | null | undefined;
}): boolean => {
  if (!permissions && !permission) return false;
  const [section, action]: string[] = permission.split('.');
  const sectionPermissions = permissions?.[section as keyof UserPermissions] as
    | Record<string, boolean>
    | undefined;
  return (
    sectionPermissions?.[action] === true ||
    isPermissionFromRole(
      [section, action],
      role || 'participant',
      ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
    )
  );
};

export default getPermission;
