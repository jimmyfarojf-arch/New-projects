import logging
import sys

from src.graph import build_graph
from src.logging_config import setup_logging
from src.tools.file_access import write_file

logger = logging.getLogger("agent.main")


def run(topic: str) -> str:
    graph = build_graph()
    final_state = graph.invoke({"topic": topic, "revision_count": 0, "feedback": ""})
    return final_state["draft"]


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
