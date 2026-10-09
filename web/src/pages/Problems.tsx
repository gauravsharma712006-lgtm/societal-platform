import { FormEvent, useEffect, useState } from 'react';
import {
    api, createMediaDownloadUrl, createMediaUploadUrl,
    saveProblemMedia,
    uploadFileToS3,
} from '../services/api';

interface Problem {
    _id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
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
}

function Problems() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');


    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('INFRASTRUCTURE');
    const [priority, setPriority] = useState('MEDIUM');

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

        const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});


    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const result = await api.createProblem({
                title,
                description,
                category,
                priority,
                location: {
                    address,
                    city,
                    state,
                },
            });

            if (selectedFile) {
                const uploadResult = await createMediaUploadUrl(
                    result.data._id,
                    selectedFile
                );

                const uploadData = await uploadResult.json();

                if (!uploadResult.ok) {
                    throw new Error(
                        uploadData.message || 'Failed to prepare image upload'
                    );
                }

                await uploadFileToS3(
                    uploadData.data.uploadUrl,
                    selectedFile
                );

                await saveProblemMedia(result.data._id, {
                    key: uploadData.data.key,
                    originalName: selectedFile.name,
                    contentType: selectedFile.type,
                    size: selectedFile.size,
                });
            }

            setProblems((currentProblems) => [
                result.data,
                ...currentProblems,
            ]);

            setTitle('');
            setDescription('');
            setCategory('INFRASTRUCTURE');
            setPriority('MEDIUM');
            setAddress('');
            setCity('');
            setState('');
            setSelectedFile(null);



        } catch (error) {
            console.error(
                'Failed to create problem:',
                error
            );

            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create problem'
            );
        } finally {
            setIsSubmitting(false);
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
        const loadProblems = async () => {
            try {
                const result = await api.getProblems();
                setProblems(result.data);
            } catch (error) {
                console.error('Failed to load problems:', error);
                setError('Failed to load problems');
            } finally {
                setIsLoading(false);
            }
        };

        loadProblems();
    }, []);
    useEffect(() => {
    const loadMediaUrls = async () => {
        for (const problem of problems) {
            if (!problem.media?.length) {
                continue;
            }

            try {
                const result = await createMediaDownloadUrl(
                    problem._id,
                    problem.media[0].key
                );

                setMediaUrls((current) => ({
                    ...current,
                    [problem._id]: result.data.downloadUrl,
                }));
            } catch (error) {
                console.error(
                    `Failed to load media for problem ${problem._id}:`,
                    error
                );
            }
        }
    };

    if (problems.length > 0) {
        loadMediaUrls();
    }
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
                                setTitle(event.target.value)
                            }
                            required
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
                                setDescription(event.target.value)
                            }
                            required
                            rows={5}
                            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                            Category
                        </label>

                        <select
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        >
                            <option value="INFRASTRUCTURE">
                                Infrastructure
                            </option>
                            <option value="HEALTH">Health</option>
                            <option value="EDUCATION">
                                Education
                            </option>
                            <option value="ENVIRONMENT">
                                Environment
                            </option>
                            <option value="TRANSPORTATION">
                                Transportation
                            </option>
                            <option value="SANITATION">
                                Sanitation
                            </option>
                            <option value="PUBLIC_SAFETY">
                                Public Safety
                            </option>
                            <option value="OTHER">Other</option>
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
                                setPriority(event.target.value)
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
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setSelectedFile(file);
                            }}
                            className="block w-full text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? 'Reporting...'
                                : 'Report Problem'}
                        </button>
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
                                        {problem.category}
                                    </span>

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

                                {mediaUrls[problem._id] && (
    <img
        src={mediaUrls[problem._id]}
        alt={
            problem.media?.[0]?.originalName ||
            'Problem image'
        }
        className="mt-4 w-full max-h-64 rounded-xl object-cover"
    />
)}
                            </div>


                        ))
                    )}
                </div>
            </div>


        </div>
    );


}

export default Problems;