import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

const ChallengeDetails = () => {
    const { challengeId } = useParams();

    const [challenge, setChallenge] =
        useState<Challenge | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showApplyModal, setShowApplyModal] =
        useState(false);

    const [motivation, setMotivation] =
        useState('');

    const [skills, setSkills] =
        useState('');

    const [submitting, setSubmitting] =
        useState(false);

    const [applicationMessage, setApplicationMessage] =
        useState('');

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                setLoading(true);
                setError('');

                if (!challengeId) {
                    throw new Error(
                        'Challenge ID is missing'
                    );
                }

                const result =
                    await api.getChallengeById(
                        challengeId
                    );

                setChallenge(result.data.challenge);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load challenge'
                );
            } finally {
                setLoading(false);
            }
        };

        loadChallenge();
    }, [challengeId]);

    const isOpen =
        challenge?.status === 'OPEN' &&
        challenge?.deadline &&
        new Date(challenge.deadline) > new Date();

    const handleApply = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        if (!challengeId) {
            return;
        }

        if (motivation.trim().length < 20) {
            setApplicationMessage(
                'Motivation must be at least 20 characters.'
            );
            return;
        }

        const skillsArray = skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);

        try {
            setSubmitting(true);
            setApplicationMessage('');

            await api.createApplication({
                challenge: challengeId,
                motivation: motivation.trim(),
                skills: skillsArray,
            });

            setApplicationMessage(
                'Application submitted successfully.'
            );

            setMotivation('');
            setSkills('');
        } catch (error) {
            setApplicationMessage(
                error instanceof Error
                    ? error.message
                    : 'Failed to submit application'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        if (submitting) return;

        setShowApplyModal(false);
        setApplicationMessage('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white p-6">
                <div className="max-w-5xl mx-auto animate-pulse">

                    <div className="h-4 w-40 bg-white/5 rounded" />

                    <div className="mt-8 rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
                        <div className="h-5 w-20 bg-white/5 rounded" />

                        <div className="mt-6 h-10 w-3/4 bg-white/5 rounded" />

                        <div className="mt-5 space-y-3">
                            <div className="h-4 w-full bg-white/5 rounded" />
                            <div className="h-4 w-5/6 bg-white/5 rounded" />
                            <div className="h-4 w-4/6 bg-white/5 rounded" />
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    if (error || !challenge) {
        return (
            <div className="min-h-screen bg-[#050505] text-white p-6">
                <div className="max-w-5xl mx-auto">

                    <Link
                        to="/challenges"
                        className="text-gray-500 hover:text-white transition"
                    >
                        ← Back to Challenges
                    </Link>

                    <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                        <h2 className="text-lg font-semibold text-red-400">
                            Unable to load challenge
                        </h2>

                        <p className="mt-2 text-gray-400">
                            {error || 'Challenge not found'}
                        </p>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[#050505] text-white p-6">

                <div className="max-w-5xl mx-auto">

                    {/* Back */}
                    <Link
                        to="/challenges"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-white transition"
                    >
                        ← Back to Challenges
                    </Link>

                    {/* Main Card */}
                    <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl shadow-black/40">

                        {/* Header */}
                        <div className="border-b border-white/10 p-8">

                            <div className="flex flex-wrap items-center justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            challenge.status ===
                                            'OPEN'
                                                ? 'bg-green-400 shadow-lg shadow-green-400/40'
                                                : 'bg-gray-500'
                                        }`}
                                    />

                                    <span
                                        className={`text-sm font-medium ${
                                            challenge.status ===
                                            'OPEN'
                                                ? 'text-green-400'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {challenge.status}
                                    </span>

                                </div>

                                <div className="text-sm text-gray-500">
                                    Deadline:{' '}
                                    <span className="text-gray-300">
                                        {new Date(
                                            challenge.deadline
                                        ).toLocaleDateString(
                                            'en-IN',
                                            {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            }
                                        )}
                                    </span>
                                </div>

                            </div>

                            <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
                                {challenge.title}
                            </h1>

                            <p className="mt-5 max-w-3xl text-gray-400 leading-7">
                                {challenge.description}
                            </p>

                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3">

                            {/* Main */}
                            <div className="lg:col-span-2 p-8">

                                <section>
                                    <h2 className="text-lg font-semibold">
                                        About this challenge
                                    </h2>

                                    <p className="mt-4 text-gray-400 leading-7">
                                        This challenge is looking
                                        for practical solutions
                                        that can create meaningful
                                        real-world impact.
                                    </p>
                                </section>

                                {/* Skills */}
                                <section className="mt-10">

                                    <h2 className="text-lg font-semibold">
                                        Required Skills
                                    </h2>

                                    <div className="flex flex-wrap gap-2 mt-4">

                                        {challenge.skills.length >
                                        0 ? (
                                            challenge.skills.map(
                                                (skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300"
                                                    >
                                                        {skill}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <span className="text-gray-500">
                                                No specific skills
                                                listed
                                            </span>
                                        )}

                                    </div>

                                </section>

                                {/* Eligibility */}
                                <section className="mt-10">

                                    <h2 className="text-lg font-semibold">
                                        Eligibility
                                    </h2>

                                    <p className="mt-4 text-gray-400 leading-7">
                                        {challenge.eligibility}
                                    </p>

                                </section>

                            </div>

                            {/* Sidebar */}
                            <aside className="border-t lg:border-t-0 lg:border-l border-white/10 bg-white/[0.015] p-8">

                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-600">
                                        Challenge Status
                                    </p>

                                    <p className="mt-2 text-lg font-semibold">
                                        {challenge.status}
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <p className="text-xs uppercase tracking-wider text-gray-600">
                                        Application Deadline
                                    </p>

                                    <p className="mt-2 text-gray-300">
                                        {new Date(
                                            challenge.deadline
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

                                <div className="mt-8">

                                    {isOpen ? (
                                        <button
                                            onClick={() =>
                                                setShowApplyModal(
                                                    true
                                                )
                                            }
                                            className="w-full rounded-xl bg-purple-600 px-5 py-3.5 font-medium text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500 hover:shadow-purple-900/40"
                                        >
                                            Apply to Challenge
                                        </button>
                                    ) : (
                                        <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center">
                                            <p className="text-sm text-gray-500">
                                                Applications are
                                                currently closed.
                                            </p>
                                        </div>
                                    )}

                                </div>

                                {isOpen && (
                                    <p className="mt-4 text-center text-xs text-gray-600">
                                        Your application will be
                                        reviewed by the challenge
                                        organizers.
                                    </p>
                                )}

                            </aside>

                        </div>

                    </div>

                </div>

            </div>

            {/* Application Modal */}
            {showApplyModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#090909] shadow-2xl shadow-black">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                            <div>
                                <h2 className="text-xl font-semibold">
                                    Apply to Challenge
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {challenge.title}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                            >
                                ✕
                            </button>

                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleApply}
                            className="p-6"
                        >

                            <div>
                                <label className="block text-sm font-medium text-gray-300">
                                    Why are you interested?
                                </label>

                                <p className="mt-1 text-xs text-gray-600">
                                    Explain your motivation,
                                    experience, and what you
                                    can contribute.
                                </p>

                                <textarea
                                    value={motivation}
                                    onChange={(event) =>
                                        setMotivation(
                                            event.target.value
                                        )
                                    }
                                    rows={7}
                                    placeholder="Tell us about your motivation..."
                                    className="mt-3 block w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-gray-700 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10"
                                    style={{
                                        backgroundColor:
                                            '#050505',
                                        color: '#ffffff',
                                    }}
                                    required
                                />

                                <div className="mt-2 flex justify-between text-xs text-gray-600">
                                    <span>
                                        Minimum 20 characters
                                    </span>

                                    <span>
                                        {motivation.length}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-7">

                                <label className="block text-sm font-medium text-gray-300">
                                    Skills
                                </label>

                                <p className="mt-1 text-xs text-gray-600">
                                    Add the technologies or
                                    skills you can contribute.
                                </p>

                                <input
                                    type="text"
                                    value={skills}
                                    onChange={(event) =>
                                        setSkills(
                                            event.target.value
                                        )
                                    }
                                    placeholder="React, Node.js, MongoDB"
                                    className="mt-3 block w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-gray-700 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10"
                                    style={{
                                        backgroundColor:
                                            '#050505',
                                        color: '#ffffff',
                                    }}
                                />

                            </div>

                            {/* Message */}
                            {applicationMessage && (
                                <div
                                    className={`mt-6 rounded-xl border p-4 ${
                                        applicationMessage.includes(
                                            'successfully'
                                        )
                                            ? 'border-green-500/20 bg-green-500/5'
                                            : 'border-red-500/20 bg-red-500/5'
                                    }`}
                                >
                                    <p
                                        className={
                                            applicationMessage.includes(
                                                'successfully'
                                            )
                                                ? 'text-sm text-green-400'
                                                : 'text-sm text-red-400'
                                        }
                                    >
                                        {applicationMessage}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting
                                        ? 'Submitting...'
                                        : 'Submit Application'}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}
        </>
    );
};

export default ChallengeDetails;