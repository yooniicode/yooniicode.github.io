---
# Jekyll이 이 파일을 페이지로 만들지 않도록 막는다.
sitemap: false
published: false
---

# 포스트별 이미지 폴더

포스트 하나가 쓰는 이미지는 이 아래 **자기 폴더 하나**에만 둔다.
글을 지우면 폴더째 지우면 되고, 어떤 이미지가 어느 글 것인지 헷갈릴 일이 없다.

```
assets/images/
  nini.jpg                     ← 사이트 전역 자산 (프로필, og:image 등). 여기 두지 않는다
  posts/
    2026-03-31-vpc-route53/    ← 포스트 하나 = 폴더 하나
      subnet.png
      instance.png
      routing-table.png
    2026-09-04-spring-security/
      spring-request-flow.png
      spring-mvc-lifecycle.png
      filter-double-execution.png
```

## 새 글에 이미지 넣는 순서

**1) 폴더를 만든다.** 이름은 `YYYY-MM-DD-영문-요약` 형식.
글 파일 이름이 한글이어도 폴더는 영문으로 만든다 — 경로에 한글이 들어가면
URL이 `%EC%84%9C%EB%B8%8C...` 처럼 퍼센트 인코딩돼 다루기 번거로워진다.

**2) front matter 에 폴더 이름을 적는다.**

```yaml
---
title: "VPC, Route 53 실습 회고"
date: 2026-03-31 12:24:00 +0900
assets: 2026-03-31-vpc-route53      # ← 이 한 줄
---
```

**3) 본문에서는 파일 이름만 쓴다.**

```liquid
{% include post-image.html src="subnet.png" width="2506" height="500"
   alt="실습에서 생성한 VPC의 퍼블릭/프라이빗 서브넷 목록 콘솔 화면" %}
```

경로 `/assets/images/posts/2026-03-31-vpc-route53/` 는 헬퍼가 붙여준다.
나중에 폴더 이름을 바꾸고 싶으면 **front matter 한 줄만** 고치면 되고,
본문의 이미지 태그는 손댈 필요가 없다.

`width` / `height` 는 원본 픽셀 크기를 그대로 적는다. 그래야 브라우저가
이미지를 내려받기 전에 자리를 미리 확보해서, 로딩 중 글이 아래로 밀리지 않는다.
크기는 이미지 파일 속성에서 확인하거나 아래 명령으로 확인할 수 있다.

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem assets/images/posts/<폴더>/*.png | ForEach-Object {
  $i = [System.Drawing.Image]::FromFile($_.FullName)
  "{0}  {1}x{2}" -f $_.Name, $i.Width, $i.Height
  $i.Dispose()
}
```

헬퍼가 받는 나머지 인자는 [`_includes/post-image.html`](../../../_includes/post-image.html)
맨 위 주석에 정리돼 있다 (`caption`, `class`, `eager`, `dir`).

## 외부 이미지 링크를 본문에 붙여넣지 말 것

Notion에서 글을 옮겨올 때 이미지가 이런 주소로 딸려온다.

```
https://prod-files-secure.s3.us-west-2.amazonaws.com/...&X-Amz-Expires=3600&X-Amz-Signature=...
```

`X-Amz-Expires=3600` — **1시간 뒤에 만료되는 서명 URL**이다.
붙여넣을 땐 잘 보이지만 한 시간 뒤부터 403이 되어 영구히 깨진다.
반드시 이미지를 내려받아 위 폴더 규칙대로 저장하고 `post-image.html` 로 참조한다.

아래 글들이 이 문제를 겪었고, 2026-09-07 에 이미지를 다시 내려받아
`post-image.html` 참조로 전부 되살렸다 (총 29장).

- `2024-01-24-python-for-data-sci.md` (1장)
- `2024-08-29-우피,-Super-대신-도메인-직접-연결하기.md` (1장)
- `2024-08-30-Cloudflare-worker를-이용하여-폰트-변경하기.md` (1장)
- `2025-04-28-iSH-&-tinyproxy-이용한-테더링-데이터-사용-제한-풀기.md` (3장)
- `2025-08-18-AWS-인스턴스,-RDS,-프록시-설정-옮기기-....md` (6장)
- `2026-06-21-소셜벤처창업-26-1-회고록.md` (17장)

`2025-06-27-서울메타위크,-SMW-2025.md` 의 첨부파일 링크 1건만 원본을 못 찾아
`{% comment %}` 로 남겨 두었다 (해당 글은 `published: false`).

되살릴 때 이미지 순서는 원본 마크다운의 등장 순서와 폴더 안 `01`, `02` … 번호
순서를 맞추고, 캡션이 붙어 있던 이미지로 순서가 맞는지 교차 검증했다.

## 링크가 안 깨졌는지 확인하기

빌드한 결과에서 이미지 경로를 모두 뽑아 실제 파일이 있는지 대조한다.

```bash
bundle exec jekyll build
grep -rho 'src="/assets/images/[^"]*"' _site --include="*.html" \
  | sed 's/src="//;s/"//' | sort -u \
  | while read p; do
      [ -f "_site$p" ] && echo "OK     $p" || echo "BROKEN $p"
    done
```
