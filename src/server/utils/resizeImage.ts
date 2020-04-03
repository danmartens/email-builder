import sharp from 'sharp';

export default function resizeImage(
  inputPath: string,
  dimensions: [number, number]
) {
  return sharp(inputPath)
    .resize({ width: dimensions[0] })
    .toBuffer();
}
