from crewai import Crew, Process

from src.agents import build_agents
from src.tasks import build_tasks


def build_crew(topic: str) -> Crew:
    agents = build_agents()
    tasks = build_tasks(topic, agents)
    return Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )
