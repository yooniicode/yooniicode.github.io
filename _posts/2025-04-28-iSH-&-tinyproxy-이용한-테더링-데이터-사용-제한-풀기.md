---
title: "iSH & tinyproxy 이용한 테더링 데이터 사용 제한 풀기"
date: 2025-04-28 00:00:00 +0900
assets: 2025-04-28-ish-tinyproxy
categories: [Blog]
tags: [프록시, iOS, 트러블슈팅]
---

- 데이터를 다써도 속도제한으로 무제한 이용할 수 있다는 말이 테더링 데이터에도 적용되는 줄 알았다.
- 사실 아니고 **휴대폰만 무제한으로 쓸 수 있다는 말이다 **🥲 집에 와이파이 회선을 깔아놓지 않아서 큰 문제거리가 되었다.

- 어떻게든 사용해야 하는 시험기간이라서.. 프록시 서버를 이용하여 회피하는 방법을 사용했다. 다른 방법으로는 APN 설정하는 방법이 있는 것 같은데 나한테는 잘 되지 않았다!
- 사용환경 skt + 아이폰으로 진행했다. (아마 타 통신사도 가능할듯)
  - 탈옥 필요 없는 iSH를 앱스토어에서 깔면 된다.
    iSH 깔았으면 설정 가서 iphone 자체의 location 사용 권한 풀어줘야 한다.

- 설정 빠르고 설치 단순하고 리소스 거의 안잡아먹는 경량 프록시 서버인 Tinyproxy ^^ 를 써서 이를 해결할 것이다. ~~#life hacks~~
```bash
apk update && apk add tinyproxy && \
sed -i 's/^Allow 127.0.0.1$/Allow 0.0.0.0\/0/' /etc/tinyproxy/tinyproxy.conf && \
echo -e "tinyproxy &\ncat /dev/location > /dev/null &\nps aux | grep tinyproxy | grep -v grep\ngrep '^Allow' /etc/tinyproxy/tinyproxy.conf" >> ~/.profile && \
source ~/.profile
```
- 모든 외부 ip가 접근하도록 허용하면 된다. 
  - sed (스트림 편집기)로 기존 설정파일 tinyproxy.conf에서 allow 127.0.0.1을 전체로 바꿔줬다.
- echo ~~ profile 까지는 터미널 열때 자동으로 실행하도록 명령어 추가했다.

- 참고로 카카오톡 pc버전 사용하고 싶으면 프록시 서버 설정해줘야 한다.
  {% include post-image.html src="01.png" width="475" height="316"
     alt="카카오톡 네트워크 설정에서 HTTP 프록시 서버를 172.20.10.1, 포트 8888로 지정한 화면" %}
- 제어판 control panel 에서도 proxy 설정해줘야 한다.
  {% include post-image.html src="02.png" width="1288" height="545"
     alt="Windows 설정의 Network & internet > Proxy 화면" %}
  {% include post-image.html src="03.png" width="675" height="617"
     alt="Windows Edit proxy server 대화상자에 172.20.10.1과 포트 8888을 입력한 화면" %}

- 여기까지 괜찮았고 잘 실행되는 것 같았으나 터미널이 수시로 종료되는 문제점이 있었어서, (아이폰 자체의 리소스 고갈이라고 생각했다)
  `ps aux` 를 통해 봤더니 프로세스가 계속 쌓여있으며 계속 중복실행됨을 확인했다.
```python
# 프로세스 죽이기
killall tinyproxy

# 프로세스 직접 찾기
ps aux | grep tinyproxy | grep -v grep

# 특정 PID 강제 종료
kill -9 [PID]

# profile 파일 수정
vi ~/.profile

# 수정 적용
source ~/.profile

# tinyproxy 포트 확인
netstat -tuln | grep 8888
```

- 접속한 환경이 리눅스(*alpine) 기반이라 그런가 vi 명령어 써가면서 해결할 수 있어서 좋았다! i wq 오랜만에 써본다..
  - vi profile에서 tinyproxy 관련 명령어가 중첩되어있는 것을 확인해서 하나만 남기고 다 지워주었다.
- 이후에는 그냥 자동실행 말고 커널에 tinyproxy 써가면서 사용해야 할 듯 싶다! ~~시험기간이라 공부말고 이런게 더 재밌다 ㅠㅠ~~
