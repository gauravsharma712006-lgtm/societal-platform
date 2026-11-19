
import { useCallback, useEffect, useState } from 'react';
import { api, createMediaDownloadUrl } from '../services/api';

type ProblemStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

interface Evidence {
  key: string;
  originalName: string;
  contentType: string;
  size: number;
}

interface EvidenceRequest {
  _id: string;
  message: string;
  status: 'PENDING' | 'RESPONDED';
  requestedAt: string;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  category: string | null;
  categoryId?: string | null;
  status: ProblemStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: {
    address?: string;
    city?: string;
    state?: string;
  };
  media?: Evidence[];
  evidenceRequests?: EvidenceRequest[];
  createdAt?: string;
}

interface CategoryNode {
  _id: string;
  name: string;
  children: CategoryNode[];
}

interface ProblemHistoryEntry {
  _id?: string;
  action: 'STATUS_CHANGED' | 'PRIORITY_CHANGED' | 'EVIDENCE_REQUESTED';
  from: string;
  to: string;
  reason?: string;
  changedAt?: string;
}

interface EvidencePreview {
  problemId: string;
  evidence: Evidence;
  url: string;
}

const statusStyles: Record<ProblemStatus, string> = {
  REPORTED: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  VERIFIED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-300 border-red-500/20',
};

