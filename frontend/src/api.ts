import axios from 'axios';

// Local development URL
const baseURL = import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// --- API Types ---

export interface OnboardingData {
  gender: string;
  age: string; // Changed to string for "Age Group" e.g., "25-30"
  job: string;
  income: string; // Mapped to financial_status e.g. "Stable", "Anxious"
  nickname: string; // Keep for UI greeting
  core_trouble: string; // New field
}

export interface StageQuestion {
    stage: number;
    question: string;
    options: {
        label: string;
        text: string;
        projection: string;
    }[];
}

export interface StageSubmitResponse {
    feedback: string | null;
    next_stage: number;
    is_stage_complete: boolean;
}

export interface UserProfile {
  profile_id: string;
  user_id: string;
  current_stage: number;
  static_data: {
      gender: string;
      age_group: string;
      occupation: string;
      financial_status: string;
      core_trouble: string;
  };
  rolling_summary: string;
}

export interface AnalysisReport {
    core_persona: string;
    inner_conflict: string;
    risk_prediction: string;
    evolution_suggestion: string;
    full_markdown: string;
}

// --- API Functions ---

export const onboarding = async (data: OnboardingData) => {
  const response = await api.post('/onboarding', data);
  return response.data; // Returns { user_id, profile }
};

export const getStageQuestion = async (userId: string) => {
    const response = await api.post('/stage/next', { user_id: userId });
    return response.data; // Returns StageQuestion or { status: "complete" }
};

export const submitStageAnswer = async (userId: string, stage: number, choice: string, projection: string) => {
    const response = await api.post('/stage/submit', { 
        user_id: userId, 
        stage, 
        choice, 
        projection 
    });
    return response.data; // Returns StageSubmitResponse
};

export const generateReport = async (userId: string) => {
  const response = await api.post('/report/generate', { user_id: userId });
  return response.data.report; // Returns AnalysisReport
};

export const getUserProfile = async (userId: string) => {
    const response = await api.get(`/user/${userId}`);
    return response.data;
}

export const chatWithAI = async (userId: string, message: string) => {
  try {
    const response = await api.post('/chat', { user_id: userId, message });
    return response.data.reply;
  } catch (error) {
    console.error('Chat Error:', error);
    return "抱歉，我暂时无法回答。";
  }
};

export const generateScenario = async (userId: string) => {
    // Placeholder - not implemented in backend yet
    return { question: "Legacy Scenario", options: [] };
};

export const submitScenarioChoice = async (userId: string, choice: string, projection: string) => {
    return "Scenario recorded";
}

export const generateTags = async (userId: string) => {
    const response = await api.post('/tags/generate', { user_id: userId });
    return response.data;
};

export const selectTags = async (userId: string, tags: string[]) => {
    const response = await api.post('/tags/select', { user_id: userId, tags });
    return response.data;
};

export const generateShadowWork = async (userId: string) => {
    const response = await api.post('/shadow/generate', { user_id: userId });
    return response.data;
};

export const submitShadowWork = async (userId: string, question: string, admitted: boolean) => {
    const response = await api.post('/shadow/submit', { user_id: userId, question, admitted });
    return response.data;
};

export default api;
