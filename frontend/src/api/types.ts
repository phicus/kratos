export type PeriodState = 'preparacion' | 'abierto' | 'cerrado';
export type ProposalStatus = 'votable' | 'excluded' | 'merged_parent';

export interface Me {
  email: string;
  is_admin: boolean;
  has_voted: boolean;
  period_state: PeriodState;
}

export interface Period {
  state: PeriodState;
  opened_at: string | null;
  closed_at: string | null;
}

export interface Proposal {
  id: number;
  name: string;
  description: string;
  how: string | null;
  time_estimate: string | null;
  original_author_email: string | null;
  status: ProposalStatus;
  parent_ids: number[];
}

export interface RankingEntry {
  proposal_id: number;
  name: string;
  total_score: number;
  vote_count: number;
}

export interface Ranking {
  period_state: PeriodState;
  closed_at: string | null;
  entries: RankingEntry[];
}

export interface AuditEntry {
  admin_email: string;
  action: string;
  target_ids: number[] | null;
  period_state_before: PeriodState | null;
  period_state_after: PeriodState | null;
  details: Record<string, unknown> | null;
  occurred_at: string;
}

export interface BallotItem {
  proposal_id: number;
  score: number;
}

// ─── Feature 002 — Admin Dashboard ─────────────────────────────────────────

export interface DashboardCounters {
  votable: number;
  excluded: number;
  merged_parent: number;
  ballots_cast: number;
}

export interface DashboardPeriod extends Period {
  opened_by: string | null;
  closed_by: string | null;
  expected_quorum: number | null;
}

export interface DashboardData {
  period: DashboardPeriod;
  counters: DashboardCounters;
  recent_audit: AuditEntry[];
}

export interface VoterReceiptSummary {
  email: string;
  voted_at: string;
}

export interface ParticipationData {
  voters_count: number;
  expected_quorum: number | null;
  voters: VoterReceiptSummary[];
}

export interface BulkProposalsResult {
  affected: number;
  bulk_group_id: string;
  skipped: Array<{ proposal_id: number; reason: string }>;
}
