import { jsonFetch, authenticatedJsonFetch } from './http';
import { resolveApiUrl } from './config';
import type {
  ImproveProblemRequest,
  ImproveProblemResponse,
} from '../types/ai';

const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true' ||
  (!import.meta.env.PROD && import.meta.env.VITE_AI_ENABLED !== 'false');

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  return authenticatedJsonFetch(url, options, url.endsWith('/ai/improve-problem') ? 70_000 : 20_000);
};

export const api = {






  register: async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await jsonFetch(
      `${API_URL}/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Registration failed'
      );
    }

    return result;
  },





  login: async (data: {
    email: string;
    password: string;
  }) => {
    const response = await jsonFetch(
      `${API_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Login failed'
      );
    }

    return result;
  },


  getMyTeams: async () => {
    const response = await authenticatedFetch(
        `${API_URL}/teams/my`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to fetch teams'
        );
    }

    return result;
},




  getMe: async () => {
    const response = await authenticatedFetch(
      `${API_URL}/users/me`,
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch current user'
      );
    }

    return result;
  },


  getProblems: async () => {
    const response = await authenticatedFetch(
      `${API_URL}/problems`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch problems');
    }

    return response.json();
  },

  getCategories: async () => {
    const response = await jsonFetch(`${API_URL}/categories`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch categories'
      );
    }

    return result;
  },

  improveProblem: async (
  data: ImproveProblemRequest
): Promise<ImproveProblemResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65_000);
  try {
  const response = await authenticatedFetch(
    `${API_URL}/ai/improve-problem`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      signal: controller.signal,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to improve problem report'
    );
  }

  return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The AI assistant timed out. Please try again or continue without AI.');
    }
    if (error instanceof TypeError || error instanceof SyntaxError) {
      throw new Error('The AI assistant is temporarily unavailable. Please try again or continue without AI.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
},


  createProblem: async (data:{
  title: string;
  description: string;
  categoryId: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  priority: string;
}) => {
    const response = await authenticatedFetch(
      `${API_URL}/problems`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to create problem'
      );
    }

    return result;
  },


  updateProblemStatus: async (
    problemId: string,
    data: {
      status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
      rejectionReason?: string;
    }
  ) => {
    const response = await authenticatedFetch(
      `${API_URL}/problems/${problemId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to update problem status'
      );
    }

    return result;
  },

  updateProblemPriority: async (
    problemId: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ) => {
    const response = await authenticatedFetch(
      `${API_URL}/problems/${problemId}/priority`,
      {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to update problem priority'
      );
    }

    return result;
  },

  getProblemHistory: async (problemId: string) => {
    const response = await authenticatedFetch(
      `${API_URL}/problems/${problemId}/history`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch problem history'
      );
    }

    return result;
  },


requestAdditionalEvidence: async (
  problemId: string,
  message: string
) => {
  const response = await authenticatedFetch(
    `${API_URL}/problems/evidence-requests`,
    {
      method: 'POST',
      body: JSON.stringify({ problemId, message }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to request additional evidence'
    );
  }

  return result;
},



  getChallenges: async () => {
    const response = await authenticatedFetch(
      `${API_URL}/challenges`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch challenges'
      );
    }

    return result;
  },

  getChallengeById: async (
    challengeId: string
  ) => {
    const response = await authenticatedFetch(
      `${API_URL}/challenges/${challengeId}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch challenge'
      );
    }

    return result;
  },


updateChallengeStatus: async (
    challengeId: string,
    status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) => {
    const response = await authenticatedFetch(
        `${API_URL}/challenges/${challengeId}/status`,
        {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to update challenge status'
        );
    }

    return result;
},


  createApplication: async (data: {
  challenge: string;
  motivation: string;
  skills: string[];
}) => {
  const response = await authenticatedFetch(
    `${API_URL}/applications`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to submit application'
    );
  }

  return result;
},

getMyApplications: async () => {
  const response = await authenticatedFetch(
    `${API_URL}/applications`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch applications'
    );
  }

  return result;
},


getApplicationsForChallenge: async (challengeId: string) => {
  const response = await authenticatedFetch(
    `${API_URL}/applications/challenge/${challengeId}`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch challenge applications'
    );
  }

  return result;
},

