import logging

from langgraph.graph import END, StateGraph

from src.agents.researcher import researcher_node
from src.agents.reviewer import reviewer_node
from src.agents.writer import writer_node
from src.config import settings
from src.state import AgentState

logger = logging.getLogger("agent.graph")


def _route_after_review(state: AgentState) -> str:
    if state.get("approved") or state.get("revision_count", 0) >= settings.max_revisions:
        return END
    return "writer"


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("researcher", researcher_node)
    graph.add_node("writer", writer_node)
    graph.add_node("reviewer", reviewer_node)

    graph.set_entry_point("researcher")
    graph.add_edge("researcher", "writer")
    graph.add_edge("writer", "reviewer")
    graph.add_conditional_edges("reviewer", _route_after_review, {"writer": "writer", END: END})

    return graph.compile()
