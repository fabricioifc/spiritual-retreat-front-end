'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UserObject } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Box, ButtonBase, Grid, Skeleton, Typography } from '@mui/material';

import { useModal } from '@/src/hooks/useModal';
import apiClient from '@/src/lib/axiosClientInstance';

import ProfilePictureModal from './ProfilePictureModal';

type ProfileDataShape = Pick<UserObject, 'name' | 'email'> & { phone: string };
type MeProfileResponse = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  emailConfirmed: boolean;
  enabled: boolean;
  isLocked: boolean;
  lockoutEndAt: string | null;
  lastLoginAt: string | null;
  photoUrl?: string | null;
};

const FALLBACK_PROFILE_IMAGE =
  'https://fastly.picsum.photos/id/503/200/200.jpg?hmac=genECHjox9165KfYsOiMMCmN-zGqh9u-lnhqcFinsrU';

const mapUserToFormData = (
  user:
    | (UserObject & { phone?: string; number?: string })
    | MeProfileResponse
    | null
    | undefined
): ProfileDataShape => {
  const candidate = user as
    | { phone?: string; number?: string }
    | null
    | undefined;
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: candidate?.phone ?? candidate?.number ?? '',
  };
};

const ProfilePage = () => {
  //const router = useRouter();
  const t = useTranslations();
  const modal = useModal();
  const { data: session, status, update } = useSession();
  const user = session?.user ?? null;
  const userId = session?.user?.id;

  const initialFormValues = useMemo(() => mapUserToFormData(user), [user]);
  const [profileData, setProfileData] =
    useState<ProfileDataShape>(initialFormValues);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    user?.profile_picture ?? null
  );
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // useEffect(() => {
  //   if (status === 'unauthenticated') {
  //     router.replace('/auth/login');
  //   }
  // }, [status, router]);

  useEffect(() => {
    setProfileData(initialFormValues);
  }, [initialFormValues]);

  useEffect(() => {
    setProfileImageUrl(user?.profile_picture ?? null);
  }, [user?.profile_picture]);

  useEffect(() => {
    let isMounted = true;

    const fetchMeProfile = async () => {
      if (!userId) return;
      setIsProfileLoading(true);
      try {
        const { data } = await apiClient.get<MeProfileResponse>('/users/me');
        if (!isMounted || !data) return;
        setProfileData(mapUserToFormData(data));
        setProfileImageUrl(data.photoUrl ?? null);
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário logado:', error);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    };

    void fetchMeProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleProfilePictureUpdated = useCallback(
    async (nextUrl: string | null) => {
      setProfileImageUrl(nextUrl);
      try {
        await update?.();
      } catch (error) {
        console.error('Erro ao atualizar a sessão após trocar a foto:', error);
      }
    },
    [update]
  );

  const handleOpenProfilePictureModal = useCallback(() => {
    if (!user) return;

    modal.open({
      key: 'profile-picture',
      title: 'Atualizar foto de perfil',
      size: 'sm',
      customRender: () => (
        <ProfilePictureModal
          userId={user.id}
          userName={user.name}
          currentImage={profileImageUrl}
          useMeRoutes
          onClose={modal.close}
          onUploadSuccess={handleProfilePictureUpdated}
        />
      ),
    });
  }, [modal, profileImageUrl, handleProfilePictureUpdated, user]);

  if (status === 'loading' || isProfileLoading) {
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Skeleton variant="rounded" width={160} height={160} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="text" height={56} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="text" height={56} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Não foi possível carregar os dados do usuário.
        </Typography>
      </Box>
    );
  }

  const displayedProfileImage = profileImageUrl || FALLBACK_PROFILE_IMAGE;
  return (
    <Box component="section" sx={{ px: 3, py: 4 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 4 }}>
        Informações pessoais
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
        <ButtonBase
          onClick={handleOpenProfilePictureModal}
          sx={{
            borderRadius: '50%',
            overflow: 'hidden',
            width: 160,
            height: 160,
            position: 'relative',
            '&:hover .profile-edit-overlay': { opacity: 1 },
          }}
        >
          <Image
            src={displayedProfileImage}
            alt={user.name ?? 'Foto de perfil'}
            width={160}
            height={160}
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
          <Box
            className="profile-edit-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
              color: 'common.white',
              pointerEvents: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditRoundedIcon fontSize="small" />
              <Typography variant="body2">
                {t('profile.picture.change')}
              </Typography>
            </Box>
          </Box>
        </ButtonBase>
        <Typography variant="caption" color="text.secondary">
          {t('profile.picture.description')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('profile.name')}
          </Typography>
          <Typography variant="body1">
            {profileData.name || t('not-informed')}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('profile.email')}
          </Typography>
          <Typography variant="body1">
            {profileData.email || t('not-informed')}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('profile.phone')}
          </Typography>
          <Typography variant="body1">
            {profileData.phone || t('not-informed')}
          </Typography>
        </Grid>
      </Grid>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        Se você precisar alterar seus dados cadastrais, entre em contato com o
        administrador ou gestor responsável.
      </Typography>
    </Box>
  );
};

export default ProfilePage;
