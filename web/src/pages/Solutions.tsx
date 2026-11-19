
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type {
    Solution,
    SolutionReviewStatus,
    SolutionImplementationStatus,
} from '../types/solution';

interface Challenge {
    _id: string;
    title: string;
    description?: string;
    status: string;
    deadline: string;
}

interface Team {
    _id: string;
    name: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    challenge: string | { _id: string; title?: string };
}

interface TeamMembership {
    _id: string;
    team: Team;
    role: 'LEADER' | 'MEMBER';
}

const reviewStyles: Record<SolutionReviewStatus, string> = {
    PENDING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    APPROVED: 'text-green-400 bg-green-500/10 border-green-500/20',
    REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
    REVISION_REQUESTED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const implementationStyles: Record<SolutionImplementationStatus, string> = {
    NOT_STARTED: 'text-gray-400 bg-white/5 border-white/10',
    IN_PROGRESS: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    ON_HOLD: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    COMPLETED: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const getId = (value: string | { _id: string } | undefined) =>
    typeof value === 'string' ? value : value?._id ?? '';

const formatStatus = (status: string) =>
    status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
    );

const Solutions = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [teams, setTeams] = useState<TeamMembership[]>([]);
    const [solutions, setSolutions] = useState<Solution[]>([]);

    const [selectedChallenge, setSelectedChallenge] = useState(
        searchParams.get('challengeId') ?? ''
    );

    const [loading, setLoading] = useState(true);
    const [solutionsLoading, setSolutionsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [teamId, setTeamId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [approach, setApproach] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError('');

                const [challengeResult, teamResult] = await Promise.all([
                    api.getChallenges(),
                    api.getMyTeams(),
                ]);

                if (cancelled) return;

                setChallenges(challengeResult.data.challenges ?? []);
                setTeams(teamResult.data.teams ?? []);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load challenges and teams.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadInitialData();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const queryChallengeId = searchParams.get('challengeId') ?? '';
        setSelectedChallenge(queryChallengeId);
    }, [searchParams]);

    useEffect(() => {
        if (!selectedChallenge) {
            setSolutions([]);
            setSolutionsLoading(false);
            return;
        }

        let cancelled = false;

        const loadSolutions = async () => {
            try {
                setSolutionsLoading(true);
                setError('');

                const result = await api.getSolutionsForChallenge(selectedChallenge);

                if (!cancelled) {
                    setSolutions(result.data.solutions ?? []);
                }
            } catch (err) {
                if (!cancelled) {
                    setSolutions([]);
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load solutions.'
                    );
                }
            } finally {
                if (!cancelled) setSolutionsLoading(false);
            }
        };

        loadSolutions();

        return () => {
            cancelled = true;
        };
    }, [selectedChallenge]);

    const eligibleTeams = useMemo(
        () =>
            teams.filter((membership) => {
                const team = membership.team;

                return (
                    team?.status === 'ACTIVE' &&
                    getId(team.challenge) === selectedChallenge
                );
            }),
        [teams, selectedChallenge]
    );

    const resetForm = () => {
        setTeamId('');
        setTitle('');
        setDescription('');
        setApproach('');
        setEstimatedCost('');
        setEstimatedCompletionDate('');
        setFormError('');
    };

    const handleChallengeChange = (challengeId: string) => {
        setSelectedChallenge(challengeId);
        setSearchParams(
            challengeId ? { challengeId } : {},
            { replace: true }
        );
        setSuccess('');
        setShowForm(false);
        resetForm();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');
        setSuccess('');

        if (!selectedChallenge) {
            setFormError('Select a challenge first.');
            return;
        }

        if (!teamId || !eligibleTeams.some((item) => item.team._id === teamId)) {
            setFormError('Select an active team associated with this challenge.');
            return;
        }

        if (title.trim().length < 3) {
            setFormError('The solution title must contain at least 3 characters.');
            return;
        }

        if (description.trim().length < 20) {
            setFormError('The description must contain at least 20 characters.');
            return;
        }

        if (approach.trim().length < 20) {
            setFormError('The implementation approach must contain at least 20 characters.');
            return;
        }

        const cost = estimatedCost.trim() ? Number(estimatedCost) : undefined;

        if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
            setFormError('Estimated cost must be a valid non-negative number.');
            return;
        }

        try {
            setSubmitting(true);

            await api.createSolution({
                challenge: selectedChallenge,
                team: teamId,
                title: title.trim(),
                description: description.trim(),
                approach: approach.trim(),
                ...(cost !== undefined ? { estimatedCost: cost } : {}),
                ...(estimatedCompletionDate
                    ? { estimatedCompletionDate }
                    : {}),
            });

            setSuccess('Your solution has been submitted for review.');
            setShowForm(false);
            resetForm();

            try {
                const result = await api.getSolutionsForChallenge(selectedChallenge);
                setSolutions(result.data.solutions ?? []);
            } catch {
                setError('Solution submitted, but the list could not be refreshed. Reload to view it.');
            }
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'Failed to submit solution.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 text-white">
                <div className="mx-auto max-w-6xl animate-pulse">
                    <div className="h-8 w-56 rounded bg-white/5" />
                    <div className="mt-3 h-4 w-80 rounded bg-white/5" />
                    <div className="mt-8 h-48 rounded-2xl border border-white/5 bg-white/[0.03]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 text-white">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-purple-400">
                            SOLUTIONS & IMPACT
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">Solutions</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                            Explore proposed solutions, track their review status,
                            and follow the ideas being developed for each challenge.
                        </p>
                    </div>

                    <Link
                        to="/challenges"
                        className="text-sm text-purple-400 transition hover:text-purple-300"
                    >
                        Browse challenges →
                    </Link>
                </div>

                <section className="mt-8 rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
                    <label
                        htmlFor="solution-challenge"
                        className="text-sm font-medium text-gray-300"
                    >
                        Select a challenge
                    </label>

                    <select
                        id="solution-challenge"
                        disabled={submitting}
                        value={selectedChallenge}
                        onChange={(event) =>
                            handleChallengeChange(event.target.value)
                        }
                        className="mt-3 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                    >
                        <option value="">Choose a challenge</option>
                        {challenges.map((challenge) => (
                            <option key={challenge._id} value={challenge._id}>
                                {challenge.title}
                            </option>
                        ))}
                    </select>

                    {selectedChallenge && (
                        <div className="mt-5 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-500">
                                {solutions.length} solution{solutions.length === 1 ? '' : 's'} listed
                            </p>

                            <button
                                type="button"
                                disabled={submitting || eligibleTeams.length === 0 || !['OPEN', 'IN_PROGRESS'].includes(challenges.find((challenge) => challenge._id === selectedChallenge)?.status ?? '')}
                                onClick={() => {
                                    resetForm();
                                    setShowForm((current) => !current);
                                }}
                                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {showForm ? 'Close form' : '+ Submit a solution'}
                            </button>
                        </div>
                    )}

                    {selectedChallenge && eligibleTeams.length === 0 && (
                        <p className="mt-3 text-sm text-gray-500">
                            You need to be a member of an active team for this challenge
                            before submitting a solution. You can create or join a team
                            from the Teams page.
                        </p>
                    )}
                </section>

                {error && (
                    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
                        {success}
                    </div>
                )}

                {showForm && (
                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-5 rounded-2xl border border-purple-500/20 bg-[#0b0b0b] p-5 sm:p-6"
                    >
                        <div>
                            <h2 className="text-xl font-semibold">Submit a solution</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Describe the problem your team will solve and how you
                                plan to implement the solution.
                            </p>
                        </div>

                        {formError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                                {formError}
                            </div>
                        )}

                        <div>
                            <label htmlFor="solution-team" className="text-sm text-gray-400">
                                Team
                            </label>
                            <select
                                id="solution-team"
                                required
                                value={teamId}
                                onChange={(event) => setTeamId(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="">Choose your team</option>
                                {eligibleTeams.map(({ team }) => (
                                    <option key={team._id} value={team._id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="solution-title" className="text-sm text-gray-400">
                                Solution title
                            </label>
                            <input
                                id="solution-title"
                                required
                                minLength={3}
                                maxLength={150}
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Give your proposed solution a clear name"
                                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/50"
                            />
                        </div>

                        <div>
                            <label htmlFor="solution-description" className="text-sm text-gray-400">
                                Problem and proposed solution
                            </label>
                            <textarea
                                id="solution-description"
                                required
                                minLength={20}
                                maxLength={5000}
                                rows={4}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Explain the problem and what your team proposes to build..."
                                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/50"
                            />
                        </div>

                        <div>
                            <label htmlFor="solution-approach" className="text-sm text-gray-400">
                                Implementation approach
                            </label>
                            <textarea
                                id="solution-approach"
                                required
                                minLength={20}
                                maxLength={5000}
                                rows={4}
                                value={approach}
                                onChange={(event) => setApproach(event.target.value)}
                                placeholder="Describe the planned technology, steps, resources, and delivery..."
                                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/50"
                            />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="solution-cost" className="text-sm text-gray-400">
                                    Estimated cost (optional)
                                </label>
                                <input
                                    id="solution-cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={estimatedCost}
                                    onChange={(event) => setEstimatedCost(event.target.value)}
                                    placeholder="e.g. 25000"
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/50"
                                />
                            </div>

                            <div>
                                <label htmlFor="solution-date" className="text-sm text-gray-400">
                                    Estimated completion (optional)
                                </label>
                                <input
                                    id="solution-date"
                                    type="date"
                                    value={estimatedCompletionDate}
                                    onChange={(event) => setEstimatedCompletionDate(event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 transition hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit for review'}
                            </button>
                        </div>
                    </form>
                )}

                <section className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Submitted solutions</h2>
                        {solutionsLoading && (
                            <span className="text-xs text-gray-500">Refreshing...</span>
                        )}
                    </div>

                    {!selectedChallenge ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                            <p className="text-gray-400">Choose a challenge to view its solutions.</p>
                        </div>
                    ) : !solutionsLoading && solutions.length === 0 && !error ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                            <h3 className="font-medium text-gray-300">No solutions yet</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Be the first team to submit a proposal for this challenge.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-2">
                            {solutions.map((solution) => (
                                <article
                                    key={solution._id}
                                    className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 transition hover:border-white/20"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`rounded-full border px-3 py-1 text-xs ${reviewStyles[solution.reviewStatus]}`}>
                                            {formatStatus(solution.reviewStatus)}
                                        </span>
                                        <span className={`rounded-full border px-3 py-1 text-xs ${implementationStyles[solution.implementationStatus]}`}>
                                            {formatStatus(solution.implementationStatus)}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-xl font-semibold">
                                        {solution.title}
                                    </h3>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                                        {solution.description}
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                                        <span>
                                            Submitted{' '}
                                            {new Date(solution.createdAt).toLocaleDateString('en-IN')}
                                        </span>
                                        <span>
                                            {solution.milestones?.length ?? 0} milestones
                                        </span>
                                        <span>
                                            {solution.impactIndicators?.length ?? 0} impact indicators
                                        </span>
                                    </div>

                                    {solution.reviewNote && (
                                        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Reviewer feedback
                                            </p>
                                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
                                                {solution.reviewNote}
                                            </p>
                                        </div>
                                    )}

                                    <Link
                                        to={`/solutions/${solution._id}`}
                                        className="mt-5 inline-flex text-sm font-medium text-purple-400 transition hover:text-purple-300"
                                    >
                                        View solution details →
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Solutions;
