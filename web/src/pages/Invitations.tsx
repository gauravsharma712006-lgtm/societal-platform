import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  challenge: Challenge;
  status: string;
}

interface InvitedBy {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Invitation {
  _id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  respondedAt?: string;
  team: Team;
  invitedBy: InvitedBy;
}

function Invitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setError('');

      const result = await api.getMyTeamInvitations();

      setInvitations(result.data.invitations || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load invitations'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResponse = async (
    invitationId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) => {
    try {
      setProcessingId(invitationId);
      setError('');

      await api.respondToTeamInvitation(
        invitationId,
        status
      );

      await fetchInvitations();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to respond to invitation'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      undefined,
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />

          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-white/10 bg-[#0b0b0b]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-purple-400">
            Team Management
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Invitations
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Review invitations to join student teams.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Empty */}
        {invitations.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 text-2xl">
              ✉
            </div>

            <h2 className="text-lg font-medium">
              No invitations yet
            </h2>

            <p className="mt-2 text-sm text-white/40">
              When a team leader invites you to join a
              team, the invitation will appear here.
            </p>

            <Link
              to="/challenges"
              className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium transition hover:bg-purple-500"
            >
              Explore Challenges
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const isPending =
                invitation.status === 'PENDING';

              const isProcessing =
                processingId === invitation._id;

              return (
                <div
                  key={invitation._id}
                  className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 transition hover:border-purple-500/20"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    {/* Main information */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold">
                          {invitation.team.name}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            invitation.status === 'PENDING'
                              ? 'bg-yellow-500/10 text-yellow-300'
                              : invitation.status === 'ACCEPTED'
                              ? 'bg-green-500/10 text-green-300'
                              : invitation.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-300'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {invitation.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/60">
                        {invitation.team.description}
                      </p>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-white/30">
                            Challenge
                          </p>

                          <p className="mt-1 text-white/80">
                            {invitation.team.challenge?.title ||
                              'Unknown challenge'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">
                            Invited by
                          </p>

                          <p className="mt-1 text-white/80">
                            {invitation.invitedBy?.name ||
                              'Unknown'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">
                            Invited on
                          </p>

                          <p className="mt-1 text-white/80">
                            {formatDate(
                              invitation.createdAt
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">
                            Challenge deadline
                          </p>

                          <p className="mt-1 text-white/80">
                            {invitation.team.challenge?.deadline
                              ? formatDate(
                                  invitation.team.challenge
                                    .deadline
                                )
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {invitation.invitedBy?.email && (
                        <p className="mt-4 text-xs text-white/30">
                          Contact: {invitation.invitedBy.email}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex shrink-0 gap-3">
                        <button
                          onClick={() =>
                            handleResponse(
                              invitation._id,
                              'REJECTED'
                            )
                          }
                          disabled={isProcessing}
                          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:border-red-500/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() =>
                            handleResponse(
                              invitation._id,
                              'ACCEPTED'
                            )
                          }
                          disabled={isProcessing}
                          className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing
                            ? 'Processing...'
                            : 'Accept'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Invitations;