"""문장 임베딩 + 내용 해시 캐시. 글이 바뀌지 않았으면 모델을 아예 로드하지 않는다."""
import hashlib
import json
from pathlib import Path

import numpy as np


class CachedEmbedder:
    def __init__(self, model_name: str, cache_path: Path, max_seq_length: int = 2048):
        self.model_name = model_name
        self.cache_path = cache_path
        self.max_seq_length = max_seq_length
        self.cache: dict[str, list[float]] = (
            json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
        )
        self._model = None

    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name, device="cpu")
            self._model.max_seq_length = self.max_seq_length
        return self._model

    def _hash(self, text: str) -> str:
        key = f"{self.model_name}::{self.max_seq_length}::{text}"
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    def embed(self, texts: list[str]) -> np.ndarray:
        hashes = [self._hash(t) for t in texts]
        missing = [(h, t) for h, t in zip(hashes, texts) if h not in self.cache]
        if missing:
            print(f"임베딩 계산: {len(missing)}개 (캐시 적중 {len(texts) - len(missing)}개)")
            vecs = self.model.encode(
                [t for _, t in missing],
                normalize_embeddings=True,
                batch_size=4,
                show_progress_bar=True,
            )
            for (h, _), v in zip(missing, vecs):
                self.cache[h] = [round(float(x), 6) for x in v]
        else:
            print(f"전부 캐시 적중 ({len(texts)}개), 모델 로드 생략")
        # 지금 글에 해당하지 않는 오래된 항목은 버려서 캐시가 계속 커지지 않게 한다.
        self.cache = {h: self.cache[h] for h in hashes}
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache_path.write_text(json.dumps(self.cache), encoding="utf-8")
        return np.array([self.cache[h] for h in hashes], dtype=np.float32)
