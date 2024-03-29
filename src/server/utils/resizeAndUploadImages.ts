import path from 'path';
import crypto from 'crypto';
import resizeImage from './resizeImage';
import putObject from './putObject';
import Configuration from '../../Configuration';
import { Dimensions } from '../types';

const resizeAndUploadImages = (
  imageFile: { originalname: string; path: string },
  imageDimensions: Dimensions[]
) =>
  Promise.all(
    imageDimensions.map((dimensions) =>
      resizeAndUploadImage(imageFile, dimensions)
    )
  );

const resizeAndUploadImage = async (
  imageFile: { originalname: string; path: string },
  dimensions: Dimensions
) => {
  const { s3BucketName, s3Subdomain } = new Configuration();

  if (s3BucketName == null) {
    throw new Error('Missing configuration "S3_BUCKET_NAME"');
  }

  const { name, ext } = path.parse(imageFile.originalname);

  const resizedImage = await resizeImage(imageFile.path, dimensions);

  const fingerprint = crypto
    .createHash('md5')
    .update(resizedImage.toString(), 'utf8')
    .digest('hex');

  const objectKey = [
    name.replace(/[^a-z0-9]+/gi, '-'),
    dimensionsString(dimensions),
    `${fingerprint}${ext}`
  ]
    .filter((part) => part != null)
    .join('-');

  return putObject(s3BucketName, objectKey, resizedImage as Buffer).then(
    (result) => {
      console.log(`Image uploaded: ${objectKey}`);

      return {
        objectKey,
        objectUrl: `https://${s3Subdomain}.amazonaws.com/${s3BucketName}/${objectKey}`,
        result
      };
    }
  );
};

const dimensionsString = (dimensions: Dimensions): string | undefined => {
  const { width, height } = dimensions;

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
