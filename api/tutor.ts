/**
 * @file api/tutor.ts
 * @description Vercel Serverless Function (/api/tutor)
 *
 * [보안 및 아키텍처 설계 - Section 13]
 * 1. 프론트엔드에서 직접 OpenAI API를 호출하지 않고 본 서버 함수를 경유합니다.
 * 2. 환경변수 OPENAI_API_KEY 및 OPENAI_MODEL을 서버에서만 읽어들입니다.
 * 3. 요청받은 questionId와 optionId를 검증하고, 서버에서 해설(explanations.json) 및
 *    개념 데이터(concepts.json)를 검색(RAG)하여 시스템 프롬프트를 구성합니다.
 * 4. 입력 메시지 길이 제한(500자) 및 출력 토큰 제한(max_tokens: 700)을 적용합니다.
 * 5. 구조화된 JSON 응답 스키마를 검증하여 클라이언트에 반환합니다.
 */

import questions from '../src/data/questions.json';
import explanations from '../src/data/explanations.json';
import concepts from '../src/data/concepts.json';

interface VercelRequest {
  method?: string;
  body?: {
    questionId?: string;
    optionId?: string;
    learningReason?: string;
    userMessage?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
}

const MAX_USER_INPUT_LENGTH = 500;
const MAX_OUTPUT_TOKENS = 700;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return res.status(503).json({
      error:
        '서버 환경변수 OPENAI_API_KEY가 설정되지 않았습니다. 로컬 데모에서는 Mock 모드를 사용해 주세요.',
    });
  }

  const { questionId, optionId, learningReason, userMessage, history = [] } = req.body || {};

  if (!questionId || !optionId || !userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({
      error: '필수 요청 파라미터(questionId, optionId, userMessage)가 누락되었습니다.',
    });
  }

  const trimmedMessage = userMessage.trim().slice(0, MAX_USER_INPUT_LENGTH);

  // 1. 서버에서 문항 및 선지 ID 검증
  const question = questions.find((q) => q.questionId === questionId);
  const selectedOption = question?.options.find((o) => o.optionId === optionId);
  const explanation = explanations.find((e) => e.optionId === optionId);

  if (!question || !selectedOption || !explanation) {
    return res.status(404).json({
      error: '유효하지 않은 문항 ID 또는 선지 ID입니다.',
    });
  }

  // 2. 서버에서 연결된 개념 데이터 검색 (RAG)
  const relatedConceptIds = new Set([
    ...selectedOption.conceptIds,
    ...explanation.relatedConceptIds,
  ]);
  const relatedConcepts = concepts.filter((c) => relatedConceptIds.has(c.conceptId));

  const systemPrompt = [
    `당신은 수능 사회탐구(생활과 윤리) 전문 개념 학습 코치 '선지로그 AI 튜터'입니다.`,
    `학습자의 선지 선택 이유: ${learningReason || 'wrong_option'}`,
    `[검증된 RAG 데이터]`,
    `- 문항: ${question.academicYear}학년도 ${question.examType} ${question.questionNumber}번 [데모]`,
    `- 선지(${selectedOption.optionId}): "${selectedOption.text}" (정오: ${explanation.correctJudgment ? 'O' : 'X'})`,
    `- 핵심 근거: ${explanation.keyEvidence}`,
    `- 공식 해설: ${explanation.explanation}`,
    `- 관련 개념: ${relatedConcepts.map((c) => `${c.conceptName}(${c.definition})`).join(' | ')}`,
    `[코칭 지침]`,
    `- 한 번에 하나의 핵심 질문에 집중하고, 소크라테스식 발문과 사례 비교를 활용하세요.`,
    `- 학습자가 정답/해설을 요청하면 지연하지 말고 즉시 명확히 설명하세요.`,
    `- 제공된 RAG 데이터 외의 임의 출처나 사상가 주장을 지어내지 마세요.`,
    `반드시 JSON 객체로 응답하세요: {"content": "...", "dialogueCategory": "오개념 진단|개념 설명|사상가 비교|사례 적용|자기설명", "pedagogicalStrategy": "소크라테스식 문답법|개념 변화 학습|스캐폴딩(비계 설정)|자기설명 유도", "referencedSources": ["${explanation.explanationId}"], "suggestedReplies": ["...", "..."], "readyForVerification": false}`,
  ].join('\n');

  try {
    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: trimmedMessage },
        ],
      }),
    });

    if (!openAiRes.ok) {
      const errText = await openAiRes.text();
      return res.status(openAiRes.status).json({
        error: `OpenAI API 호출 오류: ${openAiRes.status}`,
        details: errText.slice(0, 200),
      });
    }

    const completion = (await openAiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;

    return res.status(200).json({
      content:
        typeof parsed.content === 'string'
          ? parsed.content
          : '개념을 함께 점검해 볼까요?',
      dialogueCategory: parsed.dialogueCategory || '개념 설명',
      pedagogicalStrategy: parsed.pedagogicalStrategy || '소크라테스식 문답법',
      referencedSources: Array.isArray(parsed.referencedSources)
        ? parsed.referencedSources
        : [explanation.explanationId],
      suggestedReplies: Array.isArray(parsed.suggestedReplies)
        ? parsed.suggestedReplies
        : [],
      readyForVerification: Boolean(parsed.readyForVerification),
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : '서버 내부 오류가 발생했습니다.',
    });
  }
}

