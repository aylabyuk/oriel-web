export const GROUND_SIZE = 40;
export const ROTATION_SPEED = 0.005;

export const THEME_3D = {
  dark: {
    ground: '#111111',
    fog: '#000000',
    fogNear: 4,
    fogFar: 18,
    ambient: 1.2,
    topLight: 0.6,
    sideLight: 0.3,
  },
  light: {
    ground: '#d4cfc7',
    fog: '#e8e4df',
    fogNear: 6,
    fogFar: 22,
    ambient: 1.8,
    topLight: 0.8,
    sideLight: 0.5,
  },
} as const;
