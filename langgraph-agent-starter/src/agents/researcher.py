import logging

from src.config import get_llm
from src.state import AgentState
from src.tools.web_search import search_web

logger = logging.getLogger("agent.researcher")

RESEARCH_PROMPT = """You are a research assistant. Summarize the most relevant, factual points \
about the topic below into concise bullet notes a writer can use to draft an article.

Topic: {topic}

Search results:
{sources}

Return 5-8 bullet points of concrete findings. Do not write the article itself."""


def researcher_node(state: AgentState) -> AgentState:
    topic = state["topic"]
    results = search_web(topic)
    sources = (
        "\n".join(f"- {r['title']}: {r['snippet']} ({r['url']})" for r in results)
        or "No search results were found; rely on general knowledge and note that."
    )

    llm = get_llm()
    response = llm.invoke(RESEARCH_PROMPT.format(topic=topic, sources=sources))
    logger.info("Researched %r using %d sources", topic, len(results))

    return {**state, "research_notes": response.content}
