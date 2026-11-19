
import { useEffect, useState } from 'react';
import ProblemLocationMap from './ProblemLocationMap';

export interface EvidenceItem {
    key: string;
    originalName: string;
    contentType: string;
    size: number;
}

interface EvidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    problemTitle: string;
    location: {
        address: string;
        city: string;
        state: string;
        coordinates?: {
            type: 'Point';
            coordinates: [number, number];
        };
    };
    media: EvidenceItem[];
    mediaUrls: string[];
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function EvidenceModal({
    isOpen,
    onClose,
    problemTitle,
    location,
    media,
    mediaUrls,
}: EvidenceModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (isOpen) setActiveIndex(0);
    }, [isOpen, problemTitle]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();

            if (event.key === 'ArrowRight') {
                setActiveIndex((current) =>
                    Math.min(current + 1, media.length - 1)
                );
            }

            if (event.key === 'ArrowLeft') {
                setActiveIndex((current) =>
                    Math.max(current - 1, 0)
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, media.length, onClose]);

    if (!isOpen) return null;

    const selectedMedia = media[activeIndex];
    const selectedUrl = mediaUrls[activeIndex];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="evidence-title"
                className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-white shadow-2xl shadow-purple-950/40"
            >
                <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-purple-400">
                            Problem evidence
                        </p>

                        <h2
                            id="evidence-title"
                            className="mt-1 break-words text-xl font-semibold"
                        >
                            {problemTitle}
                        </h2>


                        <p className="mt-2 text-sm text-gray-400">
                            📍 {[location?.address, location?.city, location?.state]
                                .filter(Boolean)
                                .join(', ') || 'Location not provided'}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                            {media.length} file{media.length === 1 ? '' : 's'} attached
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close evidence viewer"
                        className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                        ✕
                    </button>
                </header>

                <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="flex min-h-[260px] flex-col items-center justify-center bg-black/40 p-4 sm:p-6">
                        {selectedUrl ? (
                            <img
                                src={selectedUrl}
                                alt={selectedMedia?.originalName ?? 'Problem evidence'}
                                className="max-h-[50vh] max-w-full rounded-lg object-contain"
                            />
                        ) : (
                            <p className="text-center text-sm text-gray-400">
                                Preview unavailable. Please try opening the evidence again.
                            </p>
                        )}

                        {media.length > 1 && (
                            <div className="mt-5 flex items-center gap-4">
                                <button
                                    type="button"
                                    disabled={activeIndex === 0}
                                    onClick={() =>
                                        setActiveIndex((index) => index - 1)
                                    }
                                    className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    ← Previous
                                </button>

                                <span className="text-sm text-gray-400">
                                    {activeIndex + 1} / {media.length}
                                </span>

                                <button
                                    type="button"
                                    disabled={activeIndex === media.length - 1}
                                    onClick={() =>
                                        setActiveIndex((index) => index + 1)
                                    }
                                    className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="border-t border-white/10 p-4 md:border-l md:border-t-0">
                        <h3 className="mb-3 font-semibold">Evidence files</h3>

                        <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
                            {media.map((item, index) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setActiveIndex(index)}
                                    aria-label={`View ${item.originalName}`}
                                    aria-pressed={activeIndex === index}
                                    className={`overflow-hidden rounded-lg border text-left transition ${activeIndex === index
                                            ? 'border-purple-400 bg-purple-500/10'
                                            : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    {mediaUrls[index] ? (
                                        <img
                                            src={mediaUrls[index]}
                                            alt=""
                                            className="h-20 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 items-center justify-center bg-white/5 text-xs text-gray-400">
                                            No preview
                                        </div>
                                    )}

                                    <span className="block truncate px-2 py-2 text-xs text-gray-300">
                                        {item.originalName || `Evidence ${index + 1}`}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {selectedMedia && (
                            <div className="mt-5 border-t border-white/10 pt-4">
                                <h3 className="font-semibold">File details</h3>

                                <dl className="mt-3 space-y-3 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Filename</dt>
                                        <dd className="mt-1 break-all text-gray-200">
                                            {selectedMedia.originalName || 'Unknown'}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-gray-500">File type</dt>
                                        <dd className="mt-1 break-all text-gray-200">
                                            {selectedMedia.contentType || 'Unknown'}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-gray-500">File size</dt>
                                        <dd className="mt-1 text-gray-200">
                                            {formatFileSize(selectedMedia.size)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-gray-500">Evidence number</dt>
                                        <dd className="mt-1 text-gray-200">
                                            {activeIndex + 1} of {media.length}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-6 border-t border-white/10 pt-4">
                                    <h3 className="mb-3 font-semibold">Reported location</h3>

                                    <ProblemLocationMap
                                        coordinates={location?.coordinates}
                                    />
                                </div>
                            </div>

                        )}


                    </aside>
                </div>
            </section>
        </div>
    );
}

export default EvidenceModal;
