---
title: "iSH & tinyproxy 이용한 테더링 데이터 사용 제한 풀기"
date: 2025-04-28 00:00:00 +0900
categories: [Blog]
tags: []
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
  ![](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed31bb93-2d4a-497a-8fbc-c75b3e8c1b22/7e35e15a-f778-4098-b042-3a86b5f33898/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4662HWFJNMX%2F20260904%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260904T065230Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECYaCXVzLXdlc3QtMiJHMEUCIQCig0bkYUHR5QqcqF3veZ%2FlOJOlrVP93lPSvkSlUuARxgIgZWjMHYtMMuGybCFf6gQLqdXWIINSz4nzRtwpcvwjZ18qiAQI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDLI6zu%2F%2FWJ558h%2FpxCrcAyU1vHM2egIThZeirEg7sV2vBQbx0XajMHPfP3rsI1klkYFYJ2OnBexgx8vlvX8mX2j8%2B8bwlPolRFvnPoMrcpSIqU3JmBBFSXRx8sVDcPLXbtx2EgrTXm3MJArzn8Y3EIK%2BaAy6fZqviTYdEXNY25OK%2FUvqX0XMLcqD2v4vqic6r2QiRfdefiiExGd5x63ohc%2BMzrgd6pRFFFZM7g%2FpK0dONrc%2Fwin8XM0K6rxTgwpW2mP%2BeSKr8w%2BHbaFMrZadG4MUeXbqBIHLcuf%2FHC0MhlRZut5nQU%2Bc0ByfpUCkYcQtguHt1Bt0LdYFadcO6nTZb8jOysPoRhr4i6%2FEpDWufLVx0laD%2FPDEKQRD493LzmVSKT%2FX451XLYOXwozSdkaiOnv4uB68q9ii58FY4Ih6HELxdnFVDSvab3YdFHDK3MWAbUw89a5ZDV62GZEtByTxg69Z4fD9YMLG07lNmOEsAFWKcKhXDBKT%2B1GF%2BZCuQK9Yk6smKKjUxmynuUgVJbS9mlCmg5Qr95C9GDbPa261opY52oL2fst%2BBPMiUNVje4Z3z2l2Kq9QRuqvrHiW7Qg6RJrsM2ju34ULV4VgVE6Zn2UPBq9yV64QB5jdbMx9OoL7%2BazkBRFTfCnj2AmYMKay6dQGOqUBvmwVF3xlI3T3JIhztGdhWcTxK3CizkDvC394nPq3LHIdcZisZq64ZVpJXp6CsilFRJW3g9BDRgNI%2FsMjAQMBJZpSMI%2FKaP%2B18dwufArM15dB3GRziNncYJ6nFGJSeRuhIOy4mXjEuamX0TNUAL8Gmg0z1ZzSNEP4e5nghtWBIa1rD5UEKmngGHZg5cGXpqqLZlxt5kwR5JoJFTRbpnQCalumE5yh&X-Amz-Signature=cc156d422ecbae5011223f22f984bcb2cae47e428f836c6153fb005c81f91fd9&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)
