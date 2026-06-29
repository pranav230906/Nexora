"""
FAISS-based vector store for semantic search of chat conversations.
Per-user FAISS indices stored as files in vector_store/{user_id}/.
Lazy-loaded and cached in memory for performance.
"""
import os
import json
import logging
import threading
from pathlib import Path
from typing import List, Dict, Optional

import numpy as np

from . import embeddings as emb

logger = logging.getLogger(__name__)

# Base directory for storing FAISS indices
VECTOR_STORE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'vector_store'
)

# In-memory cache for loaded indices
_index_cache = {}
_cache_lock = threading.Lock()


class UserVectorStore:
    """
    Per-user FAISS index for semantic search over chat messages.
    """

    def __init__(self, user_id: int):
        self.user_id = user_id
        self.store_dir = os.path.join(VECTOR_STORE_DIR, str(user_id))
        self.index_path = os.path.join(self.store_dir, 'index.faiss')
        self.metadata_path = os.path.join(self.store_dir, 'metadata.json')
        self.index = None
        self.metadata: List[Dict] = []
        self._load_or_create()

    def _load_or_create(self):
        """Load existing index from disk or create a new one."""
        try:
            import faiss
        except ImportError:
            logger.warning("faiss-cpu not installed. Semantic search disabled.")
            return

        os.makedirs(self.store_dir, exist_ok=True)

        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            try:
                import faiss
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                return
            except Exception as e:
                logger.error(f"Failed to load FAISS index for user {self.user_id}: {e}")

        # Create new empty index
        self.index = faiss.IndexFlatL2(emb.EMBEDDING_DIMENSIONS)
        self.metadata = []

    def _save(self):
        """Persist index and metadata to disk."""
        if self.index is None:
            return
        try:
            import faiss
            os.makedirs(self.store_dir, exist_ok=True)
            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'w') as f:
                json.dump(self.metadata, f)
        except Exception as e:
            logger.error(f"Failed to save FAISS index for user {self.user_id}: {e}")

    def add_message(self, message_text: str, metadata: Optional[Dict] = None):
        """
        Embed a message and add it to the index.
        """
        if self.index is None:
            return

        try:
            vector = emb.generate_embedding(message_text)

            # Skip zero vectors (API unavailable)
            if all(v == 0.0 for v in vector):
                return

            vector_np = np.array([vector], dtype='float32')
            self.index.add(vector_np)

            entry = {
                'text': message_text[:500],  # Store truncated text for retrieval
                **(metadata or {}),
            }
            self.metadata.append(entry)
            self._save()
        except Exception as e:
            logger.error(f"Failed to add message to vector store: {e}")

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for semantically similar messages.
        Returns list of metadata dicts with similarity scores.
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        try:
            query_vector = emb.generate_embedding(query)

            # Skip if embedding failed
            if all(v == 0.0 for v in query_vector):
                return []

            query_np = np.array([query_vector], dtype='float32')
            distances, indices = self.index.search(query_np, min(top_k, self.index.ntotal))

            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.metadata):
                    continue
                result = {**self.metadata[idx], 'score': float(dist)}
                results.append(result)

            return results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    def clear(self):
        """Clear the entire index for this user."""
        try:
            import faiss
            self.index = faiss.IndexFlatL2(emb.EMBEDDING_DIMENSIONS)
            self.metadata = []
            self._save()
        except Exception as e:
            logger.error(f"Failed to clear vector store: {e}")


def get_user_store(user_id: int) -> UserVectorStore:
    """
    Get or create a cached UserVectorStore instance.
    Thread-safe via lock.
    """
    with _cache_lock:
        if user_id not in _index_cache:
            _index_cache[user_id] = UserVectorStore(user_id)
        return _index_cache[user_id]
