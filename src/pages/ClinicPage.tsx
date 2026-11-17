/**
 * @file src/pages/ClinicPage.tsx
 * @description [Section 6C, 6D, 6E, 6F & Section 7] 선지로그의 핵심 화면인 '선지 클리닉' 페이지입니다.
 *
 * [화면 구성]
 * - 데스크톱 기준 좌측: 학습 자료 영역 (문항·제시문·선택 선지 강조·원본 해설 토글·RAG 출처 + 심화 학습 탭: 핵심 개념 카드 / 사상가 비교 / AI 사상가 역할극)
 * - 데스크톱 기준 우측: AI 튜터 영역 (STEP 2 학습 이유 선택 → STEP 3·4 AI 튜터 소크라테스식 문답 → STEP 5 유사 선지 이해도 검증 → STEP 6 개인별 선지로그 생성·수정·저장)
 */

import { useState, useEffect, useRef } from 'react';
import type {
  ChatMessage,
  LearningLog,
  LearningReasonType,
  PageTab,
  UnderstandingStatus,
  VerificationAttempt,
} from '../types';
import { retrieveLearningContext, getConceptById } from '../retrieval/ragEngine';
import { recommendRelatedOptions } from '../recommendation/optionRecommender';
import { LEARNING_REASON_OPTIONS } from '../tutor/prompts';
import {
  createInitialTutorMessage,
  evaluateUnderstandingMock,
  generateLearningLogDraftMock,
} from '../tutor/mockTutorEngine';
import { requestTutorResponse } from '../services/tutorApi';
import { ConceptDetailCard } from '../components/ConceptDetailModal';
import { PhilosopherComparisonCard } from '../components/PhilosopherComparisonCard';
import { RoleplayPanel } from '../components/RoleplayPanel';
import { StatusBadge, DemoBadge } from '../components/StatusBadge';
import {
  SparklesIcon,
  BookOpenIcon,
  EyeIcon,
  SendIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ScaleIcon,
  MessageSquareIcon,
  FileTextIcon,
  RefreshIcon,
} from '../components/Icons';

interface ClinicPageProps {
  optionId: string;
  aiMode: 'mock' | 'api';
  onSelectOption: (optionId: string) => void;
  onSaveLog: (log: LearningLog) => void;
  onChangeTab: (tab: PageTab) => void;
}

type RightPanelStage = 'chat' | 'verify' | 'log';
type LeftDeepTab = 'none' | 'concept_card' | 'comparison' | 'roleplay';

