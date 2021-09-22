export interface ScreenSize {
  label: string;
  width: number | null;
  height: number | null;
  cornerRadius?: number;
  bezelWidth?: number;
  headerHeight?: number;
  footerHeight?: number;
  stripMediaQueries?: boolean;
}

export const SCREEN_SIZES: ScreenSize[] = [
  { label: 'Responsive', width: null, height: null },
  {
    label: 'iPad Pro',
    width: 1024,
    height: 800,
    cornerRadius: 24,
    bezelWidth: 10
  },
  {
    label: 'Pixel 2',
    width: 411,
    height: 731,
    cornerRadius: 8,
    bezelWidth: 10
  },
  {
    label: 'iPhone X',
    width: 375,
    height: 748,
    cornerRadius: 16,
    bezelWidth: 10,
    headerHeight: 64
  },
  {
    label: 'Responsive (Legacy)',
    width: null,
    height: null,
    stripMediaQueries: true
  },
  {
    label: 'Mobile (Legacy)',
    width: 411,
    height: 731,
    cornerRadius: 8,
    bezelWidth: 10,
    stripMediaQueries: true
  }
];
