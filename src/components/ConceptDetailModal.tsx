/**
 * @file src/components/ConceptDetailModal.tsx
 * @description [Section 6D-1] 핵심 개념 카드 컴포넌트입니다.
 * 개념명, 핵심 정의, 관련 사상가, 반드시 알아야 할 조건, 자주 발생하는 오개념,
 * 관련 개념, 관련 기출 선지, 구체적 적용 사례를 한눈에 보여줍니다.
 */

import type { ConceptData } from '../types';
import { getConceptById, getOptionWithQuestion } from '../retrieval/ragEngine';
import {
  BookOpenIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LightbulbIcon,
  ArrowRightIcon,
  CloseIcon,
} from './Icons';
import { DemoBadge } from './StatusBadge';

interface ConceptDetailCardProps {
  concept: ConceptData;
  onSelectConcept?: (conceptId: string) => void;
  onStartClinicWithOption?: (optionId: string) => void;
  onClose?: () => void;
}

export function ConceptDetailCard({
  concept,
  onSelectConcept,
  onStartClinicWithOption,
  onClose,
}: ConceptDetailCardProps) {
  const relatedConcepts = concept.relatedConceptIds
    .map((id) => getConceptById(id))
    .filter((c): c is ConceptData => Boolean(c));

  const contrastingConcepts = concept.contrastingConceptIds
    .map((id) => getConceptById(id))
    .filter((c): c is ConceptData => Boolean(c));

  const linkedOptions = concept.relatedOptionIds
    .map((oid) => getOptionWithQuestion(oid))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="concept-detail-card">
      <div className="concept-card-header">
        <div>
          <div className="concept-meta-row">
            <span className="chip-subject">{concept.subjectName} · {concept.unit}</span>
            <span className="chip-philosopher">{concept.philosopherName}</span>
            {concept.isDemo && <DemoBadge label="데모 개념 데이터" />}
          </div>
          <h3 className="concept-title">
            <BookOpenIcon size={20} />
            <span>{concept.conceptName}</span>
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn-icon-close"
            onClick={onClose}
            aria-label="개념 카드 닫기"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      <div className="concept-definition-box">
        <div className="section-label">핵심 정의</div>
        <p>{concept.definition}</p>
      </div>

      <div className="concept-grid-two">
        <div className="concept-section-box condition-box">
          <div className="section-label-with-icon text-navy">
            <CheckCircleIcon size={16} />
            <span>반드시 알아야 할 조건 및 핵심 원리</span>
          </div>
          <ul className="concept-bullet-list">
            {concept.necessaryConditions.map((cond, i) => (
              <li key={i}>
                <strong>[필수 조건]</strong> {cond}
              </li>
            ))}
            {concept.keyPrinciples.map((prin, i) => (
              <li key={`p_${i}`}>{prin}</li>
            ))}
          </ul>
        </div>

        <div className="concept-section-box misconception-box">
          <div className="section-label-with-icon text-danger">
            <AlertCircleIcon size={16} />
            <span>자주 발생하는 오개념 (수능 함정)</span>
          </div>
          <ul className="concept-bullet-list">
            {concept.commonMisconceptions.map((mis, i) => (
              <li key={i}>{mis}</li>
            ))}
          </ul>
        </div>
      </div>

      {concept.examples.length > 0 && (
        <div className="concept-examples-section">
          <div className="section-label-with-icon">
            <LightbulbIcon size={16} />
            <span>상황 및 사례 적용</span>
          </div>
          <div className="examples-list">
            {concept.examples.map((ex, idx) => (
              <div key={idx} className="example-item-card">
                <div className="example-title">{ex.title}</div>
                <p className="example-situation">
                  <strong>상황:</strong> {ex.situation}
                </p>
                <p className="example-view">
                  <strong>{concept.philosopherName}의 판단:</strong> {ex.philosopherView}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="concept-relations-row">
        {relatedConcepts.length > 0 && (
          <div className="relation-group">
            <span className="relation-label">연계 개념:</span>
            <div className="relation-chips">
              {relatedConcepts.map((rc) => (
                <button
                  key={rc.conceptId}
                  type="button"
                  className="chip-link"
                  onClick={() => onSelectConcept?.(rc.conceptId)}
                >
                  {rc.philosopherName} · {rc.conceptName}
                </button>
              ))}
            </div>
          </div>
        )}
        {contrastingConcepts.length > 0 && (
          <div className="relation-group">
            <span className="relation-label">비교/대비 개념:</span>
            <div className="relation-chips">
              {contrastingConcepts.map((cc) => (
                <button
                  key={cc.conceptId}
                  type="button"
                  className="chip-link chip-contrast"
                  onClick={() => onSelectConcept?.(cc.conceptId)}
                >
                  vs {cc.philosopherName} · {cc.conceptName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {linkedOptions.length > 0 && (
        <div className="concept-linked-options">
          <div className="section-label">관련 기출 선지 ({linkedOptions.length}건)</div>
          <div className="linked-options-list">
            {linkedOptions.map(({ question, option }) => (
              <div key={option.optionId} className="linked-option-row">
                <div className="linked-option-text">
                  <span className="linked-q-badge">
                    {question.academicYear} {question.examType} {question.questionNumber}번 - 선지 {option.optionNumber}
                  </span>
                  <p>"{option.text}"</p>
                </div>
                {onStartClinicWithOption && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onStartClinicWithOption(option.optionId)}
                  >
                    <span>클리닉 학습</span>
                    <ArrowRightIcon size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="concept-source-footer">
        출처: {concept.source}
      </div>
    </div>
  );
}

