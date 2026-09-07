---
title: "[MotionMAE] paper review"
date: 2026-03-17 00:00:00 +0900
categories: [AI]
tags: [논문리뷰, 딥러닝]
---

## MotionMAE: Self-supervised Video Representation Learning with Motion-Aware Masked Autoencoders
**Paper**: BMVC 2024
**Authors**: Haosen Yang, Deng Huang, Bin Wen, Jiannan Wu, Hongxun Yao, Yi Jiang, Xiatian Zhu, Zehuan Yuan
**Affiliations**: University of Surrey, ByteDance, HKU, HIT, SCUT
---
### 0. 논문 핵심 요약 (Quick Notes)
기존 Video MAE들은 image MAE를 그대로 계승하여 individual token/patch reconstruction에 집중 → static appearance 학습에는 강하지만 dynamic temporal information 학습에는 suboptimal.
<details>
<summary>흠 ..</summary>

  VideoMAE 같은 기존 video MAE들은 image MAE를 비디오에 그대로 확장한 거예요. 비디오 프레임에서 패치 90%를 가리고, 가려진 패치의 원래 픽셀을 복원하는 게 학습 목표죠. 문제는 이렇게 하면 모델이 "각 프레임이 어떻게 생겼는가"(appearance)는 잘 배우는데, "프레임 사이에서 뭐가 어떻게 움직이는가"(motion/dynamics)는 잘 못 배운다는 거예요. 모델한테 "알아서 시간적 구조를 파악해라"고 맡기는 건데, 이게 너무 어려운 과제라는 거죠.
</details>

MotionMAE의 핵심 아이디어: **local motion reconstruction** — masked frame patch 복원에 더해, 해당 patch의 temporal difference (인접 프레임 간 차이)도 함께 예측. 이를 통해 appearance + motion을 동시에 학습.
결과: VideoMAE 대비 SSv2에서 +1.2%, DAVIS2017 VOS에서 +3.0% 개선. 추가 학습 시간 없이 (Sharing design 사용 시).
---
### 1. 배경: MAE 계열 시간순 정리
#### 1.1 Image MAE 계열
- **iGPT** (Chen et al., 2020): pixel sequence prediction
- **ViT** (Dosovitskiy et al., 2020): masked patch의 mean color 예측
- **BEiT** (Bao et al., 2021): masked visual token prediction (discrete visual codebook 사용)
- **PeCo** (Dong et al., 2021): perceptual similarity를 codebook 학습에 주입
- **MAE** (He et al., CVPR 2022): image patch reconstruction의 직접적 접근. 높은 masking ratio + unmasked patch만 encoding → 효율성 향상
- **MaskFeat** (Wei et al., CVPR 2022): HOG feature를 prediction target으로 사용
#### 1.2 Video MAE 계열
- **BEVT** (Wang et al., CVPR 2022): masked SSL을 spatial (이미지) + temporal (이미지+비디오) 2단계로 분리
- **VideoMAE** (Tong et al., NeurIPS 2022): masked spatiotemporal patch reconstruction, 90% masking ratio, ViT 기반
- **VideoMAEv2** (Wang et al., CVPR 2023): dual masking으로 scaling
- **OmniMAE** (Girdhar et al., 2022): 이미지와 비디오를 단일 모델로 masked pretraining
- **MAE as Spatiotemporal Learners** (Feichtenhofer et al., NeurIPS 2022): MAE를 비디오에 직접 적용
- **MGMAE** (Huang et al., ICCV 2023): motion guided masking strategy
- **MotionMAE** (본 논문, BMVC 2024): motion reconstruction을 auxiliary objective로 추가
#### 1.3 MotionMAE의 위치
기존 video MAE들의 한계: learning objective가 individual token of video frames의 reconstruction에 집중 → 모델 스스로 implicit spatiotemporal representation을 도출해야 하므로 temporal structure 학습이 drastically challenging.
MotionMAE의 해결책: motion information (temporal difference)을 explicit reconstruction target으로 추가 → appearance와 motion을 decompose하여 학습 촉진. 일종의 prior knowledge 도입.
---
### 2. Methodology
#### 2.1 Architecture Overview
Asymmetric Transformer 기반 MAE 구조 (He et al., 2022 MAE를 따름):
```plain text
Input Video → Patchify → Mask (90%) → Encoder (visible only) → Decoder (full set) → {Space Head, Time Head}
```
- **Encoder**: vanilla ViT, space-time joint attention. Unmasked patches만 처리 → 효율성
- **Decoder**: 또 다른 vanilla ViT. Encoded patches + mask tokens의 전체 set을 처리
  - **Space Head**: masked frame patches 복원 (appearance)
  - **Time Head**: 해당 위치의 local motion (temporal difference) 복원 (dynamics)
