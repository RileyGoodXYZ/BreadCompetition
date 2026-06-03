from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

SubmissionType = Literal["match", "subjective", "pit", "break"]


class SubmissionBase(BaseModel):
    scout_name: str = Field(min_length=1)
    team_number: int = Field(ge=0)
    event_key: Optional[str] = None
    match_number: Optional[int] = Field(default=None, ge=0)
    session_type: Optional[str] = None
    client_uuid: Optional[str] = None
    data: dict[str, Any] = Field(default_factory=dict)


class MatchSubmission(SubmissionBase):
    pass


class SubjectiveSubmission(SubmissionBase):
    pass


class PitSubmission(SubmissionBase):
    pass


class BreakSubmission(SubmissionBase):
    pass


class SubmissionRecord(BaseModel):
    id: int
    type: SubmissionType
    scout_name: str
    event_key: Optional[str]
    match_number: Optional[int]
    team_number: int
    session_type: Optional[str]
    data: dict[str, Any]
    client_uuid: Optional[str]
    created_at: datetime


# ---------------------------------------------------------------------------
# Teams (global catalog)
#
# Properties of a team that don't depend on which event they're at — name,
# drivetrain, image, nickname. Attendance is modeled separately via
# `event_teams` (see EventTeamRegister below).
# ---------------------------------------------------------------------------
class TeamBase(BaseModel):
    team_number: int = Field(ge=0)
    name: str = Field(min_length=1)
    data: dict[str, Any] = Field(default_factory=dict)


class TeamUpsert(TeamBase):
    pass


class TeamRecord(TeamBase):
    updated_at: datetime


# ---------------------------------------------------------------------------
# Events
#
# `event_key` mirrors TBA (e.g. `2026casj`) so we can sync from upstream
# later. Everything decorative (location, dates string, status text used by
# the Home shell) lives in `data`.
# ---------------------------------------------------------------------------
class EventBase(BaseModel):
    event_key: str = Field(min_length=1)
    name: str = Field(min_length=1)
    data: dict[str, Any] = Field(default_factory=dict)


class EventUpsert(EventBase):
    pass


class EventRecord(EventBase):
    updated_at: datetime


class EventTeamRegister(BaseModel):
    """Body for POST /api/events/{key}/teams — register one or more teams
    as attending. Accept a list so the seed script / TBA sync can do it in
    one round-trip."""
    team_numbers: list[int] = Field(min_length=1)


# ---------------------------------------------------------------------------
# Picklists
#
# Mirrors the in-memory document the frontend already builds in
# `picklists-store.jsx`. Anything specific to a picklist's body (slots[],
# rankings order, columns, collaborators, updatedLabel string) goes into
# `data` until the shape settles. Top-level fields are limited to what we
# filter/sort by (`kind`, `event_key`, `archived`, `starred`).
# ---------------------------------------------------------------------------
PicklistKind = Literal["shared", "my"]


class PicklistBase(BaseModel):
    title: str = Field(min_length=1)
    event_key: Optional[str] = None
    kind: PicklistKind = "my"
    owner: Optional[str] = None  # placeholder until we have real auth
    starred: bool = False
    archived: bool = False
    data: dict[str, Any] = Field(default_factory=dict)


class PicklistCreate(PicklistBase):
    # Optional client-supplied id (lets the UI keep the same id it generated
    # offline). When omitted the server mints one. Keep this simple — no
    # `client_uuid` style idempotency yet; picklist creates are user actions.
    id: Optional[str] = None


class PicklistUpdate(BaseModel):
    """Partial update. Every field is optional; omitted fields stay as-is.

    `data` is replaced wholesale when provided — no deep merge. The frontend
    sends the whole document on save, so this keeps the server dumb.
    """
    title: Optional[str] = Field(default=None, min_length=1)
    event_key: Optional[str] = None
    kind: Optional[PicklistKind] = None
    owner: Optional[str] = None
    starred: Optional[bool] = None
    archived: Optional[bool] = None
    data: Optional[dict[str, Any]] = None


class PicklistRecord(PicklistBase):
    id: str
    created_at: datetime
    updated_at: datetime
