import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Challenge {
    _id: string;
    title: string;
    status: string;
    deadline: string;
}

interface Team {
    _id: string;
    name: string;
    description: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    challenge: Challenge;
    createdAt: string;
    role: 'LEADER' | 'MEMBER';
}

interface TeamMembership {
    _id: string;
    team: Team;
    role: 'LEADER' | 'MEMBER';
}

const Teams = () => {
    const [teams, setTeams] =
        useState<TeamMembership[]>([]);

    const [challenges, setChallenges] =
        useState<Challenge[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [teamName, setTeamName] = useState('');
    const [description, setDescription] =
        useState('');
    const [selectedChallenge, setSelectedChallenge] =
        useState('');

    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] =
        useState('');

    const loadTeams = async () => {
        try {
            setLoading(true);
            setError('');

            const result =
                await api.getMyTeams();

            setTeams(result.data.teams);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load teams'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadChallenges = async () => {
        try {
            const result =
                await api.getChallenges();

            const openChallenges =
                result.data.challenges.filter(
                    (challenge: Challenge) =>
                        challenge.status === 'OPEN' &&
                        new Date(
                            challenge.deadline
                        ) > new Date()
                );

            setChallenges(openChallenges);
        } catch (error) {
            console.error(
                'Failed to load challenges',
                error
            );
        }
    };

    useEffect(() => {
        loadTeams();
        loadChallenges();
    }, []);

    const resetModal = () => {
        setTeamName('');
        setDescription('');
        setSelectedChallenge('');
        setCreateError('');
    };

    const closeModal = () => {
        if (creating) return;

        resetModal();
        setShowCreateModal(false);
    };

    const handleCreateTeam = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        if (!teamName.trim()) {
            setCreateError(
                'Team name is required'
            );
            return;
        }

        if (teamName.trim().length < 3) {
            setCreateError(
                'Team name must be at least 3 characters'
            );
            return;
        }

        if (!description.trim()) {
            setCreateError(
                'Team description is required'
            );
            return;
        }

        if (description.trim().length < 10) {
            setCreateError(
                'Description must be at least 10 characters'
            );
            return;
        }

        if (!selectedChallenge) {
            setCreateError(
                'Please select a challenge'
            );
            return;
        }

        try {
            setCreating(true);
            setCreateError('');

            await api.createTeam({
                name: teamName.trim(),
                description: description.trim(),
                challenge: selectedChallenge,
            });

            closeModal();

            await loadTeams();
        } catch (error) {
            setCreateError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create team'
            );
        } finally {
            setCreating(false);
        }
    };

    const getStatusStyle = (
        status: Team['status']
    ) => {
        switch (status) {
            case 'ACTIVE':
                return 'text-green-400 bg-green-500/10 border-green-500/20';

            case 'COMPLETED':
                return 'text-purple-400 bg-purple-500/10 border-purple-500/20';

            case 'CANCELLED':
                return 'text-red-400 bg-red-500/10 border-red-500/20';

            default:
                return 'text-gray-400 bg-white/5 border-white/10';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white p-6">
                <div className="max-w-6xl mx-auto">

                    <div className="animate-pulse">

                        <div className="h-8 w-40 bg-white/5 rounded" />

                        <div className="h-4 w-64 bg-white/5 rounded mt-3" />

                        <div className="grid md:grid-cols-2 gap-5 mt-8">
                            {[1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="h-52 rounded-2xl bg-white/5 border border-white/5"
                                />
                            ))}
                        </div>

                    </div>

                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen text-white p-6">
                <div className="max-w-6xl mx-auto">

                    <h1 className="text-3xl font-bold">
                        My Teams
                    </h1>

                    <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                        <p className="text-red-400">
                            {error}
                        </p>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

                    <div>
                        <h1 className="text-3xl font-bold">
                            My Teams
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Teams you are currently part of.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            resetModal();
                            setShowCreateModal(true);
                        }}
                        className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium transition hover:bg-purple-500"
                    >
                        + Create Team
                    </button>

                </div>

                {/* Empty State */}
                {teams.length === 0 && (
                    <div className="mt-10 rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 text-xl">
                            ◆
                        </div>

                        <h2 className="mt-5 text-xl font-semibold">
                            You are not in any teams
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-gray-500">
                            Create a team for an open challenge
                            or accept an invitation from another
                            student.
                        </p>

                        <button
                            onClick={() => {
                                resetModal();
                                setShowCreateModal(true);
                            }}
                            className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium transition hover:bg-purple-500"
                        >
                            Create Your Team
                        </button>

                    </div>
                )}

                {/* Teams */}
                {teams.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-5 mt-8">

                        {teams.map((membership) => {
                            const team =
                                membership.team;

                            return (
                                <div
                                    key={membership._id}
                                    className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 transition hover:border-white/15"
                                >

                                    <div className="flex items-start justify-between gap-4">

                                        <div>
                                            <h2 className="text-xl font-semibold">
                                                {team.name}
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-600">
                                                Created{' '}
                                                {new Date(
                                                    team.createdAt
                                                ).toLocaleDateString(
                                                    'en-IN',
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    }
                                                )}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                                                team.status
                                            )}`}
                                        >
                                            {team.status}
                                        </span>

                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-gray-400">
                                        {team.description}
                                    </p>

                                    <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">

                                        <p className="text-xs uppercase tracking-wider text-gray-600">
                                            Challenge
                                        </p>

                                        <p className="mt-2 text-sm font-medium text-gray-300">
                                            {
                                                team
                                                    .challenge
                                                    ?.title
                                            }
                                        </p>

                                    </div>

                                    <div className="mt-4 flex items-center justify-between">

                                        <span className="text-sm text-gray-500">
                                            Your role
                                        </span>

                                        <span
                                            className={
                                                membership.role ===
                                                'LEADER'
                                                    ? 'text-purple-400'
                                                    : 'text-gray-300'
                                            }
                                        >
                                            {membership.role}
                                        </span>

                                    </div>

                                    <Link
                                        to={`/teams/${team._id}`}
                                        className="mt-6 block w-full rounded-xl bg-purple-600 px-5 py-3 text-center text-sm font-medium transition hover:bg-purple-500"
                                    >
                                        View Team
                                    </Link>

                                </div>
                            );
                        })}

                    </div>
                )}

                {/* Create Team Modal */}
                {showCreateModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={closeModal}
                    >

                        <div
                            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#090909] shadow-2xl"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-white/10 p-6">

                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Create Team
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Start building your solution team.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-white text-xl"
                                >
                                    ×
                                </button>

                            </div>

                            <form
                                onSubmit={handleCreateTeam}
                                className="p-6"
                            >

                                {/* Error */}
                                {createError && (
                                    <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                                        <p className="text-sm text-red-400">
                                            {createError}
                                        </p>
                                    </div>
                                )}

                                {/* Team Name */}
                                <div>
                                    <label className="text-sm text-gray-400">
                                        Team Name
                                    </label>

                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(event) =>
                                            setTeamName(
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. HealthTech Innovators"
                                        maxLength={100}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/50"
                                    />
                                </div>

                                {/* Description */}
                                <div className="mt-5">
                                    <label className="text-sm text-gray-400">
                                        Team Description
                                    </label>

                                    <textarea
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Describe what your team wants to build..."
                                        maxLength={1000}
                                        rows={4}
                                        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/50"
                                    />

                                    <p className="text-right text-xs text-gray-700 mt-1">
                                        {description.length}/1000
                                    </p>
                                </div>

                                {/* Challenge */}
                                <div className="mt-5">
                                    <label className="text-sm text-gray-400">
                                        Challenge
                                    </label>

                                    {challenges.length === 0 ? (
                                        <div className="mt-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                                            <p className="text-sm text-yellow-400">
                                                No open challenges are currently available for team creation.
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedChallenge}
                                            onChange={(event) =>
                                                setSelectedChallenge(
                                                    event.target.value
                                                )
                                            }
                                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                                        >
                                            <option
                                                value=""
                                                className="bg-[#050505]"
                                            >
                                                Select a challenge
                                            </option>

                                            {challenges.map(
                                                (challenge) => (
                                                    <option
                                                        key={
                                                            challenge._id
                                                        }
                                                        value={
                                                            challenge._id
                                                        }
                                                        className="bg-[#050505]"
                                                    >
                                                        {
                                                            challenge.title
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-7">

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={creating}
                                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-gray-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            creating ||
                                            challenges.length === 0
                                        }
                                        className="flex-1 rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {creating
                                            ? 'Creating...'
                                            : 'Create Team'}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default Teams;