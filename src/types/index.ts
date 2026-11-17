/**
 * @file src/types/index.ts
 * @description 선지로그(SeonjiLog) 전체 애플리케이션에서 사용하는 TypeScript 타입 정의 파일입니다.
 * 4인 팀 협업을 위해 데이터 구조(기출문제, 해설, 개념), AI 튜터 대화, 이해도 검증, 학습로그 타입을 명확히 정의합니다.
 */

/** 지원 과목 코드 */
export type SubjectId = 'life_ethics' | 'ethics_thought' | 'social_culture';

/** 과목 메타 정보 */
export interface SubjectInfo {
  id: SubjectId;
  name: string;
  description: string;
  isAvailable: boolean; // MVP 구현 여부 (생활과 윤리: true, 나머지: false '준비 중')
  unitName: string;
}

/** 시험 유형 */
export type ExamType = '6월 모의평가' | '9월 모의평가' | '수능';

/** 사상가 고유 ID */
export type PhilosopherId = 'rawls' | 'nozick';

/**
 * 1. 기출문제 내 개별 선지 데이터 구조
 */
export interface QuestionOption {
  optionId: string;           // 예: "q2025_09_07_opt1"
  optionNumber: number;       // 1 ~ 5
  text: string;               // 선지 원문
  judgment: boolean;          // 선지의 옳고 그름 (true: 옳은 선지 O, false: 틀린 선지 X)
  philosopherIds: PhilosopherId[]; // 관련된 사상가 ID 목록
  conceptIds: string[];       // 관련된 핵심 개념 ID 목록
}

/**
 * 1. 기출문제 데이터 구조 (questions.json)
 */
export interface QuestionData {
  questionId: string;         // 예: "q2025_09_07"
  academicYear: number;       // 학년도 (예: 2025)
  examType: ExamType;         // 6월 모의평가 | 9월 모의평가 | 수능
  subject: SubjectId;         // 과목 ID
  subjectName: string;        // 과목 한글명 (생활과 윤리)
  unit: string;               // 단원명 (사회 정의)
  questionNumber: number;     // 문항 번호
  passage: string;            // 제시문 (갑, 을 사상가 원전 각색 지문 등)
  questionText: string;       // 발문 (예: "갑, 을 사상가의 입장으로 적절한 것만을 고른 것은?")
  correctAnswer: number;      // 정답 선지 번호 (1~5)
  options: QuestionOption[];  // 5개 선지 목록
  source: string;             // 출처 표기
  isDemo: boolean;            // 자체 제작 데모 문항 여부 (반드시 true 표기)
}

/**
 * 2. 해설 데이터 구조 (explanations.json)
 */
export interface ExplanationData {
  explanationId: string;      // 예: "exp_q2025_09_07_opt1"
  optionId: string;           // 연결된 선지 ID
  correctJudgment: boolean;   // 선지 정오 (true: O, false: X)
  explanation: string;        // 상세 해설 본문
  keyEvidence: string;        // 핵심 판단 근거 (선지의 어느 표현이 왜 맞거나 틀리는지)
  commonMisconceptions: string[]; // 학습자들이 자주 범하는 오개념 목록
  relatedConceptIds: string[];    // 연결된 개념 ID 목록
  sourceTitle: string;        // 참고 자료 제목
  sourcePage: string;         // 참고 페이지 또는 절
  sourceUrl: string;          // 참고 URL 또는 안내
  isDemo: boolean;            // 데모용 자체 제작 데이터 여부
}

/**
 * 3. 개념 데이터 구조 (concepts.json)
 */
export interface ConceptExample {
  title: string;              // 사례 제목
  situation: string;          // 사회적 상황 또는 사고실험 설명
  philosopherView: string;    // 해당 사상가의 관점 해석
}

