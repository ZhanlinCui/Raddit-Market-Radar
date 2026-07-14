"""Embedding provider abstraction + deterministic mock for semantic recall.

The mock uses a hashing bag-of-words vector so cosine similarity is meaningful
and reproducible without any network calls. Swap for a real provider by
implementing `embed`.
"""
from __future__ import annotations

import abc
import hashlib
import math
import re

from app.core.config import get_settings

_DIM = 128
_TOKEN = re.compile(r"[a-z0-9]+")


class EmbeddingProvider(abc.ABC):
    is_mock: bool = False

    @abc.abstractmethod
    def embed(self, text: str) -> list[float]:
        ...


class MockEmbeddingProvider(EmbeddingProvider):
    is_mock = True

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * _DIM
        for tok in _TOKEN.findall(text.lower()):
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            vec[h % _DIM] += 1.0
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def get_embedding_provider() -> EmbeddingProvider:
    # Only mock is wired for the MVP; real providers plug in here.
    _ = get_settings()
    return MockEmbeddingProvider()


def semantic_rank(query: str, docs: list[str], provider: EmbeddingProvider | None = None) -> list[float]:
    """Return cosine similarity of each doc to the query."""
    p = provider or get_embedding_provider()
    qv = p.embed(query)
    return [cosine(qv, p.embed(d)) for d in docs]
