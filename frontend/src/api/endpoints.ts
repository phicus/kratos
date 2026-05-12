import { api } from './client';
import type {
  AuditEntry,
  BallotItem,
  BulkProposalsResult,
  DashboardData,
  Me,
  ParticipationData,
  Period,
  Proposal,
  Ranking,
} from './types';

export const getMe = () => api.get<Me>('/api/me');
export const getPeriod = () => api.get<Period>('/api/period');
export const getProposals = () => api.get<Proposal[]>('/api/proposals');
export const submitBallot = (scores: BallotItem[]) =>
  api.post<{ status: string }>('/api/ballot', { scores });
export const getResults = () => api.get<Ranking>('/api/results');
export const logout = () => api.post('/auth/logout');

export const admin = {
  // Feature 002 — admin dashboard
  dashboard: () => api.get<DashboardData>('/api/admin/dashboard'),
  participation: () => api.get<ParticipationData>('/api/admin/participation'),
  setQuorum: (expected_quorum: number | null) =>
    api.patch('/api/admin/period/quorum', { expected_quorum }),
  bulkExclude: (proposal_ids: number[]) =>
    api.post<BulkProposalsResult>('/api/admin/proposals/bulk-exclude', { proposal_ids }),
  bulkRestore: (proposal_ids: number[]) =>
    api.post<BulkProposalsResult>('/api/admin/proposals/bulk-restore', { proposal_ids }),
  // Feature 001 — existentes
  openPeriod: () => api.post('/api/admin/period/open'),
  closePeriod: () => api.post('/api/admin/period/close'),
  resetPeriod: () => api.post('/api/admin/period/reset'),
  listAudit: (limit = 200) => api.get<AuditEntry[]>(`/api/admin/audit-log?limit=${limit}`),
  createProposal: (data: {
    name: string;
    description: string;
    how?: string;
    time_estimate?: string;
  }) => api.post<Proposal>('/api/admin/proposals', data),
  editProposal: (
    id: number,
    data: { name?: string; description?: string; how?: string; time_estimate?: string },
  ) => api.patch<Proposal>(`/api/admin/proposals/${id}`, data),
  excludeProposal: (id: number) => api.post(`/api/admin/proposals/${id}/exclude`),
  restoreProposal: (id: number) => api.post(`/api/admin/proposals/${id}/restore`),
  mergeProposals: (data: {
    parent_ids: number[];
    name: string;
    description: string;
    how?: string;
    time_estimate?: string;
  }) => api.post<Proposal>('/api/admin/proposals/merge', data),
  unmergeProposal: (id: number) => api.post(`/api/admin/proposals/${id}/unmerge`),
  importCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.postForm<{ imported: number; skipped: number }>('/api/admin/proposals/import', fd);
  },
  downloadResultsCsv: () => api.rawGet('/api/results.csv'),
};
