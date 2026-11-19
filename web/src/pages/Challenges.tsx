import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants/roles';

import { api } from '../services/api';

interface Challenge {
    _id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
    skills: string[];
    eligibility: string;
    problem?: {
        _id: string;
        title: string;
        description: string;
        category: string;
        status: string;
    };
}

interface ProblemOption {
    _id: string;
    title: string;
    category?: string;
    status?: string;
}

type ChallengeStatusAction = 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const challengeActions: Record<string, { status: ChallengeStatusAction; label: string }[]> = {
    DRAFT: [{ status: 'OPEN', label: 'Publish Challenge' }, { status: 'CANCELLED', label: 'Cancel Challenge' }],
    OPEN: [{ status: 'CLOSED', label: 'Close Applications' }, { status: 'CANCELLED', label: 'Cancel Challenge' }],
    CLOSED: [{ status: 'IN_PROGRESS', label: 'Start Challenge' }],
    IN_PROGRESS: [{ status: 'COMPLETED', label: 'Complete Challenge' }],
};

const Challenges = () => {
    const [challenges, setChallenges] =
        useState<Challenge[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [filter, setFilter] =
        useState('ALL');

    const auth = useAuth();

    const canCreateChallenge =
        auth.hasAnyRole(ROLES.ADMIN);

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [problems, setProblems] =
        useState<ProblemOption[]>([]);

    const [isCreating, setIsCreating] =
        useState(false);
    const [updatingChallengeId, setUpdatingChallengeId] = useState<string | null>(null);
    const [statusError, setStatusError] = useState('');

    const [createError, setCreateError] =
        useState<string | null>(null);

    const [createSuccess, setCreateSuccess] =
        useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        problem: '',
        deadline: '',
        skills: '',
        eligibility: '',
    });

    useEffect(() => {
        const loadChallenges = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [challengeResult, problemResult] =
                    await Promise.all([
                        api.getChallenges(),
                        canCreateChallenge
                            ? api.getProblems()
                            : Promise.resolve(null),
                    ]);

                setChallenges(
                    challengeResult.data.challenges
                );

                if (problemResult) {
                    setProblems((problemResult.data ?? []).filter(
                        (problem: ProblemOption) => problem.status === 'VERIFIED'
                    ));
                }
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load challenges'
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadChallenges();
    }, [canCreateChallenge]);





    const handleCreateChallenge = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setCreateError(null);
        setCreateSuccess(null);

        if (!form.problem) {
            setCreateError(
                'Please select a problem.'
            );
            return;
        }

        const deadline = new Date(form.deadline).getTime();
        if (!Number.isFinite(deadline) || deadline <= Date.now()) {
            setCreateError(
                'Deadline must be in the future.'
            );
            return;
        }

        const skills = form.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);

        try {
            setIsCreating(true);

            await api.createChallenge({
                title: form.title.trim(),
                description: form.description.trim(),
                problem: form.problem,
                deadline: new Date(
                    form.deadline
                ).toISOString(),
                skills,
                eligibility: form.eligibility.trim(),
            });

            setForm({
                title: '',
                description: '',
                problem: '',
                deadline: '',
                skills: '',
                eligibility: '',
            });

            setCreateSuccess(
                'Challenge created successfully.'
            );

            setShowCreateForm(false);
            setFilter('ALL');

            try {
                const result = await api.getChallenges();
                setChallenges(result.data.challenges);
            } catch (error) {
                setStatusError(
                    'Challenge created, but the list could not be refreshed. Reload to view it.'
                );
            }
        } catch (error) {
            setCreateError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create challenge.'
            );
        } finally {
            setIsCreating(false);
        }
    };




    const filteredChallenges = useMemo(() => {
        const visibleChallenges = canCreateChallenge
            ? challenges
            : challenges.filter(
                (challenge) => challenge.status !== 'DRAFT'
            );

        if (filter === 'ALL') {
            return visibleChallenges;
        }

        return visibleChallenges.filter(
            (challenge) => challenge.status === filter
        );
    }, [challenges, filter, canCreateChallenge]);


    const formatDate = (
        date: string
    ) => {
        return new Date(date).toLocaleDateString(
            'en-IN',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        );
    };

    const getStatusClass = (
        status: string
    ) => {
        switch (status) {
            case 'OPEN':
                return 'text-green-400 bg-green-400/10';

            case 'IN_PROGRESS':
                return 'text-blue-400 bg-blue-400/10';

            case 'COMPLETED':
                return 'text-gray-400 bg-gray-400/10';

            case 'CLOSED':
                return 'text-amber-300 bg-amber-400/10';

            case 'CANCELLED':
                return 'text-red-300 bg-red-400/10';

            default:
                return 'text-gray-400 bg-white/10';
        }
    };


    const handleChallengeStatusChange = async (
        challengeId: string,
        status: ChallengeStatusAction
    ) => {
        if (updatingChallengeId) return;
        setUpdatingChallengeId(challengeId);
        setStatusError('');
        try {
            await api.updateChallengeStatus(challengeId, status);

            const result = await api.getChallenges();
            setChallenges(result.data.challenges);

        } catch (err) {
            setStatusError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update challenge status.'
            );
        } finally {
            setUpdatingChallengeId(null);
        }
    };


    return (
        <div className="p-5 lg:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <p className="text-sm text-purple-400 mb-2">
                        Opportunities
                    </p>

                    <h1 className="text-3xl lg:text-4xl font-bold">
                        Challenges
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Discover real-world problems that need
                        practical solutions.
                    </p>
                </div>


                {/* Admin challenge creation */}
                {canCreateChallenge && (
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateForm((current) => !current);
                                setCreateError(null);
                                setCreateSuccess(null);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl text-sm font-medium transition"
                        >
                            {showCreateForm
                                ? 'Cancel'
                                : '+ Create Challenge'}
                        </button>

                        {createSuccess && (
                            <p className="text-green-400 text-sm mt-3">
                                {createSuccess}
                            </p>
                        )}

                        {showCreateForm && (
                            <form
                                onSubmit={handleCreateChallenge}
                                className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
                            >
                                <h2 className="text-xl font-semibold">
                                    Create a Challenge
                                </h2>

                                {createError && (
                                    <p className="text-red-400 text-sm">
                                        {createError}
                                    </p>
                                )}

                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">
                                        Challenge title
                                    </label>
                                    <input
                                        required
                                        minLength={5}
                                        maxLength={150}
                                        value={form.title}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                title: event.target.value,
                                            })
                                        }
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                        placeholder="Enter a meaningful title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        required
                                        minLength={20}
                                        maxLength={5000}
                                        rows={5}
                                        value={form.description}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                description: event.target.value,
                                            })
                                        }
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                        placeholder="Explain the challenge and expected outcome"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">
                                        Related problem
                                    </label>
                                    <select
                                        required
                                        value={form.problem}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                problem: event.target.value,
                                            })
                                        }
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                    >
                                        <option value="">
                                            Select a verified problem
                                        </option>
                                        {problems.map((problem) => (
                                            <option
                                                key={problem._id}
                                                value={problem._id}
                                            >
                                                {problem.title}
                                            </option>
                                        ))}
                                    </select>

                                    {problems.length === 0 && (
                                        <p className="text-gray-500 text-xs mt-2">
                                            No verified problems available. Verify a reported problem first.
                                        </p>
                                    )}
                                </div>


                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">
                                        Deadline
                                    </label>

                                    <input
                                        required
                                        type="datetime-local"
                                        min={new Date(
                                            Date.now() -
                                            new Date().getTimezoneOffset() * 60000
                                        )
                                            .toISOString()
                                            .slice(0, 16)}
                                        value={form.deadline}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                deadline: event.target.value,
                                            })
                                        }
                                        className="w-full bg-white text-gray-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                                    />

                                    <p className="text-gray-400 text-xs mt-2">
                                        Select a future date and time using the calendar and clock controls.
                                    </p>
                                </div>


                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">
                                        Required skills
                                    </label>
                                    <input
                                        value={form.skills}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                skills: event.target.value,
                                            })
                                        }
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                        placeholder="React, Node.js, UI/UX (comma-separated)"
                                    />
                                    <p className="text-gray-500 text-xs mt-2">
                                        Separate skills with commas. This field is optional.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">
                                        Eligibility
                                    </label>
                                    <textarea
                                        required
                                        minLength={5}
                                        maxLength={1000}
                                        rows={3}
                                        value={form.eligibility}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                eligibility: event.target.value,
                                            })
                                        }
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                        placeholder="Who can participate?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        isCreating ||
                                        problems.length === 0
                                    }
                                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-xl text-sm font-medium transition"
                                >
                                    {isCreating
                                        ? 'Creating...'
                                        : 'Create Challenge'}
                                </button>
                            </form>
                        )}
                    </div>
                )}


                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">

                    {[
                        'ALL',
                        ...(canCreateChallenge ? ['DRAFT'] : []),
                        'OPEN',
                        'CLOSED',
                        'IN_PROGRESS',
                        'COMPLETED',
                        ...(canCreateChallenge ? ['CANCELLED'] : []),
                    ].map((status) => (
                        <button
                            key={status}
                            onClick={() =>
                                setFilter(status)
                            }
                            className={`
                                px-4
                                py-2
                                rounded-xl
                                text-sm
                                transition
                                ${filter === status
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                                }
                            `}
                        >
                            {status === 'ALL'
                                ? 'All'
                                : status
                                    .replace(
                                        '_',
                                        ' '
                                    )
                                    .toLowerCase()
                                    .replace(
                                        /^\w/,
                                        (c) =>
                                            c.toUpperCase()
                                    )}
                        </button>
                    ))}

                </div>

                {statusError && (
                    <p role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                        {statusError}
                    </p>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="grid md:grid-cols-2 gap-5">

                        {[1, 2].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse"
                                >
                                    <div className="h-5 bg-white/10 rounded w-2/3" />

                                    <div className="h-4 bg-white/10 rounded w-full mt-5" />

                                    <div className="h-4 bg-white/10 rounded w-4/5 mt-2" />

                                    <div className="h-10 bg-white/10 rounded w-32 mt-6" />
                                </div>
                            )
                        )}

                    </div>
                )}

                {/* Error */}
                {!isLoading && error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                        <h2 className="font-semibold text-red-400">
                            Unable to load challenges
                        </h2>

                        <p className="text-gray-400 mt-2">
                            {error}
                        </p>
                    </div>
                )}

                {/* Empty */}
                {!isLoading &&
                    !error &&
                    filteredChallenges.length === 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">

                            <div className="text-4xl mb-4">
                                ◇
                            </div>

                            <h2 className="text-xl font-semibold">
                                No challenges found
                            </h2>

                            <p className="text-gray-500 mt-2">
                                There are no challenges matching
                                this filter right now.
                            </p>

                        </div>
                    )}

                {/* Challenges */}
                {!isLoading &&
                    !error &&
                    filteredChallenges.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-5">


                            {filteredChallenges.map(
                                (challenge) => (
                                    <div
                                        key={
                                            challenge._id
                                        }
                                        className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition"
                                    >

                                        {/* Top */}
                                        <div className="flex items-start justify-between gap-4">

                                            <h2 className="text-xl font-semibold">
                                                {
                                                    challenge.title
                                                }
                                            </h2>

                                            <span
                                                className={`shrink-0 px-3 py-1 rounded-full text-xs ${getStatusClass(
                                                    challenge.status
                                                )}`}
                                            >
                                                {
                                                    challenge.status
                                                }
                                            </span>

                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-400 mt-4 line-clamp-3">
                                            {
                                                challenge.description
                                            }
                                        </p>

                                        {/* Source problem */}
                                        {challenge.problem && (
                                            <div className="mt-5">

                                                <p className="text-xs text-gray-600 uppercase tracking-wider">
                                                    Based on problem
                                                </p>

                                                <p className="text-sm text-gray-300 mt-1">
                                                    {
                                                        challenge
                                                            .problem
                                                            .title
                                                    }
                                                </p>

                                            </div>
                                        )}

                                        {/* Skills */}
                                        {challenge.skills
                                            ?.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-5">

                                                    {challenge.skills
                                                        .slice(
                                                            0,
                                                            4
                                                        )
                                                        .map(
                                                            (
                                                                skill
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        skill
                                                                    }
                                                                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400"
                                                                >
                                                                    {
                                                                        skill
                                                                    }
                                                                </span>
                                                            )
                                                        )}

                                                </div>
                                            )}

                                        {/* Footer */}

                                        {/* Footer */}
                                        <div className="flex flex-col gap-4 mt-6 pt-5 border-t border-white/10">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-600">Deadline</p>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {formatDate(challenge.deadline)}
                                                    </p>
                                                </div>

                                                <Link
                                                    to={`/challenges/${challenge._id}`}
                                                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl text-sm transition"
                                                >
                                                    View Challenge
                                                </Link>
                                            </div>

                                            {canCreateChallenge && (
                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        to={`/challenges/${challenge._id}/applications`}
                                                        className="px-4 py-2 rounded-xl text-sm bg-purple-600 hover:bg-purple-700 transition"
                                                    >
                                                        Review Applications
                                                    </Link>

                                                    {(challengeActions[challenge.status] ?? []).map((action) => (
                                                        <button
                                                            key={action.status}
                                                            type="button"
                                                            disabled={updatingChallengeId !== null}
                                                            onClick={() =>
                                                                handleChallengeStatusChange(
                                                                    challenge._id,
                                                                    action.status
                                                                )
                                                            }
                                                            className="px-4 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 transition"
                                                        >
                                                            {updatingChallengeId === challenge._id ? 'Updating...' : action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>


                                    </div>
                                )
                            )}

                        </div>
                    )}

            </div>
        </div>
    );
};

export default Challenges;
