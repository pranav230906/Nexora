"""
Embedding generation service for the AI Chat module.
Uses OpenAI's text-embedding-3-small model for vector generation.
Graceful fallback to zero vectors when API is unavailable.
"""
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

# Embedding model config
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536


def generate_embedding(text: str) -> List[float]:
    """
    Generate an embedding vector for the given text.
    Returns a list of floats (1536 dimensions).
    Falls back to zero vector if API is unavailable.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or api_key.startswith("gsk_") or api_key == "your-actual-openai-api-key" or api_key == "your-groq-api-key":
        logger.warning("No valid OpenAI API key set (using Groq key or placeholder) — returning zero embedding vector.")
        return [0.0] * EMBEDDING_DIMENSIONS

    try:
        import openai
        base_url = os.environ.get("OPENAI_BASE_URL")

        # Note: embeddings require the actual OpenAI endpoint, not OpenRouter
        # If using OpenRouter for chat, we still try OpenAI for embeddings
        client_kwargs = {'api_key': api_key}
        # Only use base_url if it's the actual OpenAI API
        if base_url and 'openai.com' in base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text[:8000],  # Truncate to avoid token limits
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return [0.0] * EMBEDDING_DIMENSIONS


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a batch of texts.
    Falls back to zero vectors if API is unavailable.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or not texts or api_key.startswith("gsk_") or api_key == "your-actual-openai-api-key" or api_key == "your-groq-api-key":
        return [[0.0] * EMBEDDING_DIMENSIONS for _ in texts]

    try:
        import openai
        client_kwargs = {'api_key': api_key}
        base_url = os.environ.get("OPENAI_BASE_URL")
        if base_url and 'openai.com' in base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        # Truncate each text
        truncated = [t[:8000] for t in texts]

        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=truncated,
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        return [[0.0] * EMBEDDING_DIMENSIONS for _ in texts]
