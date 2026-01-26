"""
Factory for creating the appropriate AI parser based on configuration.
Chooses between Anthropic API and AWS Bedrock.
"""

import logging

from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_ai_parser():
    """
    Get the appropriate AI parser based on configuration.

    Returns:
        AIParser or BedrockParser instance based on settings
    """
    if settings.use_bedrock:
        logger.info("Using AWS Bedrock for AI parsing (no overload errors!)")
        from src.receipts.bedrock_parser import BedrockParser
        return BedrockParser()
    else:
        logger.info("Using Anthropic API for AI parsing")
        from src.receipts.ai_parser import AIParser
        return AIParser()


# For backward compatibility
def get_parser():
    """Alias for get_ai_parser()"""
    return get_ai_parser()
