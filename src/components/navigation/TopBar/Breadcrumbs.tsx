'use client';

import React, { useMemo } from 'react';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Box,
  Chip,
  Link,
  Breadcrumbs as MuiBreadcrumbs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import Iconify from '@/src/components/Iconify';
import { useBreadCrumbs } from '@/src/contexts/BreadCrumbsContext';

import { menuConfig } from '../SideMenu/shared';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbResolverContext {
  segment: string;
  currentPath: string;
  previousSegment: string | null;
  previousPath: string | null;
  pathSegments: string[];
  index: number;
  isLast: boolean;
}

type BreadcrumbResolverResult = {
  label: string;
  icon: string;
  skip?: boolean; // Se true, pula este segmento (ex: UUIDs)
} | null;

// Regex para detectar UUIDs
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Regex para detectar IDs numéricos
const NUMERIC_ID_REGEX = /^\d+$/;

// Limite de caracteres para truncar texto (responsivo)
const CHAR_LIMITS = {
  xs: {
    label: 17,
    title: 20,
  },
  sm: {
    label: 35,
    title: 40,
  },
  md: {
    label: 50,
    title: 60,
  },
};

/**
 * Trunca texto e retorna se foi truncado
 */
const truncateText = (
  text: string,
  maxLength: number
): { text: string; isTruncated: boolean } => {
  if (text.length <= maxLength) {
    return { text, isTruncated: false };
  }
  return { text: text.slice(0, maxLength) + '...', isTruncated: true };
};

/**
 * Middleware de Label Resolver
 * Centraliza toda a lógica de resolução de labels para breadcrumbs
 */
const resolveBreadcrumbLabel = (
  context: BreadcrumbResolverContext
): BreadcrumbResolverResult => {
  const { segment, previousSegment } = context;

  // ===== REGRA 1: UUIDs e IDs numéricos =====
  // Se for UUID ou ID numérico, pular (não mostrar no breadcrumb)
  if (UUID_REGEX.test(segment) || NUMERIC_ID_REGEX.test(segment)) {
    return { label: '', icon: '', skip: true };
  }

  // ===== REGRA 2: Rotas contextuais (baseadas no segmento anterior) =====
  const contextualRoutes: Record<
    string,
    Record<string, { label: string; icon: string }>
  > = {
    // Quando o segmento anterior for "retreats"
    retreats: {
      families: { label: 'Famílias', icon: 'mdi:account-group' },
      participants: { label: 'Participantes', icon: 'mdi:account-multiple' },
      contemplations: { label: 'Contemplações', icon: 'mdi:meditation' },
      tents: { label: 'Barracas', icon: 'mdi:tent' },
      'service-teams': {
        label: 'Equipes de Serviço',
        icon: 'mdi:account-hard-hat',
      },
      'service-team': {
        label: 'Equipe de Serviço',
        icon: 'mdi:account-hard-hat',
      },
      forms: { label: 'Formulários', icon: 'mdi:form-select' },
      ribbons: { label: 'Fitas', icon: 'mdi:ribbon' },
      botafora: { label: 'Bota-fora', icon: 'mdi:party-popper' },
      fiveminutescard: { label: 'Cartão de 5 Minutos', icon: 'mdi:card-text' },
      payment: { label: 'Pagamento', icon: 'mdi:credit-card' },
    },
    // Quando o segmento anterior for "users"
    users: {
      create: { label: 'Novo Usuário', icon: 'mdi:account-plus' },
      edit: { label: 'Editar Usuário', icon: 'mdi:account-edit' },
    },
    // Quando o segmento anterior for "reports"
    reports: {
      new: { label: 'Novo Relatório', icon: 'mdi:file-plus' },
      edit: { label: 'Editar Relatório', icon: 'mdi:file-edit' },
    },
  };

  const hierarchicalRoutes: Record<string, { label: string; icon: string }> = {
    'retreats/contemplations/contemplated': {
      label: 'Contemplados',
      icon: 'mdi:meditation',
    },
    'retreats/contemplations/no-contemplated': {
      label: 'Não Contemplados',
      icon: 'mdi:check-circle',
    },
    'retreats/contemplations/service-unassgined': {
      label: 'Sem Equipe de Serviço',
      icon: 'mdi:account-hard-hat',
    },
    'retreats/contemplations/service-confirmed': {
      label: 'Equipe de Serviço Confirmada',
      icon: 'mdi:account-check',
    },
  };

  // Verificar se existe uma rota contextual
  if (previousSegment && contextualRoutes[previousSegment]?.[segment]) {
    return contextualRoutes[previousSegment][segment];
  }

  // ===== REGRA 2.1: Rotas hierárquicas (multi-nível) =====
  const normalizedKey = context.pathSegments
    .slice(0, context.index + 1)
    .filter((seg) => !UUID_REGEX.test(seg) && !NUMERIC_ID_REGEX.test(seg))
    .join('/');

  if (normalizedKey && hierarchicalRoutes[normalizedKey]) {
    return hierarchicalRoutes[normalizedKey];
  }

  // ===== REGRA 3: Rotas específicas (independente do contexto) =====
  const specificRoutes: Record<string, { label: string; icon: string }> = {
    families: { label: 'Famílias', icon: 'mdi:account-group' },
    participants: { label: 'Participantes', icon: 'mdi:account-multiple' },
    contemplations: { label: 'Contemplações', icon: 'mdi:meditation' },
    tents: { label: 'Barracas', icon: 'mdi:tent' },
    'service-teams': {
      label: 'Equipes de Serviço',
      icon: 'mdi:account-hard-hat',
    },
    'service-team': {
      label: 'Equipe de Serviço',
      icon: 'mdi:account-hard-hat',
    },
    forms: { label: 'Formulários', icon: 'mdi:form-select' },
    ribbons: { label: 'Fitas', icon: 'mdi:ribbon' },
    botafora: { label: 'Bota-fora', icon: 'mdi:party-popper' },
    fiveminutescard: { label: 'Cartão de 5 Minutos', icon: 'mdi:card-text' },
    generic: { label: 'Genérico', icon: 'mdi:folder' },
    family: { label: 'Família', icon: 'mdi:account-group' },
    create: { label: 'Criar', icon: 'mdi:plus' },
    edit: { label: 'Editar', icon: 'mdi:pencil' },
    new: { label: 'Novo', icon: 'mdi:plus' },
  };

  if (specificRoutes[segment]) {
    return specificRoutes[segment];
  }

  // ===== REGRA 4: Fallback - retorna null para usar a lógica padrão =====
  return null;
};

