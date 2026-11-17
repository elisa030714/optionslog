/**
 * @file src/utils/storage.ts
 * @description localStorage를 활용하여 개인별 개념 학습로그(나의 선지로그), 최근 학습 선지,
 * 개념 지도(Concept Map)의 개념별 이해도 상태를 관리하는 유틸리티 모듈입니다.
 *
 * [설계 원칙 - Section 6F & 6G]
 * 1. MVP에서는 별도의 DB나 로그인 없이 브라우저 localStorage에 학습 기록을 안전하게 저장합니다.
 * 2. 학습 기록이 없는 개념은 임의로 취약 개념이라 판단하지 않고 반드시 '미학습'으로 표시합니다.
 * 3. 처음 데모를 실행했을 때도 '나의 선지로그'와 '개념 지도'의 작동 방식을 즉시 확인할 수 있도록
 *    데모 예시 로그 2건(isDemoSample: true)을 기본 제공하며, 언제든 수정·삭제·초기화할 수 있습니다.
 */

import type { LearningLog, UnderstandingStatus } from '../types';
import { getAllConcepts } from '../retrieval/ragEngine';

const LOGS_STORAGE_KEY = 'seonjilog_learning_logs_v1';
const RECENT_OPTIONS_KEY = 'seonjilog_recent_options_v1';
const AI_MODE_STORAGE_KEY = 'seonjilog_ai_mode_v1';

/**
 * 데모 시연용 초기 샘플 학습로그 2건
 * - 1건: 롤스 '차등의 원칙' (이해 확인)
 * - 1건: 노직 '정당한 이전의 원리' (추가 학습 필요)
 * 나머지 6개 개념은 기록이 없으므로 개념 지도에서 정확히 '미학습'으로 표시됩니다.
 */