export interface ConceptData {
  conceptId: string;          // 예: "concept_rawls_difference"
  subject: SubjectId;         // 과목 ID
  subjectName: string;        // 과목 한글명
  unit: string;               // 단원명 (사회 정의)
  philosopherId: PhilosopherId; // 사상가 ID
  philosopherName: string;    // 사상가 한글명 (롤스 / 노직)
  conceptName: string;        // 개념명 (예: "차등의 원칙")
  definition: string;         // 핵심 정의
  keyPrinciples: string[];    // 주요 원리 및 핵심 주장
  necessaryConditions: string[]; // 반드시 알아야 할 전제 조건 (예: 평등한 자유의 원칙 우선성 등)
  commonMisconceptions: string[]; // 자주 발생하는 오개념
  relatedConceptIds: string[];    // 관련 개념 ID 목록
  contrastingConceptIds: string[]; // 대비되는 개념 ID 목록
  relatedOptionIds: string[];     // 관련 기출 선지 ID 목록
  examples: ConceptExample[];     // 구체적 상황 및 사례
  source: string;             // 출처
  isDemo: boolean;            // 데모용 데이터 여부
}

/**
 * 사상가 비교 데이터 구조
 */
export interface PhilosopherComparisonRow {
  criteria: string;           // 비교 기준 (정의의 기준, 분배 관점 등)
  rawls: string;              // 롤스의 입장
  nozick: string;             // 노직의 입장
  examPoint: string;          // 수능 출제 포인트 및 혼동 주의점
}

export interface PhilosopherProfile {
  philosopherId: PhilosopherId;
  nameKo: string;
  nameEn: string;
  era: string;
  coreWork: string;
  coreKeyword: string;
  summary: string;
  personaStyle: string;       // 역할극 시뮬레이션 어조 설명
}

/**
 * 학습자가 선지 클리닉 시작 시 선택하는 학습 이유 (STEP 2)
 */
export type LearningReasonType =
  | 'wrong_option'       // 틀린 선지예요.
  | 'guessed_confused'   // 맞혔지만 헷갈렸어요.
  | 'hard_explanation'   // 해설을 읽어도 이해되지 않아요.
  | 'deep_study';        // 관련 개념을 더 깊이 이해하고 싶어요.

export interface LearningReasonOption {
  id: LearningReasonType;
  label: string;
  description: string;
  firstTutorQuestion: string;
}

/**
 * AI 튜터 대화 유형 (Section 10)
 */
export type DialogueCategory =
  | '오개념 진단'
  | '개념 설명'
  | '사상가 비교'
  | '사례 적용'
  | '사상가 역할극'
  | '자기설명'
  | '이해도 검증'
  | '학습로그 생성';

/**
 * 교육공학적 교수전략 태그 (Section 4)
 */
export type PedagogicalStrategy =
  | '소크라테스식 문답법'
  | '개념 변화 학습'
  | '스캐폴딩(비계 설정)'
  | '자기설명 유도'
  | '구성주의 비교'
  | '형성평가 피드백'
  | '학습 전이 적용';

/**
 * 채팅 메시지 구조
 */
export interface ChatMessage {
  id: string;
  sender: 'tutor' | 'student' | 'philosopher';
  philosopherId?: PhilosopherId;
  content: string;
  timestamp: string;
  dialogueCategory?: DialogueCategory;
  pedagogicalStrategy?: PedagogicalStrategy;
  referencedSources?: string[]; // RAG로 참조한 데이터 ID 및 출처
  suggestedReplies?: string[];  // 데모 시연 및 스캐폴딩을 위한 추천 답변 칩
  comparisonCardTrigger?: boolean; // 사상가 비교 카드 인라인 표시 여부
  conceptCardTriggerId?: string;   // 특정 핵심 개념 카드 인라인 표시 ID
  readyForVerification?: boolean;  // 이해도 검증 단계 진입 권장 여부
}

/**
 * 개념 이해도 상태 (Section 6E, 6G)
 */
export type UnderstandingStatus =
  | '이해 확인'
  | '부분 이해'
  | '추가 학습 필요'
  | '검증 전'
  | '미학습';