export function ClinicPage({
  optionId,
  aiMode,
  onSelectOption,
  onSaveLog,
  onChangeTab,
}: ClinicPageProps) {
  const ctx =
    retrieveLearningContext(optionId) ??
    retrieveLearningContext('q2025_09_07_opt1')!;

  const { question, selectedOption, explanation, relatedConcepts, philosopherProfiles } =
    ctx;

  // 좌측 영역 상태
  const [showOriginalExplanation, setShowOriginalExplanation] = useState(false);
  const [leftDeepTab, setLeftDeepTab] = useState<LeftDeepTab>('concept_card');
  const [selectedConceptForCard, setSelectedConceptForCard] = useState<string>(
    relatedConcepts[0]?.conceptId ?? 'concept_rawls_difference'
  );

  // 우측 학습 플로우 단계 상태 (STEP 2~4 대화 -> STEP 5 검증 -> STEP 6 로그)
  const [rightStage, setRightStage] = useState<RightPanelStage>('chat');
  const [learningReason, setLearningReason] =
    useState<LearningReasonType>('wrong_option');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createInitialTutorMessage(ctx, 'wrong_option'),
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // STEP 5. 유사 선지 이해도 검증 상태
  const recommendedOptions = recommendRelatedOptions({
    currentOptionId: selectedOption.optionId,
    limit: 3,
  });
  const [verifyOptionId, setVerifyOptionId] = useState<string>(
    recommendedOptions[0]?.option.optionId ?? ''
  );
  const [verifyJudgment, setVerifyJudgment] = useState<boolean | null>(null);
  const [verifyReasoning, setVerifyReasoning] = useState<string>('');
  const [verificationResult, setVerificationResult] =
    useState<VerificationAttempt | undefined>(undefined);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // STEP 6. 학습로그 초안 및 직접 수정 상태
  const [logDraft, setLogDraft] = useState<LearningLog | null>(null);
  const [logSavedSuccess, setLogSavedSuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // STEP 2. 학습 이유 변경 시 첫 질문 업데이트
  const handleSelectReason = (reason: LearningReasonType) => {
    setLearningReason(reason);
    setMessages([createInitialTutorMessage(ctx, reason)]);
    setApiNotice(null);
  };

  // STEP 3 & 4. 학습자 메시지 전송
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? userInput).trim();
    if (!content || isLoading) return;

    const studentMsg: ChatMessage = {
      id: `msg_stu_${Date.now()}`,
      sender: 'student',
      content,
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const nextHistory = [...messages, studentMsg];
    setMessages(nextHistory);
    if (!textToSend) {
      setUserInput('');
    }
    setIsLoading(true);
    setApiNotice(null);

    try {
      const res = await requestTutorResponse({
        mode: aiMode,
        ctx,
        learningReason,
        userMessage: content,
        history: messages,
      });

      setMessages((prev) => [...prev, res.message]);
      if (res.fallbackNotice) {
        setApiNotice(res.fallbackNotice);
      }
      if (res.message.comparisonCardTrigger) {
        setLeftDeepTab('comparison');
      } else if (res.message.conceptCardTriggerId) {
        setSelectedConceptForCard(res.message.conceptCardTriggerId);
        setLeftDeepTab('concept_card');
      }
    } catch (err) {
      setApiNotice(
        err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 5. 이해도 검증 실행
  const handleRunVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyJudgment === null) {
      setVerifyError('선지가 옳은지(O) 틀린지(X) 먼저 선택해 주세요.');
      return;
    }
    if (!verifyReasoning.trim()) {
      setVerifyError('그렇게 판단한 이유를 간략히 입력해 주세요.');
      return;
    }
    setVerifyError(null);

    const evaluated = evaluateUnderstandingMock({
      targetOptionId: verifyOptionId,
      userJudgment: verifyJudgment,
      userReasoning: verifyReasoning,
    });
    setVerificationResult(evaluated);
  };

  // STEP 6. 학습로그 초안 생성 및 이동
  const handleOpenLogStage = () => {
    const draft = generateLearningLogDraftMock({
      ctx,
      learningReason,
      messages,
      verification: verificationResult,
    });
    setLogDraft(draft);
    setLogSavedSuccess(false);
    setRightStage('log');
  };

  // STEP 6. 학습로그 최종 저장
  const handleSaveLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDraft) return;
    onSaveLog(logDraft);
    setLogSavedSuccess(true);
  };

  const activeConceptObj =
    getConceptById(selectedConceptForCard) ?? relatedConcepts[0];

  const activeVerifyTarget =
    recommendedOptions.find((r) => r.option.optionId === verifyOptionId) ??
    recommendedOptions[0];

  const latestTutorMsg = [...messages]
    .reverse()
    .find((m) => m.sender === 'tutor');

  return (
    <div className="clinic-page-wrapper">
      {/* 상단 STEP 1 ~ STEP 6 통합 학습 흐름 진행 바 */}
      <div className="clinic-stepper-bar">
        <div className="stepper-steps">
          <button
            type="button"
            className="step-item completed"
            onClick={() => onChangeTab('search')}
          >
            <span className="step-num">STEP 1</span>
            <span className="step-name">복습 선지 선택</span>
          </button>
          <span className="step-divider">→</span>
          <button
            type="button"
            className={`step-item ${rightStage === 'chat' ? 'active' : 'completed'}`}
            onClick={() => setRightStage('chat')}
          >
            <span className="step-num">STEP 2·3·4</span>
            <span className="step-name">이유 선택 · AI 오개념 교정 · 심화</span>
          </button>
          <span className="step-divider">→</span>
          <button
            type="button"
            className={`step-item ${
              rightStage === 'verify'
                ? 'active'
                : verificationResult
                ? 'completed'
                : ''
            }`}
            onClick={() => setRightStage('verify')}
          >
            <span className="step-num">STEP 5</span>
            <span className="step-name">유사 선지 이해도 검증</span>
          </button>
          <span className="step-divider">→</span>
          <button
            type="button"
            className={`step-item ${
              rightStage === 'log' ? 'active' : logSavedSuccess ? 'completed' : ''
            }`}
            onClick={handleOpenLogStage}
          >
            <span className="step-num">STEP 6</span>
            <span className="step-name">나의 선지로그 생성·저장</span>
          </button>
        </div>

        <div className="stepper-mode-indicator">
          <span className={`mode-dot ${aiMode === 'mock' ? 'dot-mock' : 'dot-api'}`} />
          <span>
            {aiMode === 'mock'
              ? 'Mock 시나리오 데모 모드 작동 중'
              : 'GPT API (/api/tutor) 모드'}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 메인 2단 레이아웃: 좌측 학습 자료 & 심화 카드 / 우측 AI 튜터 & 검증·로그 */}
      {/* ===================================================================== */}
      <div className="clinic-two-col-layout">
        {/* ==================== 좌측: 학습 자료 영역 ==================== */}
        <div className="clinic-left-column">
          <div className="clinic-material-card">
            {/* 문항 메타 정보 */}
            <div className="material-header-row">
              <div className="material-badges">
                <span className="chip-subject">
                  {question.subjectName} · {question.unit}
                </span>
                <span className="chip-exam">
                  {question.academicYear}학년도 {question.examType}{' '}
                  {question.questionNumber}번
                </span>
                <DemoBadge label="데모용 자체 제작 문항" />
              </div>
            </div>

            <h2 className="material-question-title">{question.questionText}</h2>

            {/* 제시문 */}
            <div className="material-passage-box">
              <div className="passage-box-title">제시문</div>
              <p className="passage-box-content">{question.passage}</p>
            </div>

            {/* 선택한 선지 강조 표시 & 동일 문항 내 다른 선지 전환 */}
            <div className="material-options-box">
              <div className="material-options-header">
                <span>문항 선지 목록 (현재 복습 중인 선지 강조 표시)</span>
                <span className="small-muted">다른 선지를 클릭하면 전환됩니다</span>
              </div>
              <div className="material-options-list">
                {question.options.map((opt) => {
                  const isCurrent = opt.optionId === selectedOption.optionId;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      className={`material-option-row ${
                        isCurrent ? 'selected-option-highlight' : ''
                      }`}
                      onClick={() => onSelectOption(opt.optionId)}
                    >
                      <span className="opt-num-badge">{opt.optionNumber}</span>
                      <span className="opt-text-span">{opt.text}</span>
                      {isCurrent && (
                        <span className="current-focus-pill">현재 학습 선지</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 관련 사상가 & 관련 핵심 개념 태그 & 원본 해설 확인 버튼 */}
            <div className="material-tags-and-actions">
              <div className="material-tags-group">
                <span className="meta-label">관련 사상가:</span>
                {philosopherProfiles.map((p) => (
                  <span key={p.philosopherId} className="chip-philosopher">
                    {p.nameKo} ({p.nameEn})
                  </span>
                ))}
                <span className="meta-label ml-2">핵심 개념 태그:</span>
                {relatedConcepts.map((c) => (
                  <button
                    key={c.conceptId}
                    type="button"
                    className="chip-concept-interactive"
                    onClick={() => {
                      setSelectedConceptForCard(c.conceptId);
                      setLeftDeepTab('concept_card');
                    }}
                  >
                    <BookOpenIcon size={13} />
                    <span>{c.conceptName}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={`btn-explanation-toggle ${
                  showOriginalExplanation ? 'active' : ''
                }`}
                onClick={() =>
                  setShowOriginalExplanation((prev) => !prev)
                }
              >
                <EyeIcon size={15} />
                <span>
                  {showOriginalExplanation ? '원본 해설 접기' : '원본 해설 즉시 확인'}
                </span>
              </button>
            </div>

            {/* 원본 해설 확인 박스 (학습자가 원할 때 언제든 즉시 열람 가능) */}
            {showOriginalExplanation && (
              <div className="original-explanation-drawer">
                <div className="exp-drawer-header">
                  <strong>
                    [원본 해설 및 정오답] 선지 {selectedOption.optionNumber}번은{' '}
                    <span
                      className={
                        explanation.correctJudgment ? 'text-success' : 'text-danger'
                      }
                    >
                      {explanation.correctJudgment
                        ? '옳은 선지 (O)'
                        : '틀린 선지 (X)'}
                    </span>{' '}
                    입니다.
                  </strong>
                  <span className="exp-id-tag">ID: {explanation.explanationId}</span>
                </div>
                <p className="exp-body">{explanation.explanation}</p>
                <div className="exp-evidence">
                  <strong>핵심 판단 근거:</strong> {explanation.keyEvidence}
                </div>
                <div className="exp-misconceptions">
                  <strong>자주 발생하는 오개념:</strong>{' '}
                  {explanation.commonMisconceptions.join(' / ')}
                </div>
                <div className="exp-source-line">
                  출처: {explanation.sourceTitle} ({explanation.sourcePage}) [데모용 자체 제작]
                </div>
              </div>
            )}

            {/* 참고 자료 및 출처 (RAG 파이프라인 검색 현황) */}
            <div className="rag-sources-box">
              <div className="rag-box-title">
                <span>검색 기반 AI 생성(RAG) 연결 데이터 및 출처</span>
              </div>
              <div className="rag-id-chips">
                <span className="rag-chip">문항: {question.questionId}</span>
                <span className="rag-chip">선지: {selectedOption.optionId}</span>
                <span className="rag-chip">해설: {explanation.explanationId}</span>
                {relatedConcepts.map((c) => (
                  <span key={c.conceptId} className="rag-chip">
                    개념: {c.conceptId}
                  </span>
                ))}
              </div>
              <div className="rag-source-text">
                참고 자료: {explanation.sourceTitle} ({explanation.sourcePage}) ·{' '}
                {relatedConcepts.map((c) => c.source).join(' / ')}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Section 6D. 개념 연결 및 심화 학습 탭 영역 (좌측 하단 통합 배치) */}
          {/* ============================================================== */}
          <div className="deep-learning-section-card">
            <div className="deep-tabs-header">
              <span className="deep-section-label">개념 연결 및 심화 학습</span>
              <div className="deep-tab-buttons">
                <button
                  type="button"
                  className={`deep-tab-btn ${
                    leftDeepTab === 'concept_card' ? 'active' : ''
                  }`}
                  onClick={() => setLeftDeepTab('concept_card')}
                >
                  <BookOpenIcon size={15} />
                  <span>1. 핵심 개념 카드</span>
                </button>
                <button
                  type="button"
                  className={`deep-tab-btn ${
                    leftDeepTab === 'comparison' ? 'active' : ''
                  }`}
                  onClick={() => setLeftDeepTab('comparison')}
                >
                  <ScaleIcon size={15} />
                  <span>2·3. 사상가 비교 & 사례 적용</span>
                </button>
                <button
                  type="button"
                  className={`deep-tab-btn ${
                    leftDeepTab === 'roleplay' ? 'active' : ''
                  }`}
                  onClick={() => setLeftDeepTab('roleplay')}
                >
                  <MessageSquareIcon size={15} />
                  <span>4. AI 사상가와 대화 (선택 심화)</span>
                </button>
              </div>
            </div>

            <div className="deep-tab-body">
              {leftDeepTab === 'concept_card' && activeConceptObj && (
                <ConceptDetailCard
                  concept={activeConceptObj}
                  onSelectConcept={(cid) => setSelectedConceptForCard(cid)}
                  onStartClinicWithOption={(oid) => onSelectOption(oid)}
                />
              )}
              {leftDeepTab === 'comparison' && <PhilosopherComparisonCard />}
              {leftDeepTab === 'roleplay' && <RoleplayPanel />}
            </div>
          </div>
        </div>

        {/* ==================== 우측: AI 튜터 & 검증·로그 영역 ==================== */}
        <div className="clinic-right-column">
          {/* 우측 상단 탭 전환: [1:1 AI 튜터 대화] / [이해도 검증] / [선지로그 저장] */}
          <div className="right-stage-tabs">
            <button
              type="button"
              className={`stage-tab-btn ${rightStage === 'chat' ? 'active' : ''}`}
              onClick={() => setRightStage('chat')}
            >
              <SparklesIcon size={16} />
              <span>STEP 2~4. AI 튜터 대화</span>
            </button>
            <button
              type="button"
              className={`stage-tab-btn ${rightStage === 'verify' ? 'active' : ''}`}
              onClick={() => setRightStage('verify')}
            >
              <CheckCircleIcon size={16} />
              <span>STEP 5. 개념 이해도 검증</span>
              {verificationResult && (
                <StatusBadge status={verificationResult.status} size="sm" />
              )}
            </button>
            <button
              type="button"
              className={`stage-tab-btn ${rightStage === 'log' ? 'active' : ''}`}
              onClick={handleOpenLogStage}
            >
              <FileTextIcon size={16} />
              <span>STEP 6. 선지로그 저장</span>
            </button>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* STAGE A: STEP 2 ~ 4. AI 튜터와의 개별화 소크라테스식 대화        */}
          {/* --------------------------------------------------------------- */}
          {rightStage === 'chat' && (
            <div className="tutor-chat-panel">
              {/* STEP 2. 학습 시작 이유 4가지 선택 */}
              <div className="reason-selector-box">
                <div className="reason-box-header">
                  <span className="reason-step-tag">STEP 2. 학습 이유 선택</span>
                  <span className="reason-subhint">
                    선택한 이유에 따라 AI 튜터의 첫 진단 질문이 달라집니다
                  </span>
                </div>
                <div className="reason-buttons-grid">
                  {LEARNING_REASON_OPTIONS.map((item) => {
                    const isSelected = learningReason === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`reason-option-btn ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectReason(item.id)}
                      >
                        <span className="reason-btn-label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {apiNotice && (
                <div className="api-fallback-banner">
                  <AlertCircleIcon size={16} />
                  <span>{apiNotice}</span>
                </div>
              )}

              {/* 대화 메시지 영역 */}
              <div className="chat-messages-Viewport">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble-row ${
                      msg.sender === 'student' ? 'row-student' : 'row-tutor'
                    }`}
                  >
                    {msg.sender === 'tutor' && (
                      <div className="tutor-avatar" title="선지로그 AI 튜터">
                        <SparklesIcon size={16} />
                      </div>
                    )}

                    <div
                      className={`chat-bubble ${
                        msg.sender === 'student'
                          ? 'bubble-student'
                          : 'bubble-tutor'
                      }`}
                    >
                      {msg.sender === 'tutor' && (
                        <div className="bubble-meta-top">
                          <span className="tutor-name-label">선지로그 AI 튜터</span>
                          {msg.dialogueCategory && (
                            <span className="badge-dialogue-cat">
                              {msg.dialogueCategory}
                            </span>
                          )}
                          {msg.pedagogicalStrategy && (
                            <span className="badge-strategy">
                              {msg.pedagogicalStrategy}
                            </span>
                          )}
                          <span className="bubble-time">{msg.timestamp}</span>
                        </div>
                      )}

                      <div className="bubble-text">
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>

                      {msg.sender === 'tutor' &&
                        msg.referencedSources &&
                        msg.referencedSources.length > 0 && (
                          <div className="bubble-rag-footer">
                            근거 데이터: {msg.referencedSources.join(', ')}
                          </div>
                        )}

                      {/* 인라인 학습 도구 연결 버튼 */}
                      {msg.sender === 'tutor' && msg.readyForVerification && (
                        <div className="bubble-action-cta">
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={() => setRightStage('verify')}
                          >
                            <span>STEP 5. 다른 기출 선지로 이해도 검증하기</span>
                            <ArrowRightIcon size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={handleOpenLogStage}
                          >
                            <span>STEP 6. 선지로그 바로 생성하기</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="chat-bubble-row row-tutor">
                    <div className="tutor-avatar">
                      <SparklesIcon size={16} />
                    </div>
                    <div className="chat-bubble bubble-tutor loading-bubble">
                      AI 튜터가 검증된 개념 자료(RAG)를 바탕으로 질문을 구성하고 있습니다...
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* 스캐폴딩 & 시나리오 체험용 추천 응답 칩 */}
              {latestTutorMsg?.suggestedReplies &&
                latestTutorMsg.suggestedReplies.length > 0 && (
                  <div className="suggested-replies-bar">
                    <div className="suggested-replies-label">
                      💡 <strong>생각 예시 클릭 (또는 아래 입력창에 자유롭게 작성):</strong>
                    </div>
                    <div className="suggested-chips-wrap">
                      {latestTutorMsg.suggestedReplies.map((replyText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="chip-suggested-reply"
                          disabled={isLoading}
                          onClick={() => handleSendMessage(replyText)}
                        >
                          "{replyText}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* 학습자 자유 입력 폼 */}
              <form
                className="chat-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  type="text"
                  className="chat-text-input"
                  placeholder="나의 생각이나 헷갈리는 부분을 자유롭게 설명해 보세요..."
                  value={userInput}
                  disabled={isLoading}
                  onChange={(e) => setUserInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading || !userInput.trim()}
                >
                  <SendIcon size={16} />
                  <span>전송</span>
                </button>
              </form>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* STAGE B: STEP 5. 유사 기출 선지를 통한 개념 적용 및 이해도 검증 */}
          {/* --------------------------------------------------------------- */}
          {rightStage === 'verify' && (
            <div className="verification-panel">
              <div className="verify-header-box">
                <div className="verify-badge-row">
                  <span className="step-pill">STEP 5. 학습 전이 및 형성평가</span>
                  <span className="engine-tag">
                    추천 엔진: TypeScript 개념·사상가 태그 매칭 (MVP)
                  </span>
                </div>
                <h3>다른 기출 선지에 개념 적용하기</h3>
                <p>
                  현재 학습한 선지와 동일한 선지를 제외하고, 같은 핵심 개념(
                  <strong>{relatedConcepts.map((c) => c.conceptName).join(', ')}</strong>
                  )을 다른 표현으로 다루는 선지를 추천했습니다.
                </p>
              </div>

              {/* 추천된 유사 선지 선택 카드 */}
              <div className="recommended-options-selector">
                <div className="section-label">
                  추천된 검증용 기출 선지 선택 ({recommendedOptions.length}건)
                </div>
                {recommendedOptions.map((rec, idx) => {
                  const isSelected = rec.option.optionId === verifyOptionId;
                  return (
                    <div
                      key={rec.option.optionId}
                      className={`verify-option-card ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => {
                        setVerifyOptionId(rec.option.optionId);
                        setVerifyJudgment(null);
                        setVerifyReasoning('');
                        setVerificationResult(undefined);
                        setVerifyError(null);
                      }}
                    >
                      <div className="verify-card-top">
                        <span className="verify-q-source">
                          추천 #{idx + 1} · {rec.question.academicYear}{' '}
                          {rec.question.examType} {rec.question.questionNumber}번 (선지{' '}
                          {rec.option.optionNumber}) [데모]
                        </span>
                        <span className="similarity-badge">
                          개념 유사도 {Math.round(rec.similarityScore * 100)}%
                        </span>
                      </div>
                      <p className="verify-option-text">"{rec.option.text}"</p>
                      <div className="verify-reason-caption">
                        추천 근거: {rec.recommendReason}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 선택된 검증 선지에 대한 O/X 판단 및 이유 입력 폼 */}
              {activeVerifyTarget && (
                <form
                  className="verify-evaluation-form"
                  onSubmit={handleRunVerification}
                >
                  <div className="verify-target-highlight">
                    <div className="section-label">현재 검증 대상 선지</div>
                    <p className="target-quote">
                      "{activeVerifyTarget.option.text}"
                    </p>
                  </div>

                  {/* 1. O/X 판단 선택 */}
                  <div className="verify-field-group">
                    <label className="verify-field-label">
                      1. 이 선지는 옳은 선지인가요, 틀린 선지인가요?
                    </label>
                    <div className="ox-button-group">
                      <button
                        type="button"
                        className={`ox-btn ox-true ${
                          verifyJudgment === true ? 'selected' : ''
                        }`}
                        onClick={() => setVerifyJudgment(true)}
                      >
                        ⭕ 옳은 선지예요 (O)
                      </button>
                      <button
                        type="button"
                        className={`ox-btn ox-false ${
                          verifyJudgment === false ? 'selected' : ''
                        }`}
                        onClick={() => setVerifyJudgment(false)}
                      >
                        ❌ 틀린 선지예요 (X)
                      </button>
                    </div>
                  </div>

                  {/* 2. 판단 이유 서술 + 빠른 시연용 예시 채우기 버튼 */}
                  <div className="verify-field-group">
                    <div className="verify-label-with-quickfill">
                      <label className="verify-field-label">
                        2. 그렇게 판단한 이유를 핵심 개념을 포함해 간략히 설명해 주세요.
                      </label>
                      <button
                        type="button"
                        className="btn-quickfill"
                        onClick={() => {
                          setVerifyJudgment(
                            activeVerifyTarget.explanation.correctJudgment
                          );
                          setVerifyReasoning(
                            activeVerifyTarget.explanation.keyEvidence
                          );
                        }}
                      >
                        ✨ 모범 자기설명 예시 자동입력 (시연용)
                      </button>
                    </div>
                    <textarea
                      className="textarea-input"
                      rows={3}
                      placeholder="예: 롤스의 차등의 원칙에 따르면 다른 정의의 원칙이 충족된 상태에서 최소 수혜자에게 최대 이익이 보장된다면 사회적·경제적 불평등이 정당화될 수 있기 때문입니다."
                      value={verifyReasoning}
                      onChange={(e) => setVerifyReasoning(e.target.value)}
                    />
                  </div>

                  {verifyError && (
                    <div className="form-error-msg">{verifyError}</div>
                  )}

                  <button type="submit" className="btn-primary btn-full">
                    <CheckCircleIcon size={17} />
                    <span>AI 개념 이해도 타당성 검증받기</span>
                  </button>
                </form>
              )}

              {/* 검증 결과 리포트 카드 (4대 평가 기준) */}
              {verificationResult && (
                <div className="verification-result-card">
                  <div className="result-header-row">
                    <div>
                      <span className="section-label">이해도 검증 결과</span>
                      <h4>AI 형성평가 및 개념 전이 분석 리포트</h4>
                    </div>
                    <StatusBadge status={verificationResult.status} />
                  </div>

                  <p className="result-overall-feedback">
                    {verificationResult.overallFeedback}
                  </p>

                  <div className="criteria-checklist-grid">
                    <div
                      className={`criteria-item ${
                        verificationResult.criteriaEvaluation.accurateConcept
                          .passed
                          ? 'passed'
                          : 'needs-review'
                      }`}
                    >
                      <strong>
                        {verificationResult.criteriaEvaluation.accurateConcept
                          .passed
                          ? '✓'
                          : '!'}{' '}
                        1. 핵심 개념 정확성
                      </strong>
                      <p>
                        {
                          verificationResult.criteriaEvaluation.accurateConcept
                            .comment
                        }
                      </p>
                    </div>

                    <div
                      className={`criteria-item ${
                        verificationResult.criteriaEvaluation
                          .noPhilosopherConfusion.passed
                          ? 'passed'
                          : 'needs-review'
                      }`}
                    >
                      <strong>
                        {verificationResult.criteriaEvaluation
                          .noPhilosopherConfusion.passed
                          ? '✓'
                          : '!'}{' '}
                        2. 사상가 입장 비혼동
                      </strong>
                      <p>
                        {
                          verificationResult.criteriaEvaluation
                            .noPhilosopherConfusion.comment
                        }
                      </p>
                    </div>

                    <div
                      className={`criteria-item ${
                        verificationResult.criteriaEvaluation
                          .considersConditions.passed
                          ? 'passed'
                          : 'needs-review'
                      }`}
                    >
                      <strong>
                        {verificationResult.criteriaEvaluation
                          .considersConditions.passed
                          ? '✓'
                          : '!'}{' '}
                        3. 필수 조건 및 전제 고려
                      </strong>
                      <p>
                        {
                          verificationResult.criteriaEvaluation
                            .considersConditions.comment
                        }
                      </p>
                    </div>

                    <div
                      className={`criteria-item ${
                        verificationResult.criteriaEvaluation.appliesToNewCase
                          .passed
                          ? 'passed'
                          : 'needs-review'
                      }`}
                    >
                      <strong>
                        {verificationResult.criteriaEvaluation.appliesToNewCase
                          .passed
                          ? '✓'
                          : '!'}{' '}
                        4. 새로운 사례·선지 적용력
                      </strong>
                      <p>
                        {
                          verificationResult.criteriaEvaluation.appliesToNewCase
                            .comment
                        }
                      </p>
                    </div>
                  </div>

                  <div className="result-next-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleOpenLogStage}
                    >
                      <span>STEP 6. 개인별 개념 학습로그 생성 및 저장하기</span>
                      <ArrowRightIcon size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* STAGE C: STEP 6. 개인별 개념 학습로그 자동 생성·수정·저장       */}
          {/* --------------------------------------------------------------- */}
          {rightStage === 'log' && logDraft && (
            <div className="log-editor-panel">
              <div className="log-editor-header">
                <div>
                  <span className="step-pill">STEP 6. 개인화 개념 학습노트 완성</span>
                  <h3>나의 선지로그 검토 및 저장</h3>
                  <p>
                    AI가 오늘 나눈 대화와 이해도 검증 결과를 바탕으로 작성한 학습로그 초안입니다. 내용을 자유롭게 수정한 후 저장하세요.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleOpenLogStage}
                >
                  <RefreshIcon size={14} />
                  <span>초안 다시 생성</span>
                </button>
              </div>

              {logSavedSuccess && (
                <div className="log-saved-banner">
                  <div>
                    <strong>✓ '나의 선지로그'와 '나의 개념 지도'에 성공적으로 저장되었습니다!</strong>
                    <p>저장된 기록은 사상가별·개념별로 자동 분류되어 언제든 복습할 수 있습니다.</p>
                  </div>
                  <div className="saved-banner-actions">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onChangeTab('logs')}
                    >
                      나의 선지로그 보러가기 →
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => onChangeTab('map')}
                    >
                      개념 지도 확인하기 →
                    </button>
                  </div>
                </div>
              )}

              <form className="log-form" onSubmit={handleSaveLogSubmit}>
                {/* 1~5. 메타 정보 요약 */}
                <div className="log-meta-summary-box">
                  <div className="meta-row-item">
                    <strong>과목 및 단원:</strong> {logDraft.subjectName} &gt;{' '}
                    {logDraft.unit}
                  </div>
                  <div className="meta-row-item">
                    <strong>관련 사상가:</strong>{' '}
                    {logDraft.philosopherNames.join(', ')}
                  </div>
                  <div className="meta-row-item">
                    <strong>핵심 개념:</strong> {logDraft.conceptNames.join(', ')}
                  </div>
                  <div className="meta-row-item">
                    <strong>학습한 기출 선지:</strong> [{logDraft.questionInfo}]{' '}
                    "{logDraft.optionText}"
                  </div>
                  <div className="meta-row-item">
                    <strong>최초 학습 이유:</strong> {logDraft.learningReasonLabel}
                  </div>
                </div>

                {/* 학습 이해도 상태 직접 조정 가능 */}
                <div className="log-field">
                  <label>개념 이해도 상태</label>
                  <select
                    className="select-input"
                    value={logDraft.understandingStatus}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        understandingStatus: e.target
                          .value as Exclude<UnderstandingStatus, '미학습'>,
                      })
                    }
                  >
                    <option value="이해 확인">이해 확인</option>
                    <option value="부분 이해">부분 이해</option>
                    <option value="추가 학습 필요">추가 학습 필요</option>
                    <option value="검증 전">검증 전</option>
                  </select>
                </div>

                {/* 6. 기존의 나의 이해 */}
                <div className="log-field">
                  <label>기존의 나의 이해</label>
                  <textarea
                    className="textarea-input"
                    rows={2}
                    value={logDraft.initialUnderstanding}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        initialUnderstanding: e.target.value,
                      })
                    }
                  />
                </div>

                {/* 7. 학습 과정에서 발견한 오개념 */}
                <div className="log-field">
                  <label>학습 과정에서 발견한 오개념</label>
                  <textarea
                    className="textarea-input"
                    rows={2}
                    value={logDraft.discoveredMisconception}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        discoveredMisconception: e.target.value,
                      })
                    }
                  />
                </div>

                {/* 8. 새롭게 이해한 개념 (자기설명) */}
                <div className="log-field">
                  <label>새롭게 이해한 개념 (나의 언어로 정리)</label>
                  <textarea
                    className="textarea-input"
                    rows={3}
                    value={logDraft.newlyUnderstoodConcept}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        newlyUnderstoodConcept: e.target.value,
                      })
                    }
                  />
                </div>

                {/* 9. AI 피드백 요약 */}
                <div className="log-field">
                  <label>AI 피드백 요약</label>
                  <textarea
                    className="textarea-input"
                    rows={2}
                    value={logDraft.aiFeedbackSummary}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        aiFeedbackSummary: e.target.value,
                      })
                    }
                  />
                </div>

                {/* 10. 관련 사상가 및 개념 비교 */}
                <div className="log-field">
                  <label>관련 사상가 및 개념 비교 노트</label>
                  <textarea
                    className="textarea-input"
                    rows={2}
                    value={logDraft.philosopherComparisonNote}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        philosopherComparisonNote: e.target.value,
                      })
                    }
                  />
                </div>

                {/* 12. 추가 학습이 필요한 부분 */}
                <div className="log-field">
                  <label>추가 학습이 필요한 부분</label>
                  <textarea
                    className="textarea-input"
                    rows={2}
                    value={logDraft.furtherStudyNeeded}
                    onChange={(e) =>
                      setLogDraft({
                        ...logDraft,
                        furtherStudyNeeded: e.target.value,
                      })
                    }
                  />
                </div>

                {/* 11, 13, 14. 검증 결과 및 출처 요약 */}
                <div className="log-sources-readonly">
                  <div>
                    <strong>유사 선지 검증 결과:</strong>{' '}
                    {logDraft.verificationResult
                      ? `[${logDraft.verificationResult.status}] "${logDraft.verificationResult.targetOptionText}"`
                      : '아직 STEP 5 검증을 수행하지 않음 (검증 탭에서 언제든 추가 가능)'}
                  </div>
                  <div>
                    <strong>참고 자료 및 출처:</strong>{' '}
                    {logDraft.sources.join(' | ')}
                  </div>
                </div>

                <button type="submit" className="btn-primary btn-full">
                  <CheckCircleIcon size={17} />
                  <span>나의 선지로그에 저장하기 (localStorage)</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
