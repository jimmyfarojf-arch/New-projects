import logging

from crewai.tools import tool

logger = logging.getLogger("agent.tools.web_search")


def search_web(query: str, max_results: int = 5) -> list[dict]:
    """Search the web and return results. Fails gracefully (empty list) on any error
    so a flaky network or missing dependency never crashes the crew run."""
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
        {"title": r.get("title", ""), "url": r.get("href", ""), "snippet": r.get("body", "")}
        for r in raw_results
    ]


@tool("Web Search")
def web_search_tool(query: str) -> str:
    """Search the web for a query and return the top results as text."""
    results = search_web(query)
    if not results:
        return "No results found."
    return "\n".join(f"- {r['title']}: {r['snippet']} ({r['url']})" for r in results)
