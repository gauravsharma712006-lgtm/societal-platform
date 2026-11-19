import { S3Client } from '@aws-sdk/client-s3';
import { createUploadUrl, getObjectMetadata, validateImageContent } from './media.service';

describe('Media storage safeguards', () => {
    afterEach(() => jest.restoreAllMocks());

    it('signs the declared upload size and content type without contacting S3', async () => {
        const signedUrl = await createUploadUrl('problems/test/photo.png', 'image/png', 1024);
        const signedHeaders = new URL(signedUrl).searchParams.get('X-Amz-SignedHeaders');

        expect(signedHeaders?.split(';')).toEqual(
            expect.arrayContaining(['content-length', 'content-type', 'host'])
        );
    });

    it('reads only the image signature range', async () => {
        const send = jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
            Body: { transformToByteArray: async () => new Uint8Array([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
            ]) },
        } as never);

        await expect(validateImageContent('problems/test/photo.png', 'image/png')).resolves.toBe(true);
        expect(send).toHaveBeenCalledWith(expect.objectContaining({
            input: expect.objectContaining({ Range: 'bytes=0-11' }),
        }));
    });

    it('rejects a mismatched image signature', async () => {
        jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({
            Body: { transformToByteArray: async () => new Uint8Array(12) },
        } as never);

        await expect(validateImageContent('problems/test/photo.png', 'image/png')).resolves.toBe(false);
    });

    it('distinguishes a missing object from an inaccessible storage service', async () => {
        const send = jest.spyOn(S3Client.prototype, 'send')
            .mockRejectedValueOnce({ name: 'NotFound' } as never)
            .mockRejectedValueOnce({ name: 'AccessDenied' } as never);

        await expect(getObjectMetadata('problems/test/missing.png')).resolves.toBeNull();
        await expect(getObjectMetadata('problems/test/private.png')).rejects.toThrow('MEDIA_STORAGE_UNAVAILABLE');
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('propagates image-read outages as retryable storage failures', async () => {
        jest.spyOn(S3Client.prototype, 'send').mockRejectedValue({ name: 'TimeoutError' } as never);

        await expect(validateImageContent('problems/test/photo.png', 'image/png'))
            .rejects.toThrow('MEDIA_STORAGE_UNAVAILABLE');
    });
});
