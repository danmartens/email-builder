import fs from 'node:fs';
import crypto from 'node:crypto';

export function getFingerprint(inputPath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputPath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          crypto
            .createHash('md5')
            .update(data.toString(), 'utf8')
            .digest('hex'),
        );
      }
    });
  });
}
