---
title: "RDS & DynamoDB 실습 회고"
date: 2026-05-01 12:00:00 +0900
categories: AWS
tags: [AWS, AWS Cloud Club]
author: yoonji
layout: single
published: true
---

# RDS & DynamoDB

## 데이터베이스란?

구조화된 정보 또는 데이터의 조직화된 모음으로, DBMS(Database Management System)에 의해 제어된다.

데이터베이스는 크게 두 가지로 나뉜다.

- **Relational Database**: 구조화된 데이터를 테이블 형태로 저장하며, 엄격한 스키마와 SQL을 사용해 데이터를 조작한다. (MySQL, PostgreSQL)
- **Non-Relational Database**: 비정형 데이터를 저장하며 스키마가 없고, 대량의 분산 데이터를 다양한 형태로 빠르게 처리한다. (MongoDB, Redis)

---

## RDS (Relational Database Service)

AWS 클라우드에서 관계형 데이터베이스를 더 쉽게 설치, 운영 및 확장할 수 있는 완전관리형 웹 서비스다.

### RDS의 장점

- **간편한 관리**: 설치, 패치, 백업 등을 AWS가 대신 처리해준다.
- **가용성 및 안정성**: Multi-AZ 구성으로 장애 대응이 가능하다.
- **자동 백업 vs. 스냅샷**: 자동 백업과 수동 스냅샷 모두 지원한다.
- **보안성**: VPC, 보안 그룹 등을 통해 네트워크 수준에서 DB를 보호한다.
- **확장성**: Read Replica를 통해 읽기 성능을 Scale Out 할 수 있다.
- **비용 효율성**: 사용한 만큼만 과금된다.

### Multi AZ

다른 가용 영역(AZ)에 DB 복사본을 자동으로 생성하고 동기화하는 기능이다. 장애 감지 시 자동으로 대기(Standby) 인스턴스로 전환되어 서비스 중단을 최소화한다.

### Read Replica

읽기 전용 복제본으로, 읽기(Read) 쿼리의 성능을 향상시키고 부하를 분산시킨다. 비동기적으로 복제되며, Scale Out을 통해 읽기 중심의 워크로드 처리량을 높일 수 있다.

> 💡 **SAA 예시 문제**: RDS를 사용 중인 회사에서 하루/한 달에 한 번씩 통계용으로 데이터를 읽어오는 데 성능 문제가 발생했다면?
> → **RDS Read Replica** 를 사용하면 된다!

---

## RDS 핸즈온 실습

오늘은 RDS for PostgreSQL DB 인스턴스를 생성하고 EC2에서 접속해보는 실습을 진행했다.

### 실습 흐름

1. **EC2 인스턴스 생성**: Amazon Linux 2023 AMI, t2.micro 타입으로 생성하고 SSH 트래픽을 내 IP로 허용했다. 키 페어 없이 EC2 Instance Connect로 접속할 것이라 따로 키 발급은 하지 않았다.

2. **PostgreSQL DB 인스턴스 생성**: 손쉬운 생성(Easy Create) 방식으로 진행했다. 프리 티어를 선택하고, EC2 연결 설정에서 앞서 만든 EC2 인스턴스를 연결했다. 암호 자동 생성을 선택했다면 **자격 증명 세부 정보 보기** 버튼을 눌러 비밀번호를 꼭 복사해둬야 한다 — 다시는 안 보여준다!

3. **EC2에서 DB 접속**: EC2 인스턴스에 접속한 뒤 아래 명령어로 psql을 설치하고 DB에 연결했다.

```bash
# 최신 버전으로 업데이트
sudo dnf update -y

# psql 설치
sudo dnf install postgresql15

# db 인스턴스에 연결
psql --host={endpoint} --port=5432 --dbname=postgres --username=postgres
` ``

접속에 성공하면 `postgres=>` 프롬프트가 뜨면서 PostgreSQL을 자유롭게 쓸 수 있다!

4. **실습 후 리소스 정리**: EC2와 DB 인스턴스를 종료 및 삭제했다. DB 삭제 시 **최종 스냅샷 생성**과 **자동 백업 보존** 체크를 해제해야 과금이 발생하지 않으니 주의!

---

## DynamoDB

### SQL vs NoSQL

| 구분 | SQL | NoSQL |
|------|-----|-------|
| 데이터 구조 | 테이블 (행/열) | 비정형 (문서, 키-값 등) |
| 스키마 | 엄격함 | 유연함 |
| 확장성 | 수직 확장 | 수평 확장 |
| 대표 서비스 | MySQL, PostgreSQL | MongoDB, DynamoDB |

### Amazon DynamoDB란?

모든 규모에서 10ms 미만의 성능을 제공하는 **서버리스 NoSQL 완전관리형 데이터베이스**다.

- **완전관리형**: 장비 운영부터 DB 솔루션 설치·운영까지 AWS가 모두 담당한다.
- **높은 가용성과 내구성**: 모든 데이터가 SSD에 저장되고 여러 가용 영역에 걸쳐 자동 복제된다.
- **Auto-Scaling**: 요청량에 따라 읽기/쓰기 용량을 자동으로 조절한다.

### DynamoDB 핵심 구성 요소

- **테이블(Table)**: 데이터를 담는 최상위 단위
- **항목(Item)**: 테이블의 각 행, RDB의 row에 해당
- **속성(Attribute)**: 각 항목의 데이터 필드

NoSQL답게 기본 키(PK)를 제외하면 스키마가 없어 항목마다 다른 속성을 가질 수 있고, 중첩된 속성(Address처럼)도 자유롭게 넣을 수 있다.

### Partition Key & Sort Key

- **Partition Key**: RDBMS의 Primary Key와 비슷한 역할로, 데이터가 저장될 파티션을 결정한다. 일치(Equal) 검색만 지원한다.
- **Sort Key**: 같은 파티션 안에서 데이터를 정렬하는 기준이다. 일치뿐만 아니라 부등호, 포함 등 범위 검색도 지원해서 더 유연한 쿼리가 가능하다.

---

## DynamoDB 핸즈온 실습

`Music` 테이블을 만들고 데이터를 추가한 뒤 쿼리를 날려보는 실습을 진행했다.

- 파티션 키: `Artist` (문자열)
- 정렬 키: `songTitle` (문자열)

aespa, NewJeans의 곡 데이터를 항목으로 추가한 뒤, Artist = "aespa" 로 쿼리하면 aespa의 곡 목록이, Sort Key에 "시작 문자 = A" 조건을 추가하면 "Attention"만 필터링되는 걸 확인했다.

### Lambda로 데이터 일괄 추가하기

DynamoDB는 `BatchWriteItem` API를 통해 한 번에 최대 25개의 항목을 삽입할 수 있다. AWS Lambda를 활용하면 `batch.put_item`으로 대량의 데이터를 한 번에 처리할 수 있어 훨씬 효율적이다.

또한 DynamoDB는 NoSQL 특성상 Join을 기본 지원하지 않는데, 꼭 필요하다면 Lambda 함수로 구현하는 방법을 쓸 수 있다.

