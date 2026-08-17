import logging

from src.config import get_llm
from src.state import AgentState

logger = logging.getLogger("agent.writer")

WRITE_PROMPT = """You are a copywriter. Write a short article (3-4 paragraphs) about the topic \
below, using the research notes provided.

Topic: {topic}

Research notes:
{research_notes}
{feedback_block}

Write only the article, no preamble."""


def writer_node(state: AgentState) -> AgentState:
    feedback_block = (
        f"\nReviewer feedback from the previous draft (address this):\n{state['feedback']}"
        if state.get("feedback")
        else ""
    )

    llm = get_llm()
    response = llm.invoke(
        WRITE_PROMPT.format(
            topic=state["topic"],
            research_notes=state["research_notes"],
            feedback_block=feedback_block,
        )
    )
    logger.info("Draft written for %r (revision %d)", state["topic"], state.get("revision_count", 0))

    return {**state, "draft": response.content}
