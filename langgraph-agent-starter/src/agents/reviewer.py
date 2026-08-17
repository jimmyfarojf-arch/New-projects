import logging

from src.config import get_llm
from src.state import AgentState

logger = logging.getLogger("agent.reviewer")

REVIEW_PROMPT = """You are an editor. Review the draft article below against the research notes.

Topic: {topic}

Research notes:
{research_notes}

Draft:
{draft}

If the draft is accurate, on-topic, and well-written, respond with exactly:
APPROVED

Otherwise respond with:
REVISE
<one paragraph of specific, actionable feedback>"""


def reviewer_node(state: AgentState) -> AgentState:
    llm = get_llm(temperature=0)
    response = llm.invoke(
        REVIEW_PROMPT.format(
            topic=state["topic"],
            research_notes=state["research_notes"],
            draft=state["draft"],
        )
    ).content.strip()

    revision_count = state.get("revision_count", 0)
    approved = response.upper().startswith("APPROVED")
    feedback = "" if approved else response.split("\n", 1)[-1]

    logger.info(
        "Review for %r: %s (revision %d)",
        state["topic"],
        "approved" if approved else "revise",
        revision_count,
    )

    return {
        **state,
        "approved": approved,
        "feedback": feedback,
        "revision_count": revision_count + 1,
    }
