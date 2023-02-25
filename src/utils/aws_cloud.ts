import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

import { CODE, MESSAGE } from '../constants';

export class s3Bucket {
  s3: S3;
  config: ConfigService;

  constructor() {
    this.s3 = new S3();
    this.config = new ConfigService();
  }

  // Post file in bucket
  async createObjectInBucket(file: any) {
    const fileName = `${new Date().getTime()}_${file.originalname.replace(
      /[\s()]+/g,
      '_',
    )}`;

    try {
      const fileObject = {
        Key: fileName,
        Body: Buffer.from(file.buffer),
        Bucket: this.config.get('AWS_BUCKET_NAME'),
      };

      const res = await this.s3.upload(fileObject).promise();
      if (!res) {
        throw {
          code: CODE.badRequest,
          messsge: MESSAGE.uploadFailed,
        };
      }

      return {
        key: res.Key,
        url: res.Location,
      };
    } catch (err) {
      console.log(err);
    }
  }

  // Delete items from bucket
  async deleteObject(key: string) {
    try {
      const deleteObjectP = {
        Key: key,
        Bucket: this.config.get('AWS_BUCKET_NAME'),
      };

      return await this.s3.deleteObject(deleteObjectP).promise();
    } catch (err) {
      console.log(err);
    }
  }

  // Get all buckets lists
  async listAllBuckets() {
    try {
      const data = await this.s3.listBuckets().promise();

      return data.Buckets;
    } catch (err) {
      console.log(err);
    }
  }

  // Get perticular file from bucket
  async itemObject() {
    try {
      const data = await this.s3
        .getObject({
          Key: 'default-profile.png',
          Bucket: this.config.get('AWS_BUCKET_NAME'),
        })
        .promise();

      return data;
    } catch (err) {
      console.log(err);
    }
  }
}
