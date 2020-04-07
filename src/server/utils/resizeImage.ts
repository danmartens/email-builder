import sharp from 'sharp';
import { Dimensions } from '../types';

export default function resizeImage(
  inputPath: string,
  [width, height]: Dimensions
) {
  return sharp(inputPath)
    .resize({ width, height })
    .toBuffer();
}
