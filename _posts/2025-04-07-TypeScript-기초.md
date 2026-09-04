---
title: "TypeScript 기초"
date: 2025-04-07 00:00:00 +0900
categories: [FE]
tags: []
---

#### 리액트 프레임워크
- 앵귤러, 뷰와 함께 대표적인 프론트엔드 자바스크립트 프레임워크
- 프론트엔드 프레임워크 = 클라이언트에서 동작하는 템플릿 엔진
  - JS 객체를 DOM 객체로 전환해주는 역할을 

싱글 페이지 애플리케이션 (리액트의 경우)
- 서버에 자원을 한 번만 요청함
- 백엔드에서 받은 데이터를 해석하여 동적으로 화면을 생성함

멀티 페이지 애플리케이션
→ 과거 렌더링 내용을 모두 지운 후 다시 렌더링
- 새로 고침 현상 발생, 요청시마다 새로운 HTML 전달받음

#### 윈도우 개발 환경
- 노드, vscode, scoop, ~~homebrew(맥),~~ touch(파일관리 유틸리티)
- 파워셸에서 $env:SCOOP=”D:\Scoop” 으로 환경 변수 만들기 → A(모두 예)
- scoop install git aria2
- scoop install nodejs-lts
- node -v로 버전 확인
- scoop bucket add extras
- scoop install vscode
  - 업데이트시 scoop update *
  - cd c:\scoop\apps\vscode\current
  - .\install-context.reg
  - 통하여 마우스 오른쪽으로 눌렀을 때 vscode로 실행하도록 함 
- scoop install touch
- vscode 내에서 프리티어 설치, //prettier-ignore를 통하여 아래 행에 적용하지 않도록 함

#### 프로젝트 만들기
cra(create-react-app)을 이용하여 만들기 때문에, 
npx create-react-app 프로젝트-이름 —template typescript
