import { s3Bucket as AWSCloud } from './aws_cloud';

const s3 = new AWSCloud();

const getObject = async () => {
  const data = await s3.itemObject();
  console.log('data', data);
};

getObject();
