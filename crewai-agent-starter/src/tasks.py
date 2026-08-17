from crewai import Agent, Task


def build_tasks(topic: str, agents: dict[str, Agent]) -> list[Task]:
    research_task = Task(
        description=f"Research the topic: {topic}. Produce 5-8 bullet points of concrete findings.",
        expected_output="A bullet list of factual findings with no article prose.",
        agent=agents["researcher"],
    )

    write_task = Task(
        description="Write a 3-4 paragraph article using the research findings above.",
        expected_output="A short, well-structured article in markdown.",
        agent=agents["writer"],
        context=[research_task],
    )

    review_task = Task(
        description=(
            "Review the article against the research findings. If it is accurate and "
            "well-written, output it unchanged. Otherwise rewrite it so it is."
        ),
        expected_output="The final, publication-ready article in markdown.",
        agent=agents["reviewer"],
        context=[research_task, write_task],
    )

    return [research_task, write_task, review_task]
