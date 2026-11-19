
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type {
    Solution,
    SolutionReviewStatus,
} from '../types/solution';

interface ChallengeOption {
    _id: string;
    title: string;
}

type ReviewFilter = 'ALL' | SolutionReviewStatus;

const filters: { label: string; value: ReviewFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Revision requested', value: 'REVISION_REQUESTED' },
];

function SolutionReviews() {
    const [challenges, setChallenges] = useState<ChallengeOption[]>([]);
    const [challengeId, setChallengeId] = useState('');
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [filter, setFilter] = useState<ReviewFilter>('PENDING');
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [loadingChallenges, setLoadingChallenges] = useState(true);
    const [loadingSolutions, setLoadingSolutions] = useState(false);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;

        async function loadChallenges() {
            try {
                setLoadingChallenges(true);
                setError('');

                const result = await api.getChallenges();
                const items: ChallengeOption[] = result.data?.challenges ?? [];

                if (!active) return;

                setChallenges(items);
                setChallengeId((current) => current || items[0]?._id || '');
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load challenges.'
                    );
                }
            } finally {
                if (active) setLoadingChallenges(false);
            }
        }

        void loadChallenges();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadSolutions() {
            if (!challengeId) {
                setSolutions([]);
                return;
            }

            try {
                setLoadingSolutions(true);
                setError('');
                setMessage('');

                const result = await api.getSolutionsForChallenge(challengeId);

                if (active) {
                    setSolutions(result.data?.solutions ?? []);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load solutions.'
                    );
                }
            } finally {
                if (active) setLoadingSolutions(false);
            }
        }

        void loadSolutions();

        return () => {
            active = false;
        };
    }, [challengeId]);

    const visibleSolutions = useMemo(
        () =>
            filter === 'ALL'
                ? solutions
                : solutions.filter((solution) => solution.reviewStatus === filter),
        [filter, solutions]
    );

    async function reviewSolution(
        solutionId: string,
        reviewStatus: Exclude<SolutionReviewStatus, 'PENDING'>
    ) {
        try {
            setReviewingId(solutionId);
            setError('');
            setMessage('');

            const reviewNote = notes[solutionId]?.trim();

            const result = await api.reviewSolution(solutionId, {
                reviewStatus,
                ...(reviewNote ? { reviewNote } : {}),
            });

            const updatedSolution: Solution | undefined = result.data?.solution;

            if (updatedSolution) {
                setSolutions((current) =>
                    current.map((solution) =>
                        solution._id === solutionId ? updatedSolution : solution
                    )
                );
            } else {
                // If the response doesn't include the updated record, reload the list.
                const refreshed = await api.getSolutionsForChallenge(challengeId);
                setSolutions(refreshed.data?.solutions ?? []);
            }

            setMessage(
                reviewStatus === 'APPROVED'
                    ? 'Solution approved successfully.'
                    : reviewStatus === 'REJECTED'
                        ? 'Solution rejected.'
                        : 'Revision requested successfully.'
            );

            setNotes((current) => ({ ...current, [solutionId]: '' }));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to review solution.'
            );
        } finally {
            setReviewingId(null);
        }
    }

    return (
        <main className="min-h-[calc(100vh-73px)] w-full space-y-6 bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1028] p-4 text-white md:p-6">      <header>
            <h1 className="text-2xl font-bold text-white">Solution Reviews</h1>
            <p className="mt-2 text-sm text-gray-400">
                Review submitted solutions and provide feedback to their teams.
            </p>
        </header>

            {error && (
                <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {message && (
                <div role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
                    {message}
                </div>
            )}

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                <label htmlFor="challenge-select" className="mb-2 block text-sm text-gray-300">
                    Select challenge
                </label>

                <select
                    id="challenge-select"
                    value={challengeId}
                    onChange={(event) => setChallengeId(event.target.value)}
                    disabled={loadingChallenges || challenges.length === 0}
                    className="w-full rounded-lg border border-white/10 bg-gray-900 p-3 text-white md:max-w-xl"
                >
                    {loadingChallenges && <option value="">Loading challenges…</option>}
                    {!loadingChallenges && challenges.length === 0 && (
                        <option value="">No challenges available</option>
                    )}
                    {challenges.map((challenge) => (
                        <option key={challenge._id} value={challenge._id}>
                            {challenge.title}
                        </option>
                    ))}
                </select>
            </section>

            <nav className="flex flex-wrap gap-2" aria-label="Filter solutions">
                {filters.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setFilter(item.value)}
                        aria-pressed={filter === item.value}
                        className={`rounded-full border px-3 py-2 text-sm transition ${filter === item.value
                                ? 'border-purple-400 bg-purple-500/20 text-white'
                                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <p className="text-sm text-gray-400">
                {loadingSolutions
                    ? 'Loading solutions…'
                    : `${visibleSolutions.length} solution${visibleSolutions.length === 1 ? '' : 's'} found`}
            </p>

            {!loadingSolutions && !error && challengeId && visibleSolutions.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                    <h2 className="font-semibold text-white">No solutions found</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        There are no solutions matching this filter for the selected challenge.
                    </p>
                </div>
            )}

            <section className="space-y-4">
                {visibleSolutions.map((solution) => (
                    <article
                        key={solution._id}
                        className="rounded-xl border border-white/10 bg-white/5 p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {solution.title}
                                </h2>
                                <p className="mt-1 text-xs text-gray-400">
                                    Submitted {new Date(solution.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                                {solution.reviewStatus.replaceAll('_', ' ')}
                            </span>
                        </div>

                        <div className="mt-4 space-y-4 text-sm text-gray-300">
                            <div>
                                <h3 className="mb-1 font-medium text-white">Description</h3>
                                <p className="whitespace-pre-wrap">{solution.description}</p>
                            </div>

                            <div>
                                <h3 className="mb-1 font-medium text-white">Proposed approach</h3>
                                <p className="whitespace-pre-wrap">{solution.approach}</p>
                            </div>

                            {solution.estimatedCost !== undefined && (
                                <p>
                                    <span className="font-medium text-white">Estimated cost: </span>
                                    {solution.estimatedCost.toLocaleString()}
                                </p>
                            )}

                            {solution.estimatedCompletionDate && (
                                <p>
                                    <span className="font-medium text-white">Estimated completion: </span>
                                    {new Date(solution.estimatedCompletionDate).toLocaleDateString()}
                                </p>
                            )}

                            {solution.reviewNote && (
                                <div className="rounded-lg bg-black/20 p-3">
                                    <h3 className="mb-1 font-medium text-white">Previous review note</h3>
                                    <p className="whitespace-pre-wrap">{solution.reviewNote}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-4">
                            <label
                                htmlFor={`review-note-${solution._id}`}
                                className="mb-2 block text-sm text-gray-300"
                            >
                                Review note (optional)
                            </label>

                            <textarea
                                id={`review-note-${solution._id}`}
                                value={notes[solution._id] ?? ''}
                                onChange={(event) =>
                                    setNotes((current) => ({
                                        ...current,
                                        [solution._id]: event.target.value,
                                    }))
                                }
                                rows={3}
                                placeholder="Explain your decision or suggest improvements…"
                                className="w-full rounded-lg border border-white/10 bg-gray-900 p-3 text-sm text-white placeholder:text-gray-500"
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={reviewingId !== null}
                                    onClick={() => void reviewSolution(solution._id, 'APPROVED')}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {reviewingId === solution._id ? 'Saving…' : 'Approve'}
                                </button>

                                <button
                                    type="button"
                                    disabled={reviewingId !== null}
                                    onClick={() => void reviewSolution(solution._id, 'REVISION_REQUESTED')}
                                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Request revision
                                </button>

                                <button
                                    type="button"
                                    disabled={reviewingId !== null}
                                    onClick={() => void reviewSolution(solution._id, 'REJECTED')}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
}

export default SolutionReviews;
