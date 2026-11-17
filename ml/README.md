# 선지로그(SeonjiLog) — Python 머신러닝 유사 선지 추천 모듈 (`ml/`)

본 디렉터리는 **교육대학원 AI교육공학 기말 프로젝트**의 Python 및 머신러닝 연동 계획을 위한 프로토타입 및 가이드 폴더입니다.

## 1. 현재 MVP 작동 방식 vs 최종 Python ML 연동 구조

- **현재 웹 MVP 작동 방식 (실제 구동 중)**:
  - [`src/recommendation/optionRecommender.ts`](../src/recommendation/optionRecommender.ts)에서 TypeScript 기반 **핵심 개념 태그(`conceptIds`) + 연계 개념(`relatedConceptIds`) + 사상가 태그(`philosopherIds`) 가중치 매칭 알고리즘**이 작동하고 있습니다.
  - 현재 학습 중인 선지(`currentOptionId`)와 동일한 선지는 제외하고, 동일한 개념을 다른 표현으로 출제하는 기출 선지를 STEP 5(개념 이해도 검증)에 추천합니다.
- **최종 단계 Python ML 확장 방식**:
  - [`ml/similarity_recommender_prototype.py`](./similarity_recommender_prototype.py)에 작성된 **TF-IDF + Cosine Similarity + 개념 태그 하이브리드 점수 산출 모델**을 Google Colab에서 실험·검증한 뒤, 사전 계산된 유사도 행렬(`similarity_matrix.json`)로 내보내거나 Vercel Python Serverless Function(`/api/ml-recommend`)으로 배포하여 연동합니다.

## 2. Google Colab 실행 방법

1. Google Colab에서 새 노트북을 생성합니다.
2. 프로젝트의 `src/data/questions.json`, `src/data/explanations.json`, `src/data/concepts.json` 파일을 Colab 작업 디렉터리에 업로드합니다.
3. [`similarity_recommender_prototype.py`](./similarity_recommender_prototype.py)의 함수를 실행하여 특정 선지(`q2025_09_07_opt1` 등)에 대한 상위 추천 선지와 코사인 유사도 점수를 확인합니다.

