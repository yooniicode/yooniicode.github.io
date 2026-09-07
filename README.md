# YooniCode

개인 기술 블로그 — <https://yooniicode.site>

Jekyll + [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) 기반이며,
테마 파일(`_layouts/`, `_includes/`, `_sass/`)을 이 저장소에 직접 두고 고쳐 쓴다.
`remote_theme` 은 쓰지 않는다 — 원격 테마를 함께 켜두면 GitHub Pages 에서만 그쪽이
끼어들어 로컬 빌드와 결과가 갈릴 수 있기 때문이다.

## 로컬에서 실행

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
```

## 저장소 구조

```
_posts/          글. 파일명은 YYYY-MM-DD-제목.md
_pages/          about, 404, 카테고리/태그/연도 아카이브
_layouts/        테마 레이아웃 (로컬 사본)
_includes/       테마 파셜 (로컬 사본) + post-image.html
_sass/           테마 스타일 (로컬 사본)
assets/css/main.scss     이 블로그의 디자인 토큰과 조판 규칙
assets/images/posts/     포스트별 이미지 — 규칙은 그 안 README.md 참고
```

## 글 쓰기

front matter 는 이런 모양이다.

```yaml
---
title: "제목"
date: 2026-09-06 00:00:00 +0900
categories: [Backend]        # 아래 7개 중 하나
tags: [Spring, JWT]
assets: 2026-09-06-slug      # 이미지를 쓸 때만
toc: true                    # 긴 글이면
toc_sticky: true
---
```

### 카테고리

`AWS` · `Backend` · `Blog` · `AI` · `CS` · `Frontend` · `PM` 일곱 개로 쓴다.
글 주소가 `/:categories/:title/` 라 카테고리를 바꾸면 주소가 바뀐다.
**바꿀 때는 `redirect_from` 에 예전 주소를 남겨야** 기존 링크가 살아 있다.

```yaml
redirect_from: ["/server/예전-제목/"]
```

### 이미지

외부 이미지 주소, 특히 Notion 의 `X-Amz-Expires` 가 붙은 서명 URL 을 본문에
붙여넣지 않는다. 한 시간 뒤 403 이 되어 영구히 깨진다.
이미지는 내려받아 `assets/images/posts/<폴더>/` 에 두고 헬퍼로 참조한다.

```liquid
{% include post-image.html src="01.png" width="1506" height="517"
   alt="스크린리더가 읽을 설명" caption="그림 아래 붙는 설명" %}
```

자세한 규칙은 [`assets/images/posts/README.md`](assets/images/posts/README.md).

## 배포 전 점검

```bash
bundle exec jekyll build

# 이미지 경로가 실제 파일과 맞는지 대조
grep -rho 'src="/assets/images/[^"]*"' _site --include="*.html" \
  | sed 's/src="//;s/"//' | sort -u \
  | while read p; do
      [ -f "_site$p" ] && echo "OK     $p" || echo "BROKEN $p"
    done
```

## 라이선스

글과 이미지의 저작권은 작성자에게 있다.
테마는 Minimal Mistakes (MIT) — [LICENSE](LICENSE) 참고.
