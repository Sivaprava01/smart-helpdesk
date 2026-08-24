import logging
import sys
from smart_helpdesk.core.config import get_settings

logger = logging.getLogger("smart_helpdesk")


def setup_logging() -> None:
    """Configures application-wide structured and readable logging."""
    settings = get_settings()
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root/module logger handler and formatting
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    logger.setLevel(log_level)
