/**
 * @file src/components/RoleplayPanel.tsx
 * @description [Section 6D-4] 선택적 심화 학습 기능인 'AI 사상가와 대화하기(역할극)' 및
 * '동일 사회적 상황에 대한 사상가 가상 토론' 컴포넌트입니다.
 */

import { useState } from 'react';
import type { PhilosopherId } from '../types';
import {
  ROLEPLAY_TOPICS,
  generatePhilosopherRoleplayReply,
} from '../tutor/roleplayEngine';
import { MessageSquareIcon, SendIcon, ShieldCheckIcon } from './Icons';

export function RoleplayPanel() {
  const [mode, setMode] = useState<'debate' | 'ask_rawls' | 'ask_nozick'>('debate');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    ROLEPLAY_TOPICS[0].topicId
  );
  const [customQuestion, setCustomQuestion] = useState('');
  const [roleplayLogs, setRoleplayLogs] = useState<
    Array<{
      id: string;
      philosopherId: PhilosopherId;
      question: string;
      answer: string;
      conceptIds: string[];
    }>
  >([]);

  const activeTopic =
    ROLEPLAY_TOPICS.find((t) => t.topicId === selectedTopicId) ??
    ROLEPLAY_TOPICS[0];

  const handleAskPhilosopher = (philosopherId: PhilosopherId, qText?: string) => {
    const query = (qText ?? customQuestion).trim();
    if (!query) return;

    const { reply, referencedConceptIds } = generatePhilosopherRoleplayReply(
      philosopherId,
      query
    );

    setRoleplayLogs((prev) => [
      {
        id: `rp_${Date.now()}`,
        philosopherId,
        question: query,
        answer: reply,
        conceptIds: referencedConceptIds,
      },
      ...prev,
    ]);

    if (!qText) {
      setCustomQuestion('');
    }
  };

  return (
    <div className="roleplay-panel-container">
      {/* 필수 안내 문구: 실제 사상가 발언 재현이 아닌 교육용 시뮬레이션 명시 */}
      <div className="simulation-disclaimer-banner">
        <ShieldCheckIcon size={18} />
        <div>
          <strong>[교육용 시뮬레이션 안내]</strong> 본 'AI 사상가와 대화하기'는 실제 역사적 사상가의 발언을 그대로 재현하는 것이 아니라, 제공된 검증 학습 자료(<code>concepts.json</code>)에 기반한 선택적 심화 교육 시뮬레이션입니다.
        </div>
      </div>

      {/* 모드 선택 탭 */}
      <div className="roleplay-mode-tabs">
        <button
          type="button"
          className={`subtab-btn ${mode === 'debate' ? 'active' : ''}`}
          onClick={() => setMode('debate')}
        >
          롤스 vs 노직 가상 토론 비교
        </button>
        <button
          type="button"
          className={`subtab-btn ${mode === 'ask_rawls' ? 'active' : ''}`}
          onClick={() => setMode('ask_rawls')}
        >
          롤스에게 질문하기
        </button>
        <button
          type="button"
          className={`subtab-btn ${mode === 'ask_nozick' ? 'active' : ''}`}
          onClick={() => setMode('ask_nozick')}
        >
          노직에게 질문하기
        </button>
      </div>

      {mode === 'debate' ? (
        <div className="debate-view">
          <div className="debate-topic-selector">
            <span className="section-label">토론 쟁점 선택:</span>
            <div className="topic-chips">
              {ROLEPLAY_TOPICS.map((t) => (
                <button
                  key={t.topicId}
                  type="button"
                  className={`chip-filter ${
                    selectedTopicId === t.topicId ? 'active' : ''
                  }`}
                  onClick={() => setSelectedTopicId(t.topicId)}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          <div className="debate-question-banner">
            <strong>공통 질문:</strong> "{activeTopic.questionForPhilosopher}"
          </div>

          <div className="debate-columns">
            <div className="debate-speech-card rawls-speech">
              <div className="speaker-badge rawls-badge">갑: 존 롤스 (공정으로서의 정의)</div>
              <p>{activeTopic.rawlsResponse}</p>
            </div>
            <div className="debate-speech-card nozick-speech">
              <div className="speaker-badge nozick-badge">을: 로버트 노직 (소유 권리론)</div>
              <p>{activeTopic.nozickResponse}</p>
            </div>
          </div>

          <div className="debate-takeaway-box">
            <strong>AI 튜터의 수능 비교 핵심 정리:</strong> {activeTopic.tutorTakeaway}
          </div>
        </div>
      ) : (
        <div className="ask-philosopher-view">
          <div className="philosopher-persona-banner">
            <MessageSquareIcon size={18} />
            <span>
              <strong>
                {mode === 'ask_rawls' ? '존 롤스 (John Rawls)' : '로버트 노직 (Robert Nozick)'}
              </strong>
              의 관점 시뮬레이터에게 궁금한 점을 질문해 보세요.
            </span>
          </div>

          <div className="quick-roleplay-questions">
            <span className="relation-label">추천 질문 클릭:</span>
            {mode === 'ask_rawls' ? (
              <>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() =>
                    handleAskPhilosopher(
                      'rawls',
                      '최소 수혜자를 위해서라면 기본적 자유를 조금 제한해도 되나요?'
                    )
                  }
                >
                  최소 수혜자를 위해 기본적 자유를 제한해도 되나요?
                </button>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() =>
                    handleAskPhilosopher(
                      'rawls',
                      '원초적 입장의 당사자들은 이타심 때문에 차등의 원칙에 합의하나요?'
                    )
                  }
                >
                  원초적 입장 당사자들은 이타심으로 합의하나요?
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() =>
                    handleAskPhilosopher(
                      'nozick',
                      '과거에 사기나 강탈로 빼앗은 재산에도 국가가 개입하면 안 되나요?'
                    )
                  }
                >
                  과거 사기·강탈 재산에도 국가 개입을 반대하시나요?
                </button>
                <button
                  type="button"
                  className="chip-suggestion"
                  onClick={() =>
                    handleAskPhilosopher(
                      'nozick',
                      '부유한 사람이 빈곤층에게 자발적으로 기부하는 것도 반대하시나요?'
                    )
                  }
                >
                  부유층의 자발적 기부도 반대하시나요?
                </button>
              </>
            )}
          </div>

          <form
            className="roleplay-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAskPhilosopher(mode === 'ask_rawls' ? 'rawls' : 'nozick');
            }}
          >
            <input
              type="text"
              className="input-text"
              placeholder={
                mode === 'ask_rawls'
                  ? '롤스에게 질문 입력 (예: 무지의 베일, 기본적 자유의 우선성 등)'
                  : '노직에게 질문 입력 (예: 교정의 원리, 자발적 기부, 최소국가 등)'
              }
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <SendIcon size={15} />
              <span>질문하기</span>
            </button>
          </form>

          <div className="roleplay-history-list">
            {roleplayLogs.length === 0 ? (
              <div className="empty-hint-box">
                위 추천 질문을 클릭하거나 직접 질문을 입력하면 사상가의 관점 시뮬레이션 답변과 참조 개념 ID가 표시됩니다.
              </div>
            ) : (
              roleplayLogs.map((item) => (
                <div key={item.id} className="roleplay-qa-card">
                  <div className="rp-q">
                    <strong>나의 질문 ({item.philosopherId === 'rawls' ? '롤스' : '노직'}에게):</strong> {item.question}
                  </div>
                  <div className="rp-a">{item.answer}</div>
                  <div className="rp-sources">
                    참조 개념 ID: {item.conceptIds.join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

