export interface ScreenSize {
  label: string;
  width: number | null;
  height: number | null;
  radius: number;
  bezel: number;
}

export const SCREEN_SIZES: ScreenSize[] = [
  { label: 'Responsive', width: null, height: null, radius: 0, bezel: 0 },
  { label: 'iPad Pro', width: 1024, height: 800, radius: 24, bezel: 10 },
  { label: 'Pixel 2', width: 411, height: 731, radius: 8, bezel: 10 },
  { label: 'iPhone X', width: 375, height: 748, radius: 16, bezel: 10 }
];
