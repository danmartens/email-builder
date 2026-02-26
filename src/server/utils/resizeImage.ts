import sharp from 'sharp';
import { Dimensions } from '../types';

export function resizeImage(inputPath: string, dimensions: Dimensions) {
  return sharp(inputPath).resize(dimensions).toBuffer();
}
