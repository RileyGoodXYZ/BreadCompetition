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
