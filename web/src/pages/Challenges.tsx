import { useEffect, useMemo, useState } from 'react';
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
    problem?: {
        _id: string;
        title: string;
        description: string;
        category: string;
        status: string;
    };
}

const Challenges = () => {
    const [challenges, setChallenges] =
        useState<Challenge[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [filter, setFilter] =
        useState('ALL');

    useEffect(() => {
        const loadChallenges = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const result =
                    await api.getChallenges();

                setChallenges(
                    result.data.challenges
                );
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
    }, []);

    const filteredChallenges =
        useMemo(() => {
            if (filter === 'ALL') {
                return challenges;
            }

            return challenges.filter(
                (challenge) =>
                    challenge.status === filter
            );
        }, [challenges, filter]);

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

            default:
                return 'text-gray-400 bg-white/10';
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

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">

                    {[
                        'ALL',
                        'OPEN',
                        'IN_PROGRESS',
                        'COMPLETED',
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
                                ${
                                    filter === status
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
                                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">

                                            <div>
                                                <p className="text-xs text-gray-600">
                                                    Deadline
                                                </p>

                                                <p className="text-sm text-gray-400 mt-1">
                                                    {formatDate(
                                                        challenge.deadline
                                                    )}
                                                </p>
                                            </div>

                                            <Link
                                                to={`/challenges/${challenge._id}`}
                                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl text-sm transition"
                                            >
                                                View Challenge
                                            </Link>

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