- 제어판 control panel 에서도 proxy 설정해줘야 한다.
  ![](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed31bb93-2d4a-497a-8fbc-c75b3e8c1b22/f19f7eec-bb98-4882-9615-99eada06130c/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667KJJCZQ4%2F20260904%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260904T065231Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECYaCXVzLXdlc3QtMiJIMEYCIQCTX2YAGu8CoqJMiDG9pwsd8TO%2FvbG3eOjkFEYcjoXQgwIhAJt%2Fr0EvG2uEo6BRKA8RsUqsMKUAAYcptyrMibTEnn3%2FKogECO%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzpOtZfA2A6YYZzmTkq3APLnZHa115WhwyHWj%2FvOvluB26DPu3YBYgvBIuc3H7vu485jPgl6UmQdUmdgQe6Z8kJmx9HPxDgQIrNcsA7setd2r1fPbS%2FIQQxQo%2BfDdcQ4PhYWl%2BUvj1jva8aeXEZ3cxwSalynBdVYTLPBsf%2Fibh2yW%2F9PIn6dXWC0JGpLbR%2FIR56hfCtnbQ2ijAtYPimzoq7oLL0C93Gdh3NYES9TVJyqwrTXgUBu61Y4%2Fy2u%2BzO6mJXaZ1FQIugxH9CtasWSalrqXcjVK9TVVNT79fXvdsYmbzu9PXs9IeyoynZggvPnRrOT4chha2Y0pScRhnPRC9dJFuD2nQ686Sg1ljhMkNq8DjGfGSS7k3JQUiQfIF7yw4rxmMi2%2F0lCWwhssgHQICWWMNv14QWyLqWlrK%2FScaqkqnQA%2BqR9wE3VOmEyVwbgeA3uHaSlrGKolIdi76qyYncnN4mxUybvhNCeZSzqM17qvk1X8STs9%2B2J5mYfa3DyIS4o5C7pASxskKNQET0nZLsscjAsQEeu3DKp%2BhEK%2FQDiKg1WeKQ5eiWvHxTZEC5ltD3Ir2sS%2FnKTpqTsVaY6dEVMzi5ox8%2FhLaBtRtHPU3jD7KBmtyDZH6TlQAsBd%2BOjOCSW9BFuq%2FAwYGTnTDOsOnUBjqkAfCJt5OVwANG0sm52oZbcLA6dS18QLvWeC7lm8euIdbGkFpO9RF5DzLSiRG2ze9pklKR1U7EzM8PgV2AD3N9zRBNW2c%2FoJTsW9tHDngKHrdhSRpN2qiPAIALMDTiTFxY4NTUX%2BmQAiobhSLsm6t7FteEl5KRgE7mcV0uWfVIb%2B4tKuCU5b0pg%2FNpMujuESbQqDPYPP0Le46wgwUQ1fEoYczXdLey&X-Amz-Signature=22c62051fa9102d93a3a053b0625dded2a11b9761c6afe81d1491a4401775dfc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)
  ![](https://prod-files-secure.s3.us-west-2.amazonaws.com/ed31bb93-2d4a-497a-8fbc-c75b3e8c1b22/65f26b39-d84c-41f4-a3b6-6d83410f6bae/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667KJJCZQ4%2F20260904%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260904T065231Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECYaCXVzLXdlc3QtMiJIMEYCIQCTX2YAGu8CoqJMiDG9pwsd8TO%2FvbG3eOjkFEYcjoXQgwIhAJt%2Fr0EvG2uEo6BRKA8RsUqsMKUAAYcptyrMibTEnn3%2FKogECO%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzpOtZfA2A6YYZzmTkq3APLnZHa115WhwyHWj%2FvOvluB26DPu3YBYgvBIuc3H7vu485jPgl6UmQdUmdgQe6Z8kJmx9HPxDgQIrNcsA7setd2r1fPbS%2FIQQxQo%2BfDdcQ4PhYWl%2BUvj1jva8aeXEZ3cxwSalynBdVYTLPBsf%2Fibh2yW%2F9PIn6dXWC0JGpLbR%2FIR56hfCtnbQ2ijAtYPimzoq7oLL0C93Gdh3NYES9TVJyqwrTXgUBu61Y4%2Fy2u%2BzO6mJXaZ1FQIugxH9CtasWSalrqXcjVK9TVVNT79fXvdsYmbzu9PXs9IeyoynZggvPnRrOT4chha2Y0pScRhnPRC9dJFuD2nQ686Sg1ljhMkNq8DjGfGSS7k3JQUiQfIF7yw4rxmMi2%2F0lCWwhssgHQICWWMNv14QWyLqWlrK%2FScaqkqnQA%2BqR9wE3VOmEyVwbgeA3uHaSlrGKolIdi76qyYncnN4mxUybvhNCeZSzqM17qvk1X8STs9%2B2J5mYfa3DyIS4o5C7pASxskKNQET0nZLsscjAsQEeu3DKp%2BhEK%2FQDiKg1WeKQ5eiWvHxTZEC5ltD3Ir2sS%2FnKTpqTsVaY6dEVMzi5ox8%2FhLaBtRtHPU3jD7KBmtyDZH6TlQAsBd%2BOjOCSW9BFuq%2FAwYGTnTDOsOnUBjqkAfCJt5OVwANG0sm52oZbcLA6dS18QLvWeC7lm8euIdbGkFpO9RF5DzLSiRG2ze9pklKR1U7EzM8PgV2AD3N9zRBNW2c%2FoJTsW9tHDngKHrdhSRpN2qiPAIALMDTiTFxY4NTUX%2BmQAiobhSLsm6t7FteEl5KRgE7mcV0uWfVIb%2B4tKuCU5b0pg%2FNpMujuESbQqDPYPP0Le46wgwUQ1fEoYczXdLey&X-Amz-Signature=f687924c963d04feadc3980b2ef4687d393c8d81523f74f46741829890d83177&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
