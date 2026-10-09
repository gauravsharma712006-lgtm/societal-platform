import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Challenge {
    _id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
    skills: string[];
    eligibility: string;
}

interface Application {
    _id: string;
    challenge: Challenge;
    motivation: string;
    skills: string[];
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    reviewNote?: string;
    createdAt: string;
}

const Applications = () => {
    const [applications, setApplications] =
        useState<Application[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadApplications = async () => {
            try {
                setLoading(true);
                setError('');

                const result =
                    await api.getMyApplications();

                setApplications(
                    result.data.applications
                );
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load applications'
                );
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    const getStatusStyle = (
        status: Application['status']
    ) => {
        switch (status) {
            case 'ACCEPTED':
                return 'border-green-500/20 bg-green-500/10 text-green-400';

            case 'REJECTED':
                return 'border-red-500/20 bg-red-500/10 text-red-400';

            default:
                return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400';
        }
    };

    const getStatusDot = (
        status: Application['status']
    ) => {
        switch (status) {
            case 'ACCEPTED':
                return 'bg-green-400';

            case 'REJECTED':
                return 'bg-red-400';

            default:
                return 'bg-yellow-400';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white">
                <div className="max-w-6xl mx-auto p-6">

                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-white/5 rounded" />

                        <div className="h-4 w-72 bg-white/5 rounded mt-3" />

                        <div className="mt-8 space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-40 rounded-2xl bg-white/5 border border-white/5"
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
            <div className="min-h-screen text-white">
                <div className="max-w-6xl mx-auto p-6">

                    <h1 className="text-3xl font-bold">
                        My Applications
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
        <div className="min-h-screen text-white">

            <div className="max-w-6xl mx-auto p-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">
                        My Applications
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Track the challenges you have applied
                        to and monitor their progress.
                    </p>
                </div>

                {/* Empty */}
                {applications.length === 0 && (
                    <div className="mt-10 rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                            ✦
                        </div>

                        <h2 className="mt-5 text-xl font-semibold">
                            No applications yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-gray-500">
                            You haven't applied to any
                            challenges yet. Explore available
                            challenges and find one that matches
                            your interests.
                        </p>

                        <Link
                            to="/challenges"
                            className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
                        >
                            Explore Challenges
                        </Link>

                    </div>
                )}

                {/* Applications */}
                {applications.length > 0 && (
                    <div className="mt-8 space-y-5">

                        {applications.map(
                            (application) => (
                                <div
                                    key={application._id}
                                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] transition hover:border-white/15"
                                >

                                    {/* Top */}
                                    <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between">

                                        <div>
                                            <Link
                                                to={`/challenges/${application.challenge._id}`}
                                                className="text-xl font-semibold transition hover:text-purple-400"
                                            >
                                                {
                                                    application
                                                        .challenge
                                                        .title
                                                }
                                            </Link>

                                            <p className="mt-2 text-sm text-gray-500">
                                                Applied on{' '}
                                                {new Date(
                                                    application.createdAt
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
                                            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyle(
                                                application.status
                                            )}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                                    application.status
                                                )}`}
                                            />

                                            {
                                                application.status
                                            }
                                        </span>

                                    </div>

                                    {/* Body */}
                                    <div className="p-6">

                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-gray-600">
                                                Your Motivation
                                            </p>

                                            <p className="mt-3 text-sm leading-6 text-gray-400">
                                                {
                                                    application.motivation
                                                }
                                            </p>
                                        </div>

                                        {/* Skills */}
                                        {application.skills
                                            .length >
                                            0 && (
                                            <div className="mt-6">

                                                <p className="text-xs uppercase tracking-wider text-gray-600">
                                                    Skills
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {application.skills.map(
                                                        (
                                                            skill
                                                        ) => (
                                                            <span
                                                                key={
                                                                    skill
                                                                }
                                                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400"
                                                            >
                                                                {
                                                                    skill
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                                </div>

                                            </div>
                                        )}

                                        {/* Review */}
                                        {application.reviewNote && (
                                            <div
                                                className={`mt-6 rounded-xl border p-4 ${
                                                    application.status ===
                                                    'ACCEPTED'
                                                        ? 'border-green-500/10 bg-green-500/5'
                                                        : 'border-red-500/10 bg-red-500/5'
                                                }`}
                                            >
                                                <p className="text-xs uppercase tracking-wider text-gray-600">
                                                    Organizer
                                                    Review
                                                </p>

                                                <p className="mt-2 text-sm text-gray-400">
                                                    {
                                                        application.reviewNote
                                                    }
                                                </p>
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

export default Applications;