const INITIAL_DEMO_LOGS: LearningLog[] = [
  {
    logId: 'log_demo_rawls_01',
    subject: 'life_ethics',
    subjectName: '생활과 윤리',
    unit: '사회 정의',
    philosopherIds: ['rawls'],
    philosopherNames: ['존 롤스'],
    conceptIds: ['concept_rawls_difference'],
    conceptNames: ['차등의 원칙'],
    questionId: 'q2025_09_07',
    questionInfo: '2025학년도 9월 모의평가 7번 [데모용 자체 제작]',
    optionId: 'q2025_09_07_opt1',
    optionNumber: 1,
    optionText: '롤스는 정의로운 사회에서 모든 사회적·경제적 불평등이 제거되어야 한다고 본다.',
    learningReason: 'wrong_option',
    learningReasonLabel: '틀린 선지예요.',
    initialUnderstanding:
      '롤스는 평등을 중요하게 생각하는 사상가이기 때문에 모든 경제적 불평등을 없애야 한다는 맞는 선지라고 생각했다.',
    discoveredMisconception:
      '롤스가 지향하는 기본적 자유의 평등(제1원칙)과 사회적·경제적 가치 분배(제2원칙)를 구분하지 못하고 결과적 균등 분배로 오해함.',
    newlyUnderstoodConcept:
      '롤스는 모든 불평등이 없어져야 한다고 주장하는 것이 아니라, 평등한 자유의 원칙과 공정한 기회균등의 원칙이 충족된 상태에서 최소 수혜자에게 최대 이익이 될 때 불평등을 허용한다.',
    aiFeedbackSummary:
      '사회 A[30,30,30]와 사회 B[80,60,40] 비교를 통해 최소 수혜자의 몫을 극대화하는 차등의 원칙 원리를 스스로 도출하고 자기설명을 완성함.',
    philosopherComparisonNote:
      '롤스와 노직 모두 결과의 획일적 평등에는 반대하지만, 롤스는 최소 수혜자를 위한 사회 기본 구조의 재분배를 인정하고 노직은 취득·이전의 역사적 절차만 본다.',
    verificationResult: {
      targetOptionId: 'q2024_11_09_opt1',
      targetOptionText:
        '롤스는 정의의 다른 원칙들이 충족된 상태에서 최소 수혜자에게 최대 이익이 보장된다면 사회적·경제적 불평등이 정당화될 수 있다고 본다.',
      targetQuestionInfo: '2024학년도 수능 9번 [데모]',
      userJudgment: true,
      correctJudgment: true,
      userReasoning:
        '롤스의 차등의 원칙에 따르면 제1원칙과 공정한 기회균등 원칙이 충족되었을 때 최소 수혜자에게 최대 이익이 되는 사회적·경제적 불평등은 정당화되기 때문이다.',
      status: '이해 확인',
      overallFeedback:
        '차등의 원칙의 핵심 조건(다른 원칙 충족 + 최소 수혜자 최대 이익)을 새로운 선지에 완벽히 적용했습니다.',
      criteriaEvaluation: {
        accurateConcept: {
          passed: true,
          comment: '차등의 원칙과 최소 수혜자 개념을 정확히 설명함.',
        },
        noPhilosopherConfusion: {
          passed: true,
          comment: '롤스의 입장을 혼동 없이 일관되게 적용함.',
        },
        considersConditions: {
          passed: true,
          comment: '정의의 다른 원칙들이 먼저 충족되어야 한다는 전제 조건을 고려함.',
        },
        appliesToNewCase: {
          passed: true,
          comment: '변형된 긍정문 선지에도 개념을 정확히 전이하여 판단함.',
        },
      },
      evaluatedAt: '2026-11-16T14:30:00.000Z',
    },
    understandingStatus: '이해 확인',
    furtherStudyNeeded:
      '천부적 재능의 분포를 공동 자산으로 본다는 선지(q2025_09_07_opt2)와 제1원칙의 축차적 우선성 선지도 함께 복습하기.',
    createdAt: '2026-11-16T14:30:00.000Z',
    updatedAt: '2026-11-16T14:30:00.000Z',
    sources: [
      '선지로그 데모 해설서 - 생활과 윤리 (p.12 롤스 차등의 원칙 핵심 분석)',
      '선지로그 데모 교육자료 (존 롤스 『정의론』 제2장 정의의 원칙 재구성)',
    ],
    isDemoSample: true,
  },
  {
    logId: 'log_demo_nozick_02',
    subject: 'life_ethics',
    subjectName: '생활과 윤리',
    unit: '사회 정의',
    philosopherIds: ['nozick'],
    philosopherNames: ['로버트 노직'],
    conceptIds: ['concept_nozick_transfer', 'concept_nozick_entitlement'],
    conceptNames: ['정당한 이전의 원리', '소유 권리론과 역사적·비정형적 원리'],
    questionId: 'q2025_09_07',
    questionInfo: '2025학년도 9월 모의평가 7번 [데모용 자체 제작]',
    optionId: 'q2025_09_07_opt4',
    optionNumber: 4,
    optionText:
      '노직은 부유한 개인이 빈곤층을 돕기 위해 자신의 재산을 자발적으로 기부하는 것도 부정의하다고 본다.',
    learningReason: 'guessed_confused',
    learningReasonLabel: '맞혔지만 헷갈렸어요.',
    initialUnderstanding:
      '노직은 최소국가와 자유지상주의를 주장하니까 빈곤층을 돕는 행위 자체에 부정적이지 않을까 순간 망설였다.',
    discoveredMisconception:
      '국가의 강제적 재분배(근로소득 과세) 반대와 개인의 자발적 기부(정당한 이전)를 구분하지 못함.',
    newlyUnderstoodConcept:
      '노직이 반대하는 것은 국가가 세금으로 강제 재분배하는 것이며, 정당한 소유물을 가진 개인이 자발적으로 기부·증여하는 것은 정당한 이전의 원리에 따라 완전히 정의롭다.',
    aiFeedbackSummary:
      '노직의 정당한 이전의 원리에서 강제적 과세와 자발적 증여의 차이를 구분함. 다만 유사 선지 적용 검증이 추가로 필요함.',
    philosopherComparisonNote:
      '롤스는 제도적 조세·복지를 통한 재분배를 정의의 요구로 보지만, 노직은 자발적 이전(기부·교환)만 정당한 것으로 인정한다.',
    understandingStatus: '추가 학습 필요',
    furtherStudyNeeded:
      '노직의 정당한 이전의 원리 관련 다른 기출 선지(q2024_06_05_opt4)로 이해도 검증 완료하기.',
    createdAt: '2026-11-17T10:15:00.000Z',
    updatedAt: '2026-11-17T10:15:00.000Z',
    sources: [
      '선지로그 데모 해설서 - 생활과 윤리 (p.25 강제적 과세 vs 자발적 이전)',
      '선지로그 데모 교육자료 (로버트 노직 『아나키에서 유토피아로』 체임벌린 사례 재구성)',
    ],
    isDemoSample: true,
  },
];

