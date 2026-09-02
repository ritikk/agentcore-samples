import { S3Client, PutObjectCommand, PutObjectCommandInput, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

export class S3Service {
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    if (!BUCKET_NAME) {
      throw new AppError('S3 bucket not configured', 500);
    }

    try {
      const params: PutObjectCommandInput = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
      };

      await s3Client.send(new PutObjectCommand(params));

      logger.info(`File uploaded to S3: ${key}`);

      return key;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new AppError('Failed to upload file', 500);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!BUCKET_NAME) {
      throw new AppError('S3 bucket not configured', 500);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw new AppError('Failed to generate signed URL', 500);
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!BUCKET_NAME) {
      throw new AppError('S3 bucket not configured', 500);
    }

    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new AppError('Failed to delete file', 500);
    }
  }
}
