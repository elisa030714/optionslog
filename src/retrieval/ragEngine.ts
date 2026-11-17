/**
 * @file src/retrieval/ragEngine.ts
 * @description 선지로그(SeonjiLog)의 검색 기반 생성(RAG: Retrieval-Augmented Generation) 파이프라인 모듈입니다.
 *
 * [작동 원리 - 7단계 파이프라인 중 데이터 검색 및 컨텍스트 조립 담당]
 * 1. 학습자가 복습할 선지(optionId)를 선택합니다.
 * 2. optionId를 기반으로 기출문제 데이터(questions.json)에서 문항과 선지 원문을 검색합니다.
 * 3. 해당 선지에 연결된 해설 데이터(explanations.json)를 검색합니다.
 * 4. 관련 사상가(philosophers.json) 및 핵심/대비 개념 데이터(concepts.json)를 검색합니다.
 * 5. 검색된 검증 자료들을 하나의 구조화된 문맥(RetrievedContext)으로 조립하여 AI 튜터에 전달합니다.
 */

import questionsRaw from '../data/questions.json';
import explanationsRaw from '../data/explanations.json';
import conceptsRaw from '../data/concepts.json';
import philosophersRaw from '../data/philosophers.json';
import type {
  QuestionData,
  QuestionOption,
  ExplanationData,
  ConceptData,
  PhilosopherProfile,
  PhilosopherComparisonRow,
  SubjectInfo,
  RetrievedContext,
  PhilosopherId,
} from '../types';

// 타입 안전성을 보장하며 JSON 데이터 로드
const questionsData = questionsRaw as QuestionData[];
const explanationsData = explanationsRaw as ExplanationData[];
const conceptsData = conceptsRaw as ConceptData[];
const subjectsData = philosophersRaw.subjects as SubjectInfo[];
const philosophersData = philosophersRaw.philosophers as PhilosopherProfile[];
const comparisonTableData = philosophersRaw.comparisonTable as PhilosopherComparisonRow[];
const caseStudiesData = philosophersRaw.caseStudies;

/** 전체 과목 목록 반환 */
export function getAllSubjects(): SubjectInfo[] {
  return subjectsData;
}

/** 전체 기출문제 목록 반환 */
export function getAllQuestions(): QuestionData[] {
  return questionsData;
}

/** 전체 개념 목록 반환 */
export function getAllConcepts(): ConceptData[] {
  return conceptsData;
}

/** 전체 사상가 프로필 반환 */
export function getAllPhilosophers(): PhilosopherProfile[] {
  return philosophersData;
}

/** 사상가 비교표 데이터 반환 */
export function getPhilosopherComparisonTable(): PhilosopherComparisonRow[] {
  return comparisonTableData;
}

/** 상황 및 사례 적용 데이터 반환 */
export function getCaseStudies() {
  return caseStudiesData;
}

/** 특정 개념 ID로 개념 데이터 단건 조회 */
export function getConceptById(conceptId: string): ConceptData | undefined {
  return conceptsData.find((c) => c.conceptId === conceptId);
}

/** 특정 사상가 ID로 사상가 프로필 단건 조회 */
export function getPhilosopherById(philosopherId: PhilosopherId): PhilosopherProfile | undefined {
  return philosophersData.find((p) => p.philosopherId === philosopherId);
}

/** 특정 선지 ID로 문항 + 선지 + 해설 통합 조회 */
export function getOptionWithQuestion(optionId: string): {
  question: QuestionData;
  option: QuestionOption;
  explanation: ExplanationData;
} | null {
  for (const question of questionsData) {
    const foundOption = question.options.find((opt) => opt.optionId === optionId);
    if (foundOption) {
      const explanation = explanationsData.find((exp) => exp.optionId === optionId);
      if (explanation) {
        return { question, option: foundOption, explanation };
      }
    }
  }
  return null;
}

/**
 * [핵심 RAG 함수]
 * 선택된 선지 ID(optionId)를 기준으로 기출문제, 선지 해설, 핵심 개념, 대비 개념, 사상가 프로필을
 * 고유 ID 연결망을 통해 한 번에 검색하여 반환합니다.
 */
