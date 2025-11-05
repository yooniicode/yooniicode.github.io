---
title: "AWS 계정 이전 시 RDS&KMS 키 관련 트러블슈팅"
date: 2025-11-5 20:16:00 +0900
categories: AWS
tags: [AWS, Backend]
author: yoonji
layout: single
published: true
---

## KMS 키 관련 이슈 정리
- 기존 사용하던 A 계정에서 B 계정으로 DB migration (스냅샷)을 진행했었는데, A 계정이 요금 체납(...) 으로 정지당하면서 inaccessible-encryption-credentials-recoverable 하다며 DB 접근 불가능한 상황이 반복되었다.

- A 계정을 복구하니 키도 복구되었으나, B 계정에서 예전에 멀쩡하게 보였던 키가 존재하지 않는다는 문구가 발생하였다.

- [AWS 공식문서: RDS 리소스 암호화](https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/Overview.Encryption.html)

### 트러블슈팅

- A, B 계정 간 IAM 관련 권한 문제임을 추측했으나 되던게 갑자기 안될리가 없으니까 .. AWS에서 그 사이에 정책을 업데이트했는지 찾아보기까지 했다
- 사실 이문제로 삽질한게 마이그레이션 2번 내내 그랬는데 금붕어같이 진행했다
- RDS 클러스터 전체를 재시작 하면 된다!!!!!!!!!!!!! 이미 서비스가 중단되었으므로 최대한 빨리 재시작해서 해결했다.
- 아무도 이 문제에 대해 다루지 않았을 것이다 왜냐하면 DB 마이그레이션을 개인차원에서 할만한 일이 없기도 하고.. 관련 문서가 아무것도 없어서 눈물 줄줄흘리면서 밤새는 경험을 했다 (DB 날아가면 PM님한테 혼난다)
