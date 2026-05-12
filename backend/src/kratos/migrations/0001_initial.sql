-- Kratos — schema inicial
-- Ver data-model.md §SQL. Comentarios en data-model; aquí sólo DDL.

CREATE TABLE periods (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    state TEXT NOT NULL CHECK (state IN ('preparacion','abierto','cerrado')),
    opened_at TEXT,
    closed_at TEXT,
    opened_by TEXT,
    closed_by TEXT
);

INSERT OR IGNORE INTO periods(id, state) VALUES (1, 'preparacion');

CREATE TABLE proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
    description TEXT NOT NULL,
    how TEXT,
    time_estimate TEXT,
    original_author_email TEXT,
    status TEXT NOT NULL CHECK (status IN ('votable','excluded','merged_parent')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_proposals_status ON proposals(status);

CREATE TABLE proposal_merges (
    merged_proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    parent_proposal_id INTEGER NOT NULL REFERENCES proposals(id),
    merged_at TEXT NOT NULL DEFAULT (datetime('now')),
    merged_by TEXT NOT NULL,
    PRIMARY KEY (merged_proposal_id, parent_proposal_id)
);
CREATE UNIQUE INDEX idx_proposal_merges_parent ON proposal_merges(parent_proposal_id);

CREATE TABLE vote_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    voted_at TEXT NOT NULL,
    UNIQUE (user_email, period_id)
);

CREATE TABLE vote_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    proposal_id INTEGER NOT NULL REFERENCES proposals(id),
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    ballot_uuid TEXT NOT NULL,
    UNIQUE (ballot_uuid, proposal_id)
);
CREATE INDEX idx_vote_scores_proposal ON vote_scores(proposal_id);

CREATE TABLE admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_ids TEXT,
    period_state_before TEXT,
    period_state_after TEXT,
    details TEXT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
