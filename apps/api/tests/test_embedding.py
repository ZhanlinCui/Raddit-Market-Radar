from app.llm.embedding import MockEmbeddingProvider, cosine, semantic_rank


def test_embedding_deterministic_and_normalized():
    p = MockEmbeddingProvider()
    v1 = p.embed("need a booking system for my salon")
    v2 = p.embed("need a booking system for my salon")
    assert v1 == v2
    # normalized -> self cosine ~ 1
    assert abs(cosine(v1, v2) - 1.0) < 1e-6


def test_semantic_rank_prefers_related_doc():
    docs = [
        "I need a booking system, WhatsApp is a mess with double bookings",
        "What mechanical keyboard do you use for typing",
    ]
    scores = semantic_rank("small business owner looking for appointment booking software", docs)
    assert scores[0] > scores[1]