/** 저장된 전체 학습로그 불러오기 */
export function getSavedLearningLogs(): LearningLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_LOGS));
      return INITIAL_DEMO_LOGS;
    }
    const parsed = JSON.parse(raw) as LearningLog[];
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_LOGS;
  } catch {
    return INITIAL_DEMO_LOGS;
  }
}

/** 새로운 학습로그 저장 또는 기존 학습로그 수정(Upsert) */
export function saveLearningLog(log: LearningLog): LearningLog[] {
  const logs = getSavedLearningLogs();
  const existingIdx = logs.findIndex((item) => item.logId === log.logId);
  const updatedLog: LearningLog = {
    ...log,
    updatedAt: new Date().toISOString(),
  };

  let nextLogs: LearningLog[];
  if (existingIdx >= 0) {
    nextLogs = [...logs];
    nextLogs[existingIdx] = updatedLog;
  } else {
    nextLogs = [updatedLog, ...logs];
  }

  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
  } catch {
    // localStorage 용량 제한 등 예외 무시
  }
  return nextLogs;
}

/** 특정 학습로그 삭제 */
export function deleteLearningLog(logId: string): LearningLog[] {
  const logs = getSavedLearningLogs();
  const nextLogs = logs.filter((item) => item.logId !== logId);
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
  } catch {
    // ignore
  }
  return nextLogs;
}

/** 초기 데모 샘플 상태로 학습로그 초기화 */
export function resetLearningLogsToDemo(): LearningLog[] {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_LOGS));
  } catch {
    // ignore
  }
  return INITIAL_DEMO_LOGS;
}

/** 최근 학습한 선지 ID 목록 조회 및 추가 */
export function getRecentOptionIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_OPTIONS_KEY);
    if (!raw) {
      return ['q2025_09_07_opt1', 'q2025_09_07_opt4', 'q2025_06_11_opt1'];
    }
    return JSON.parse(raw) as string[];
  } catch {
    return ['q2025_09_07_opt1', 'q2025_09_07_opt4'];
  }
}

export function addRecentOptionId(optionId: string): string[] {
  const current = getRecentOptionIds().filter((id) => id !== optionId);
  const next = [optionId, ...current].slice(0, 6);
  try {
    localStorage.setItem(RECENT_OPTIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

/**
 * [Section 6G 핵심 로직]
 * 모든 개념(concepts.json)에 대해 현재 저장된 학습로그를 기준으로 이해도 상태를 계산합니다.
 * 학습 기록이 전혀 없는 개념은 임의로 취약 개념이라 판단하지 않고 반드시 '미학습'으로 반환합니다.
 */
export function getConceptStatusMap(
  logs: LearningLog[]
): Record<string, { status: UnderstandingStatus; logCount: number; latestLog?: LearningLog }> {
  const concepts = getAllConcepts();
  const statusMap: Record<
    string,
    { status: UnderstandingStatus; logCount: number; latestLog?: LearningLog }
  > = {};

  for (const concept of concepts) {
    const matchingLogs = logs.filter((l) => l.conceptIds.includes(concept.conceptId));
    if (matchingLogs.length === 0) {
      // 기록이 없는 개념은 반드시 '미학습'으로 표시
      statusMap[concept.conceptId] = {
        status: '미학습',
        logCount: 0,
      };
    } else {
      // 가장 최근에 작성/수정한 학습로그의 상태를 대표 상태로 반영
      const sorted = [...matchingLogs].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      statusMap[concept.conceptId] = {
        status: sorted[0].understandingStatus,
        logCount: matchingLogs.length,
        latestLog: sorted[0],
      };
    }
  }

  return statusMap;
}

/** AI 작동 모드 설정 ('mock' | 'api') */
export function getAiModePreference(): 'mock' | 'api' {
  try {
    const saved = localStorage.getItem(AI_MODE_STORAGE_KEY);
    return saved === 'api' ? 'api' : 'mock';
  } catch {
    return 'mock';
  }
}

export function setAiModePreference(mode: 'mock' | 'api'): void {
  try {
    localStorage.setItem(AI_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

