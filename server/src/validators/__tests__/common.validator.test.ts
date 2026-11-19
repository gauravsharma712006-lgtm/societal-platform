import { mongoObjectIdSchema } from '../common.validator';

describe('mongoObjectIdSchema', () => {
    it('accepts a valid MongoDB ObjectId', () => {
        expect(
            mongoObjectIdSchema.safeParse(
                '507f1f77bcf86cd799439011'
            ).success
        ).toBe(true);
    });

    it('rejects an invalid ObjectId', () => {
        expect(
            mongoObjectIdSchema.safeParse('not-an-object-id')
                .success
        ).toBe(false);
    });

    it('rejects an ObjectId with the wrong length', () => {
        expect(
            mongoObjectIdSchema.safeParse('507f1f77bcf86cd79943901')
                .success
        ).toBe(false);
    });

    it('accepts uppercase hexadecimal characters', () => {
        expect(
            mongoObjectIdSchema.safeParse(
                '507F1F77BCF86CD799439011'
            ).success
        ).toBe(true);
    });
});