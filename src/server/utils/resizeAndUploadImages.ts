import path from 'path';
import resizeImage from './resizeImage';
import getFingerprint from './getFingerprint';
import putObject from './putObject';
import Configuration from '../../Configuration';
import { Dimensions } from '../types';

const resizeAndUploadImages = async (
  imageFile: { originalname: string; path: string },
  dimensions: Dimensions
) => {
  const { s3BucketName } = new Configuration();

  const { name, ext } = path.parse(imageFile.originalname);

  const retinaDimensions: Dimensions = [
    dimensions[0] != null ? dimensions[0] * 1.5 : undefined,
    dimensions[1] != null ? dimensions[1] * 1.5 : undefined
  ];

  const [imageBuffer, retinaImageBuffer, fingerprint] = await Promise.all([
    resizeImage(imageFile.path, dimensions),
    resizeImage(imageFile.path, retinaDimensions),
    getFingerprint(imageFile.path)
  ]);

  const imageKey = `${name}-${dimensionsString(
    dimensions
  )}-${fingerprint}${ext}`;

  const retinaImageKey = `${name}-${dimensionsString(
    retinaDimensions
  )}-${fingerprint}${ext}`;

  await Promise.all([
    putObject(s3BucketName, imageKey, imageBuffer as Buffer),
    putObject(s3BucketName, retinaImageKey, retinaImageBuffer as Buffer)
  ]);

  return [imageKey, retinaImageKey];
};

const dimensionsString = (dimensions: Dimensions): string => {
  const [width, height] = dimensions;

  if (width != null && height != null) {
    return `${width}w${height}h`;
  }

  if (width != null) {
    return `${width}w`;
  }

  if (height != null) {
    return `${height}h`;
  }
};

export default resizeAndUploadImages;
