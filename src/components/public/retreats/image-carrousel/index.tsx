'use client';

import React, { useCallback, useState } from 'react';

import Image from 'next/image';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import { FreeMode, Keyboard, Navigation, Thumbs, Zoom } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import {
  Box,
  ButtonBase,
  Dialog,
  Fade,
  IconButton,
  Stack,
  Tooltip,
  alpha,
} from '@mui/material';

interface ImageCarrouselProps {
  images: string[];
  initialIndex?: number;
  aspectRatio?: number; // width / height
  rounded?: number;
  thumbWidth?: number;
  thumbHeight?: number;
}

export const ImageCarrousel: React.FC<ImageCarrouselProps> = ({
  images,
  initialIndex = 0,
  aspectRatio = 16 / 6,
  rounded = 4,
  thumbWidth = 76, // <== tamanho pequeno
  thumbHeight = 56, // <== altura pequena
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [openViewer, setOpenViewer] = useState(false);

  const openFullscreen = useCallback((idx: number) => {
    setActiveIndex(idx);
    setOpenViewer(true);
  }, []);

  if (!images?.length) return null;

  const closeFullscreen = () => setOpenViewer(false);

  return (
    <>
      <Stack spacing={1.5}>
        {/* Swiper principal */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: rounded,
            overflow: 'hidden',
            aspectRatio: `${aspectRatio}`,
            bgcolor: 'background.default',
            '& .swiper': { height: '100%' },
            '& .swiper-slide': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              cursor: 'pointer',
            },
          }}
        >
          <Swiper
            modules={[Navigation, Thumbs, Keyboard]}
            onSlideChange={(s) => setActiveIndex(s.activeIndex)}
            initialSlide={initialIndex}
            spaceBetween={8}
            navigation={{
              prevEl: '.main-prev-btn',
              nextEl: '.main-next-btn',
            }}
            keyboard
            thumbs={{
              swiper:
                thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            }}
          >
            {images.map((src, i) => (
              <SwiperSlide key={src + i} onClick={() => openFullscreen(i)}>
                <Fade in appear timeout={220}>
                  <Box
                    component="img"
                    src={src}
                    alt={`Imagem ${i + 1}`}
                    draggable={false}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </Fade>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Botões navegação overlay */}
          <NavOverlayButton className="main-prev-btn" side="left" />
          <NavOverlayButton className="main-next-btn" side="right" />

          {/* Botão fullscreen */}
          <Tooltip title="Tela cheia">
            <IconButton
              size="small"
              onClick={() => openFullscreen(activeIndex)}
              sx={(theme) => {
                // Usando color-mix para gerar camadas sem alpha()
                const layer = (opacity: number) => {
                  const pct = Math.round(opacity * 100);
                  if (theme.vars) {
                    return `color-mix(in srgb, ${theme.vars.palette.background.paper} ${pct}%, transparent)`;
                  }
                  return alpha(theme.palette.background.paper, opacity);
                };
                return {
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: layer(0.55),
                  backdropFilter: 'blur(6px)',
                  '&:hover': {
                    bgcolor: layer(0.85),
                  },
                };
              }}
            >
              <FullscreenRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Thumbnails */}
        <Box
          sx={(theme) => {
            const leftGrad = `linear-gradient(90deg, 
    var(--mui-palette-background-default) 0%, 
    color-mix(in srgb, var(--mui-palette-background-default) 85%, transparent) 35%, 
    transparent 100%
  )`;

            const rightGrad = `linear-gradient(270deg, 
    var(--mui-palette-background-default) 0%, 
    color-mix(in srgb, var(--mui-palette-background-default) 85%, transparent) 35%, 
    transparent 100%
  )`;

            return {
              position: 'relative',
              height: thumbHeight + 24,
              '& .thumbs-swiper': { height: thumbHeight + 24 },
              '& .thumbs-swiper .swiper-wrapper': { alignItems: 'center' },
              '& .thumbs-swiper .swiper-slide': {
                opacity: 0.55,
                borderRadius: 6,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid transparent',
                boxSizing: 'border-box',
                transition: 'opacity .18s, transform .18s, border-color .18s',
                '&.swiper-slide-thumb-active': {
                  opacity: 1,
                  transform: 'translateY(-3px)',
                  borderColor: theme.vars?.palette.primary.main,
                },
              },
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 48,
                pointerEvents: 'none',
                zIndex: 2,
              },
              '&::before': {
                left: 0,
                background: leftGrad,
              },
              '&::after': {
                right: 0,
                background: rightGrad,
              },
            };
          }}
        >
          <Swiper
            className="thumbs-swiper"
            modules={[FreeMode, Thumbs]}
            onSwiper={setThumbsSwiper}
            watchSlidesProgress
            freeMode
            slidesPerView="auto"
            spaceBetween={8}
          >
            {images.map((src, i) => (
              <SwiperSlide
                key={'thumb-' + src + i}
                style={{
                  width: thumbWidth,
                  height: thumbHeight,
                  flex: '0 0 auto',
                }}
              >
                <ButtonBase
                  sx={{
                    width: '100%',
                    height: '100%',
                    p: 0,
                    borderRadius: 'inherit',
                    overflow: 'hidden',
                  }}
                  onClick={() => setActiveIndex(i)}
                >
                  <Box
                    component="img"
                    src={src}
                    alt={`Thumb ${i + 1}`}
                    draggable={false}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: i === activeIndex ? 'none' : 'brightness(.82)',
                      transition: 'filter .15s',
                      '&:hover': { filter: 'brightness(.95)' },
                    }}
                  />
                </ButtonBase>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Stack>

      {/* Fullscreen Viewer */}
      <Dialog
        open={openViewer}
        onClose={closeFullscreen}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'black',
            p: 0,
          },
        }}
      >
        <IconButton
          onClick={closeFullscreen}
          sx={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 10,
            bgcolor: alpha('#000', 0.4),
            '&:hover': { bgcolor: alpha('#000', 0.6) },
            color: 'white',
          }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            '& .swiper': { width: '100%', height: '100%' },
            '& .swiper-slide': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              userSelect: 'none',
            },
          }}
        >
          <Swiper
            modules={[Navigation, Zoom, Keyboard]}
            navigation={{
              prevEl: '.viewer-prev-btn',
              nextEl: '.viewer.next-btn',
            }}
            zoom
            keyboard
            initialSlide={activeIndex}
            onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          >
            {images.map((src, i) => (
              <SwiperSlide key={'full-' + src + i}>
                <div className="swiper-zoom-container">
                  <Image
                    src={src}
                    alt={`Imagem fullscreen ${i + 1}`}
                    width={1920}
                    height={1080}
                    unoptimized
                    draggable={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navegação fullscreen */}
          <NavOverlayButton
            className="viewer-prev-btn"
            side="left"
            size="large"
            light
          />
          <NavOverlayButton
            className="viewer-next-btn"
            side="right"
            size="large"
            light
          />
        </Box>
      </Dialog>
    </>
  );
};

/* Botão overlay reutilizável */
const NavOverlayButton: React.FC<{
  className?: string;
  side: 'left' | 'right';
  size?: 'small' | 'large';
  light?: boolean;
}> = ({ className, side, size = 'small', light }) => {
  const iconSize = size === 'large' ? 40 : 32;
  const Icon =
    side === 'left' ? ChevronLeftRoundedIcon : ChevronRightRoundedIcon;

  return (
    <IconButton
      className={className}
      sx={(theme) => {
        const layer = (opacity: number) => {
          const pct = Math.round(opacity * 100);
          if (theme.vars) {
            if (light) {
              return `color-mix(in srgb, ${theme.vars.palette.common.white} ${pct}%, transparent)`;
            }
            return `color-mix(in srgb, ${theme.vars.palette.background.paper} ${pct}%, transparent)`;
          }
          return alpha(
            light ? theme.palette.common.white : theme.palette.background.paper,
            opacity
          );
        };
        return {
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [side]: 8,
          zIndex: 5,
          width: iconSize,
          height: iconSize,
          bgcolor: layer(light ? 0.18 : 0.55),
          backdropFilter: 'blur(6px)',
          border: '1px solid',
          borderColor: theme.vars
            ? `color-mix(in srgb, ${theme.vars.palette.common.black} 25%, transparent)`
            : alpha(theme.palette.common.black, 0.25),
          color: light ? 'white' : 'inherit',
          '&:hover': {
            bgcolor: layer(light ? 0.3 : 0.85),
          },
        };
      }}
    >
      <Icon />
    </IconButton>
  );
};
