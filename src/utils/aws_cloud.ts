import { S3 } from 'aws-sdk';

import { CODE, MESSAGE } from '../constants';

const bucketName = process.env.AWS_BUCKET_NAME;

export class s3Bucket {
  s3: S3;
  constructor() {
    this.s3 = new S3();
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
        Bucket: bucketName,
        Body: Buffer.from(file.buffer),
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
        Bucket: bucketName,
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
    console.log('bucketName', bucketName);

    try {
      const data = await this.s3
        .getObject({
          Bucket: bucketName,
          Key: 'default-profile.png',
        })
        .promise();

      return data;
    } catch (err) {
      console.log(err);
    }
  }
}
