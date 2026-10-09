import {
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../config/env';

const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
});

export const createUploadUrl = async (
    key: string,
    contentType: string
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: 300,
        }
    );

    return uploadUrl;
};


export const createDownloadUrl = async (
    key: string
): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
    });

    const downloadUrl = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: 300,
        }
    );

    return downloadUrl;
};

export const verifyObjectExists = async (
    key: string
): Promise<boolean> => {
    try {
        const command = new HeadObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);

        return true;
    } catch (error) {
        
        console.error('S3 object verification failed:', error);

        return false;

    }
};