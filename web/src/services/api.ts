import { auth } from './auth';

const API_URL = 'http://localhost:5000/api';

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = auth.getToken();

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const api = {






  register: async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch(
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
    const response = await fetch(
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


  createProblem: async (data: {
    title: string;
    description: string;
    category: string;
    location: {
      address: string;
      city: string;
      state: string;
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
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
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

