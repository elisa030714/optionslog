/**
 * @file src/recommendation/optionRecommender.ts
 * @description 학습 중인 선지와 동일하거나 유사한 개념을 다루는 다른 기출 선지를 추천하는 독립 모듈입니다.
 *
 * [설계 원칙 - Section 6E & Section 11]
 * 1. 현재 학습 중인 선지(currentOptionId)와 동일한 선지는 절대 중복 추천하지 않습니다.
 * 2. MVP에서는 TypeScript 기반의 개념 태그(conceptIds) 및 사상가 태그(philosopherIds) 가중치 매칭 알고리즘을 사용합니다.
 * 3. 향후 Python 기반 머신러닝 유사도 분석 모델(TF-IDF, Cosine Similarity, Sentence Embedding) API와
 *    즉시 교체·연동할 수 있도록 표준 인터페이스(OptionRecommenderInterface)를 제공합니다.
 * 4. UI에 현재 추천 방식이 'TypeScript 개념·사상가 태그 매칭 (MVP)'임을 투명하게 표시합니다.
 */

import {
  getAllQuestions,
  getOptionWithQuestion,
  getConceptById,
  getPhilosopherById,
} from '../retrieval/ragEngine';
import type { RecommendedOptionItem } from '../types';

export interface RecommendationRequest {
  currentOptionId: string;
  limit?: number;
  excludeOptionIds?: string[];
}

/**
 * [MVP 구현] 개념 태그 및 사상가 태그 가중치 기반 유사 선지 추천 함수
 *
 * 가중치 산정 공식 (0.0 ~ 1.0 정규화):
 * - 핵심 개념(conceptIds) 일치 점수: 65% 가중치
 * - 관련 개념(relatedConceptIds) 간접 일치 점수: 20% 가중치
 * - 사상가(philosopherIds) 일치 점수: 15% 가중치
 * - 다른 문항(questionId)에서 출제된 선지일 경우 전이 학습 효과를 위해 우선순위 부여
 */
export function recommendRelatedOptions(req: RecommendationRequest): RecommendedOptionItem[] {
  const { currentOptionId, limit = 3, excludeOptionIds = [] } = req;
  const current = getOptionWithQuestion(currentOptionId);
  if (!current) return [];

  const targetOption = current.option;
  const targetQuestionId = current.question.questionId;
  const targetConceptSet = new Set(targetOption.conceptIds);
  const targetPhilosopherSet = new Set(targetOption.philosopherIds);

  // 현재 개념들과 연결된 관련 개념 집합
  const relatedConceptSet = new Set<string>();
  targetOption.conceptIds.forEach((cid) => {
    const c = getConceptById(cid);
    c?.relatedConceptIds.forEach((rcid) => relatedConceptSet.add(rcid));
  });

  const excludedSet = new Set<string>([currentOptionId, ...excludeOptionIds]);
  const allQuestions = getAllQuestions();
  const candidates: RecommendedOptionItem[] = [];

  for (const q of allQuestions) {
    for (const opt of q.options) {
      // 1. 현재 학습 중인 선지 또는 제외 목록에 있는 선지는 제외
      if (excludedSet.has(opt.optionId)) continue;

      const fullData = getOptionWithQuestion(opt.optionId);
      if (!fullData) continue;

      // 2. 일치하는 핵심 개념 계산
      const directMatchedConceptIds = opt.conceptIds.filter((cid) => targetConceptSet.has(cid));
      const indirectMatchedConceptIds = opt.conceptIds.filter(
        (cid) => !targetConceptSet.has(cid) && relatedConceptSet.has(cid)
      );
      const matchedPhilosopherIds = opt.philosopherIds.filter((pid) =>
        targetPhilosopherSet.has(pid)
      );

      if (
        directMatchedConceptIds.length === 0 &&
        indirectMatchedConceptIds.length === 0 &&
        matchedPhilosopherIds.length === 0
      ) {
        continue;
      }

      // 3. 태그 유사도 점수 산출 (TypeScript Tag Matching MVP)
      const directConceptRatio =
        directMatchedConceptIds.length /
        Math.max(1, Math.max(targetConceptSet.size, opt.conceptIds.length));
      const indirectBonus = indirectMatchedConceptIds.length > 0 ? 0.18 : 0;
      const philosopherRatio =
        matchedPhilosopherIds.length /
        Math.max(1, Math.max(targetPhilosopherSet.size, opt.philosopherIds.length));
      const crossQuestionBonus = q.questionId !== targetQuestionId ? 0.08 : 0;

      const rawScore =
        directConceptRatio * 0.65 +
        indirectBonus +
        philosopherRatio * 0.15 +
        crossQuestionBonus;
      const similarityScore = Math.min(0.98, Math.round(rawScore * 100) / 100);

      const matchedConceptNames = directMatchedConceptIds
        .map((cid) => getConceptById(cid)?.conceptName)
        .filter((name): name is string => Boolean(name));

      const matchedPhilosopherNames = matchedPhilosopherIds
        .map((pid) => getPhilosopherById(pid)?.nameKo)
        .filter((name): name is string => Boolean(name));

      let recommendReason = '';
      if (matchedConceptNames.length > 0) {
        recommendReason = `현재 학습한 '${matchedConceptNames.join(', ')}' 개념을 다른 표현과 맥락에서 검증할 수 있는 선지입니다.`;
      } else {
        recommendReason = `${matchedPhilosopherNames.join(', ')}의 연계 개념을 적용해 볼 수 있는 확장 선지입니다.`;
      }

      candidates.push({
        option: opt,
        question: q,
        explanation: fullData.explanation,
        similarityScore,
        matchedConcepts: matchedConceptNames,
        matchedPhilosophers: matchedPhilosopherNames,
        recommendReason,
        algorithmType: 'tag_matching_mvp',
      });
    }
  }

  // 유사도 점수 내림차순 정렬 후 상위 limit개 반환
  candidates.sort((a, b) => b.similarityScore - a.similarityScore);
  return candidates.slice(0, limit);
}

/**
 * [향후 확장용 인터페이스]
 * Python 기반 머신러닝 서버(FastAPI / Vercel Python Function) 연동 시 사용할 비동기 추천 함수 스텁입니다.
 * 현재 MVP에서는 실제 ML 서버를 호출하지 않고 로컬 태그 매칭 결과를 반환합니다.
 */
export async function fetchPythonMLRecommendations(
  req: RecommendationRequest
): Promise<{
  isMockFallback: boolean;
  engineLabel: string;
  items: RecommendedOptionItem[];
}> {
  // 추후 Python ML 엔드포인트 연동 시:
  // const res = await fetch('/api/ml-recommend', { method: 'POST', body: JSON.stringify(req) });
  return {
    isMockFallback: true,
    engineLabel: 'TypeScript 개념·사상가 태그 매칭 엔진 (MVP 작동 중 / Python ML 연동 인터페이스 준비 완료)',
    items: recommendRelatedOptions(req),
  };
}