- Pretraining 후: encoder만 downstream task에 사용, 두 head 모두 discard
#### 2.2 Patch Embedding & Masking
**Patch Embedding**:
- Input video를 non-overlapping spacetime patches (cubes)로 분할
- Cube embedding 수행 → temporal resolution 감소로 시간 축 redundancy 억제
- Learnable positional embedding을 elementwise addition
**Patch Masking**:
- 각 time point에서 fixed ratio로 random masking
- Masking 전략: random, space-only (tube), time-only (전체 프레임 선택) 가능
- Video data는 text/image보다 redundancy가 높으므로 **90% masking ratio** 사용
#### 2.3 Motion Target: Temporal Difference
Motion information = 시간적으로 인접한 두 프레임 간의 **L1 difference of pixel values**
```plain text
Motion(t) = |Frame(t+1) − Frame(t)|
```
- 프레임 하나는 rich appearance information 제공
- 프레임 간 temporal difference는 additional dynamic motion knowledge 제공
- Appearance와 motion은 video understanding에 모두 critical
- Optical flow도 대안으로 사용 가능하나, compute cost가 훨씬 높음
- 가장 fine-grained motion (directly adjacent frames)이 가장 유용 — large-time-gap motion은 예측이 over-challenging
#### 2.4 Decoder Design: 두 가지 변형
**1) Independent Design (Ind)**:
- Space head와 time head가 완전히 독립된 두 개의 network
- 성능이 약간 더 좋음 (더 빠른 수렴)
- 추가 compute cost 발생 (~40% 더 많은 GPU 시간)
**2) Sharing Design (Sha)**:
- 마지막 prediction layer를 제외하고 single network를 공유
- **추가 학습 시간 없이** VideoMAE 대비 성능 향상
- Cost-effectiveness 면에서 우수
#### 2.5 Objective Loss Function
각 head에 대해 **L2 (MSE) reconstruction loss** 사용:
```plain text
L_total = L_space + L_motion
```
- `L_space`: Space head의 prediction vs frame image patches (masked 위치만)
- `L_motion`: Time head의 prediction vs frame difference patches (masked 위치만)
- Ablation에서 MSE > L1 > Smooth L1 순으로 효과적
Weight ratio (frame : motion):
- 1:1이 최적 (1:2, 2:1과 비교 시 큰 차이 없음 — slightly sensitive)
---
### 3. 사용된 평가 지표 (Metrics)
#### 3.1 Action Recognition
**Inference protocol**: Multi-view evaluation
- K temporal clips (K = 2 for SSv2, 5 for K400, 10 for UCF101) × 3 spatial crops = 3K views
- 최종 prediction = 모든 view의 평균
#### 3.2 Video Object Segmentation (VOS)
- Pretrained model을 **freeze** (finetuning 없음) → representation의 순수한 expressiveness 평가
- Nearest-neighbor between consecutive frames로 segmentation 수행
---
### 4. 주요 실험 결과
#### 4.1 Something-Something V2 (Motion-Centric)
핵심 관찰:
- Self-supervised learning이 supervised learning 대비 일반적으로 우수 (MViTv2 < MaskFeat, extra data 사용에도 불구)
- Domain-specific pretraining이 domain-generic보다 효과적 (VideoMAE vs MAE)
- MotionMAE가 모든 setting에서 최고 성능: VideoMAE 대비 +0.3%~+1.2% (domain-specific), MAE 대비 +2.2% (domain-generic)
- ViT-L 기반 MotionMAE: 74.6% — 당시 최고 기록
#### 4.2 Kinetics-400 (Appearance-Dominant)
(*: 400 epoch pretraining)
핵심 관찰:
- Appearance-dominant 데이터셋에서도 motion reconstruction이 유효
- 400 epoch에서 MotionMAE가 VideoMAE 대비 +0.6% → 더 빠른 수렴 시사
- 전체 epoch에서도 일관되게 최고 성능
#### 4.3 Video Object Segmentation (DAVIS-2017, Frozen)
핵심 관찰:
- Video data로 pretraining한 것이 image data보다 효과적 (MAE IN1K vs K400)
- MotionMAE가 VideoMAE 대비 **+3.0%** (J&F-Mean) — object-focused 시나리오에서 더 큰 격차
- Frozen encoder 평가이므로 representation 품질의 순수한 차이를 반영
#### 4.4 Efficiency vs Effectiveness
핵심 관찰:
- **Sharing design은 추가 학습 시간 없이 성능 향상** — cost-effectiveness 우수
- Independent design은 더 빠르게 수렴하지만 ~40% 추가 GPU 시간
- 초기 epoch (400)에서 gain이 더 큼 (+1.7~2.1) → 빠른 수렴 확인
---
### 5. Ablation Studies 요약
모든 ablation: ViT-B, SSv2, domain-specific, 400 epoch pretrain, Ind decoder.
#### 5.1 Reconstruction Target
- Frame과 motion 단독은 비슷한 성능 (surprising)
- 결합 시 clear gain → 좋은 complementing effect
#### 5.2 Frame:Motion Weight Ratio
- 비율에 약간만 sensitive → 1:1이 최적이지만 robust
#### 5.3 Motion Temporal Granularity
- 가장 fine-grained (직접 인접 프레임)가 최적
- Large-time-gap motion은 예측이 over-challenging — 시간적 변동이 복잡
#### 5.4 Decoder Design
**Width**: 384 dim 최적 (128: 67.5, 384: 68.4, 512: 68.3)
**Depth**: 4 blocks 최적 (1: 67.4, 4: 68.4, 8: 68.2)
→ 충분히 크되 과하지 않은 decoder가 중요
#### 5.5 Reconstruction Loss
- MSE가 최적
---
### 6. MotionMAE vs V-JEPA 2
핵심 차이점:
1. MotionMAE는 pixel space에서 frame + motion을 복원하는 generative approach. V-JEPA 2는 representation space에서 예측하는 non-generative approach.
1. MotionMAE는 motion을 explicit target으로 도입. V-JEPA 2는 masking 전략을 통해 motion을 implicit하게 학습.
1. V-JEPA 2는 규모(data, model)가 훨씬 크고, frozen encoder만으로 평가하여 representation 품질의 순수한 비교가 가능.
---
### 7. Limitations
1. **Pixel-level reconstruction의 한계**: V-JEPA 계열이 지적하듯, pixel reconstruction은 예측 불가능한 디테일(나뭇잎, 물결 등)에도 리소스를 소모.
1. **Scale 제한**: 최대 ViT-L (305M)까지만 실험. 1B+ 규모에서의 scaling behavior 미탐구.
1. **Temporal difference의 단순성**: L1 frame difference는 lighting change, camera motion 등 non-semantic motion에도 반응. Optical flow가 더 robust하나 compute cost 높음.
1. **Domain-specific pretraining 의존**: 최고 성능은 같은 dataset에서 pretrain-finetune할 때 달성. Cross-domain generalization은 상대적으로 약함.
1. **Evaluation이 finetuning 기반**: Frozen encoder 평가가 제한적 (DAVIS만). Finetuning 기반 결과는 encoder representation의 순수한 품질을 측정하기 어려움.
---
### 8. Key Takeaways
1. **Motion의 explicit 모델링이 유효하다**: Frame reconstruction만으로는 temporal dynamics 학습이 부족. Temporal difference를 auxiliary target으로 추가하면 appearance + motion을 동시에 학습 가능.
1. **Decomposition as prior knowledge**: Video data에 내재된 두 종류의 정보(appearance, motion)를 분해하여 학습하는 것이 효과적. 이는 모델이 스스로 발견해야 할 prior knowledge를 도입하는 것.
1. **Cost-free improvement (Sharing design)**: Decoder를 공유하면 추가 학습 비용 없이 성능 향상 가능 — practical한 장점.
1. **Motion-centric 태스크에서 특히 강함**: SSv2 (+1.2%), DAVIS VOS (+3.0%) 등 temporal structure가 중요한 태스크에서 gain이 큼. K400 같은 appearance-dominant 태스크에서도 일관된 개선.
1. **Fine-grained motion이 핵심**: 직접 인접 프레임 간 차이가 가장 유용. Large-gap motion은 예측 난이도가 너무 높아 오히려 해로움.
