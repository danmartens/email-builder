import path from 'path';

class Configuration {
  get projectPath(): string {
    return process.cwd();
  }

  get emailsPath() {
    return path.join(this.projectPath, 'emails');
  }

  get host(): string {
    return process.env.HOST ?? 'localhost';
  }

  get port(): string {
    return process.env.PORT ?? '5000';
  }

  get assetsPort(): string {
    return process.env.ASSETS_PORT ?? '8080';
  }

  get awsRegion(): string | undefined {
    return process.env.AWS_REGION;
  }

  get s3BucketName(): string | undefined {
    return process.env.S3_BUCKET_NAME;
  }
}

export default Configuration;
