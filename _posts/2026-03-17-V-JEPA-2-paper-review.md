---
title: "[V-JEPA 2] paper review"
date: 2026-03-17 00:00:00 +0900
categories: [AI]
tags: []
---

## V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning
**Paper**: arXiv 2506.09985 (June 2025) 
**Authors**: Assran, Bardes, Fan, Garrido, Howes et al. (FAIR at Meta) 
**Code**: https://github.com/facebookresearch/vjepa2
---
### 0. 논문 핵심 요약 (Quick Notes)
JEPA 접근법은 video generation 기반 방식과 달리, scene에서 예측 가능한 측면(e.g., 움직이는 물체의 trajectory)의 representation 학습에 집중하고, generative objective가 강조하는 예측 불가능한 디테일은 무시한다 — pixel-level prediction을 하기 때문.
JEPA pretraining을 scaling함으로써, SOTA understanding/prediction 능력을 가진 video representation을 얻을 수 있고, 이러한 representation이 action-conditioned predictive model의 기반이 되어 zero-shot planning을 가능하게 함을 입증.
**EMA encoder란?** encoder weight의 exponential moving average로 정의되는 가중치를 가진 encoder.
**AC (Action-Conditioned)란?** Pretraining 후 encoder를 freeze하고 새로운 predictor를 학습. Past frames, actions, end-effector states에 근거해서 future frames의 representation을 예측하는 autoregressive feature prediction objective.
---
### 1. JEPA 계보: 시간순 정리
#### 1.1 JEPA (LeCun, 2022 — Position Paper)
Yann LeCun이 "A Path Towards Autonomous Machine Intelligence" (2022)에서 제안한 개념적 프레임워크. 핵심 아이디어는 세상을 pixel 수준에서 예측하는 대신, 학습된 representation space에서 예측하자는 것이다.
기존 generative model(GAN, diffusion, autoregressive 등)은 모든 pixel을 예측해야 하므로 나뭇잎 위치, 물결 패턴 같은 예측 불가능한 디테일까지 모델링해야 한다. JEPA는 이를 피하고, 예측 가능한 고수준 구조적 정보에만 집중할 수 있도록 latent space에서의 prediction을 수행한다.
JEPA의 구조적 특징:
- Encoder가 입력을 latent로 변환
- Predictor가 latent space에서 미래/마스킹된 부분을 예측
- Target encoder (EMA)가 ground truth latent를 제공
- Representation collapse를 방지하기 위해 stop-gradient + EMA 사용
#### 1.2 I-JEPA (Assran et al., CVPR 2023)
JEPA 개념을 이미지 도메인에 최초 적용한 모델. ImageNet에서 self-supervised pretraining을 수행하며, masked image modeling을 representation space에서 수행한다. MAE(Masked Autoencoder)가 pixel을 복원하는 것과 달리, I-JEPA는 latent target을 예측한다.
핵심 차이점: MAE는 pixel reconstruction → 고빈도 텍스처에 민감. I-JEPA는 representation prediction → 의미론적 구조에 집중.
#### 1.3 V-JEPA (Bardes et al., 2024)
JEPA를 비디오로 확장. 비디오의 시공간 구조를 활용한 multiblock masking을 도입하여 temporal reasoning 능력을 학습한다.
주요 사양:
- Data: VideoMix2M (VM2M) — 약 2M 비디오
- Model: 최대 ViT-H (600M params)
- Position Embedding: Absolute sinusoidal
- Resolution: 16 frames, 224×224
- Training: 90K iterations, cosine LR schedule + EMA ramp
V-JEPA는 video understanding 태스크에서 language-supervised 모델과 경쟁적 성능을 보여줬으나, 데이터와 모델 규모의 한계로 SOTA에는 미치지 못했다.
#### 1.4 V-JEPA 2 (본 논문, June 2025)
V-JEPA를 네 가지 축(data, model, training, resolution)에서 대규모로 스케일링한 버전. V-JEPA의 학습 목적 함수 자체는 동일하지만, 아키텍처 세부사항(position embedding → 3D-RoPE)과 학습 전략(progressive resolution, warmup-constant-decay schedule)이 변경되었다.
주요 변경점:
- Data: 2M → 22M videos (VideoMix22M, 1M+ hours)
- Model: ViT-L(300M) → ViT-g(1B params)
- Position Embedding: Absolute sincos → 3D-RoPE
- Resolution: 16fr/224px → 64fr/384px (progressive training)
- Training: 90K → 252K iterations, warmup-constant-decay schedule
- EMA: Ramp schedule → Fixed momentum (0.998)
#### 1.5 V-JEPA 2-AC (본 논문의 Section 3-4)
V-JEPA 2의 frozen encoder 위에 action-conditioned predictor를 학습시켜 world model로 확장한 버전. 소량의 로봇 비디오(~62시간)만으로 학습하며, Model Predictive Control (MPC)을 통해 zero-shot 로봇 조작을 수행한다.
---
### 2. V-JEPA 2 Base Encoder: Pretraining
#### 2.1 V-JEPA Framework Extension — Mask-Denoising in Representation Space
V-JEPA 2의 학습은 mask denoising in representation space이다:
- mask: patches가 randomly dropped됨
- **encoder**: extract representation
- **predictor**: predict representation of video parts
- 둘이 simultaneously trained using the objective, 둘 다 ViT(Vision Transformer)에 해당
학습 목적 함수:
```plain text
min_{θ,ϕ,Δy}  ||P_ϕ(Δy, E_θ(x)) − sg(E_θ̄(y))||₁
```
각 기호 설명:
- `x`: masked video (일부 token이 drop된 입력)
- `y`: full video (마스킹 전 원본)
- `E_θ`: 학습 대상 encoder (ViT)
- `P_ϕ`: predictor (ViT-small, ~22M params)
- `E_θ̄`: EMA encoder (θ의 exponential moving average, stop-gradient 적용)
- `Δy` (THETAy): learnable mask token — indicates the locations of dropped patches
- `sg(·)`: stop-gradient operation — bar theta weights를 사용하여 representation collapse 방지
- Loss: L1 norm, **prediction할 때만 사용!**
- Position information encode 시 **RoPE (Rotary Position Embedding)** 사용
  - using 3D-RoPE instead of absolute sincos position embeddings (Vaswani et al., 2017) helps stabilize training for the largest models!
