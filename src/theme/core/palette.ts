'use client';

import { alpha } from '@mui/material';

function createGradient(color1: string, color2: string) {
  return `linear-gradient(to bottom, ${color1}, ${color2})`;
}

export type ColorSchema =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

declare module '@mui/material/LinearProgress' {
  interface LinearProgressPropsColorOverrides {
    greenLemon: true;
    blue: true;
    purple: true;
    pink: true;
    salmon: true;
  }
}

// interface GradientsPaletteOptions {
//   primary: string;
//   info: string;
//   success: string;
//   warning: string;
//   error: string;
// }

// interface ChartPaletteOptions {
//   violet: string[];
//   blue: string[];
//   green: string[];
//   yellow: string[];
//   red: string[];
// }

// declare module "@mui/material/styles/createPalette" {
//   interface TypeBackground {
//     neutral: string;
//   }
//   interface SimplePaletteColorOptions {
//     lighter: string;
//     darker: string;
//   }
//   interface PaletteColor {
//     lighter: string;
//     darker: string;
//   }
//   interface Palette {
//     gradients: GradientsPaletteOptions;
//     chart: ChartPaletteOptions;
//   }
//   interface PaletteOptions {
//     gradients: GradientsPaletteOptions;
//     chart: ChartPaletteOptions;
//   }
// }

type ThemedPalette = typeof COMMON & {
  text: { primary: string; secondary: string; disabled: string };
  background: { paper: string; default: string; neutral: string };
  action: {
    active: string;
    hover: string;
    selected: string;
    disabled: string;
    disabledBackground: string;
    focus: string;
    hoverOpacity: number;
    disabledOpacity: number;
  };
};

type NestedKeys<T, K extends keyof T = keyof T> = K extends string
  ? `${K}.${Extract<keyof T[K], string>}`
  : never;

export type IconColorTheme = NestedKeys<ThemedPalette>;

declare module '@mui/material' {
  interface Color {
    0: string;
    500_8: string;
    500_12: string;
    500_16: string;
    500_24: string;
    500_32: string;
    500_48: string;
    500_56: string;
    500_80: string;
  }
}

// SETUP COLORS
const PRIMARY = {
  lighter: '#E2D1CA', // Very soft, creamy latte
  light: '#9A7163', // Muted medium brown
  main: '#693927', // Your original deep chocolate
  dark: '#4D2A1D', // Dark espresso
  darker: '#331C13', // Deepest wood/black-brown
};

const SECONDARY = {
  lighter: '#C8FACD',
  light: '#5BE584',
  main: '#00AB55',
  dark: '#007B55',
  darker: '#005249',
};

const INFO = {
  lighter: '#F0F6FC',
  light: '#58A6FF',
  main: '#1F6FEB',
  dark: '#1158C7',
  darker: '#0A3069',
};

const SUCCESS = {
  lighter: '#D6FBE9',
  light: '#33EB91',
  main: '#00E676', // Verde característico do GitHub
  dark: '#196127',
  darker: '#0F3E1E',
};

const WARNING = {
  lighter: '#FFF3BF',
  light: '#FFD33D',
  main: '#F2CC60', // Amarelo suave do GitHub
  dark: '#B08800',
  darker: '#735C00',
};

const ERROR = {
  lighter: '#FFDCE0',
  light: '#FF7B72',
  main: '#D73A49', // Vermelho característico do GitHub
  dark: '#B62324',
  darker: '#7D181F',
};

const GREENLEMON = {
  lighter: '#e6eaad',
  light: '#d1eaa1',
  main: '#a7ce55',
  dark: '#7f9d2b',
  darker: '#5f7420',
};
const BLUE = {
  lighter: '#e3f1ff',
  light: '#b3d4ff',
  main: '#0066cc',
  dark: '#004080',
  darker: '#002040',
};
const PURPLE = {
  lighter: '#e7e5ff',
  light: '#bcb8ff',
  main: '#716aca',
  dark: '#463fa1',
  darker: '#2c2677',
};
const PINK = {
  lighter: '#ffe3eb',
  light: '#ffa1b3',
  main: '#dc1db3',
  dark: '#a71b8c',
  darker: '#771156',
};
const SALMON = {
  lighter: '#FFC6B7',
  light: '#ff785b',
  main: '#ff5733',
  dark: '#b23c23',
  darker: '#8C1700',
};