/**
 * 이해도 검증 4대 평가 기준 결과 (Section 6E)
 */
export interface VerificationCriteriaResult {
  accurateConcept: { passed: boolean; comment: string };       // 1. 핵심 개념을 정확하게 설명하는가?
  noPhilosopherConfusion: { passed: boolean; comment: string }; // 2. 사상가의 입장을 혼동하지 않는가?
  considersConditions: { passed: boolean; comment: string };   // 3. 필요한 조건과 전제를 고려하는가?
  appliesToNewCase: { passed: boolean; comment: string };      // 4. 새로운 사례에 개념을 적절하게 적용하는가?
}

/**
 * 유사 선지 이해도 검증 결과 (STEP 5)
 */
export interface VerificationAttempt {
  targetOptionId: string;
  targetOptionText: string;
  targetQuestionInfo: string;
  userJudgment: boolean;        // 학습자가 판단한 O(true) / X(false)
  correctJudgment: boolean;     // 실제 정답 O(true) / X(false)
  userReasoning: string;        // 학습자가 작성한 판단 이유
  status: Exclude<UnderstandingStatus, '미학습'>;
  overallFeedback: string;
  criteriaEvaluation: VerificationCriteriaResult;
  evaluatedAt: string;
}

/**
 * 나의 선지로그 (개인별 개념 학습노트 - Section 6F)
 */
export interface LearningLog {
  logId: string;
  subject: SubjectId;
  subjectName: string;          // 1. 과목
  unit: string;                 // 1. 단원
  philosopherIds: PhilosopherId[];
  philosopherNames: string[];   // 2. 관련 사상가
  conceptIds: string[];
  conceptNames: string[];       // 3. 핵심 개념
  questionId: string;
  questionInfo: string;         // 기출 문항 정보
  optionId: string;
  optionNumber: number;
  optionText: string;           // 4. 학습한 기출 선지
  learningReason: LearningReasonType;
  learningReasonLabel: string;  // 5. 최초 학습 이유
  initialUnderstanding: string; // 6. 기존의 나의 이해
  discoveredMisconception: string; // 7. 학습 과정에서 발견한 오개념
  newlyUnderstoodConcept: string;  // 8. 새롭게 이해한 개념 (자기설명)
  aiFeedbackSummary: string;    // 9. AI 피드백 요약
  philosopherComparisonNote: string; // 10. 관련 사상가 및 개념 비교
  verificationResult?: VerificationAttempt; // 11. 유사 선지 검증 결과
  understandingStatus: Exclude<UnderstandingStatus, '미학습'>;
  furtherStudyNeeded: string;   // 12. 추가 학습이 필요한 부분
  createdAt: string;            // 13. 학습 날짜
  updatedAt: string;
  sources: string[];            // 14. 참고 자료 및 출처
  isDemoSample?: boolean;       // 초기 탑재된 데모 예시 로그 여부
}

/**
 * RAG 검색 컨텍스트 구조 (Section 9)
 */
export interface RetrievedContext {
  question: QuestionData;
  selectedOption: QuestionOption;
  explanation: ExplanationData;
  relatedConcepts: ConceptData[];
  contrastingConcepts: ConceptData[];
  philosopherProfiles: PhilosopherProfile[];
}

/**
 * 추천 선지 아이템 구조 (Section 11)
 */
export interface RecommendedOptionItem {
  option: QuestionOption;
  question: QuestionData;
  explanation: ExplanationData;
  similarityScore: number;      // 0 ~ 1 사이 유사도 점수 (MVP: 태그/개념 가중치 매칭)
  matchedConcepts: string[];    // 일치하는 개념명 목록
  matchedPhilosophers: string[]; // 일치하는 사상가명 목록
  recommendReason: string;      // 추천 사유 설명
  algorithmType: 'tag_matching_mvp' | 'python_ml_tfidf_cosine';
}

/**
 * 페이지 네비게이션 탭 ID
 */
export type PageTab = 'home' | 'search' | 'clinic' | 'logs' | 'map';

