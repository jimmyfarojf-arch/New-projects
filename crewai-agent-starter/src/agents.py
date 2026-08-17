from crewai import Agent

from src.config import get_llm
from src.tools.web_search import web_search_tool


def build_agents() -> dict[str, Agent]:
    llm = get_llm()

    researcher = Agent(
        role="Researcher",
        goal="Find accurate, up-to-date facts about the given topic",
        backstory="A meticulous analyst who only reports what the sources actually say.",
        tools=[web_search_tool],
        llm=llm,
        verbose=True,
    )

    writer = Agent(
        role="Writer",
        goal="Turn research notes into a clear, engaging short article",
        backstory="A copywriter who writes tight, factual prose with no fluff.",
        llm=llm,
        verbose=True,
    )

    reviewer = Agent(
        role="Editor",
        goal="Catch factual errors, off-topic content, and weak writing before publication",
        backstory="A strict editor who rejects anything that doesn't match the research.",
        llm=llm,
        verbose=True,
    )

    return {"researcher": researcher, "writer": writer, "reviewer": reviewer}