// Configuração das rotas baseada no menuConfig e ROUTES
const getRouteConfig = (): Record<
  string,
  { label: string; icon: string; parent?: string }
> => {
  const config: Record<
    string,
    { label: string; icon: string; parent?: string }
  > = {};

  // Adicionar configurações do menu
  menuConfig.forEach((menu) => {
    config[menu.path] = {
      label: menu.label,
      icon: menu.icon,
    };
  });

  // Adicionar rotas específicas com variações de path
  const additionalRoutes = {
    '/': { label: 'Home', icon: 'lucide:home' },
    '/users': { label: 'Usuários', icon: 'solar:user-bold-duotone' },
    '/retreats': { label: 'Retiros', icon: 'material-symbols:temple-buddhist' },
    '/profile': { label: 'Perfil', icon: 'material-symbols:person' },
    '/settings': { label: 'Configurações', icon: 'material-symbols:settings' },
    '/my-retreats': {
      label: 'Meus Retiros',
      icon: 'material-symbols:temple-buddhist',
    },
    '/payment': { label: 'Pagamento', icon: 'lucide:credit-card' },
    '/reports': { label: 'Relatórios', icon: 'lucide:bar-chart' },
    '/help': { label: 'Ajuda', icon: 'lucide:help-circle' },
    '/config': { label: 'Configurações', icon: 'material-symbols:settings' },
  };

  Object.entries(additionalRoutes).forEach(([path, config_item]) => {
    config[path] = config_item;
  });

  return config;
};

const BreadcrumbIcon = ({
  icon,
  isLast,
  size = 1.4,
}: {
  icon?: string;
  isLast: boolean;
  size?: number;
}) => {
  // ✅ Ícone padrão para evitar mudanças bruscas
  const defaultIcon = 'lucide:folder';
  const iconToUse = icon || defaultIcon;

  return (
    <Iconify
      icon={iconToUse}
      size={size}
      sx={{
        color: isLast ? 'primary.main' : 'text.secondary',
        // ✅ Evitar layout shift durante carregamento
        display: 'block',
      }}
    />
  );
};

/**
 * Componente para renderizar label de breadcrumb com truncamento e tooltip
 */