export const GREY = {
  0: '#FFFFFF',
  100: '#F0F6FC',
  200: '#C9D1D9',
  300: '#B1BAC4',
  400: '#8B949E',
  500: '#6E7681',
  600: '#484F58',
  700: '#30363D',
  800: '#21262D',
  900: '#161B22',
  1000: '#0D1117',
  500_8: alpha('#6E7681', 0.08),
  500_12: alpha('#6E7681', 0.12),
  500_16: alpha('#6E7681', 0.16),
  500_24: alpha('#6E7681', 0.24),
  500_32: alpha('#6E7681', 0.32),
  500_48: alpha('#6E7681', 0.48),
  500_56: alpha('#6E7681', 0.56),
  500_80: alpha('#6E7681', 0.8),
};

const GRADIENTS = {
  primary: createGradient(PRIMARY.light, PRIMARY.main),
  info: createGradient(INFO.light, INFO.main),
  success: createGradient(SUCCESS.light, SUCCESS.main),
  warning: createGradient(WARNING.light, WARNING.main),
  error: createGradient(ERROR.light, ERROR.main),
};

const CHART_COLORS = {
  violet: ['#826AF9', '#9E86FF', '#D0AEFF', '#F7D2FF'],
  blue: ['#2D99FF', '#83CFFF', '#A5F3FF', '#CCFAFF'],
  green: ['#2CD9C5', '#60F1C8', '#A4F7CC', '#C0F2DC'],
  yellow: ['#FFE700', '#FFEF5A', '#FFF7AE', '#FFF3D6'],
  red: ['#FF6C40', '#FF8F6D', '#FFBD98', '#FFF2D4'],
};

export const COMMON = {
  common: { black: '#000', white: '#fff' },
  primary: { ...PRIMARY, contrastText: '#fff' },
  secondary: { ...SECONDARY, contrastText: '#fff' },
  info: { ...INFO, contrastText: '#fff' },
  success: { ...SUCCESS, contrastText: GREY[800] },
  warning: { ...WARNING, contrastText: GREY[800] },
  error: { ...ERROR, contrastText: '#fff' },
  greenLemon: { ...GREENLEMON, contrastText: '#fff' },
  blue: { ...BLUE, contrastText: '#fff' },
  purple: { ...PURPLE, contrastText: '#fff' },
  pink: { ...PINK, contrastText: '#fff' },
  salmon: { ...SALMON, contrastText: '#fff' },
  grey: GREY,
  gradients: GRADIENTS,
  chart: CHART_COLORS,
  divider: GREY[500_24],
  action: {
    hover: GREY[500_8],
    selected: '#DFE1EA',
    disabled: GREY[500_80],
    disabledBackground: GREY[500_24],
    focus: GREY[500_24],
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

const palette = {
  light: {
    ...COMMON,
    mode: 'light',
    text: { primary: GREY[900], secondary: GREY[700], disabled: GREY[500] },
    background: { paper: GREY[0], default: '#F0F6FC', neutral: GREY[100] },
    action: { active: GREY[600], ...COMMON.action },
  },
  dark: {
    ...COMMON,
    mode: 'dark',
    text: { primary: '#C9D1D9', secondary: GREY[500], disabled: GREY[600] },
    background: { paper: GREY[900], default: GREY[1000], neutral: GREY[700] },
    action: { active: GREY[500], ...COMMON.action },
  },
};

export const ColorSchemaValues = {
  primary: PRIMARY,
  secondary: SECONDARY,
  info: INFO,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
};

export const MeshupColorSchemaValues = {
  pink: PINK,
  error: ERROR,
  salmon: SALMON,
  warning: WARNING,
  primary: PRIMARY,
  info: INFO,
  blue: BLUE,
  purple: PURPLE,
};

export default palette;
