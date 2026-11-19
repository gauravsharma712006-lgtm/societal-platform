import { FormEvent, useEffect, useRef, useState } from 'react';
import type { ProblemPriority, ProblemStatus } from '../types/problem';
import type { ProblemSuggestion } from '../types/ai';
import { AI_ENABLED } from '../services/api';
import EvidenceModal from '../components/EvidenceModal';
import LocationPicker, {
    type GeoPoint,
} from '../components/LocationPicker';


import {
    api, createMediaDownloadUrl, createMediaUploadUrl,
    saveProblemMedia,
    uploadFileToS3,
} from '../services/api';



interface Problem {
    _id: string;
    title: string;
    description: string;
    category: string | null;
    categoryId?: string | null;
    priority: ProblemPriority;
    status: ProblemStatus;
    location: {
        address: string;
        city: string;
        state: string;
    };
    media: {
        key: string;
        originalName: string;
        contentType: string;
        size: number;
    }[];

    evidenceRequests?: {
        _id: string;
        message: string;
        status: 'PENDING' | 'RESPONDED';
        requestedAt: string;
        respondedAt?: string;
        responseMediaKeys?: string[];
    }[];
}

interface CategoryNode {
    _id: string;
    name: string;
    slug: string;
    isSelectable: boolean;
    children: CategoryNode[];
}