function Verification() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<EvidencePreview | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [requestMessages, setRequestMessages] = useState<Record<string, string>>({});
  const [requestFormId, setRequestFormId] = useState<string | null>(null);
  const [historyByProblem, setHistoryByProblem] = useState<
    Record<string, ProblemHistoryEntry[]>
  >({});
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'REPORTED' | 'UNDER_REVIEW'>('ALL');

  const loadProblems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [result, categoryResult] = await Promise.all([
        api.getProblems(),
        api.getCategories(),
      ]);
      const data = result.data;
      setProblems(Array.isArray(data) ? data : data?.problems ?? []);
      setCategories(categoryResult.data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoryName = (problem: Problem): string => {
    const findCategory = (nodes: CategoryNode[]): CategoryNode | undefined => {
      for (const node of nodes) {
        if (node._id === problem.categoryId) {
          return node;
        }

        const child = findCategory(node.children ?? []);
        if (child) {
          return child;
        }
      }

      return undefined;
    };

    return findCategory(categories)?.name ??
      problem.category?.replace(/_/g, ' ') ??
      'Category unavailable';
  };

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const openEvidence = async (problem: Problem, evidence: Evidence) => {
    setPreviewingKey(evidence.key);
    setError('');

    try {
      const result = await createMediaDownloadUrl(problem._id, evidence.key);
      const url = result.data?.downloadUrl;

      if (!url) {
        throw new Error('The server did not return an evidence URL.');
      }

      setPreview({
        problemId: problem._id,
        evidence,
        url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open evidence.');
    } finally {
      setPreviewingKey(null);
    }
  };

  const updateStatus = async (
    problem: Problem,
    status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'
  ) => {
    const rejectionReason = rejectionReasons[problem._id]?.trim();

    if (
      status === 'REJECTED' &&
      (!rejectionReason || rejectionReason.length < 5)
    ) {
      setError('Please provide a rejection reason of at least 5 characters.');
      return;
    }

    setUpdatingId(problem._id);
    setError('');
    setSuccess('');

    try {
      await api.updateProblemStatus(problem._id, {
        status,
        ...(status === 'REJECTED' ? { rejectionReason } : {}),
      });

      setSuccess(`"${problem.title}" updated to ${status.replace('_', ' ')}.`);
      await loadProblems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update problem status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const requestEvidence = async (problem: Problem) => {
    const message = requestMessages[problem._id]?.trim();

    if (!message || message.length < 5) {
      setError('Explain what additional evidence is needed (at least 5 characters).');
      return;
    }

    setRequestingId(problem._id);
    setError('');
    setSuccess('');

    try {
      await api.requestAdditionalEvidence(problem._id, message);
      setSuccess(`Evidence request sent for "${problem.title}".`);
      setRequestMessages((current) => ({ ...current, [problem._id]: '' }));
      setRequestFormId(null);
      await loadProblems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request evidence.');
    } finally {
      setRequestingId(null);
    }
  };

  const updatePriority = async (
    problem: Problem,
    priority: Problem['priority']
  ) => {
    setUpdatingId(problem._id);
    setError('');
    setSuccess('');

    try {
      await api.updateProblemPriority(problem._id, priority);
      setSuccess(`"${problem.title}" priority updated to ${priority}.`);
      await loadProblems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleHistory = async (problemId: string) => {
    if (historyByProblem[problemId]) {
      setHistoryByProblem((current) => {
        const next = { ...current };
        delete next[problemId];
        return next;
      });
      return;
    }

    setHistoryLoadingId(problemId);
    setError('');

    try {
      const result = await api.getProblemHistory(problemId);
      setHistoryByProblem((current) => ({
        ...current,
        [problemId]: result.data.history,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem history.');
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const visibleProblems = problems.filter((problem) => {
    if (filter === 'ALL') {
      return problem.status !== 'VERIFIED' && problem.status !== 'REJECTED';
    }

    return problem.status === filter;
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-purple-300">ADMINISTRATION</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Problem Verification</h1>
        <p className="mt-2 text-gray-400">
          Inspect evidence, request missing information, and make verification decisions.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Reported', status: 'REPORTED', color: 'text-blue-300' },
          { label: 'Under review', status: 'UNDER_REVIEW', color: 'text-amber-300' },
          { label: 'Awaiting review', status: 'PENDING', color: 'text-purple-300' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-400">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.color}`}>
              {item.status === 'PENDING'
                ? problems.filter(
                    (p) => p.status === 'REPORTED' || p.status === 'UNDER_REVIEW'
                  ).length
                : problems.filter((p) => p.status === item.status).length}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Submissions</h2>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'REPORTED', 'UNDER_REVIEW'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  filter === value
                    ? 'border-purple-500 bg-purple-600 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {value === 'ALL' ? 'All pending' : value.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={() => void loadProblems()}
              disabled={loading}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            Loading problem submissions...
          </div>
        ) : visibleProblems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h3 className="font-semibold text-white">No pending submissions</h3>
            <p className="mt-2 text-sm text-gray-400">
              There are no problems matching this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleProblems.map((problem) => {
              const evidence = problem.media ?? [];
              const requests = problem.evidenceRequests ?? [];
              const pendingRequests = requests.filter((r) => r.status === 'PENDING');

              return (
                <article
                  key={problem._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {getCategoryName(problem)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[problem.status]}`}>
                      {problem.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                    {problem.description}
                  </p>

                  {(problem.location?.address || problem.location?.city || problem.location?.state) && (
                    <p className="mt-3 text-sm text-gray-400">
                      <span className="mr-2">⌖</span>
                      {[problem.location.address, problem.location.city, problem.location.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}

                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-medium text-white">Submitted evidence</h4>
                      <span className="text-sm text-gray-400">
                        {evidence.length} file(s)
                      </span>
                    </div>

                    {evidence.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">
                        No evidence files are attached to this report.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {evidence.map((file) => (
                          <div
                            key={file.key}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"
                          >
                            <div className="min-w-0">
                              <p className="break-all text-sm text-gray-200">
                                {file.originalName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {file.contentType} · {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={() => void openEvidence(problem, file)}
                              disabled={previewingKey === file.key}
                              className="shrink-0 rounded-lg border border-purple-400/30 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/10 disabled:opacity-50"
                            >
                              {previewingKey === file.key ? 'Opening...' : 'View evidence'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {requests.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-white">Evidence requests</h4>
                      {requests.map((request) => (
                        <div key={request._id} className="rounded-lg border border-white/10 p-3">
                          <div className="flex flex-wrap justify-between gap-2">
                            <span className="text-sm text-gray-300">{request.message}</span>
                            <span className={`text-xs ${request.status === 'PENDING' ? 'text-amber-300' : 'text-emerald-300'}`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="text-sm text-gray-300">
                        <span className="mb-1 block">Priority</span>
                        <select
                          value={problem.priority}
                          disabled={updatingId === problem._id}
                          onChange={(event) => void updatePriority(
                            problem,
                            event.target.value as Problem['priority']
                          )}
                          className="rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-white"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => void toggleHistory(problem._id)}
                        disabled={historyLoadingId === problem._id}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        {historyLoadingId === problem._id
                          ? 'Loading history...'
                          : historyByProblem[problem._id]
                            ? 'Hide history'
                            : 'View history'}
                      </button>
                    </div>

                    {historyByProblem[problem._id] && (
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <h4 className="font-medium text-white">Problem history</h4>
                        {historyByProblem[problem._id].length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">No history entries yet.</p>
                        ) : (
                          <ul className="mt-3 space-y-2 text-sm text-gray-300">
                            {historyByProblem[problem._id].map((entry, index) => (
                              <li key={entry._id ?? `${entry.action}-${index}`}>
                                {entry.action.replace(/_/g, ' ')}: {entry.from} → {entry.to}
                                {entry.reason ? ` — ${entry.reason}` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {problem.status !== 'VERIFIED' && problem.status !== 'REJECTED' && (
                      <div>
                        {requestFormId === problem._id ? (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-200">
                              What additional evidence is required?
                            </label>
                            <textarea
                              value={requestMessages[problem._id] ?? ''}
                              onChange={(event) =>
                                setRequestMessages((current) => ({
                                  ...current,
                                  [problem._id]: event.target.value,
                                }))
                              }
                              placeholder="e.g. Please upload a clearer photo showing the full affected area."
                              rows={3}
                              maxLength={1000}
                              className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => void requestEvidence(problem)}
                                disabled={requestingId === problem._id}
                                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
                              >
                                {requestingId === problem._id ? 'Sending...' : 'Send evidence request'}
                              </button>
                              <button
                                onClick={() => setRequestFormId(null)}
                                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRequestFormId(problem._id)}
                            className="rounded-lg border border-purple-400/30 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/10"
                          >
                            Request more evidence
                          </button>
                        )}

                        {pendingRequests.length > 0 && (
                          <p className="mt-2 text-xs text-amber-300">
                            {pendingRequests.length} evidence request(s) awaiting a reporter response.
                          </p>
                        )}
                      </div>
                    )}

                    {problem.status === 'REPORTED' && (
                      <button
                        onClick={() => void updateStatus(problem, 'UNDER_REVIEW')}
                        disabled={updatingId === problem._id}
                        className="rounded-lg bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
                      >
                        {updatingId === problem._id ? 'Updating...' : 'Start review'}
                      </button>
                    )}

                    {problem.status === 'UNDER_REVIEW' && (
                      <div className="space-y-3">
                        <textarea
                          value={rejectionReasons[problem._id] ?? ''}
                          onChange={(event) =>
                            setRejectionReasons((current) => ({
                              ...current,
                              [problem._id]: event.target.value,
                            }))
                          }
                          placeholder="Rejection reason (required only if rejecting)"
                          rows={2}
                          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void updateStatus(problem, 'VERIFIED')}
                            disabled={updatingId === problem._id || pendingRequests.length > 0}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            Verify problem
                          </button>
                          <button
                            onClick={() => void updateStatus(problem, 'REJECTED')}
                            disabled={updatingId === problem._id || pendingRequests.length > 0}
                            className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          {pendingRequests.length > 0 && (
                            <p className="w-full text-xs text-amber-300">
                              Wait for the reporter to respond to pending evidence requests before deciding.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Evidence preview"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
              <div className="min-w-0">
                <h3 className="break-all font-semibold text-white">
                  {preview.evidence.originalName}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  {preview.evidence.contentType} · {(preview.evidence.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setPreview(null)}
                aria-label="Close evidence preview"
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
              {preview.evidence.contentType.startsWith('image/') ? (
                <img
                  src={preview.url}
                  alt={preview.evidence.originalName}
                  className="max-h-[68vh] max-w-full rounded-lg object-contain"
                />
              ) : (
                <p className="text-sm text-gray-300">
                  Preview is not available for this file type.
                </p>
              )}
            </div>

            <div className="flex justify-end border-t border-white/10 p-4">
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-purple-400/30 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/10"
              >
                Open original file
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Verification;