const BreadcrumbLabel = ({
  label,
  breakpoint,
  asChip = false,
}: {
  label: string;
  isLast: boolean; // Mantido para API consistente
  breakpoint: 'xs' | 'sm' | 'md';
  asChip?: boolean;
}) => {
  const maxLength = CHAR_LIMITS[breakpoint].label;
  const { text, isTruncated } = truncateText(label, maxLength);

  const content = asChip ? (
    <Chip
      label={text}
      size="small"
      color="primary"
      variant="outlined"
      sx={{
        bgcolor: 'background.paper',
        fontWeight: 600,
        fontSize: 12,
        height: 24,
        maxWidth: breakpoint === 'xs' ? 120 : breakpoint === 'sm' ? 200 : 300,
        '& .MuiChip-label': {
          color: 'primary.main',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
    />
  ) : (
    <Typography
      component="span"
      noWrap
      sx={{
        color: 'text.secondary',
        fontSize: 14,
        fontWeight: 500,
        maxWidth: breakpoint === 'xs' ? 100 : breakpoint === 'sm' ? 180 : 250,
        display: 'block',
      }}
    >
      {text}
    </Typography>
  );

  if (isTruncated) {
    return (
      <Tooltip title={label} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Determinar breakpoint atual
  const currentBreakpoint: 'xs' | 'sm' | 'md' = isXs
    ? 'xs'
    : isSm
      ? 'sm'
      : 'md';

  const {
    title,
    //pathname: breadCrumbPathName,
    noBreadCrumbs,
  } = useBreadCrumbs();

  const routeConfig = useMemo(() => getRouteConfig(), []);

  // Gerar breadcrumbs baseado no pathname atual
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Construir breadcrumbs baseado nos segmentos do path
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const previousSegment = index > 0 ? pathSegments[index - 1] : null;
      const previousPath = index > 0 ? items[items.length - 1]?.path : null;

      // ===== MIDDLEWARE: Resolver personalizado =====
      const resolverContext: BreadcrumbResolverContext = {
        segment,
        currentPath,
        previousSegment,
        previousPath,
        pathSegments,
        index,
        isLast,
      };

      const resolved = resolveBreadcrumbLabel(resolverContext);

      // Se o resolver retornou skip: true, pular este segmento
      if (resolved?.skip) {
        return;
      }

      // Se o resolver retornou um resultado, usar
      if (resolved) {
        items.push({
          label: resolved.label,
          path: currentPath,
          icon: resolved.icon,
          isCurrentPage: isLast,
        });
        return;
      }

      // ===== FALLBACK: Lógica padrão =====
      const routeInfo = routeConfig[currentPath];

      if (routeInfo) {
        items.push({
          label: routeInfo.label,
          path: currentPath,
          icon: routeInfo.icon,
          isCurrentPage: isLast,
        });
      } else {
        // Fallback para rotas não configuradas
        items.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath,
          icon: 'lucide:folder',
          isCurrentPage: isLast,
        });
      }
    });

    return items;
  }, [pathname, routeConfig]);

  // Breadcrumbs a serem exibidos (em mobile, só os 2 últimos)
  const displayBreadcrumbs = useMemo(() => {
    if (isDesktop || breadcrumbs.length <= 2) {
      return breadcrumbs;
    }
    // Em mobile, mostrar apenas os 2 últimos
    return breadcrumbs.slice(-2);
  }, [breadcrumbs, isDesktop]);

  // Se não tem breadcrumbs, não mostrar nada
  if (breadcrumbs.length === 0) {
    return null;
  }

  // Verificar se há itens ocultos (para mostrar "...")
  const hasHiddenItems = !isDesktop && breadcrumbs.length > 2;

  // Preparar título com truncamento responsivo
  const rawTitle = title || breadcrumbs[breadcrumbs.length - 1].label;
  const titleMaxLength = CHAR_LIMITS[currentBreakpoint].title;
  const titleTruncated = truncateText(rawTitle, titleMaxLength);

  return (
    <Box display={'flex'} alignItems="center" gap={1}>
      {isDesktop && (
        <Iconify
          icon={breadcrumbs[breadcrumbs.length - 1].icon || 'lucide:folder'}
          size={6}
          sx={{ color: 'text.primary' }}
        />
      )}
      <Box>
        {titleTruncated.isTruncated ? (
          <Tooltip title={rawTitle} arrow>
            <Typography
              variant="h4"
              noWrap
              sx={{ maxWidth: { xs: 200, sm: 300 } }}
            >
              {titleTruncated.text}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="h4">{titleTruncated.text}</Typography>
        )}
        <MuiBreadcrumbs
          separator={
            <Iconify
              icon="lucide:chevron-right"
              size={1.2}
              sx={{ color: 'text.disabled' }}
            />
          }
          maxItems={isDesktop ? 4 : 3}
          sx={{
            '& .MuiBreadcrumbs-ol': {
              alignItems: 'center',
              flexWrap: 'nowrap',
            },
          }}
        >
          {/* Indicador de itens ocultos em mobile */}
          {hasHiddenItems && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.disabled',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              ...
            </Typography>
          )}
          {!noBreadCrumbs &&
            displayBreadcrumbs.map((item, index) => {
              const isLast = index === displayBreadcrumbs.length - 1;
              const labelText = isLast ? (title ?? item.label) : item.label;

              return (
                <Box
                  key={item.path}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 0, // Permite shrink
                  }}
                >
                  {/* Ícone */}
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BreadcrumbIcon
                      icon={item.icon}
                      isLast={isLast}
                      size={1.4}
                    />
                  </Box>

                  {/* Label com truncamento e tooltip */}
                  {isLast ? (
                    <BreadcrumbLabel
                      label={labelText}
                      isLast={isLast}
                      breakpoint={currentBreakpoint}
                      asChip
                    />
                  ) : (
                    <Link
                      component={NextLink}
                      href={item.path}
                      underline="hover"
                      color="inherit"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary',
                        fontSize: 14,
                        fontWeight: 500,
                        minWidth: 0,
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <BreadcrumbLabel
                        label={labelText}
                        isLast={isLast}
                        breakpoint={currentBreakpoint}
                      />
                    </Link>
                  )}
                </Box>
              );
            })}
        </MuiBreadcrumbs>
      </Box>
    </Box>
  );
};

export default Breadcrumbs;
