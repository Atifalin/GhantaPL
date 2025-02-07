const tintColorLight = '#007AFF';
const tintColorDark = '#0A84FF';

type ColorScheme = {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  card: string;
};

type Colors = {
  light: ColorScheme;
  dark: ColorScheme;
};

export const Colors: Colors = {
  light: {
    text: '#000000',
    background: '#F2F2F7',
    tint: tintColorLight,
    tabIconDefault: '#C4C4C4',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    tabIconDefault: '#C4C4C4',
    tabIconSelected: tintColorDark,
    card: '#1C1C1E',
  },
};
