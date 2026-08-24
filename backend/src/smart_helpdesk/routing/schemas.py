import uuid
from pydantic import BaseModel, ConfigDict, Field


class ScoreBreakdown(BaseModel):
    """Detailed point breakdown contributing to total score (out of 100.0)."""

    location: float = Field(..., description="Location/proximity contribution (max 20.0 pts)")
    rating: float = Field(..., description="Overall customer rating contribution (max 25.0 pts)")
    customer_history: float = Field(..., description="Specific customer affinity contribution (max 25.0 pts)")
    reopen_rate: float = Field(..., description="Job completion quality contribution (max 15.0 pts)")
    workload: float = Field(..., description="Workload utilization contribution (max 15.0 pts)")


class RankedCandidate(BaseModel):
    """Ranked eligible technician candidate with explainable scoring."""

    rank: int = Field(..., ge=1, description="Deterministic rank position (1 is top recommended)")
    technician_id: uuid.UUID
    technician_name: str
    total_score: float = Field(..., ge=0.0, le=100.0, description="Total weighted score [0.0 - 100.0]")
    score_breakdown: ScoreBreakdown

    model_config = ConfigDict(from_attributes=True)


class ExcludedCandidate(BaseModel):
    """Technician excluded during mandatory eligibility checks."""

    technician_id: uuid.UUID
    technician_name: str
    reasons: list[str] = Field(..., description="List of mandatory eligibility checks failed")

    model_config = ConfigDict(from_attributes=True)


class RecommendedTechnician(BaseModel):
    """Top-ranked technician recommended for dispatch."""

    technician_id: uuid.UUID
    technician_name: str
    total_score: float

    model_config = ConfigDict(from_attributes=True)


class RoutingPreviewResponse(BaseModel):
    """Read-only evaluation result of technician eligibility and ranking for a ticket."""

    ticket_id: uuid.UUID
    ticket_category: str
    technicians_considered: int
    eligible_count: int
    excluded_candidates: list[ExcludedCandidate] = []
    ranked_candidates: list[RankedCandidate] = []
    recommended_technician: RecommendedTechnician | None = None

    model_config = ConfigDict(from_attributes=True)