학습 과정:
1. 비디오를 tubelet (2×16×16)으로 patchify
1. Multiblock masking으로 token의 일부를 drop
1. Masked video를 encoder `E_θ`에 통과
1. Encoder output + mask token `Δy`를 predictor `P_ϕ`에 통과
1. EMA encoder `E_θ̄`가 full video를 encoding → target 생성 (stop-gradient)
1. Predictor output과 EMA target 간 L1 loss 계산 (masked 위치만)
Collapse 방지 메커니즘: EMA encoder에 stop-gradient를 적용하여 trivial solution(모든 representation이 상수)을 방지. V-JEPA 1에서는 EMA momentum을 ramp했으나, V-JEPA 2에서는 고정 momentum 0.998이 대규모 학습에서 더 안정적임을 확인.
#### 2.2 Architecture
**Encoder**: Vision Transformer (ViT) 계열
**Predictor**: ViT-small (~22M params), 모든 encoder 크기에서 동일하게 사용. Predictor를 작게 유지하는 것이 representation 품질에 유리 — predictor가 크면 shortcut 학습 가능성 증가.
**3D-RoPE (Rotary Position Embedding)**:
- V-JEPA 1의 absolute sinusoidal PE를 대체
- Temporal, Height, Width 3축에 독립적으로 rotary embedding 적용
- 대규모 모델(ViT-g)에서 학습 안정화에 기여
- 해상도 변경 시 interpolation 없이 자연스럽게 확장 가능
**Tubelet**: 2×16×16 (temporal 2 frames × spatial 16×16 pixels). 비디오의 시공간 patch 단위.
**Multiblock Masking**: V-JEPA 1과 동일한 전략. 비디오에서 시공간적으로 연속된 block 여러 개를 한번에 마스킹하여, 단순 interpolation이 아닌 의미론적 추론을 강제.
#### 2.3 Pretraining Dataset: VideoMix22M (VM22M)
**YT1B Curation Pipeline**: YT-Temporal-1B (YT1B)는 원본이 5.6B scene으로 구성된 대규모 데이터셋이나, 품질이 고르지 않다. 논문은 retrieval-based curation을 적용:
1. PySceneDetect로 비디오에서 scene 단위 추출 (316M scenes)
1. DINOv2 ViT-L로 각 scene의 embedding 추출
1. 1.5M clusters로 clustering
1. Target distribution (K710 + SSv2 + COIN + EpicKitchen)과 매칭하여 cluster 가중치 계산
1. 가중치 기반 sampling → 210K clusters, 115M scenes 최종 선택
Curation 효과: uncurated 대비 +1.4pt avg accuracy 개선. 특히 장기 학습(>100K iter)에서 uncurated 데이터는 성능이 정체/하락하는 반면, curated 데이터는 지속적 개선.
#### 2.4 Scaling Ingredients
V-JEPA 1에서 V-JEPA 2로의 성능 향상을 4가지 축으로 분해하여 ablation:
**1) Data Scaling (+1.0pt avg)**
- VM2M (2M) → VM22M (22M)
- augmentation, additional data sources
- 다양한 domain (egocentric + exocentric + instructional + web) 혼합이 핵심
- ImageNet 포함이 appearance 이해에 기여
**2) Model Scaling (+1.5pt avg)**
- scale architecture 300 million → 1 billion params, ViT-L → ViT-G
- SSv2에서 +1.6pt, K400에서 +1.5pt
- Predictor는 ViT-small (22M)로 고정 — encoder만 scale
**3) Training Schedule (+0.8pt avg)**
- 90K → 252K iterations
- adopting **warmup-constant-decay schedule** → simplifying hyperparameter tuning, iteration 수도 늘림 & leveraging the additional data effectively
- V-JEPA 2 model training employs a warmup-constant learning rate schedule followed by a cooldown phase (Zhai et al., 2022; Hägele et al., 2024)
- 이 schedule은 half-cosine schedule (Loshchilov and Hutter, 2016)과 comparable한 성능
- 하지만 long training run 탐색이 더 cost-effective — constant phase의 서로 다른 checkpoint에서 multiple cooldown run을 시작할 수 있으므로
- V-JEPA 1 (Bardes et al., 2024) 대비 recipe 단순화: fixed teacher EMA 및 weight decay coefficients 유지 (ramp-up schedule 대신) — downstream understanding task에 미치는 영향 미미
- 90K → 252K iteration 확장 시 ViT-g 모델에서 +0.8 average performance improvement
- 이 schedule은 cooldown phase에서 video resolution을 점진적으로 증가시키는 progressive training도 용이하게 함
- EMA momentum: ramp → fixed 0.998
**4) Progressive Resolution (+0.7pt avg)**
- warmup-constant-decay를 활용하여 higher resolution video와 longer clip으로 scale
- warmup and constant phases에서는 shorter, lower-res clips으로 training
- 이후 final decay phase에서 resolution 또는 clip-length를 증가
- 구체적으로:
  - **Warmup phase (12K iter)**: low-res video로 warmup
  - **Constant phase (228K iter)**: 16 frames, 256×256, constant learning rate — main phase
  - **Cooldown phase (12K iter)**: video duration 및 resolution을 증가시키면서 동시에 learning rate를 linearly decaying → 64 frames, 384×384