function Problems() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeEvidenceProblem, setActiveEvidenceProblem] =
        useState<Problem | null>(null);

    const [coordinates, setCoordinates] = useState<GeoPoint | undefined>();



    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [priority, setPriority] = useState<ProblemPriority>('MEDIUM');

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [savedProblemId, setSavedProblemId] = useState<string | null>(null);
    const [submitNotice, setSubmitNotice] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadedKeys = useRef(new Map<File, string>());

    const [isImproving, setIsImproving] = useState(false);
    const [aiError, setAiError] = useState('');

    const [aiSuggestion, setAiSuggestion] =
        useState<ProblemSuggestion | null>(null);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const [mediaUrls, setMediaUrls] = useState<Record<string, string[]>>({});
    const aiRequestVersion = useRef(0);


    const [responseFiles, setResponseFiles] = useState<
        Record<string, File[]>
    >({});

    const [respondingToRequest, setRespondingToRequest] = useState<
        string | null
    >(null);

    const [responseErrors, setResponseErrors] = useState<
        Record<string, string>
    >({});

    const [responseSuccess, setResponseSuccess] = useState<
        Record<string, string>
    >({});



    const getCategoryName = (
        categoryId: string | null | undefined,
        legacyCategory: string | null
    ): string => {
        const findCategory = (
            nodes: CategoryNode[]
        ): CategoryNode | undefined => {
            for (const node of nodes) {
                if (node._id === categoryId) {
                    return node;
                }

                const child = findCategory(node.children ?? []);

                if (child) {
                    return child;
                }
            }

            return undefined;
        };

        if (categoryId) {
            const category = findCategory(categories);

            if (category) {
                return category.name;
            }
        }

        return legacyCategory?.replace(/_/g, ' ') ??
            (categoryId ? 'Category unavailable' : 'Uncategorized');
    };

    const renderCategoryOptions = (
        nodes: CategoryNode[],
        depth = 0
    ): React.ReactNode[] => nodes.flatMap((node) => [
        <option
            key={node._id}
            value={node._id}
            disabled={!node.isSelectable}
        >
            {`${'— '.repeat(depth)}${node.name}`}
        </option>,
        ...renderCategoryOptions(node.children ?? [], depth + 1),
    ]);



    const resetReportForm = () => {
        setTitle('');
        setDescription('');
        setCategoryId('');
        setPriority('MEDIUM');
        setAddress('');
        setCity('');
        setState('');
        setSelectedFiles([]);
        setCoordinates(undefined);
        setSavedProblemId(null);
        setAiSuggestion(null);
        setAiError('');
        aiRequestVersion.current += 1;
        setIsImproving(false);
        uploadedKeys.current.clear();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (isSubmitting) return;

        if (selectedFiles.length > 10 || selectedFiles.some((file) =>
            !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
            file.size === 0 || file.size > 10 * 1024 * 1024
        )) {
            setSubmitError('Select up to 10 JPEG, PNG or WebP images, each between 1 byte and 10 MB.');
            return;
        }

        if (!coordinates) {
            setSubmitError(
                'Please select the exact problem location on the map.'
            );
            return;
        }

        if (!categoryId) {
            setSubmitError('Please select a problem category.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');
        setSubmitNotice('');
        aiRequestVersion.current += 1;
        setIsImproving(false);
        setAiSuggestion(null);
        let reportId = savedProblemId;
        let remainingFiles = [...selectedFiles];

        try {
            if (!reportId) {
            const result = await api.createProblem({
                title,
                description,
                categoryId,
                priority,
                location: {
                    address,
                    city,
                    state,
                    coordinates,
                },
            });
            reportId = result.data._id;
            setSavedProblemId(reportId);
            setProblems((current) => [result.data, ...current]);
            }

            for (const file of selectedFiles) {
                let key = uploadedKeys.current.get(file);
                if (!key) {
                const uploadResult = await createMediaUploadUrl(
                    reportId!,
                    file
                );

                const uploadData = await uploadResult.json();

                if (!uploadResult.ok) {
                    throw new Error(
                        uploadData.message || `Failed to prepare upload for ${file.name}`
                    );
                }

                await uploadFileToS3(
                    uploadData.data.uploadUrl,
                    file
                );
                key = uploadData.data.key;
                uploadedKeys.current.set(file, key!);
                }

                const mediaResult = await saveProblemMedia(reportId!, {
                    key: key!,
                    originalName: file.name,
                    contentType: file.type,
                    size: file.size,
                });
                setProblems((current) => current.map((problem) =>
                    problem._id === reportId ? mediaResult.data : problem
                ));
                remainingFiles = remainingFiles.filter((pending) => pending !== file);
                setSelectedFiles(remainingFiles);
                uploadedKeys.current.delete(file);
            }
            resetReportForm();
            setSubmitNotice('Your problem report was saved.');
        } catch (error) {
            console.error(
                'Failed to create problem:',
                error
            );

            setSubmitError(
                (reportId ? 'Your report is saved. Retry the remaining images without creating another report. ' : '') + (error instanceof Error
                    ? error.message
                    : 'Failed to create problem')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImproveProblem = async () => {
        if (description.trim().length < 20) {
            setAiError(
                'Please provide at least 20 characters in the description.'
            );
            return;
        }

        const requestVersion = ++aiRequestVersion.current;

        setIsImproving(true);
        setAiError('');
        setAiSuggestion(null);

        try {
            const result = await api.improveProblem({
                title: title.trim(),
                description: description.trim(),
            });

            // Ignore the result if the form changed while AI was processing.
            if (requestVersion !== aiRequestVersion.current) {
                return;
            }

            setAiSuggestion(result.data);
        } catch (error) {
            if (requestVersion !== aiRequestVersion.current) {
                return;
            }

            console.error('AI problem improvement failed:', error);

            setAiError(
                error instanceof Error
                    ? error.message
                    : 'Unable to improve the problem report.'
            );
        } finally {
            if (requestVersion === aiRequestVersion.current) {
                setIsImproving(false);
            }
        }
    };


    const handleEvidenceResponse = async (
        event: FormEvent<HTMLFormElement>,
        problem: Problem,
        request: NonNullable<Problem['evidenceRequests']>[number]
    ) => {
        event.preventDefault();

        const files = responseFiles[request._id] ?? [];

        if (files.length === 0) {
            setResponseErrors((current) => ({
                ...current,
                [request._id]: 'Please select at least one evidence image.',
            }));
            return;
        }

        if (files.length > 10) {
            setResponseErrors((current) => ({
                ...current,
                [request._id]: 'You can upload up to 10 images per response.',
            }));
            return;
        }

        setRespondingToRequest(request._id);
        setResponseErrors((current) => ({
            ...current,
            [request._id]: '',
        }));
        setResponseSuccess((current) => ({
            ...current,
            [request._id]: '',
        }));

        try {
            const responseMediaKeys: string[] = [];

            for (const file of files) {
                const uploadResult = await createMediaUploadUrl(
                    problem._id,
                    file
                );

                const uploadData = await uploadResult.json();

                if (!uploadResult.ok) {
                    throw new Error(
                        uploadData.message ||
                        `Failed to prepare upload for ${file.name}.`
                    );
                }

                await uploadFileToS3(
                    uploadData.data.uploadUrl,
                    file
                );

                await saveProblemMedia(problem._id, {
                    key: uploadData.data.key,
                    originalName: file.name,
                    contentType: file.type,
                    size: file.size,
                });

                responseMediaKeys.push(uploadData.data.key);
            }

            await api.respondToEvidenceRequest(
                problem._id,
                request._id,
                responseMediaKeys
            );

            const refreshedProblems = await api.getProblems();
            setProblems(refreshedProblems.data);

            setResponseFiles((current) => ({
                ...current,
                [request._id]: [],
            }));

            setResponseSuccess((current) => ({
                ...current,
                [request._id]: 'Evidence submitted successfully.',
            }));
        } catch (error) {
            console.error('Failed to submit additional evidence:', error);

            setResponseErrors((current) => ({
                ...current,
                [request._id]:
                    error instanceof Error
                        ? error.message
                        : 'Failed to submit additional evidence.',
            }));
        } finally {
            setRespondingToRequest(null);
        }
    };


    const getMediaUrl = async (
        problemId: string,
        key: string
    ): Promise<string> => {
        const result = await createMediaDownloadUrl(
            problemId,
            key
        );

        return result.data.downloadUrl;
    };


    useEffect(() => {
        const loadPageData = async () => {
            try {
                const [problemResult, categoryResult] = await Promise.all([
                    api.getProblems(),
                    api.getCategories(),
                ]);

                setProblems(problemResult.data);
                setCategories(categoryResult.data.categories);
            } catch (error) {
                console.error('Failed to load problem reporting data:', error);
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load problem reporting data'
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadPageData();
    }, []);






    useEffect(() => {
        let cancelled = false;

        const loadMediaUrls = async () => {
            const entries = await Promise.all(
                problems.map(async (problem) => {
                    if (!problem.media?.length) {
                        return [problem._id, []] as const;
                    }

                    const urls = await Promise.all(
                        problem.media.map(async (media) => {
                            try {
                                const result = await getMediaUrl(
                                    problem._id,
                                    media.key
                                );

                                return result;
                            } catch (error) {
                                console.error(
                                    `Failed to load image ${media.key}:`,
                                    error
                                );

                                return '';
                            }
                        })
                    );

                    return [problem._id, urls] as const;
                })
            );

            if (!cancelled) {
                setMediaUrls(Object.fromEntries(entries));
            }
        };

        if (problems.length > 0) {
            loadMediaUrls();
        } else {
            setMediaUrls({});
        }

        return () => {
            cancelled = true;
        };
    }, [problems]);




    if (isLoading) {
        return <p className="text-gray-400">Loading problems...</p>;
    }

    if (error) {
        return <p className="text-red-400">{error}</p>;
    }

    return (
        <div className="mx-auto max-w-6xl">
            {/* Page Header */}
            <div>
                <p className="text-sm font-medium text-purple-400">
                    COMMUNITY REPORTS
                </p>

                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                    Problems
                </h1>

                <p className="mt-2 max-w-2xl text-gray-400">
                    Report and track real-world problems in your
                    community.
                </p>
            </div>

            {/* Report Problem */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
                <div>
                    <h2 className="text-xl font-semibold">
                        Report a Problem
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Help your community by reporting an issue
                        that needs attention.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 grid gap-5 md:grid-cols-2"
                >
                    <fieldset className="contents" disabled={isSubmitting || !!savedProblemId} inert={isSubmitting || !!savedProblemId}>
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Problem Title
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Broken streetlights near park"
                            value={title}
                            onChange={(event) =>
                                { setTitle(event.target.value); aiRequestVersion.current += 1; setIsImproving(false); setAiSuggestion(null); setAiError(''); }
                            }
                            required
                            minLength={5}
                            maxLength={150}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Description
                        </label>

                        <textarea
                            placeholder="Describe the problem clearly..."
                            value={description}
                            onChange={(event) =>
                                { setDescription(event.target.value); aiRequestVersion.current += 1; setIsImproving(false); setAiSuggestion(null); setAiError(''); }
                            }
                            required
                            minLength={20}
                            maxLength={5000}
                            rows={5}
                            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />

                        {AI_ENABLED && <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleImproveProblem}
                                disabled={isImproving || description.trim().length < 20}
                                className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isImproving
                                    ? 'Improving your report...'
                                    : '✨ Improve with AI'}
                            </button>

                            <span className="text-xs text-gray-500">
                                AI helps make your report clearer and more informative.
                            </span>
                        </div>}

                        {aiError && (
                            <p role="alert" className="mt-2 text-sm text-red-400">
                                {aiError}
                            </p>
                        )}
                    </div>


                    {aiSuggestion && (
                        <div className="md:col-span-2 rounded-xl border border-purple-400/30 bg-purple-500/5 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="font-semibold text-purple-300">
                                    AI Suggestions
                                </h3>

                                <span className="text-xs text-gray-500">
                                    Review before applying
                                </span>
                            </div>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Suggested Title
                                    </p>
                                    <p className="mt-1 text-white">
                                        {aiSuggestion.title}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Suggested Description
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                                        {aiSuggestion.description}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Suggested Category
                                    </p>
                                    <p className="mt-1 text-sm text-purple-300">
                                        {aiSuggestion.category}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitle(aiSuggestion.title);
                                        setDescription(aiSuggestion.description);

                                        setAiSuggestion(null);
                                        setAiError('');
                                    }}
                                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
                                >
                                    Apply Suggestions
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAiSuggestion(null)}
                                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Category
                        </label>

                        <select
                            value={categoryId}
                            onChange={(event) =>
                                setCategoryId(event.target.value)
                            }
                            required
                            disabled={categories.length === 0}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        >
                            <option value="">
                                {categories.length === 0
                                    ? 'No categories available'
                                    : 'Select a category'}
                            </option>
                            {renderCategoryOptions(categories)}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Priority
                        </label>

                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value as ProblemPriority)
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">
                                Critical
                            </option>
                        </select>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Address
                        </label>

                        <input
                            type="text"
                            placeholder="Street, landmark, area..."
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            City
                        </label>

                        <input
                            type="text"
                            placeholder="Bhopal"
                            value={city}
                            onChange={(event) =>
                                setCity(event.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            State
                        </label>

                        <input
                            type="text"
                            placeholder="Madhya Pradesh"
                            value={state}
                            onChange={(event) =>
                                setState(event.target.value)
                            }
                            required
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* Exact Map Location */}
                    <div className="md:col-span-2">
                        <LocationPicker
                            value={coordinates}
                            onChange={setCoordinates}
                        />
                    </div>

                    {submitError && (
                        <div className="md:col-span-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {submitError}
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Problem Image
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(event) => {
                                setSelectedFiles(
                                    Array.from(event.target.files ?? [])
                                );
                            }}
                            className="block w-full text-sm"
                        />
                    </div>
                    </fieldset>

                    <div className="md:col-span-2">
                        {submitNotice && <p role="status" className="mb-3 text-sm text-green-400">{submitNotice}</p>}
                        <button
                            type="submit"
                            disabled={isSubmitting || categories.length === 0}
                            className="rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? 'Reporting...'
                                : savedProblemId ? 'Retry Remaining Images' : 'Report Problem'}
                        </button>
                        {savedProblemId && !isSubmitting && (
                            <button type="button" className="ml-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                                onClick={() => { resetReportForm(); setSubmitError(''); setSubmitNotice('Your report was saved with the images already attached.'); }}>
                                Finish without remaining images
                            </button>
                        )}
                    </div>


                </form>
            </div>

            {/* Problems List */}
            <div className="mt-10">
                <div>
                    <h2 className="text-2xl font-bold">
                        Reported Problems
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Issues reported by the community.
                    </p>
                </div>

                <div className="mt-5 space-y-4">
                    {problems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
                            <p className="text-gray-400">
                                No problems reported yet.
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Be the first to report an issue.
                            </p>
                        </div>
                    ) : (
                        problems.map((problem) => (
                            <div
                                key={problem._id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:border-purple-500/30"
                            >
                                <h3 className="text-xl font-semibold">
                                    {problem.title}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    {problem.description}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                                        {getCategoryName(problem.categoryId, problem.category)}                                    </span>

                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                                        {problem.priority}
                                    </span>

                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                                        {problem.status}
                                    </span>
                                </div>

                                <p className="mt-4 text-sm text-gray-500">
                                    📍 {problem.location.address},{' '}
                                    {problem.location.city},{' '}
                                    {problem.location.state}
                                </p>

                                {problem.media?.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveEvidenceProblem(problem)}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:border-purple-400/60 hover:bg-purple-500/20"
                                    >
                                        <span aria-hidden="true">▧</span>
                                        View Evidence
                                        <span className="rounded-md bg-purple-400/20 px-2 py-0.5 text-xs">
                                            {problem.media.length}
                                        </span>
                                    </button>
                                )}


                                {problem.evidenceRequests?.map((request) => (
                                    <div
                                        key={request._id}
                                        className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="font-semibold text-white">
                                                Additional Evidence Requested
                                            </h4>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${request.status === 'PENDING'
                                                    ? 'bg-amber-400/10 text-amber-300'
                                                    : 'bg-green-400/10 text-green-300'
                                                    }`}
                                            >
                                                {request.status}
                                            </span>
                                        </div>

                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                                            {request.message}
                                        </p>

                                        {request.status === 'PENDING' ? (
                                            <form
                                                className="mt-4 space-y-4"
                                                onSubmit={(event) =>
                                                    handleEvidenceResponse(event, problem, request)
                                                }
                                            >
                                                <div>
                                                    <label
                                                        htmlFor={`evidence-${request._id}`}
                                                        className="mb-2 block text-sm font-medium text-gray-300"
                                                    >
                                                        Upload requested evidence
                                                    </label>

                                                    <input
                                                        id={`evidence-${request._id}`}
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        multiple
                                                        required
                                                        disabled={respondingToRequest !== null}
                                                        onChange={(event) => {
                                                            const files = Array.from(
                                                                event.target.files ?? []
                                                            );

                                                            setResponseFiles((current) => ({
                                                                ...current,
                                                                [request._id]: files,
                                                            }));

                                                            setResponseErrors((current) => ({
                                                                ...current,
                                                                [request._id]: '',
                                                            }));
                                                        }}
                                                        className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-500/20 file:px-4 file:py-2 file:font-medium file:text-purple-300 hover:file:bg-purple-500/30"
                                                    />

                                                    <p className="mt-2 text-xs text-gray-500">
                                                        JPEG, PNG or WebP. Select 1–10 images.
                                                    </p>

                                                    {(responseFiles[request._id] ?? []).length > 0 && (
                                                        <p className="mt-2 text-sm text-gray-400">
                                                            {(responseFiles[request._id] ?? []).length} image(s) selected
                                                        </p>
                                                    )}
                                                </div>

                                                {responseErrors[request._id] && (
                                                    <p role="alert" className="text-sm text-red-400">
                                                        {responseErrors[request._id]}
                                                    </p>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        respondingToRequest !== null ||
                                                        (responseFiles[request._id] ?? []).length === 0
                                                    }
                                                    className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {respondingToRequest === request._id
                                                        ? 'Uploading evidence...'
                                                        : 'Upload and Submit Evidence'}
                                                </button>
                                            </form>
                                        ) : (
                                            <p className="mt-3 text-sm text-green-300">
                                                Evidence has been submitted for this request.
                                            </p>
                                        )}

                                        {responseSuccess[request._id] && (
                                            <p role="status" className="mt-3 text-sm text-green-300">
                                                {responseSuccess[request._id]}
                                            </p>
                                        )}
                                    </div>
                                ))}





                            </div>


                        ))
                    )}
                </div>
            </div>

            {activeEvidenceProblem && (
                <EvidenceModal
                    isOpen={true}
                    onClose={() => setActiveEvidenceProblem(null)}
                    problemTitle={activeEvidenceProblem.title}
                    media={activeEvidenceProblem.media ?? []}
                    mediaUrls={mediaUrls[activeEvidenceProblem._id] ?? []}
                    location={activeEvidenceProblem.location}
                />
            )}


        </div>
    );


}







export default Problems;
