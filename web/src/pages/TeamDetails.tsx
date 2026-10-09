import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    createdBy: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    createdAt: string;
}

interface Member {
    _id: string;
    team: string;
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    role: 'LEADER' | 'MEMBER';
    joinedAt: string;
}

const TeamDetails = () => {
    const { teamId } = useParams();

    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Member[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!teamId) {
            setError('Team ID is missing');
            setLoading(false);
            return;
        }

        const loadTeam = async () => {
            try {
                setLoading(true);
                setError('');

                const [teamResult, membersResult] =
                    await Promise.all([
                        api.getTeamById(teamId),
                        api.getTeamMembers(teamId),
                    ]);

                setTeam(teamResult.data.team);
                setMembers(membersResult.data.members);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load team'
                );
            } finally {
                setLoading(false);
            }
        };

        loadTeam();
    }, [teamId]);

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
            <div className="min-h-screen bg-[#050505] text-white p-6">
                <div className="max-w-5xl mx-auto">

                    <div className="h-5 w-36 bg-white/5 rounded animate-pulse" />

                    <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-8 animate-pulse">

                        <div className="h-8 w-72 bg-white/5 rounded" />

                        <div className="h-4 w-56 bg-white/5 rounded mt-4" />

                        <div className="h-20 w-full bg-white/5 rounded mt-8" />

                        <div className="h-6 w-40 bg-white/5 rounded mt-10" />

                        <div className="h-16 w-full bg-white/5 rounded mt-5" />

                    </div>

                </div>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="min-h-screen bg-[#050505] text-white p-6">
                <div className="max-w-5xl mx-auto">

                    <Link
                        to="/teams"
                        className="text-sm text-gray-500 hover:text-gray-200 transition"
                    >
                        ← Back to My Teams
                    </Link>

                    <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
                        <h2 className="text-lg font-semibold text-red-400">
                            Unable to load team
                        </h2>

                        <p className="text-gray-500 mt-2">
                            {error || 'Team not found'}
                        </p>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6">
            <div className="max-w-5xl mx-auto">

                {/* Back */}
                <Link
                    to="/teams"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-200 transition"
                >
                    ← Back to My Teams
                </Link>

                {/* Main Card */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b0b0b] overflow-hidden">

                    {/* Header */}
                    <div className="p-8 border-b border-white/10">

                        <div className="flex items-start justify-between gap-6">

                            <div>

                                <div className="flex flex-wrap items-center gap-3">

                                    <h1 className="text-3xl font-bold">
                                        {team.name}
                                    </h1>

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                                            team.status
                                        )}`}
                                    >
                                        {team.status}
                                    </span>

                                </div>

                                <p className="text-gray-500 mt-3">
                                    {team.challenge?.title}
                                </p>

                            </div>

                        </div>

                        <p className="text-gray-400 leading-7 mt-7 max-w-3xl">
                            {team.description}
                        </p>

                    </div>

                    {/* Team Information */}
                    <div className="p-8 border-b border-white/10">

                        <h2 className="text-xl font-semibold">
                            Team Information
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-4 mt-5">

                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                                <p className="text-xs uppercase tracking-wider text-gray-600">
                                    Team Leader
                                </p>

                                <p className="mt-2 text-gray-200 font-medium">
                                    {team.createdBy?.name}
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                    {team.createdBy?.email}
                                </p>

                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                                <p className="text-xs uppercase tracking-wider text-gray-600">
                                    Created
                                </p>

                                <p className="mt-2 text-gray-200 font-medium">
                                    {new Date(
                                        team.createdAt
                                    ).toLocaleDateString(
                                        'en-IN',
                                        {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        }
                                    )}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Members */}
                    <div className="p-8">

                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="text-xl font-semibold">
                                    Team Members
                                </h2>

                                <p className="text-gray-500 text-sm mt-1">
                                    Students currently working on this team.
                                </p>
                            </div>

                            <span className="text-sm text-gray-500">
                                {members.length}{' '}
                                {members.length === 1
                                    ? 'member'
                                    : 'members'}
                            </span>

                        </div>

                        {members.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                                <p className="text-gray-500">
                                    No team members found.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 mt-6">

                                {members.map((member) => (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition"
                                    >

                                        <div className="flex items-center gap-4">

                                            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                                                {member.user?.name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>

                                                <p className="font-medium text-gray-200">
                                                    {member.user?.name}
                                                </p>

                                                <p className="text-gray-600 text-sm mt-1">
                                                    {member.user?.email}
                                                </p>

                                            </div>

                                        </div>

                                        <span
                                            className={
                                                member.role ===
                                                'LEADER'
                                                    ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs'
                                                    : 'text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs'
                                            }
                                        >
                                            {member.role}
                                        </span>

                                    </div>
                                ))}

                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/10 px-8 py-5 bg-black/20">

                        <p className="text-gray-700 text-xs">
                            Team ID: {team._id}
                        </p>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default TeamDetails;