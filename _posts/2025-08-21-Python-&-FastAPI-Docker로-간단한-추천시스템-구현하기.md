---
title: "[Python & FastAPI] Docker로 간단한 추천시스템 구현하기"
date: 2025-08-21 00:00:00 +0900
categories: [AI]
tags: []
---

#### 트러블슈팅 ; fastAPI 무한 로딩 이슈
netstat -ano | findstr "127.0.0.1:8000” 했더니

netstat -ano | findstr 127.0.0.1
소켓이 주르륵 뜨길래 kill하려 했으나… orphan socket이다.

C:\Users\iyjgk>tasklist | findstr 37800
C:\Users\iyjgk>net stop winnat
The Windows NAT Driver service is not started.
More help is available by typing NET HELPMSG 3521.
C:\Users\iyjgk>net start winnat
System error 5 has occurred.
Access is denied.
- 이건 그냥 관리자 권한으로 들어가서 다시 하믄 된다
`net stop winnat
net start winnat` 

`netsh int ip reset
netsh winsock reset`
까지 해주고 재부팅했더니 다 날아갔다 ㅎㅎ
→ 그리고 다시 실행시키니까 괜찮아짐. 

근데 매번 재실행할순 없는데 ㅜㅜ
C:\Users\iyjgk>netstat -ano | findstr 127.0.0.1:8000
TCP    127.0.0.1:8000         0.0.0.0:0              LISTENING       38280
TCP    127.0.0.1:8000         0.0.0.0:0              LISTENING       27252
TCP    127.0.0.1:8000         127.0.0.1:54526        CLOSE_WAIT      27252
TCP    127.0.0.1:8000         127.0.0.1:54527        CLOSE_WAIT      27252
TCP    127.0.0.1:8000         127.0.0.1:54529        CLOSE_WAIT      27252
TCP    127.0.0.1:8000         127.0.0.1:54533        CLOSE_WAIT      27252
TCP    127.0.0.1:54526        127.0.0.1:8000         FIN_WAIT_2      29068
TCP    127.0.0.1:54527        127.0.0.1:8000         FIN_WAIT_2      29068
TCP    127.0.0.1:54529        127.0.0.1:8000         FIN_WAIT_2      29068
TCP    127.0.0.1:54533        127.0.0.1:8000         FIN_WAIT_2      29068

C:\Users\iyjgk>taskkill /F /PID 38280
SUCCESS: The process with PID 38280 has been terminated.
C:\Users\iyjgk>taskkill /F /PID 27252
ERROR: The process "27252" not found.

근데 파이참 내의 파워셸에서도 ctrl + c로 킬이 안돼서
`taskkill /im uvicorn.exe /f /t` 해줬다. gitbash로 uvicorn 쓰면 안되고 파워셸에서만 가능하다 !!! ㅜㅜ

python -m uvicorn main:app --reload
pipenv run pytest tests/

[https://sir.kr/g6_pythonista/129](https://sir.kr/g6_pythonista/129)

- **도커** (하위 페이지)
