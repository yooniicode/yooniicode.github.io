"""_posts/*.md 를 읽어 임베딩에 넣을 텍스트로 정리한다."""
import re
from dataclasses import dataclass
from pathlib import Path

import frontmatter

# 코드 블록은 본문 주제보다 "코드다움" 쪽으로 임베딩을 끌어당겨서 언어 이름만 남긴다.
FENCE = re.compile(r"```(\w*)[^\n]*\n.*?```", re.S)
LIQUID = re.compile(r"\{%.*?%\}|\{\{.*?\}\}", re.S)
IMAGE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
HTML_TAG = re.compile(r"<[^>]+>")
URL = re.compile(r"https?://\S+")


@dataclass(frozen=True)
class Post:
    key: str  # 파일명. Liquid 에서 post.path 의 마지막 조각과 맞춰 본다.
    text: str


def _clean(body: str) -> str:
    body = FENCE.sub(lambda m: f" {m.group(1)} code ", body)
    body = LIQUID.sub(" ", body)
    body = IMAGE.sub(" ", body)
    body = LINK.sub(r"\1", body)
    body = HTML_TAG.sub(" ", body)
    body = URL.sub(" ", body)
    return re.sub(r"\s+", " ", body).strip()


def load_posts(posts_dir: Path) -> list[Post]:
    posts = []
    for path in sorted(posts_dir.glob("*.md")):
        fm = frontmatter.load(path)
        if fm.get("published") is False:
            continue
        title = fm.get("title", "")
        tags = " ".join(str(t) for t in (fm.get("tags") or []))
        # 제목과 태그를 앞에 붙이면 본문이 짧은 글도 주제가 안정적으로 잡힌다.
        posts.append(Post(key=path.name, text=f"{title}\n{tags}\n{_clean(fm.content)}"))
    return posts
