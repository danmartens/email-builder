import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export function putObject(
  bucketName: string,
  objectKey: string,
  fileBuffer: Buffer,
): Promise<PutObjectCommandOutput> {
  return s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileBuffer,
      ACL: 'public-read',
    }),
  );
}
