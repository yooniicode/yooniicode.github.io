"""고차원 임베딩을 3D 좌표로 줄이고, 원본 공간 기준 이웃을 뽑는다."""
import numpy as np
from sklearn.decomposition import PCA

# 글이 이보다 적으면 UMAP 이 불안정해서 PCA 로 대신한다.
UMAP_MIN_SAMPLES = 30


def project_3d(X: np.ndarray, seed: int = 42) -> np.ndarray:
    n = len(X)
    if n < UMAP_MIN_SAMPLES:
        coords = PCA(n_components=3, random_state=seed).fit_transform(X)
    else:
        import umap

        coords = umap.UMAP(
            n_components=3,
            n_neighbors=min(12, n - 1),
            min_dist=0.25,
            metric="cosine",
            random_state=seed,
        ).fit_transform(X)
    coords = coords - coords.mean(axis=0)
    return coords / np.abs(coords).max()  # [-1, 1]


def top_k_neighbors(X: np.ndarray, k: int = 5) -> list[list[tuple[int, float]]]:
    # 3D 로 줄이면 거리가 뒤틀리므로 "비슷한 글"은 원본 임베딩의 cosine 으로 고른다.
    sims = X @ X.T  # 정규화된 벡터라 내적이 곧 cosine
    np.fill_diagonal(sims, -1)
    idx = np.argsort(-sims, axis=1)[:, :k]
    return [[(int(j), float(sims[i, j])) for j in row] for i, row in enumerate(idx)]
