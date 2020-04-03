import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export default function putObject(
  bucketName: string,
  objectKey: string,
  fileBuffer: Buffer
) {
  return new Promise((resolve, reject) => {
    s3.putObject(
      {
        Bucket: bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ACL: 'public-read'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
}