- 고해상도를 cooldown에서만 사용하여 **8.4× GPU 시간 절감**
- Full-resolution training (처음부터 384px) 대비 동등 성능
누적 효과: 84.2 → 88.2 avg accuracy (+4.0pt, 6개 벤치마크 평균)
#### 2.5 Evaluation Protocol: Attentive Probe
V-JEPA 2의 표준 평가는 frozen encoder + 학습 가능한 attentive probe로 수행:
- 4-layer cross-attention query token 구조
- Encoder의 모든 layer output을 weighted aggregation
- Encoder 가중치는 완전 고정 (fine-tuning 없음)
- 이 프로토콜은 encoder representation의 순수한 품질을 측정
---
### 3. V-JEPA 2-AC: Action-Conditioned World Model
#### 3.1 Motivation
V-JEPA 2의 encoder는 "관찰만으로 학습한" 세계 모델이다. 하지만 로봇이 행동을 계획하려면 "내가 이 행동을 하면 세계가 어떻게 변할까"를 예측해야 한다. V-JEPA 2-AC는 소량의 로봇 interaction 데이터로 action-conditioned prediction 능력을 추가한다.
AC = pretraining 후 encoder를 freeze하고 새로운 predictor를 학습. Past frames, actions, end-effector states에 근거해서 future frames의 representation을 예측하는 autoregressive feature prediction objective.
#### 3.2 Training Data: Droid Dataset
- ~62시간 unlabeled 로봇 비디오 (Franka Panda manipulator)
- 4fps, 256×256 해상도, 4초 clip (16 frames)
- End-effector state (7D): position(3) + orientation(3) + gripper(1)
- Action = Δ(end-effector state) — 연속 프레임 간 state 차이
- Reward, task label 없음 — 완전 비지도 학습
#### 3.3 Architecture
Frozen V-JEPA 2 encoder 위에 새로운 action-conditioned predictor를 학습:
- ~300M param transformer (24 layers, 16 heads, 1024 dim)
- Block-causal attention: 시간적 인과성 보장 (미래 정보 참조 불가)
- Input: interleaved sequence — (aₖ, sₖ, zₖ) 반복
  - aₖ: action (7D delta, linear projection)
  - sₖ: end-effector state (7D, linear projection)
  - zₖ: frame features (V-JEPA 2 encoder output, frozen)
