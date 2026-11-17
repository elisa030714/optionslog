# 선지로그 (SeonjiLog)

> **"하나의 선지에서, 하나의 개념을 완성하다."**  
> AI 기반 수능 사회탐구 개념 학습 및 오개념 교정 웹 애플리케이션 (교육대학원 AI교육공학 기말 프로젝트 MVP)

---

## 1. 서비스 개요 및 핵심 철학

**선지로그(SeonjiLog)**는 기출문제 풀이를 마친 고등학생 및 N수생이 **틀린 선지, 맞혔지만 헷갈린 선지, 해설을 읽어도 이해되지 않는 선지**를 출발점으로 삼아 AI 튜터와 소크라테스식 대화를 나누며 자신의 오개념을 발견·교정하고, 개인화된 개념 학습로그를 축적하는 서비스입니다.

- **핵심 철학**: *"선지는 학습의 출발점이고, 개념 이해는 학습의 목적이며, 로그는 학습의 결과물이다."*
- **교육공학적 기반**: 구성주의(Constructivism), 개념 변화 학습(Conceptual Change), 자기설명(Self-explanation), 소크라테스식 문답법(Socratic Questioning), 스캐폴딩(Scaffolding), 형성평가(Formative Assessment), 학습 전이(Transfer of Learning)
- **MVP 구현 범위**: 수능 사회탐구 **생활과 윤리 — 사회 정의(존 롤스, 로버트 노직)** 단원 (자체 제작 데모 문항 5세트·총 25개 선지 및 해설·핵심 개념 8종 탑재 / 윤리와 사상·사회·문화 확장 구조 지원)

---

## 2. 전체 사용자 학습 플로우 (STEP 1 ~ STEP 6)

1. **STEP 1. 복습할 기출 선지 선택**: 기출문제 기준(학년도·회차·문항 번호) 또는 개념 기준(사상가·개념·키워드)으로 선지 선택
2. **STEP 2. 학습 이유 확인**: `틀린 선지예요` / `맞혔지만 헷갈렸어요` / `해설을 읽어도 이해되지 않아요` / `관련 개념을 더 깊이 이해하고 싶어요` 중 선택 → 맞춤형 첫 질문 제시
3. **STEP 3. AI 튜터와의 대화를 통한 오개념 진단**: 단답식 해설 제공 대신 소크라테스식 발문과 사례(예: 사회 A `[30,30,30]` vs 사회 B `[80,60,40]`)로 사고 촉진
4. **STEP 4. 오개념 교정 및 심화 학습**: 자기설명 유도, 핵심 개념 카드, 롤스 vs 노직 사상가 비교표, 상황 적용 워크숍, AI 사상가 역할극(교육용 시뮬레이션)
5. **STEP 5. 유사 선지 이해도 검증**: 동일 개념을 다른 표현으로 다루는 다른 기출 선지에 대해 O/X 판단 + 이유 서술 → 4대 평가 기준으로 `이해 확인` / `부분 이해` / `추가 학습 필요` 판정
6. **STEP 6. 개인별 개념 학습로그 생성 및 저장**: AI가 14개 필수 항목의 학습로그 초안을 자동 생성하고, 학습자가 직접 수정 후 `localStorage`에 저장 → `나의 선지로그` 및 `나의 개념 지도`에 즉시 반영

---

## 3. 시스템 아키텍처 및 디렉터리 구조

4명의 팀원이 독립적인 모듈 단위로 충돌 없이 분업할 수 있도록 설계되어 있습니다.

```text
optionslog/
├── api/
│   └── tutor.ts                        # Vercel 서버 함수 (/api/tutor) - OpenAI API 보안 호출 및 서버측 RAG 검증
├── ml/
│   ├── README.md                       # Python 머신러닝 유사 선지 추천 모듈 연동 가이드
│   └── similarity_recommender_prototype.py # TF-IDF + Cosine Similarity 기반 유사도 추천 프로토타입 (Colab용)
├── src/
│   ├── components/                     # 공통 UI 컴포넌트
│   │   ├── Icons.tsx                   # Lucide 스타일 벡터 아이콘 모음
│   │   ├── Sidebar.tsx                 # 좌측 사이드바 메뉴 및 Mock/API 모드 스위치
│   │   ├── StatusBadge.tsx             # 이해도 상태 배지 및 데모 데이터 배지
│   │   ├── ConceptDetailModal.tsx      # 핵심 개념 카드 (정의, 필수 조건, 오개념, 사례, 연계 선지)
│   │   ├── PhilosopherComparisonCard.tsx # 사상가 비교표(롤스 vs 노직) 및 사례 적용 워크숍
│   │   └── RoleplayPanel.tsx           # AI 사상가와 대화하기 & 가상 토론 (선택적 심화 시뮬레이션)
│   ├── pages/                          # 5대 핵심 화면 페이지
│   │   ├── HomePage.tsx                # A. 홈 화면 (과목 선택, 빠른 검색, 이어서 학습, 복습 필요 개념)
│   │   ├── SearchPage.tsx              # B. 기출문제 및 선지 검색 화면 (문항 기준 / 개념 기준)
│   │   ├── ClinicPage.tsx              # C·D·E. 선지 클리닉 화면 (2단 레이아웃, STEP 1~6 통합 학습 세션)
│   │   ├── MyLogsPage.tsx              # F. 나의 선지로그 (사상가·개념별 학습 기록 필터, 묶어보기, 직접 수정)
│   │   └── ConceptMapPage.tsx          # G. 나의 개념 지도 (계층 구조 트리, 미학습/이해확인 상태 시각화)
│   ├── data/                           # 구조화된 검증 교육 데이터 (JSON)
│   │   ├── questions.json              # 기출문제 및 선지 데이터 (5문항 25선지, 데모 표기)
│   │   ├── explanations.json           # 선지별 상세 해설, 핵심 근거, 빈출 오개념 데이터 (25건)
│   │   ├── concepts.json               # 롤스·노직 핵심 개념 8종 (정의, 필수 조건, 사례, 연결 선지)
│   │   └── philosophers.json           # 과목 메타데이터, 사상가 프로필, 6대 비교 기준표, 사례 데이터
│   ├── retrieval/
│   │   └── ragEngine.ts                # 고유 ID 기반 기출·해설·개념 검색 및 RAG 프롬프트 컨텍스트 조립
│   ├── recommendation/
│   │   └── optionRecommender.ts        # 동일/유사 개념 기반 검증용 기출 선지 추천 엔진 (태그 매칭 + ML 인터페이스)
│   ├── tutor/
│   │   ├── prompts.ts                  # 학습 이유별 첫 질문 및 13대 교육공학 원칙 기반 시스템 프롬프트
│   │   ├── mockTutorEngine.ts          # Mock AI 튜터 시나리오 엔진, 4대 기준 이해도 평가, 선지로그 초안 생성
│   │   └── roleplayEngine.ts           # 사상가 페르소나 역할극 및 가상 토론 시뮬레이션 엔진
│   ├── services/
│   │   └── tutorApi.ts                 # Mock 모드 및 /api/tutor 호출 클라이언트 (중복 요청 방지·폴백 처리)
│   ├── utils/
│   │   └── storage.ts                  # localStorage 기반 선지로그 CRUD 및 개념 지도 상태 산출 유틸리티
│   ├── types/
│   │   └── index.ts                    # 전체 데이터 및 상태 TypeScript 인터페이스 정의
│   ├── App.tsx                         # 루트 상태 및 탭 라우팅 관리
│   ├── main.tsx                        # React 엔트리 포인트
│   └── index.css                       # Notion/Linear 스타일 디자인 시스템 스타일시트
├── .env.example                        # 서버 환경변수 설정 예시
└── package.json
```

