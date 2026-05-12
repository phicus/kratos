"""Pydantic schemas compartidos por todos los endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

PeriodState = Literal["preparacion", "abierto", "cerrado"]
ProposalStatus = Literal["votable", "excluded", "merged_parent"]


class Period(BaseModel):
    state: PeriodState
    opened_at: str | None = None
    closed_at: str | None = None


class Proposal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    how: str | None = None
    time_estimate: str | None = None
    original_author_email: str | None = None
    status: ProposalStatus
    parent_ids: list[int] = Field(default_factory=list)


class ProposalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    how: str | None = None
    time_estimate: str | None = None


class ProposalEdit(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    how: str | None = None
    time_estimate: str | None = None


class ProposalMergeRequest(BaseModel):
    parent_ids: list[int] = Field(min_length=2)
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    how: str | None = None
    time_estimate: str | None = None


class BallotItem(BaseModel):
    proposal_id: int
    score: int = Field(ge=1, le=10)


class BallotRequest(BaseModel):
    scores: list[BallotItem] = Field(min_length=1)


class Me(BaseModel):
    email: EmailStr
    is_admin: bool
    has_voted: bool
    period_state: PeriodState


class RankingEntry(BaseModel):
    proposal_id: int
    name: str
    total_score: int
    vote_count: int


class Ranking(BaseModel):
    period_state: PeriodState
    closed_at: str | None = None
    entries: list[RankingEntry]


class AuditEntry(BaseModel):
    admin_email: EmailStr
    action: str
    target_ids: list[int] | None = None
    period_state_before: PeriodState | None = None
    period_state_after: PeriodState | None = None
    details: dict | None = None
    occurred_at: str


class ImportCsvResult(BaseModel):
    imported: int
    skipped: int


# ─── Feature 002 — Admin Dashboard ────────────────────────────────────────


class DashboardCounters(BaseModel):
    votable: int = Field(ge=0)
    excluded: int = Field(ge=0)
    merged_parent: int = Field(ge=0)
    ballots_cast: int = Field(ge=0)


class DashboardPeriod(BaseModel):
    state: PeriodState
    opened_at: str | None = None
    closed_at: str | None = None
    opened_by: str | None = None
    closed_by: str | None = None
    expected_quorum: int | None = None


class DashboardData(BaseModel):
    period: DashboardPeriod
    counters: DashboardCounters
    recent_audit: list[AuditEntry] = Field(max_length=5)


class VoterReceiptSummary(BaseModel):
    """**Principio I**: este objeto NUNCA contiene scores ni ballot_uuid."""

    email: EmailStr
    voted_at: str


class ParticipationData(BaseModel):
    voters_count: int = Field(ge=0)
    expected_quorum: int | None = None
    voters: list[VoterReceiptSummary]


class QuorumUpdateRequest(BaseModel):
    expected_quorum: int | None = None


class BulkProposalsRequest(BaseModel):
    proposal_ids: list[int] = Field(min_length=1, max_length=200)


class BulkProposalsSkip(BaseModel):
    proposal_id: int
    reason: str


class BulkProposalsResult(BaseModel):
    affected: int = Field(ge=0)
    bulk_group_id: str
    skipped: list[BulkProposalsSkip] = Field(default_factory=list)