#### 3.4 Loss Functions
**Teacher Forcing Loss**:
```plain text
L_tf = (1/T) Σₖ ||ẑₖ₊₁ − zₖ₊₁||₁
```
각 step에서 ground truth encoder feature를 입력으로 사용하고, 다음 step의 feature를 예측.
**Rollout Loss**:
```plain text
L_roll = ||P_ϕ(a₁:T, s₁, z₁) − z_{T+1}||₁    (T=2)
```
첫 frame의 feature만 주고 T step을 autoregressive하게 rollout한 후 마지막 feature를 예측. Error accumulation에 대한 robustness를 학습.
**Total Loss**: L = L_tf + L_roll
#### 3.5 Planning: Model Predictive Control (MPC)
**Goal-Conditioned Energy Function**:
```plain text
E(â₁:T; zₖ, sₖ, zg) = ||P(â₁:T; sₖ, zₖ) − zg||₁
```
Goal image를 encoder로 embedding한 zg와, action sequence를 rollout한 predicted state 간의 L1 distance를 최소화.
**Cross-Entropy Method (CEM)**:
1. Gaussian distribution에서 action 후보 800개 sampling
1. V-JEPA 2-AC로 미래 state rollout (latent space)
1. Energy 최소화하는 top-k action 선택
1. 선택된 action들의 mean/variance로 분포 업데이트
1. 10회 반복 refinement
1. 최종 best action sequence의 첫 번째 action만 실행
**Receding Horizon Control**: 첫 action 실행 → 새 state 관측 → 처음부터 re-planning. 매 step마다 최신 관측을 반영하여 open-loop error 완화.
Planning 시간: action당 ~16초 (vs Cosmos: action당 ~4분 → 약 15× 빠름)
---
### 4. 사용된 평가 지표 (Metrics)
#### 4.1 Video Classification (Probe-based)
#### 4.2 Action Anticipation
#### 4.3 Video Question Answering (VidQA)
V-JEPA 2 encoder를 LLaVA framework + Llama 3.1 8B에 연결하여 평가.
#### 4.4 Robot Manipulation
Lab1, Lab2 두 개의 서로 다른 실험 환경에서 측정 후 평균.
---
### 5. 주요 실험 결과
#### 5.1 Probe-based Classification
핵심 관찰:
- Motion understanding (SSv2, Div-48, Jester)에서 image encoder 대비 압도적 우위 — SSv2: 77.3 vs DINOv2 50.7
- Appearance understanding (COIN, IN1K)에서는 language-supervised 모델(SigLIP2, PEcoreG)에 약간 열세
- Overall average에서 모든 image/video encoder 중 최고 성능
#### 5.2 Action Anticipation (EK100)
- 이전 SOTA 대비 +12.1pt (상대 44% 개선)
- 300M 모델로도 8B PlausiVL을 초과
- Frozen encoder + attentive probe만 사용
#### 5.3 Video QA (8B class, LLaVA + Llama 3.1 8B)
- Language supervision 없이 pretrain된 encoder로 VidQA SOTA 달성
- Frame 수 증가 시 성능 선형 증가 (DINOv2는 정체) → temporal 이해 능력 차별화
#### 5.4 Zero-Shot Robot Manipulation (avg of Lab1 + Lab2)
- 62시간 unlabeled 데이터만으로 새 환경에서 zero-shot pick-and-place 수행
- Cosmos (video generation 기반) 대비 15× 빠르면서 성능 우위
- Latent space planning이 pixel-space planning 대비 효율적임을 실증
---
### 6. Ablation Studies 요약
#### 6.1 Position Embedding
3D-RoPE vs absolute sincos: ViT-g 규모에서 3D-RoPE가 학습 안정성 향상. 소규모 모델에서는 차이 미미.
#### 6.2 Data Curation
YT1B uncurated vs curated: curated가 +1.4pt. 장기 학습에서 uncurated는 성능 정체/하락.
#### 6.3 Progressive vs Full Resolution
Full-resolution training (처음부터 64fr/384px): V-JEPA 2의 progressive 방식과 동등한 성능이지만, 8.4× 더 많은 GPU 시간 소요.
#### 6.4 LR Schedule
Warmup-Constant-Decay vs Cosine: 최종 성능 유사. 하지만 WCD는 constant phase에서 여러 checkpoint를 분기할 수 있어 비용 효율적.
#### 6.5 EMA Momentum
Fixed (0.998) vs Ramp: 고정 momentum이 대규모 학습에서 더 안정적.
#### 6.6 Predictor Size
ViT-small (22M) vs larger predictor: predictor를 키우면 성능 하락 — 큰 predictor는 encoder를 bypass하는 shortcut을 학습할 수 있음.
---
### 7. Limitations
1. **Camera position sensitivity**: V-JEPA 2-AC는 camera 위치에 따라 inferred action 좌표축에 회전 오차가 발생. 수동 카메라 배치 필요.
1. **Long-horizon planning**: Autoregressive rollout에서 error accumulation + action space의 기하급수적 증가. Sub-goal 없이는 복잡한 multi-step task 수행 어려움.
1. **Image goal only**: 현재 visual goal만 지원. Language instruction으로 task를 지정할 수 없음.
1. **Scale ceiling**: 최대 1B params까지만 실험. 선행연구(InternVideo2 등)는 6B~20B까지 확장. 더 큰 규모에서의 scaling behavior는 미탐구.
1. **Appearance 이해 한계**: Language-supervised 모델(SigLIP2, PEcoreG) 대비 COIN, IN1K 같은 appearance-heavy 벤치마크에서 약간 열세.
---
### 8. Future Directions
1. **Hierarchical world models**: 다중 시공간 스케일에서의 예측을 통한 long-horizon planning. 고수준 sub-goal 생성 + 저수준 action planning 분리.
1. **Language goal integration**: V-JEPA 2-AC의 representation space에 language embedding을 정렬하여 자연어로 task specification.
1. **Further scaling**: Encoder 1B → 10B+, 더 많은 interaction data, 더 다양한 로봇 platform에서의 학습.
1. **Policy distillation**: World model의 imagination에서 feed-forward policy를 학습하여 planning 시간을 0에 가깝게 단축.
1. **Gradient-based planning**: CEM (sampling 기반) 대신 differentiable planning으로 효율성 향상.
---
### 9. Key Takeaways
1. **Representation space prediction이 효과적이다**: Pixel prediction 없이도 video understanding에서 SOTA를 달성할 수 있다. 예측 불가능한 디테일을 자연스럽게 무시하는 JEPA의 inductive bias가 유효.
1. **4가지 축 모두에서 scaling이 작동한다**: Data, model, training, resolution — 어느 하나가 아닌 네 축의 조합이 성능을 끌어올린다. 특히 data curation의 효과가 크다.
1. **Language supervision은 필수가 아니다**: Language-free self-supervised encoder가 VidQA에서 SOTA를 달성. Text-video pair 없이도 temporal 이해가 가능하다는 것은 conventional wisdom에 대한 반증.
1. **Internet video + 소량 로봇 데이터의 조합**: 1M시간 internet video로 시각 표현을 학습하고, 62시간 로봇 데이터로 action conditioning을 추가하는 2-stage 전략이 효과적.
1. **Latent space planning의 우위**: Video generation 기반 planning(Cosmos) 대비 15× 빠르면서 성능도 우월. Pixel-level detail 생성이 planning에 불필요함을 실증.
