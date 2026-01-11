'use client';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Box,
  CSSObject,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Theme,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';

import Loading from '@/app/loading';
import { BreadCrumbsProvider } from '@/src/contexts/BreadCrumbsContext';
import { useDrawer } from '@/src/contexts/DrawerContext';
import { useMenuAccess } from '@/src/hooks/useMenuAccess';

import Iconify from '../../Iconify';
import TopBar from '../TopBar';
import ProtectedRoute from '../protected/ProtectedRoute';

const drawerWidth: number = 240; // Fixed drawer width

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  zIndex: theme.zIndex.drawer - 3,
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer - 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  boxShadow: 'none',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const ResponsiveDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  width: drawerWidth,
  backgroundColor: 'background.default',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiPaper-root': {
    backgroundColor: 'inherit',
  },
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}));

const SideMenuDrawer = ({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) => {
  const {
    mobileOpen,
    drawerWidth,
    // handleDrawerTransitionEnd,
    handleDrawerClose,
    // handleDrawerToggle,
    openPersistent,
    handleDrawerPersistentToggle,
  } = useDrawer();

  const { getAccessibleMenus, isLoading: isLoadingMenu } =
    useMenuAccess(session);

  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const showMenuLabels = openPersistent || (!isDesktop && mobileOpen);
  // const showMenuLabels = openPersistent;

  // ✅ Obter apenas os menus que o usuário tem acesso
  const accessibleMenus = getAccessibleMenus();
  const handleMenuClick = (path: string) => {
    router.push(path);
    // Close mobile drawer after navigation
    if (!isDesktop) handleDrawerClose();
  };

  const drawerContent = (
    <>
      <Divider />
      <List sx={{ flexGrow: 1, p: 1, pl: 0 }}>
        {accessibleMenus.map((menu) => (
          <ListItem key={menu.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={[
                showMenuLabels
                  ? { justifyContent: 'initial' }
                  : { justifyContent: 'center' },
              ]}
              component={Link}
              href={menu.path}
              onClick={() => handleMenuClick(menu.path)}
            >
              <ListItemIcon sx={[showMenuLabels ? { mr: 3 } : { mr: 'auto' }]}>
                <Iconify icon={menu.icon} />
              </ListItemIcon>
              <ListItemText
                primary={menu.label}
                sx={[
                  showMenuLabels
                    ? { opacity: 1, visibility: 'visible' }
                    : { opacity: 0, visibility: 'hidden' },
                ]}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {accessibleMenus.length === 0 && isLoadingMenu && <Loading />}

        {/* Mostrar se não tem acesso a nada */}
        {accessibleMenus.length === 0 && !isLoadingMenu && (
          <ListItem>
            <ListItemText
              primary="Nenhum menu disponível"
              secondary="Entre em contato com o administrador"
            />
          </ListItem>
        )}
      </List>
    </>
  );

  return (
    <Box id="side-menu-drawer" sx={{ display: 'flex', height: '100vh' }}>
      <BreadCrumbsProvider>
        <AppBar position="fixed" open={isDesktop && openPersistent}>
          <Box sx={{ backgroundColor: 'background.paper' }}>
            <TopBar />
          </Box>
        </AppBar>

        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop permanent drawer */}
        <ResponsiveDrawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, zIndex: 1000 }}
          open={openPersistent}
        >
          <DrawerHeader>
            <Iconify icon="lucide:mountain" size={1.8} color="primary.main" />
            <Typography
              variant="h6"
              component="div"
              sx={[
                openPersistent
                  ? { opacity: 1, visibility: 'visible' }
                  : { opacity: 0, visibility: 'hidden' },
              ]}
            >
              SAM Gestor
            </Typography>
            <IconButton
              onClick={handleDrawerPersistentToggle}
              sx={[
                openPersistent
                  ? { opacity: 1, visibility: 'visible' }
                  : { opacity: 0 },
              ]}
            >
              {theme.direction === 'rtl' ? (
                <Iconify icon="lucide:chevron-right" size={2} />
              ) : (
                <Iconify icon="lucide:chevron-left" size={2} />
              )}
            </IconButton>
          </DrawerHeader>
          {drawerContent}
        </ResponsiveDrawer>

        <Box
          sx={{
            backgroundColor: 'background.paper',
            height: '100%',
            width: {
              xs: '100%',
              sm: openPersistent
                ? `calc(100% - ${drawerWidth}px)`
                : `calc(100% - 65px)`,
            },
            // On desktop, account for drawer width; on mobile, full width
            // ml: {
            //   sm: openPersistent ? `${drawerWidth}px` : `calc(64px + 1px)`,
            //   xs: 0,
            // },
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: openPersistent
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
              }),
          }}
        >
          <DrawerHeader />
          <Box
            sx={{
              height: 'calc(100% - 72px)',
              backgroundColor: 'background.paper',
            }}
          >
            <Box
              sx={{
                p: 3,
                pt: 1,
                pb: 1,
                width: '100%',
                height: '100%',
                borderRadius: 0,
                backgroundColor: 'background.paper',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  overflowY: 'auto',
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <ProtectedRoute session={session}>{children}</ProtectedRoute>
              </Box>
            </Box>
          </Box>
        </Box>
      </BreadCrumbsProvider>
    </Box>
  );
};
export default SideMenuDrawer;
