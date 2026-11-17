/**
 * @file src/services/tutorApi.ts
 * @description 프론트엔드에서 AI 튜터 응답을 요청하는 서비스 모듈입니다.
 *
 * [설계 원칙 - Section 13]
 * 1. OpenAI API 키는 프론트엔드(VITE_ 환경변수 등)에 절대 노출하지 않으며,
 *    실제 API 모드일 때는 오직 Vercel 서버 함수(/api/tutor)로만 요청을 보냅니다.
 * 2. 기본값인 Mock Mode에서는 API 키 없이도 로컬에서 전체 교육 시나리오를 즉시 체험할 수 있습니다.
 * 3. 중복 요청 방지(inFlightLock), 입력 길이 제한(500자), 네트워크 오류 시 안전한 Mock 폴백 안내를 지원합니다.
 */

import type {
  ChatMessage,
  LearningReasonType,
  RetrievedContext,
  DialogueCategory,
  PedagogicalStrategy,
} from '../types';
import { generateMockTutorReply } from '../tutor/mockTutorEngine';

const MAX_INPUT_LENGTH = 500;
let isRequestInFlight = false;

export interface TutorApiRequest {
  mode: 'mock' | 'api';
  ctx: RetrievedContext;
  learningReason: LearningReasonType;
  userMessage: string;
  history: ChatMessage[];
}

export interface TutorApiResponse {
  message: ChatMessage;
  usedMode: 'mock' | 'api';
  fallbackNotice?: string;
}

/** 서버에서 반환된 JSON 구조 검증 */
function validateStructuredServerResponse(data: unknown): {
  content: string;
  dialogueCategory: DialogueCategory;
  pedagogicalStrategy: PedagogicalStrategy;
  referencedSources: string[];
  suggestedReplies: string[];
  readyForVerification: boolean;
} | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.content !== 'string' || !obj.content.trim()) return null;

  return {
    content: obj.content,
    dialogueCategory:
      (obj.dialogueCategory as DialogueCategory) || '개념 설명',
    pedagogicalStrategy:
      (obj.pedagogicalStrategy as PedagogicalStrategy) || '소크라테스식 문답법',
    referencedSources: Array.isArray(obj.referencedSources)
      ? obj.referencedSources.map(String)
      : [],
    suggestedReplies: Array.isArray(obj.suggestedReplies)
      ? obj.suggestedReplies.map(String)
      : [],
    readyForVerification: Boolean(obj.readyForVerification),
  };
}

/**
 * AI 튜터에게 학습자 메시지를 전송하고 구조화된 응답을 받는 함수
 */
export async function requestTutorResponse(
  req: TutorApiRequest
): Promise<TutorApiResponse> {
  if (isRequestInFlight) {
    throw new Error('이전 요청을 처리 중입니다. 잠시만 기다려 주세요.');
  }

  const sanitizedInput = req.userMessage.trim().slice(0, MAX_INPUT_LENGTH);
  if (!sanitizedInput) {
    throw new Error('메시지를 입력해 주세요.');
  }

  isRequestInFlight = true;

  try {
    // 1. Mock 데모 모드인 경우 (API 키 불필요, 사전 검증된 교육 시나리오 작동)
    if (req.mode === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 420)); // 자연스러운 튜터 타이핑 체감 딜레이
      const reply = generateMockTutorReply(req.ctx, sanitizedInput, req.history);
      return {
        message: reply,
        usedMode: 'mock',
      };
    }

    // 2. GPT API 서버 함수(/api/tutor) 호출 모드
    const response = await fetch('/api/tutor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: req.ctx.question.questionId,
        optionId: req.ctx.selectedOption.optionId,
        learningReason: req.learningReason,
        userMessage: sanitizedInput,
        history: req.history.slice(-8).map((m) => ({
          role: m.sender === 'student' ? 'user' : 'assistant',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg =
        (errBody as { error?: string }).error ||
        `서버 응답 오류 (HTTP ${response.status})`;
      throw new Error(errMsg);
    }

    const rawJson: unknown = await response.json();
    const validated = validateStructuredServerResponse(rawJson);

    if (!validated) {
      throw new Error('AI 응답 형식이 유효하지 않습니다.');
    }

    return {
      message: {
        id: `msg_api_${Date.now()}`,
        sender: 'tutor',
        content: validated.content,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        dialogueCategory: validated.dialogueCategory,
        pedagogicalStrategy: validated.pedagogicalStrategy,
        referencedSources:
          validated.referencedSources.length > 0
            ? validated.referencedSources
            : [req.ctx.explanation.explanationId],
        suggestedReplies: validated.suggestedReplies,
        readyForVerification: validated.readyForVerification,
      },
      usedMode: 'api',
    };
  } catch (err) {
    // 서버 함수 미실행(로컬 vite 단독 실행) 또는 OPENAI_API_KEY 미설정 시 안전하게 Mock 시나리오로 폴백
    const fallbackReply = generateMockTutorReply(
      req.ctx,
      sanitizedInput,
      req.history
    );
    const reasonText =
      err instanceof Error ? err.message : 'API 연결을 확인할 수 없습니다.';

    return {
      message: fallbackReply,
      usedMode: 'mock',
      fallbackNotice: `[안내] 현재 서버에 OPENAI_API_KEY가 설정되지 않았거나 로컬 데모 환경(${reasonText})이므로, 검증된 Mock AI 시나리오 모드로 안전하게 응답했습니다.`,
    };
  } finally {
    isRequestInFlight = false;
  }
}