export function retrieveLearningContext(optionId: string): RetrievedContext | null {
  const base = getOptionWithQuestion(optionId);
  if (!base) return null;

  const { question, option, explanation } = base;

  // 선지 및 해설에 연결된 모든 개념 ID 수집 (중복 제거)
  const conceptIdSet = new Set<string>([
    ...option.conceptIds,
    ...explanation.relatedConceptIds,
  ]);

  const relatedConcepts = conceptsData.filter((c) => conceptIdSet.has(c.conceptId));

  // 관련 개념들의 대비 개념(contrastingConceptIds) 수집
  const contrastingIdSet = new Set<string>();
  relatedConcepts.forEach((rc) => {
    rc.contrastingConceptIds.forEach((cid) => {
      if (!conceptIdSet.has(cid)) {
        contrastingIdSet.add(cid);
      }
    });
  });

  const contrastingConcepts = conceptsData.filter((c) => contrastingIdSet.has(c.conceptId));

  // 관련 사상가 프로필 조회
  const philosopherProfiles = philosophersData.filter((p) =>
    option.philosopherIds.includes(p.philosopherId)
  );

  return {
    question,
    selectedOption: option,
    explanation,
    relatedConcepts,
    contrastingConcepts,
    philosopherProfiles,
  };
}

/**
 * 검색된 RAG 컨텍스트를 GPT API 프롬프트에 주입할 수 있는 구조화된 텍스트 블록으로 변환합니다.
 * AI가 제공된 검증 자료 외의 내용을 지어내지 않도록(Hallucination 방지) 출처 ID를 명시합니다.
 */
export function formatContextForPrompt(ctx: RetrievedContext): string {
  const { question, selectedOption, explanation, relatedConcepts, contrastingConcepts } = ctx;

  const conceptsText = relatedConcepts
    .map(
      (c) =>
        `- [개념 ID: ${c.conceptId}] ${c.philosopherName} - ${c.conceptName}\n` +
        `  · 정의: ${c.definition}\n` +
        `  · 핵심 원리: ${c.keyPrinciples.join(' / ')}\n` +
        `  · 필수 전제 조건: ${c.necessaryConditions.join(' / ')}\n` +
        `  · 흔한 오개념: ${c.commonMisconceptions.join(' / ')}\n` +
        `  · 대표 사례: ${c.examples.map((e) => `${e.title}(${e.situation})`).join(' | ')}`
    )
    .join('\n');

  const contrastingText =
    contrastingConcepts.length > 0
      ? contrastingConcepts
          .map(
            (c) =>
              `- [대비 개념 ID: ${c.conceptId}] ${c.philosopherName} - ${c.conceptName}: ${c.definition}`
          )
          .join('\n')
      : '없음';

  return [
    `=== [검증된 학습 자료 컨텍스트 (RAG)] ===`,
    `1. 문항 정보: [${question.questionId}] ${question.academicYear}학년도 ${question.examType} ${question.subjectName} (${question.unit}) ${question.questionNumber}번 [데모용 자체 제작]`,
    `2. 제시문:\n${question.passage}`,
    `3. 학습자가 선택한 선지 [${selectedOption.optionId}]: "${selectedOption.text}"`,
    `4. 선지 정오답: ${explanation.correctJudgment ? '옳은 선지 (O)' : '틀린 선지 (X)'}`,
    `5. 공식 해설 [${explanation.explanationId}]: ${explanation.explanation}`,
    `6. 핵심 판단 근거: ${explanation.keyEvidence}`,
    `7. 자주 발생하는 오개념: ${explanation.commonMisconceptions.join(' / ')}`,
    `8. 연결된 핵심 개념 데이터:\n${conceptsText}`,
    `9. 비교/대비 개념 데이터:\n${contrastingText}`,
    `10. 출처: ${explanation.sourceTitle} (${explanation.sourcePage})`,
    `========================================`,
  ].join('\n');
}

/**
 * 질문이나 학습자 입력이 현재 검증된 데이터베이스 범위(생활과 윤리 - 사회 정의: 롤스·노직)를
 * 완전히 벗어난 미지원 사상가/과목에 대한 것인지 검사하는 가드레일 함수입니다.
 */
export function checkOutOfScopeQuery(userInput: string): {
  isOutOfScope: boolean;
  detectedKeyword?: string;
} {
  const unsupportedKeywords = [
    '아리스토텔레스',
    '칸트',
    '벤담',
    '밀',
    '마르크스',
    '왈처',
    '니부어',
    '하버마스',
    '공자',
    '맹자',
    '순자',
    '주희',
    '왕수인',
    '이황',
    '이이',
    '길리건',
    '요나스',
  ];

  for (const kw of unsupportedKeywords) {
    if (userInput.includes(kw)) {
      return { isOutOfScope: true, detectedKeyword: kw };
    }
  }
  return { isOutOfScope: false };
}

