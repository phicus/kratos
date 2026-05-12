"""Cómputo del ranking final (sólo con periodo `cerrado`)."""

from __future__ import annotations

import sqlite3


def ranking(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute("""
        SELECT p.id          AS proposal_id,
               p.name        AS name,
               COALESCE(SUM(vs.score), 0)            AS total_score,
               COUNT(DISTINCT vs.ballot_uuid)        AS vote_count
        FROM proposals p
        LEFT JOIN vote_scores vs ON vs.proposal_id = p.id
        WHERE p.status = 'votable'
        GROUP BY p.id
        ORDER BY total_score DESC, name COLLATE NOCASE ASC
        """).fetchall()
    return [
        {
            "proposal_id": r["proposal_id"],
            "name": r["name"],
            "total_score": int(r["total_score"]),
            "vote_count": int(r["vote_count"]),
        }
        for r in rows
    ]
