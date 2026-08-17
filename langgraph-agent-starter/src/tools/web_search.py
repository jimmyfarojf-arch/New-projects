import logging
from typing import TypedDict

logger = logging.getLogger("agent.tools.web_search")


class SearchResult(TypedDict):
    title: str
    url: str
    snippet: str


def search_web(query: str, max_results: int = 5) -> list[SearchResult]:
    """Search the web and return results. Fails gracefully (empty list) on any error
    so a flaky network or missing dependency never crashes the agent pipeline."""
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        logger.warning("duckduckgo-search is not installed; returning no results for %r", query)
        return []

    try:
        with DDGS() as ddgs:
            raw_results = list(ddgs.text(query, max_results=max_results))
    except Exception:
        logger.exception("Web search failed for query %r", query)
        return []

    return [
        {
            "title": r.get("title", ""),
            "url": r.get("href", ""),
            "snippet": r.get("body", ""),
        }
        for r in raw_results
    ]
