import type { ProblemCategory } from './problem';

export interface ImproveProblemRequest {
  title: string;
  description: string;
  category?: ProblemCategory;
}

export interface ProblemSuggestion {
  title: string;
  description: string;
  category: ProblemCategory;
}

export interface ImproveProblemResponse {
  status: 'success';
  message: string;
  data: ProblemSuggestion;
}