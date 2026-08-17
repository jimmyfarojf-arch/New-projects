import logging
import sys

from src.crew import build_crew
from src.logging_config import setup_logging
from src.tools.file_access import write_file

logger = logging.getLogger("agent.main")


def run(topic: str) -> str:
    crew = build_crew(topic)
    result = crew.kickoff()
    return str(result)


def main() -> None:
    setup_logging()
    topic = " ".join(sys.argv[1:]) or input("Topic: ")

    article = run(topic)
    print("\n--- FINAL ARTICLE ---\n")
    print(article)

    try:
        path = write_file("output/article.md", article)
        logger.info("Saved article to %s", path)
    except OSError:
        logger.exception("Could not save article to workspace")


if __name__ == "__main__":
    main()