reviewApplication: async (
  applicationId: string,
  data: {
    status: 'ACCEPTED' | 'REJECTED';
    reviewNote?: string;
  }
) => {
  const response = await authenticatedFetch(
    `${API_URL}/applications/${applicationId}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to review application'
    );
  }

  return result;
},



getTeamById: async (teamId: string) => {
    const response = await authenticatedFetch(
        `${API_URL}/teams/${teamId}`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to fetch team'
        );
    }

    return result;
},

getTeamMembers: async (teamId: string) => {
    const response = await authenticatedFetch(
        `${API_URL}/teams/${teamId}/members`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to fetch team members'
        );
    }

    return result;
},


createTeam: async (data: {
    name: string;
    description: string;
    challenge: string;
}) => {
    const response = await authenticatedFetch(
        `${API_URL}/teams`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to create team'
        );
    }

    return result;
},

getStudents: async () => {
  const response = await authenticatedFetch(
    `${API_URL}/users/students`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch students'
    );
  }

  return result;
},

createTeamInvitation: async (data: {
  team: string;
  invitedUser: string;
}) => {
  const response = await authenticatedFetch(
    `${API_URL}/team-invitations`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to send invitation'
    );
  }

  return result;
},

getMyTeamInvitations: async () => {
  const response = await authenticatedFetch(
    `${API_URL}/team-invitations/my`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch invitations'
    );
  }

  return result;
},

respondToTeamInvitation: async (
  invitationId: string,
  status: 'ACCEPTED' | 'REJECTED'
) => {
  const response = await authenticatedFetch(
    `${API_URL}/team-invitations/${invitationId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to respond to invitation'
    );
  }

  return result;
},


  // Add inside the existing `api` object.

  getSolutionsForChallenge: async (challengeId: string) => {
    const response = await authenticatedFetch(
      `${API_URL}/solutions/challenge/${challengeId}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch solutions'
      );
    }

    return result;
  },

  getSolutionById: async (solutionId: string) => {
    const response = await authenticatedFetch(
      `${API_URL}/solutions/${solutionId}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to fetch solution'
      );
    }

    return result;
  },

  createSolution: async (data: {
    challenge: string;
    team: string;
    title: string;
    description: string;
    approach: string;
    estimatedCost?: number;
    estimatedCompletionDate?: string;
  }) => {
    const response = await authenticatedFetch(
      `${API_URL}/solutions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to submit solution'
      );
    }

    return result;
  },


reviewSolution: async (
  solutionId: string,
  data: {
    reviewStatus: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
    reviewNote?: string;
  }
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        solutionId,
        ...data,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to review solution'
    );
  }

  return result;
},



updateSolutionImplementation: async (
  solutionId: string,
  implementationStatus:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'ON_HOLD'
    | 'COMPLETED'
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/implementation`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        solutionId,
        implementationStatus,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to update implementation status'
    );
  }

  return result;
},



addSolutionMilestone: async (
  solutionId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: string;
  }
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/milestones`,
    {
      method: 'POST',
      body: JSON.stringify({
        solutionId,
        ...data,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to add milestone'
    );
  }

  return result;
},

updateSolutionMilestone: async (
  solutionId: string,
  milestoneId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/milestones/${milestoneId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        solutionId,
        milestoneId,
        status,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to update milestone'
    );
  }

  return result;
},

recordSolutionImpact: async (
  solutionId: string,
  data: {
    name: string;
    description?: string;
    unit: string;
    baselineValue?: number;
    measuredValue?: number;
    measuredAt?: string;
    notes?: string;
    evidenceKeys?: string[];
  }
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/impact`,
    {
      method: 'POST',
      body: JSON.stringify({
        solutionId,
        ...data,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to record solution impact'
    );
  }

  return result;
},


respondToEvidenceRequest: async (
    problemId: string,
    requestId: string,
    responseMediaKeys: string[]
) => {
    const response = await authenticatedFetch(
        `${API_URL}/problems/evidence-requests/respond`,
        {
            method: 'POST',
            body: JSON.stringify({
                problemId,
                requestId,
                responseMediaKeys,
            }),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to submit evidence response.'
        );
    }

    return result;
},



createChallenge: async (data: {
    title: string;
    description: string;
    problem: string;
    deadline: string;
    skills: string[];
    eligibility: string;
}) => {
    const response = await authenticatedFetch(
        `${API_URL}/challenges`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to create challenge'
        );
    }

    return result;
},







};


export const createMediaUploadUrl = async (
  problemId: string,
  file: File
) => {
  return authenticatedFetch(`${API_URL}/media/upload-url`, {
    method: 'POST',
    body: JSON.stringify({
      problemId,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });
};

export const uploadFileToS3 = async (
  uploadUrl: string,
  file: File
): Promise<void> => {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 120_000);
  try {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The image upload timed out. Please retry the remaining images.');
    if (error instanceof TypeError) throw new Error('Unable to upload the image. Check your connection and retry.');
    throw error;
  } finally {
    clearTimeout(deadline);
  }
};


export const saveProblemMedia = async (
    problemId: string,
    data: {
        key: string;
        originalName: string;
        contentType: string;
        size: number;
    }
) => {
    const response = await authenticatedFetch(
        `${API_URL}/problems/${problemId}/media`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to save media'
        );
    }

    return result;
};


export const createMediaDownloadUrl = async (
    problemId: string,
    key: string
) => {
    const response = await authenticatedFetch(
        `${API_URL}/media/download-url`,
        {
            method: 'POST',
            body: JSON.stringify({
                problemId,
                key,
            }),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || 'Failed to create download URL'
        );
    }

    return result;
};



export const createSolutionEvidenceUploadUrl = async (
  solutionId: string,
  file: File
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/evidence/upload-url`,
    {
      method: 'POST',
      body: JSON.stringify({
        solutionId,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to create evidence upload URL'
    );
  }

  return result;
};

export const saveSolutionEvidence = async (
  solutionId: string,
  data: {
    key: string;
    originalName: string;
    contentType: string;
    size: number;
  }
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/evidence`,
    {
      method: 'POST',
      body: JSON.stringify({
        solutionId,
        ...data,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to attach solution evidence'
    );
  }

  return result;
};

export const createSolutionEvidenceDownloadUrl = async (
  solutionId: string,
  key: string
) => {
  const response = await authenticatedFetch(
    `${API_URL}/solutions/${solutionId}/evidence/download-url`,
    {
      method: 'POST',
      body: JSON.stringify({ solutionId, key }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to create evidence download URL'
    );
  }

  return result;
};
