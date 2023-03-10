import * as IBMCOS from 'ibm-cos-sdk';

import { CODE, MESSAGE } from '../constants';

const bucketName = process.env.IBM_BACKET_NAME;
const defaultConfig = {
  apiKeyId: process.env.IBM_API_KEY,
  endpoint: process.env.IBM_ENDPOINT,
  serviceInstanceId: process.env.IBM_SERVICE_INSTANCE_ID,
};

// S3 configuration
const s3Config = async () => {
  try {
    return await new IBMCOS.S3(defaultConfig);
  } catch (err) {
    console.log(err);
  }
};

export class S3COS {
  s3: IBMCOS.S3;
  constructor() {
    s3Config()
      .then((data) => {
        this.s3 = data;
      })
      .catch((err) => console.log(err));
  }

  // Post file in bucket
  async createObjectInBucket(file) {
    const fileName = `${new Date().getTime()}_${file.originalname.replace(
      /[\s()]+/g,
      '_',
    )}`;

    try {
      const fileObject = {
        Bucket: bucketName,
        Key: fileName,
        Body: Buffer.from(file.buffer),
      };

      const res = await this.s3.putObject(fileObject).promise();
      if (!res) {
        throw {
          messsge: MESSAGE.uploadFailed,
          code: CODE.badRequest,
        };
      }

      const url = `https://${bucketName}.${defaultConfig.endpoint}/${fileName}`;
      return {
        url,
        key: fileName,
      };
    } catch (err) {
      console.log(err);
    }
  }

  // Delete items from bucket
  async deleteObject(key: string) {
    try {
      const deleteObjectP = {
        Bucket: bucketName,
        Key: key,
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
          Bucket: bucketName,
          Key: 'SampleVideo_720x480_10mb.mkv',
        })
        .promise();

      return data;
    } catch (err) {
      console.log(err);
    }
  }
}
