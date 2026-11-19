
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom';
import {
    api, createSolutionEvidenceDownloadUrl, createSolutionEvidenceUploadUrl, uploadFileToS3,
    saveSolutionEvidence,
} from '../services/api';
import type {
    Solution,
    SolutionReviewStatus,
    SolutionImplementationStatus,
} from '../types/solution';


type PopulatedReference =
    | string
    | {
        _id?: string;
        name?: string;
        title?: string;
        email?: string;
    }
    | null
    | undefined;

function getReferenceId(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && '_id' in value) {
        return String(value._id);
    }
    return '';
}

function getReferenceName(
    value: PopulatedReference,
    fallback = 'Not available',
): string {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    return value.name || value.title || value.email || value._id || fallback;
}

function getStatusClass(status: string): string {
    switch (status) {
        case 'APPROVED':
        case 'COMPLETED':
            return 'border-green-500/30 bg-green-500/10 text-green-300';

        case 'REJECTED':
        case 'ON_HOLD':
            return 'border-red-500/30 bg-red-500/10 text-red-300';

        case 'REVISION_REQUESTED':
        case 'IN_PROGRESS':
            return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';

        default:
            return 'border-white/10 bg-white/5 text-gray-300';
    }
}

function formatStatus(status: string): string {
    return status
        .split('_')
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

function formatDate(value?: string): string {
    if (!value) return 'Not specified';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Not specified';

    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(status)}`}
        >
            {formatStatus(status)}
        </span>
    );
}



export default function SolutionDetails() {
    const { solutionId } = useParams<{ solutionId: string }>();

    const [solution, setSolution] = useState<Solution | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    const [isTeamMember, setIsTeamMember] = useState(false);

    const canManageImplementation =
        isTeamMember &&
        !!solution &&
        solution.reviewStatus === 'APPROVED' &&
        solution.implementationStatus !== 'COMPLETED';



    const [implementationStatus, setImplementationStatus] =
        useState<SolutionImplementationStatus>('NOT_STARTED');

    const [savingImplementation, setSavingImplementation] = useState(false);
    const [implementationMessage, setImplementationMessage] = useState('');
    const [implementationError, setImplementationError] = useState('');


    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [milestoneDescription, setMilestoneDescription] = useState('');
    const [milestoneDueDate, setMilestoneDueDate] = useState('');

    const [savingMilestone, setSavingMilestone] = useState(false);
    const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(
        null,
    );
    const [milestoneMessage, setMilestoneMessage] = useState('');
    const [milestoneError, setMilestoneError] = useState('');

    const [impactName, setImpactName] = useState('');
    const [impactDescription, setImpactDescription] = useState('');
    const [impactUnit, setImpactUnit] = useState('');
    const [impactBaseline, setImpactBaseline] = useState('');
    const [impactMeasured, setImpactMeasured] = useState('');
    const [impactMeasuredAt, setImpactMeasuredAt] = useState('');
    const [impactNotes, setImpactNotes] = useState('');

    const [savingImpact, setSavingImpact] = useState(false);
    const [impactMessage, setImpactMessage] = useState('');
    const [impactError, setImpactError] = useState('');

    const [uploadingEvidence, setUploadingEvidence] = useState(false);
    const [evidenceError, setEvidenceError] = useState('');
    const [evidenceMessage, setEvidenceMessage] = useState('');
    const [openingEvidenceKey, setOpeningEvidenceKey] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadSolution() {
            if (!solutionId) {
                setError('No solution ID was provided.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');
                setIsTeamMember(false);
                setImplementationError('');

                const result = await api.getSolutionById(solutionId);

                if (!cancelled) {
                    setSolution(result.data.solution);
                    setImplementationStatus(
                        result.data.solution.implementationStatus,
                    );
                }

                try {
                    const memberships = await api.getMyTeams();
                    const teamId = getReferenceId(result.data.solution.team);
                    if (!cancelled) {
                        setIsTeamMember((memberships.data.teams ?? []).some(
                            (membership: { team: unknown }) => getReferenceId(membership.team) === teamId
                        ));
                    }
                } catch {
                    if (!cancelled) {
                        setImplementationError('Unable to verify team membership. Reload to enable implementation changes.');
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load solution details.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSolution();

        return () => {
            cancelled = true;
        };
    }, [solutionId]);

    const handleEvidenceUpload = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file || !solution) return;

        setEvidenceError('');
        setEvidenceMessage('');

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
            setEvidenceError('Choose a JPEG, PNG, or WebP image.');
            event.target.value = '';
            return;
        }

        if (file.size < 1 || file.size > 10 * 1024 * 1024) {
            setEvidenceError('The image must be between 1 byte and 10 MB.');
            event.target.value = '';
            return;
        }

        if (solution.implementationStatus === 'COMPLETED') {
            setEvidenceError(
                'Evidence cannot be added after implementation is completed.'
            );
            event.target.value = '';
            return;
        }

        setUploadingEvidence(true);

        try {
            // 1. Ask the backend for a presigned S3 upload URL.
            const uploadResult = await createSolutionEvidenceUploadUrl(
                solution._id,
                file
            );

            const { uploadUrl, key } = uploadResult.data;

            // 2. Upload the actual file directly to S3.
            await uploadFileToS3(uploadUrl, file);

            // 3. Ask the backend to validate and attach the evidence.
            const saveResult = await saveSolutionEvidence(solution._id, {
                key,
                originalName: file.name,
                contentType: file.type,
                size: file.size,
            });

            setSolution(saveResult.data.solution);

            setEvidenceMessage('Evidence uploaded successfully.');
        } catch (error) {
            setEvidenceError(
                error instanceof Error
                    ? error.message
                    : 'Failed to upload evidence.'
            );
        } finally {
            setUploadingEvidence(false);
            event.target.value = '';
        }
    };

    const handleOpenEvidence = async (key: string) => {
        setEvidenceError('');
        setEvidenceMessage('');
        setOpeningEvidenceKey(key);

        try {
            const result = await createSolutionEvidenceDownloadUrl(
                solutionId as string,
                key
            );

            const downloadUrl = result.data.downloadUrl;

            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            setEvidenceError(
                error instanceof Error
                    ? error.message
                    : 'Failed to open evidence.'
            );
        } finally {
            setOpeningEvidenceKey('');
        }
    };

    async function handleImplementationUpdate() {
        if (!solution || savingImplementation) return;

        setSavingImplementation(true);
        setImplementationMessage('');
        setImplementationError('');

        try {
            const result = await api.updateSolutionImplementation(
                solution._id,
                implementationStatus,
            );

            const updatedSolution =
                result.data.solution ?? result.data;

            if (updatedSolution.implementationStatus) {
                setSolution((current) =>
                    current
                        ? {
                            ...current,
                            ...updatedSolution,
                        }
                        : current,
                );

                setImplementationStatus(
                    updatedSolution.implementationStatus,
                );
            } else {
                const refreshed = await api.getSolutionById(solution._id);
                setSolution(refreshed.data.solution);
                setImplementationStatus(
                    refreshed.data.solution.implementationStatus,
                );
            }

            setImplementationMessage('Implementation status updated.');
        } catch (err) {
            setImplementationError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update implementation status.',
            );
        } finally {
            setSavingImplementation(false);
        }
    }

    async function handleAddMilestone(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!solution || savingMilestone || !milestoneTitle.trim()) return;

        setSavingMilestone(true);
        setMilestoneMessage('');
        setMilestoneError('');

        try {
            await api.addSolutionMilestone(solution._id, {
                title: milestoneTitle.trim(),
                ...(milestoneDescription.trim()
                    ? { description: milestoneDescription.trim() }
                    : {}),
                ...(milestoneDueDate
                    ? { dueDate: milestoneDueDate }
                    : {}),
            });

            const refreshed = await api.getSolutionById(solution._id);
            setSolution(refreshed.data.solution);

            setMilestoneTitle('');
            setMilestoneDescription('');
            setMilestoneDueDate('');
            setMilestoneMessage('Milestone added successfully.');
        } catch (err) {
            setMilestoneError(
                err instanceof Error ? err.message : 'Failed to add milestone.',
            );
        } finally {
            setSavingMilestone(false);
        }
    }

    async function handleMilestoneStatusChange(
        milestoneId: string,
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    ) {
        if (!solution || updatingMilestoneId) return;

        setUpdatingMilestoneId(milestoneId);
        setMilestoneMessage('');
        setMilestoneError('');

        try {
            await api.updateSolutionMilestone(solution._id, milestoneId, status);

            const refreshed = await api.getSolutionById(solution._id);
            setSolution(refreshed.data.solution);

            setMilestoneMessage('Milestone status updated.');
        } catch (err) {
            setMilestoneError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update milestone status.',
            );
        } finally {
            setUpdatingMilestoneId(null);
        }
    }

    async function handleRecordImpact(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!solution || savingImpact) return;

        setSavingImpact(true);
        setImpactMessage('');
        setImpactError('');

        try {
            await api.recordSolutionImpact(solution._id, {
                name: impactName.trim(),
                unit: impactUnit.trim(),

                ...(impactDescription.trim()
                    ? { description: impactDescription.trim() }
                    : {}),

                ...(impactBaseline.trim() !== ''
                    ? { baselineValue: Number(impactBaseline) }
                    : {}),

                ...(impactMeasured.trim() !== ''
                    ? { measuredValue: Number(impactMeasured) }
                    : {}),

                ...(impactMeasuredAt
                    ? { measuredAt: impactMeasuredAt }
                    : {}),

                ...(impactNotes.trim()
                    ? { notes: impactNotes.trim() }
                    : {}),
            });

            const refreshed = await api.getSolutionById(solution._id);
            setSolution(refreshed.data.solution);

            setImpactName('');
            setImpactDescription('');
            setImpactUnit('');
            setImpactBaseline('');
            setImpactMeasured('');
            setImpactMeasuredAt('');
            setImpactNotes('');

            setImpactMessage('Impact measurement recorded successfully.');
        } catch (err) {
            setImpactError(
                err instanceof Error
                    ? err.message
                    : 'Failed to record impact measurement.',
            );
        } finally {
            setSavingImpact(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
                Loading solution details...
            </div>
        );
    }

    if (error || !solution) {
        return (
            <div className="mx-auto max-w-4xl space-y-4 p-6">
                <Link
                    to="/solutions"
                    className="text-sm text-purple-300 hover:text-purple-200"
                >
                    ← Back to Solutions
                </Link>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-red-300">
                    {error || 'Solution not found.'}
                </div>
            </div>
        );
    }

    const challengeName = getReferenceName(
        solution.challenge as unknown as PopulatedReference,
    );

    const teamName = getReferenceName(
        solution.team as unknown as PopulatedReference,
    );

    const submitterName = getReferenceName(
        solution.submittedBy as unknown as PopulatedReference,
    );

    const canManageMilestones =
        canManageImplementation &&
        solution.reviewStatus === 'APPROVED' &&
        solution.implementationStatus !== 'COMPLETED';

    const canManageImpact =
        canManageImplementation &&
        solution.reviewStatus === 'APPROVED' &&
        solution.implementationStatus !== 'COMPLETED';

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 text-white sm:p-6">
            <Link
                to="/solutions"
                className="inline-flex text-sm text-purple-300 transition hover:text-purple-200"
            >
                ← Back to Solutions
            </Link>

            {/* Solution header */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                            Solution Details
                        </p>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            {solution.title}
                        </h1>

                        <p className="max-w-3xl whitespace-pre-wrap leading-7 text-gray-300">
                            {solution.description}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatusBadge
                            status={
                                solution.reviewStatus as SolutionReviewStatus
                            }
                        />
                        <StatusBadge
                            status={
                                solution.implementationStatus as SolutionImplementationStatus
                            }
                        />
                    </div>
                </div>

                <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs text-gray-500">Challenge</p>
                        <p className="mt-1 font-medium">{challengeName}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Team</p>
                        <p className="mt-1 font-medium">{teamName}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Submitted by</p>
                        <p className="mt-1 break-words font-medium">
                            {submitterName}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Submitted on</p>
                        <p className="mt-1 font-medium">
                            {formatDate(solution.createdAt)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Proposed approach */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold">Proposed Approach</h2>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-300">
                    {solution.approach || 'No approach has been provided.'}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/[0.03] p-4">
                        <p className="text-sm text-gray-500">Estimated Cost</p>
                        <p className="mt-2 text-xl font-semibold">
                            {solution.estimatedCost != null
                                ? `₹${solution.estimatedCost.toLocaleString('en-IN')}`
                                : 'Not specified'}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] p-4">
                        <p className="text-sm text-gray-500">
                            Estimated Completion
                        </p>
                        <p className="mt-2 text-xl font-semibold">
                            {formatDate(solution.estimatedCompletionDate)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Review information */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold">Review Information</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-sm text-gray-500">Reviewed by</p>
                        <p className="mt-1">
                            {getReferenceName(
                                solution.reviewedBy as unknown as PopulatedReference,
                                'Not reviewed yet',
                            )}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Review date</p>
                        <p className="mt-1">
                            {formatDate(solution.reviewedAt)}
                        </p>
                    </div>
                </div>

                {solution.reviewNote && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm text-gray-500">Reviewer feedback</p>
                        <p className="mt-2 whitespace-pre-wrap text-gray-300">
                            {solution.reviewNote}
                        </p>
                    </div>
                )}
            </section>


            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold">
                    Implementation Management
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                    Track the current progress of this solution.
                </p>

                {canManageImplementation ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                            value={implementationStatus}
                            onChange={(event) =>
                                setImplementationStatus(
                                    event.target.value as SolutionImplementationStatus,
                                )
                            }
                            disabled={savingImplementation}
                            className="rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500"
                        >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <button
                            type="button"
                            onClick={handleImplementationUpdate}
                            disabled={
                                savingImplementation ||
                                implementationStatus === solution.implementationStatus
                            }
                            className="rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {savingImplementation ? 'Saving...' : 'Save Status'}
                        </button>
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-gray-400">
                        You can view implementation progress but cannot change it.
                    </p>
                )}

                {implementationMessage && (
                    <p className="mt-3 text-sm text-green-400">
                        {implementationMessage}
                    </p>
                )}

                {implementationError && (
                    <p className="mt-3 text-sm text-red-400">
                        {implementationError}
                    </p>
                )}
            </section>

            {/* Milestones */}

            {/* Milestones */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Milestones</h2>
                    <span className="text-sm text-gray-500">
                        {solution.milestones.length} total
                    </span>
                </div>

                {canManageMilestones && (
                    <form
                        onSubmit={handleAddMilestone}
                        className="mt-5 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                        <h3 className="font-medium">Add a milestone</h3>

                        <div>
                            <label
                                htmlFor="milestone-title"
                                className="mb-2 block text-sm text-gray-300"
                            >
                                Title
                            </label>
                            <input
                                id="milestone-title"
                                value={milestoneTitle}
                                onChange={(event) => setMilestoneTitle(event.target.value)}
                                required
                                maxLength={150}
                                placeholder="e.g. Complete initial prototype"
                                disabled={savingMilestone}
                                className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="milestone-description"
                                className="mb-2 block text-sm text-gray-300"
                            >
                                Description (optional)
                            </label>
                            <textarea
                                id="milestone-description"
                                value={milestoneDescription}
                                onChange={(event) =>
                                    setMilestoneDescription(event.target.value)
                                }
                                rows={3}
                                maxLength={2000}
                                placeholder="Describe what this milestone should achieve..."
                                disabled={savingMilestone}
                                className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="milestone-due-date"
                                className="mb-2 block text-sm text-gray-300"
                            >
                                Due date (optional)
                            </label>
                            <input
                                id="milestone-due-date"
                                type="date"
                                value={milestoneDueDate}
                                onChange={(event) => setMilestoneDueDate(event.target.value)}
                                disabled={savingMilestone}
                                className="rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingMilestone || !milestoneTitle.trim()}
                            className="rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {savingMilestone ? 'Adding milestone...' : 'Add Milestone'}
                        </button>
                    </form>
                )}

                {solution.reviewStatus !== 'APPROVED' && (
                    <p className="mt-4 text-sm text-gray-400">
                        Milestones can be managed after the solution is approved.
                    </p>
                )}

                {solution.reviewStatus === 'APPROVED' &&
                    solution.implementationStatus === 'COMPLETED' && (
                        <p className="mt-4 text-sm text-gray-400">
                            This solution is completed, so milestone changes are disabled.
                        </p>
                    )}

                {solution.milestones.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-400">
                        No milestones have been added yet.
                    </p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {solution.milestones.map((milestone) => (
                            <div
                                key={milestone._id}
                                className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-start"
                            >
                                <div className="min-w-0">
                                    <h3 className="font-medium">{milestone.title}</h3>

                                    {milestone.description && (
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-400">
                                            {milestone.description}
                                        </p>
                                    )}

                                    <p className="mt-2 text-xs text-gray-500">
                                        Due: {formatDate(milestone.dueDate)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                    {canManageMilestones &&
                                        milestone.status !== 'COMPLETED' ? (
                                        <>
                                            <label
                                                htmlFor={`milestone-status-${milestone._id}`}
                                                className="text-xs text-gray-400"
                                            >
                                                Update status
                                            </label>

                                            <select
                                                id={`milestone-status-${milestone._id}`}
                                                value={milestone.status}
                                                disabled={updatingMilestoneId !== null}
                                                onChange={(event) => {
                                                    void handleMilestoneStatusChange(
                                                        milestone._id,
                                                        event.target.value as
                                                        | 'PENDING'
                                                        | 'IN_PROGRESS'
                                                        | 'COMPLETED',
                                                    );
                                                }}
                                                className="rounded-lg border border-white/10 bg-[#17131f] px-3 py-2 text-sm text-white outline-none focus:border-purple-500 disabled:opacity-50"
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="IN_PROGRESS">
                                                    In Progress
                                                </option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>

                                            {updatingMilestoneId === milestone._id && (
                                                <span className="text-xs text-gray-400">
                                                    Saving...
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <StatusBadge status={milestone.status} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {milestoneMessage && (
                    <p className="mt-4 text-sm text-green-400" role="status">
                        {milestoneMessage}
                    </p>
                )}

                {milestoneError && (
                    <p className="mt-4 text-sm text-red-400" role="alert">
                        {milestoneError}
                    </p>
                )}
            </section>


            {/* Impact indicators */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">



                {canManageImpact && (
                    <form
                        onSubmit={handleRecordImpact}
                        className="mt-5 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                        <h3 className="font-medium">Record an impact measurement</h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="impact-name" className="mb-2 block text-sm text-gray-300">
                                    Indicator name
                                </label>
                                <input
                                    id="impact-name"
                                    value={impactName}
                                    onChange={(event) => setImpactName(event.target.value)}
                                    required
                                    maxLength={150}
                                    placeholder="e.g. People helped"
                                    disabled={savingImpact}
                                    className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="impact-unit" className="mb-2 block text-sm text-gray-300">
                                    Unit
                                </label>
                                <input
                                    id="impact-unit"
                                    value={impactUnit}
                                    onChange={(event) => setImpactUnit(event.target.value)}
                                    required
                                    maxLength={50}
                                    placeholder="e.g. people, kg, hours"
                                    disabled={savingImpact}
                                    className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="impact-description" className="mb-2 block text-sm text-gray-300">
                                Description (optional)
                            </label>
                            <textarea
                                id="impact-description"
                                value={impactDescription}
                                onChange={(event) => setImpactDescription(event.target.value)}
                                rows={2}
                                maxLength={2000}
                                placeholder="What does this indicator measure?"
                                disabled={savingImpact}
                                className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="impact-baseline" className="mb-2 block text-sm text-gray-300">
                                    Baseline value (optional)
                                </label>
                                <input
                                    id="impact-baseline"
                                    type="number"
                                    step="any"
                                    value={impactBaseline}
                                    onChange={(event) => setImpactBaseline(event.target.value)}
                                    disabled={savingImpact}
                                    placeholder="Before implementation"
                                    className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="impact-measured" className="mb-2 block text-sm text-gray-300">
                                    Measured value (optional)
                                </label>
                                <input
                                    id="impact-measured"
                                    type="number"
                                    step="any"
                                    value={impactMeasured}
                                    onChange={(event) => setImpactMeasured(event.target.value)}
                                    disabled={savingImpact}
                                    placeholder="Current result"
                                    className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="impact-date" className="mb-2 block text-sm text-gray-300">
                                Measurement date (optional)
                            </label>
                            <input
                                id="impact-date"
                                type="date"
                                value={impactMeasuredAt}
                                onChange={(event) => setImpactMeasuredAt(event.target.value)}
                                disabled={savingImpact}
                                className="rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label htmlFor="impact-notes" className="mb-2 block text-sm text-gray-300">
                                Notes (optional)
                            </label>
                            <textarea
                                id="impact-notes"
                                value={impactNotes}
                                onChange={(event) => setImpactNotes(event.target.value)}
                                rows={3}
                                maxLength={3000}
                                placeholder="Explain the result or how it was measured..."
                                disabled={savingImpact}
                                className="w-full rounded-lg border border-white/10 bg-[#17131f] px-4 py-3 text-white outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingImpact || !impactName.trim() || !impactUnit.trim()}
                            className="rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {savingImpact ? 'Recording...' : 'Record Impact'}
                        </button>
                    </form>
                )}

                {solution.reviewStatus !== 'APPROVED' && (
                    <p className="mt-4 text-sm text-gray-400">
                        Impact measurements can be recorded after the solution is approved.
                    </p>
                )}

                {solution.reviewStatus === 'APPROVED' &&
                    solution.implementationStatus === 'COMPLETED' && (
                        <p className="mt-4 text-sm text-gray-400">
                            This solution is completed, so new impact measurements cannot be recorded.
                        </p>
                    )}

                {impactMessage && (
                    <p className="mt-4 text-sm text-green-400" role="status">
                        {impactMessage}
                    </p>
                )}

                {impactError && (
                    <p className="mt-4 text-sm text-red-400" role="alert">
                        {impactError}
                    </p>
                )}

                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Impact Indicators</h2>
                    <span className="text-sm text-gray-500">
                        {solution.impactIndicators.length} recorded
                    </span>
                </div>

                {solution.impactIndicators.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-400">
                        No impact measurements have been recorded yet.
                    </p>
                ) : (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {solution.impactIndicators.map((indicator, index) => (
                            <div
                                key={indicator._id || `${indicator.name}-${index}`}
                                className="rounded-xl border border-white/10 p-4"
                            >
                                <h3 className="font-medium">{indicator.name}</h3>

                                {indicator.description && (
                                    <p className="mt-1 text-sm text-gray-400">
                                        {indicator.description}
                                    </p>
                                )}

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Baseline
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {indicator.baselineValue ?? '—'}{' '}
                                            {indicator.baselineValue != null
                                                ? indicator.unit
                                                : ''}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Measured
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {indicator.measuredValue ?? '—'}{' '}
                                            {indicator.measuredValue != null
                                                ? indicator.unit
                                                : ''}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    Measured: {formatDate(indicator.measuredAt)}
                                </p>

                                {indicator.notes && (
                                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">
                                        {indicator.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {canManageImplementation && (
                    <div className="mb-4">
                        <label
                            htmlFor="solution-evidence-upload"
                            className="mb-2 block text-sm font-medium"
                        >
                            Upload implementation evidence
                        </label>

                        <input
                            id="solution-evidence-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={uploadingEvidence}
                            onChange={handleEvidenceUpload}
                            className="block w-full text-sm"
                        />

                        <p className="mt-1 text-xs text-gray-400">
                            JPEG, PNG, or WebP. Maximum file size: 10 MB.
                        </p>

                        {uploadingEvidence && (
                            <p className="mt-2 text-sm">
                                Uploading evidence…
                            </p>
                        )}
                    </div>
                )}

            {evidenceError && (
                <p role="alert" className="mb-3 text-sm text-red-400">
                    {evidenceError}
                </p>
            )}

            {evidenceMessage && (
                <p role="status" className="mb-3 text-sm text-green-400">
                    {evidenceMessage}
                </p>
            )}

            {/* Evidence */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Evidence</h2>
                    <span className="text-sm text-gray-500">
                        {solution.evidence.length} files
                    </span>
                </div>

                {solution.evidence.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-400">
                        No evidence files have been attached yet.
                    </p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {solution.evidence.map((file, index) => (
                            <div
                                key={file._id || `${file.key}-${index}`}
                                className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="break-words font-medium">
                                        {file.originalName}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {file.contentType} ·{' '}
                                        {(file.size / 1024).toFixed(1)} KB ·{' '}
                                        {formatDate(file.uploadedAt)}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenEvidence(file.key)}
                                        disabled={openingEvidenceKey === file.key}
                                        className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                                    >
                                        {openingEvidenceKey === file.key
                                            ? 'Opening…'
                                            : 'View evidence'}
                                    </button>

                                </div>
                            </div>


                        ))}
                    </div>


                )}
            </section>

            {/* Activity history */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Activity History</h2>
                    <span className="text-sm text-gray-500">
                        {solution.history.length} events
                    </span>
                </div>

                {solution.history.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-400">
                        No activity has been recorded yet.
                    </p>
                ) : (
                    <div className="mt-5 space-y-4">
                        {solution.history.map((event, index) => (
                            <div
                                key={event._id || `${event.action}-${index}`}
                                className="relative border-l border-purple-500/30 pb-2 pl-5"
                            >
                                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-purple-400" />

                                <div className="flex flex-col justify-between gap-1 sm:flex-row">
                                    <p className="font-medium">
                                        {formatStatus(event.action)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatDate(event.changedAt)}
                                    </p>
                                </div>

                                {(event.from || event.to) && (
                                    <p className="mt-1 text-sm text-gray-400">
                                        {event.from
                                            ? formatStatus(event.from)
                                            : '—'}
                                        {' → '}
                                        {event.to
                                            ? formatStatus(event.to)
                                            : '—'}
                                    </p>
                                )}

                                {event.note && (
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-400">
                                        {event.note}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
