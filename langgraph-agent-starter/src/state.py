from typing import TypedDict


class AgentState(TypedDict, total=False):
    topic: str
    research_notes: str
    draft: str
    feedback: str
    approved: bool
    revision_count: int
