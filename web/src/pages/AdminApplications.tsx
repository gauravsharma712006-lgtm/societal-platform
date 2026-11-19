
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';

interface Applicant {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface Application {
    _id: string;
    applicant: Applicant;
    motivation: string;
    skills: string[];
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    reviewNote?: string;
    createdAt: string;
}

const AdminApplications = () => {
    const { challengeId } = useParams<{ challengeId: string }>();

    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadApplications = async () => {
        if (!challengeId) {
            setError('Challenge ID is missing.');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const result = await api.getApplicationsForChallenge(challengeId);
            setApplications(result.data.applications || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load applications.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadApplications();
    }, [challengeId]);

    const handleReview = async (
        applicationId: string,
        status: 'ACCEPTED' | 'REJECTED'
    ) => {
        setActionError('');
        setSuccessMessage('');
        const reviewNote = reviewNotes[applicationId]?.trim() || '';

        if (status === 'REJECTED' && !reviewNote.trim()) {
            setActionError('Please provide a reason before rejecting.');
            return;
        }

        try {
            setReviewingId(applicationId);

            await api.reviewApplication(applicationId, {
                status,
                ...(status === 'REJECTED'
                    ? { reviewNote: reviewNote.trim() }
                    : {}),
            });

            setApplications((current) =>
                current.map((application) =>
                    application._id === applicationId
                        ? {
                              ...application,
                              status,
                              reviewNote:
                                  status === 'REJECTED'
                                      ? reviewNote.trim()
                                      : undefined,
                          }
                        : application
                )
            );

            setReviewNotes((current) => ({ ...current, [applicationId]: '' }));
            setSuccessMessage(
                status === 'ACCEPTED'
                    ? 'Application accepted successfully.'
                    : 'Application rejected successfully.'
            );
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Failed to review application.'
            );
        } finally {
            setReviewingId(null);
        }
    };

    return (
        <div className="p-5 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link
                    to="/challenges"
                    className="text-purple-400 hover:text-purple-300 text-sm"
                >
                    ← Back to Challenges
                </Link>

                <div className="mt-5 mb-8">
                    <p className="text-sm text-purple-400 mb-2">
                        Administration
                    </p>
                    <h1 className="text-3xl font-bold">
                        Review Applications
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Review applicant details and decide who can participate
                        in this challenge.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
                        {error}
                    </div>
                )}

                {actionError && (
                    <div className="mb-5 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
                        {actionError}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-5 p-4 rounded-xl border border-green-500/20 bg-green-500/10 text-green-300">
                        {successMessage}
                    </div>
                )}

                {isLoading ? (
                    <p className="text-gray-400">
                        Loading applications...
                    </p>
                ) : !error && applications.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-white/10 bg-white/5 text-center">
                        <h2 className="text-xl font-semibold">
                            No applications yet
                        </h2>
                        <p className="text-gray-400 mt-2">
                            Applications submitted for this challenge will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {applications.map((application) => (
                            <article
                                key={application._id}
                                className="p-6 rounded-2xl border border-white/10 bg-white/5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {application.applicant?.name || 'Unknown applicant'}
                                        </h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {application.applicant?.email || 'No email available'}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Applied on{' '}
                                            {new Date(application.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs w-fit ${
                                            application.status === 'PENDING'
                                                ? 'bg-yellow-400/10 text-yellow-300'
                                                : application.status === 'ACCEPTED'
                                                  ? 'bg-green-400/10 text-green-300'
                                                  : 'bg-red-400/10 text-red-300'
                                        }`}
                                    >
                                        {application.status}
                                    </span>
                                </div>

                                <div className="mt-5">
                                    <h3 className="text-sm font-medium text-gray-300">
                                        Motivation
                                    </h3>
                                    <p className="text-gray-400 mt-2 whitespace-pre-wrap">
                                        {application.motivation}
                                    </p>
                                </div>

                                {application.skills?.length > 0 && (
                                    <div className="mt-5">
                                        <h3 className="text-sm font-medium text-gray-300 mb-2">
                                            Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {application.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.reviewNote && (
                                    <div className="mt-5">
                                        <h3 className="text-sm font-medium text-gray-300">
                                            Review note
                                        </h3>
                                        <p className="text-gray-400 mt-2">
                                            {application.reviewNote}
                                        </p>
                                    </div>
                                )}

                                {application.status === 'PENDING' && (
                                    <div className="mt-6 pt-5 border-t border-white/10">
                                        <label
                                            htmlFor={`review-note-${application._id}`}
                                            className="block text-sm text-gray-300 mb-2"
                                        >
                                            Rejection note
                                            <span className="text-gray-500">
                                                {' '}(required only when rejecting)
                                            </span>
                                        </label>

                                        <textarea
                                            id={`review-note-${application._id}`}
                                            rows={3}
                                            maxLength={1000}
                                            value={reviewNotes[application._id] || ''}
                                            disabled={reviewingId !== null}
                                            onChange={(event) =>
                                                setReviewNotes((current) => ({
                                                    ...current,
                                                    [application._id]: event.target.value,
                                                }))
                                            }
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                            placeholder="Explain why the application is being rejected..."
                                        />

                                        <div className="flex flex-wrap gap-3 mt-4">
                                            <button
                                                type="button"
                                                disabled={reviewingId !== null}
                                                onClick={() =>
                                                    void handleReview(
                                                        application._id,
                                                        'ACCEPTED'
                                                    )
                                                }
                                                className="px-4 py-2.5 rounded-xl text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 transition"
                                            >
                                                {reviewingId === application._id
                                                    ? 'Processing...'
                                                    : 'Accept Application'}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={reviewingId !== null}
                                                onClick={() =>
                                                    void handleReview(
                                                        application._id,
                                                        'REJECTED'
                                                    )
                                                }
                                                className="px-4 py-2.5 rounded-xl text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                                            >
                                                {reviewingId === application._id
                                                    ? 'Processing...'
                                                    : 'Reject Application'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApplications;
