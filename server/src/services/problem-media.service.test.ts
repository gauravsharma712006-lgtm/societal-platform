import { Problem } from '../models/problem.model';
import { addProblemMedia } from './problem.service';

describe('Problem media attachment retries', () => {
    const problemId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439012';
    const media = {
        key: `problems/${problemId}/photo.png`,
        originalName: 'photo.png',
        contentType: 'image/png',
        size: 1024,
    };

    afterEach(() => jest.restoreAllMocks());

    it('attaches an image only when its key is not already stored', async () => {
        const problem = { _id: problemId, media: [media] };
        const update = jest.spyOn(Problem, 'findOneAndUpdate').mockResolvedValue(problem as never);
        const lookup = jest.spyOn(Problem, 'findOne');

        await expect(addProblemMedia(problemId, userId, media)).resolves.toEqual(problem);
        expect(update).toHaveBeenCalledWith(
            { _id: problemId, reportedBy: userId, 'media.key': { $ne: media.key } },
            { $push: { media } },
            { new: true, runValidators: true }
        );
        expect(lookup).not.toHaveBeenCalled();
    });

    it('returns the existing attachment on a retry after a lost response', async () => {
        const problem = { _id: problemId, media: [media] };
        jest.spyOn(Problem, 'findOneAndUpdate').mockResolvedValue(null);
        const lookup = jest.spyOn(Problem, 'findOne').mockResolvedValue(problem as never);

        await expect(addProblemMedia(problemId, userId, media)).resolves.toEqual(problem);
        expect(lookup).toHaveBeenCalledWith({
            _id: problemId, reportedBy: userId, 'media.key': media.key,
        });
        expect(problem.media).toHaveLength(1);
    });

    it('keeps ownership enforced when looking up an existing key', async () => {
        jest.spyOn(Problem, 'findOneAndUpdate').mockResolvedValue(null);
        const lookup = jest.spyOn(Problem, 'findOne').mockResolvedValue(null);

        await expect(addProblemMedia(problemId, userId, media)).rejects.toThrow('PROBLEM_NOT_FOUND');
        expect(lookup).toHaveBeenCalledWith(expect.objectContaining({ reportedBy: userId }));
    });
});
