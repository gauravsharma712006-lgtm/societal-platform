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
    ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && { credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        ...(env.AWS_SESSION_TOKEN && { sessionToken: env.AWS_SESSION_TOKEN }),
    } }),
});

export const createUploadUrl = async (
    key: string,
    contentType: string,
    size?: number
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
    });

    try {
    const uploadUrl = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: 300,
            signableHeaders: new Set(['content-type', 'content-length']),
        }
    );

    return uploadUrl;
    } catch {
        throw new Error('MEDIA_STORAGE_UNAVAILABLE');
    }
};


export const createDownloadUrl = async (
    key: string
): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
        ResponseCacheControl: 'private, no-store',
    });

    try {
    const downloadUrl = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: 300,
        }
    );

    return downloadUrl;
    } catch {
        throw new Error('MEDIA_STORAGE_UNAVAILABLE');
    }
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
        
        if (typeof error === 'object' && error !== null && 'name' in error &&
            (error.name === 'NoSuchKey' || error.name === 'NotFound')) return false;
        throw new Error('MEDIA_STORAGE_UNAVAILABLE');

    }
};

export const getObjectMetadata = async (
    key: string
): Promise<{ contentType?: string; size?: number } | null> => {
    try {
        const result = await s3Client.send(
            new HeadObjectCommand({
                Bucket: env.AWS_S3_BUCKET_NAME,
                Key: key,
            })
        );

        return {
            contentType: result.ContentType,
            size: result.ContentLength,
        };
    } catch (error) {
        if (
            typeof error === 'object' && error !== null &&
            ('name' in error && (error.name === 'NotFound' || error.name === 'NoSuchKey'))
        ) {
            return null;
        }

        throw new Error('MEDIA_STORAGE_UNAVAILABLE');
    }
};


export const validateImageContent = async (
    key: string,
    expectedContentType: string
): Promise<boolean> => {
    try {
        const result = await s3Client.send(
            new GetObjectCommand({
                Bucket: env.AWS_S3_BUCKET_NAME,
                Key: key,
                Range: 'bytes=0-11',
            })
        );

        if (!result.Body) {
            return false;
        }

        const bytes = await result.Body.transformToByteArray();

        if (bytes.length < 12) {
            return false;
        }

        const isJpeg =
            bytes[0] === 0xff &&
            bytes[1] === 0xd8 &&
            bytes[2] === 0xff;

        const isPng =
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0d &&
            bytes[5] === 0x0a &&
            bytes[6] === 0x1a &&
            bytes[7] === 0x0a;

        const isWebp =
            bytes[0] === 0x52 &&
            bytes[1] === 0x49 &&
            bytes[2] === 0x46 &&
            bytes[3] === 0x46 &&
            bytes[8] === 0x57 &&
            bytes[9] === 0x45 &&
            bytes[10] === 0x42 &&
            bytes[11] === 0x50;

        switch (expectedContentType) {
            case 'image/jpeg':
                return isJpeg;
            case 'image/png':
                return isPng;
            case 'image/webp':
                return isWebp;
            default:
                return false;
        }
    } catch (error) {
        if (
            typeof error === 'object' && error !== null &&
            'name' in error &&
            (error.name === 'NoSuchKey' || error.name === 'NotFound' || error.name === 'InvalidRange')
        ) {
            return false;
        }

        throw new Error('MEDIA_STORAGE_UNAVAILABLE');
    }
};