---

## 4. 설치 및 실행 방법

### 사전 요구사항
- Node.js 18 이상

### 로컬 개발 서버 실행
```bash
# 1. 패키지 설치
npm install

# 2. 개발 서버 시작 (API 키 없이 Mock 데모 모드로 전체 기능 즉시 작동)
npm run dev

# 3. 프로덕션 빌드 및 타입 검증
npm run build

# 4. 코드 린트 검사
npm run lint
```

---

## 5. 환경변수 설정 (GPT API 연동 시)

기본값인 **Mock 시나리오 데모 모드**에서는 별도의 API 키 없이도 모든 화면과 시나리오를 100% 체험할 수 있습니다.  
실제 OpenAI GPT API와 연동하려면 프로젝트 루트(또는 Vercel 프로젝트 대시보드의 Environment Variables)에 다음 환경변수를 설정하세요.

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

> **보안 주의사항**:
> - API 키에 절대 `VITE_` 접두사를 붙이지 마세요. 프론트엔드 번들에 노출되지 않도록 오직 서버 함수([`api/tutor.ts`](./api/tutor.ts))에서만 `process.env.OPENAI_API_KEY`를 읽습니다.
> - `.env` 파일은 `.gitignore`에 의해 제외되며 GitHub에 커밋하지 않습니다.

---

## 6. 기출문제·해설·개념 데이터 추가 방법

새로운 문항이나 과목(윤리와 사상, 사회·문화)을 추가할 때는 `src/data/` 폴더의 세 JSON 파일을 고유 ID로 연결하여 추가합니다.

1. **`src/data/concepts.json`**: 새 개념의 `conceptId`(예: `concept_kant_duty`)를 정의하고 `definition`, `necessaryConditions`, `commonMisconceptions`를 입력합니다.
2. **`src/data/questions.json`**: 문항(`questionId`)과 5개 선지(`optionId`)를 추가하고, 각 선지의 `conceptIds` 배열에 위에서 만든 `conceptId`를 넣습니다. 자체 제작 데이터인 경우 반드시 `"isDemo": true`로 설정합니다.
3. **`src/data/explanations.json`**: 각 `optionId`에 대응하는 `explanationId`를 만들고 `correctJudgment`, `explanation`, `keyEvidence`, `relatedConceptIds`를 작성합니다.

---

## 7. 4인 팀 협업 가이드

| 역할 | 담당 모듈 및 파일 | 주요 업무 |
| :--- | :--- | :--- |
| **팀원 1 (교육공학·데이터 설계)** | `src/data/*.json`, `src/retrieval/ragEngine.ts` | 기출 선지·해설·개념 JSON 구축, 오개념 유형 분류, 사상가 비교표 검증 |
| **팀원 2 (AI 프롬프트·튜터링)** | `src/tutor/*`, `api/tutor.ts`, `src/services/tutorApi.ts` | 소크라테스식 발문 프롬프트 고도화, 이해도 검증 루브릭 설계, GPT API 연동 |
| **팀원 3 (UI/UX·프론트엔드)** | `src/pages/*`, `src/components/*`, `src/index.css` | 선지 클리닉 2단 레이아웃, 나의 선지로그, 개념 지도 UI 개선 및 반응형 테스트 |
| **팀원 4 (데이터 분석·ML 추천)** | `src/recommendation/*`, `ml/*`, `src/utils/storage.ts` | 태그 매칭 가중치 튜닝, Google Colab 기반 TF-IDF/코사인 유사도 분석 실험 및 연동 |
