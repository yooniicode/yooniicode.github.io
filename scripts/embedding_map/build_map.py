"""글 임베딩 지도 데이터를 만든다.

실행: scripts/embedding_map/.venv/Scripts/python scripts/embedding_map/build_map.py
결과: _data/post_map.json (파일명 -> 3D 좌표, 비슷한 글 5개)
URL, 제목, 요약은 Jekyll 이 붙인다(post-map.json 페이지). permalink 규칙을 여기서 흉내 내지 않기 위해서다.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from embedder import CachedEmbedder  # noqa: E402
from post_loader import load_posts  # noqa: E402
from projector import project_3d, top_k_neighbors  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MODEL = "BAAI/bge-m3"  # 한영 혼용 글이라 다국어 모델


def main() -> None:
    posts = load_posts(ROOT / "_posts")
    embedder = CachedEmbedder(MODEL, ROOT / ".cache" / "embeddings.json")
    X = embedder.embed([p.text for p in posts])

    coords = project_3d(X)
    neighbors = top_k_neighbors(X)

    out = {
        p.key: {
            "pos": [round(float(v), 4) for v in coords[i]],
            "neighbors": [
                {"key": posts[j].key, "score": round(s, 3)} for j, s in neighbors[i]
            ],
        }
        for i, p in enumerate(posts)
    }
    dest = ROOT / "_data" / "post_map.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(out)}개 글 -> {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
