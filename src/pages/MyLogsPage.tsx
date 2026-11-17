/**
 * @file src/pages/MyLogsPage.tsx
 * @description [Section 6F] '나의 선지로그' 화면입니다.
 * 문항 번호 나열식 오답노트가 아니라, 사상가와 핵심 개념을 중심으로 축적되는 개인화 개념 학습노트입니다.
 * 과목별·단원별·사상가별·개념별 필터링, 개념별 묶어보기, 학습자 직접 수정·저장·삭제 기능을 제공합니다.
 */

import { useState } from 'react';
import type {
  LearningLog,
  PhilosopherId,
  SubjectId,
  UnderstandingStatus,
} from '../types';
import { getAllConcepts, getAllSubjects } from '../retrieval/ragEngine';
import { StatusBadge, DemoBadge } from '../components/StatusBadge';
import {
  FileTextIcon,
  EditIcon,
  TrashIcon,
  ArrowRightIcon,
  RefreshIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CloseIcon,
} from '../components/Icons';

interface MyLogsPageProps {
  logs: LearningLog[];
  onUpdateLog: (updated: LearningLog) => void;
  onDeleteLog: (logId: string) => void;
  onResetDemoLogs: () => void;
  onStartClinicWithOption: (optionId: string) => void;
  initialConceptFilter?: string;
}

export function MyLogsPage({
  logs,
  onUpdateLog,
  onDeleteLog,
  onResetDemoLogs,
  onStartClinicWithOption,
  initialConceptFilter = 'all',
}: MyLogsPageProps) {
  const allSubjects = getAllSubjects();
  const allConcepts = getAllConcepts();

  // 필터 상태
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [philosopherFilter, setPhilosopherFilter] = useState<
    PhilosopherId | 'all'
  >('all');
  const [conceptFilter, setConceptFilter] =
    useState<string>(initialConceptFilter);
  const [statusFilter, setStatusFilter] = useState<
    UnderstandingStatus | 'all'
  >('all');
  const [viewMode, setViewMode] = useState<'by_concept' | 'chronological'>(
    'by_concept'
  );

  // 인라인 수정 모달/드로어 상태
  const [editingLog, setEditingLog] = useState<LearningLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (subjectFilter !== 'all' && log.subject !== subjectFilter) return false;
    if (unitFilter !== 'all' && log.unit !== unitFilter) return false;
    if (
      philosopherFilter !== 'all' &&
      !log.philosopherIds.includes(philosopherFilter)
    ) {
      return false;
    }
    if (conceptFilter !== 'all' && !log.conceptIds.includes(conceptFilter)) {
      return false;
    }
    if (statusFilter !== 'all' && log.understandingStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  // 개념별 그룹화 (동일 개념을 여러 학년도/문항에서 학습했을 때 한눈에 모아보기)
  const groupedByConcept = allConcepts
    .map((concept) => ({
      concept,
      items: filteredLogs.filter((l) =>
        l.conceptIds.includes(concept.conceptId)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    onUpdateLog(editingLog);
    setEditingLog(null);
  };

  return (
    <div className="page-container">
      {/* 헤더 */}
      <header className="page-header">
        <div>
          <div className="page-header-badges">
            <span className="step-pill">개인화 개념 학습노트</span>
            <DemoBadge label="localStorage 자동 저장 지원" />
          </div>
          <h1 className="page-title">나의 선지로그</h1>
          <p className="page-desc">
            단순 문항 번호 나열이 아닌, 사상가와 핵심 개념을 중심으로 나의 오개념 교정 과정과 자기설명을 축적합니다.
          </p>
        </div>

        <div className="header-actions-row">
          <div className="mode-switch-tabs">
            <button
              type="button"
              className={`mode-tab-btn ${
                viewMode === 'by_concept' ? 'active' : ''
              }`}
              onClick={() => setViewMode('by_concept')}
            >
              개념·사상가 중심 묶어보기
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${
                viewMode === 'chronological' ? 'active' : ''
              }`}
              onClick={() => setViewMode('chronological')}
            >
              최신 학습순 전체 보기
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onResetDemoLogs}
            title="데모 예시 로그 복원"
          >
            <RefreshIcon size={14} />
            <span>예시 로그 복원</span>
          </button>
        </div>
      </header>

      {/* 다중 필터 바: 과목별 / 단원별 / 사상가별 / 개념별 / 상태별 */}
      <section className="filter-bar-card">
        <div className="filter-group">
          <label className="filter-label">과목별</label>
          <select
            className="select-input"
            value={subjectFilter}
            onChange={(e) =>
              setSubjectFilter(e.target.value as SubjectId | 'all')
            }
          >
            <option value="all">전체 과목</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id} disabled={!s.isAvailable}>
                {s.name} {!s.isAvailable ? '(준비 중)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">단원별</label>
          <select
            className="select-input"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
          >
            <option value="all">전체 단원</option>
            <option value="사회 정의">사회 정의</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">사상가별</label>
          <select
            className="select-input"
            value={philosopherFilter}
            onChange={(e) =>
              setPhilosopherFilter(e.target.value as PhilosopherId | 'all')
            }
          >
            <option value="all">전체 사상가</option>
            <option value="rawls">존 롤스 (Rawls)</option>
            <option value="nozick">로버트 노직 (Nozick)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">핵심 개념별</label>
          <select
            className="select-input"
            value={conceptFilter}
            onChange={(e) => setConceptFilter(e.target.value)}
          >
            <option value="all">전체 핵심 개념</option>
            {allConcepts.map((c) => (
              <option key={c.conceptId} value={c.conceptId}>
                {c.philosopherName} · {c.conceptName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">이해도 상태별</label>
          <select
            className="select-input"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as UnderstandingStatus | 'all')
            }
          >
            <option value="all">전체 상태</option>
            <option value="이해 확인">이해 확인</option>
            <option value="부분 이해">부분 이해</option>
            <option value="추가 학습 필요">추가 학습 필요</option>
            <option value="검증 전">검증 전</option>
          </select>
        </div>
      </section>

      {/* 로그 수정 모달 */}
      {editingLog && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3>
                <EditIcon size={18} />
                <span>선지로그 직접 수정하기</span>
              </h3>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setEditingLog(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form className="log-form" onSubmit={handleSaveEdit}>
              <div className="log-meta-summary-box">
                <div>
                  <strong>대상 선지:</strong> [{editingLog.questionInfo}] "
                  {editingLog.optionText}"
                </div>
                <div>
                  <strong>관련 사상가 · 개념:</strong>{' '}
                  {editingLog.philosopherNames.join(', ')} ·{' '}
                  {editingLog.conceptNames.join(', ')}
                </div>
              </div>

              <div className="log-field">
                <label>이해도 검증 상태</label>
                <select
                  className="select-input"
                  value={editingLog.understandingStatus}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      understandingStatus: e.target.value as Exclude<
                        UnderstandingStatus,
                        '미학습'
                      >,
                    })
                  }
                >
                  <option value="이해 확인">이해 확인</option>
                  <option value="부분 이해">부분 이해</option>
                  <option value="추가 학습 필요">추가 학습 필요</option>
                  <option value="검증 전">검증 전</option>
                </select>
              </div>

              <div className="log-field">
                <label>기존의 나의 이해</label>
                <textarea
                  className="textarea-input"
                  rows={2}
                  value={editingLog.initialUnderstanding}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      initialUnderstanding: e.target.value,
                    })
                  }
                />
              </div>

              <div className="log-field">
                <label>학습 과정에서 발견한 오개념</label>
                <textarea
                  className="textarea-input"
                  rows={2}
                  value={editingLog.discoveredMisconception}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      discoveredMisconception: e.target.value,
                    })
                  }
                />
              </div>

              <div className="log-field">
                <label>새롭게 이해한 개념 (자기설명)</label>
                <textarea
                  className="textarea-input"
                  rows={3}
                  value={editingLog.newlyUnderstoodConcept}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      newlyUnderstoodConcept: e.target.value,
                    })
                  }
                />
              </div>

              <div className="log-field">
                <label>AI 피드백 요약</label>
                <textarea
                  className="textarea-input"
                  rows={2}
                  value={editingLog.aiFeedbackSummary}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      aiFeedbackSummary: e.target.value,
                    })
                  }
                />
              </div>

              <div className="log-field">
                <label>관련 사상가 및 개념 비교</label>
                <textarea
                  className="textarea-input"
                  rows={2}
                  value={editingLog.philosopherComparisonNote}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      philosopherComparisonNote: e.target.value,
                    })
                  }
                />
              </div>

              <div className="log-field">
                <label>추가 학습이 필요한 부분</label>
                <textarea
                  className="textarea-input"
                  rows={2}
                  value={editingLog.furtherStudyNeeded}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      furtherStudyNeeded: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingLog(null)}
                >
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircleIcon size={16} />
                  <span>수정 내용 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 로그 목록 표시 */}
      {filteredLogs.length === 0 ? (
        <div className="empty-logs-card">
          <FileTextIcon size={32} />
          <h3>조건에 해당하는 선지로그가 없습니다.</h3>
          <p>
            필터를 초기화하거나 '선지 클리닉'에서 새로운 선지를 학습하고 나만의 개념 로그를 저장해 보세요.
          </p>
        </div>
      ) : viewMode === 'by_concept' ? (
        <div className="concept-grouped-logs">
          {groupedByConcept.map(({ concept, items }) => (
            <section key={concept.conceptId} className="concept-log-group-section">
              <div className="concept-group-banner">
                <div className="group-banner-left">
                  <BookOpenIcon size={18} />
                  <span className="chip-philosopher">{concept.philosopherName}</span>
                  <h2 className="group-concept-name">{concept.conceptName}</h2>
                  <span className="group-count-badge">
                    축적된 선지 기록 {items.length}건
                  </span>
                </div>
                <p className="group-concept-def">{concept.definition}</p>
              </div>

              <div className="logs-cards-stack">
                {items.map((log) => (
                  <LogItemCard
                    key={`${concept.conceptId}_${log.logId}`}
                    log={log}
                    onEdit={() => setEditingLog(log)}
                    onDelete={() => onDeleteLog(log.logId)}
                    onStartClinic={() => onStartClinicWithOption(log.optionId)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="logs-cards-stack">
          {filteredLogs.map((log) => (
            <LogItemCard
              key={log.logId}
              log={log}
              onEdit={() => setEditingLog(log)}
              onDelete={() => onDeleteLog(log.logId)}
              onStartClinic={() => onStartClinicWithOption(log.optionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 개별 학습로그 상세 카드 (14개 필수 항목 전체 표시) */
function LogItemCard({
  log,
  onEdit,
  onDelete,
  onStartClinic,
}: {
  log: LearningLog;
  onEdit: () => void;
  onDelete: () => void;
  onStartClinic: () => void;
}) {
  const formattedDate = new Date(log.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="log-detail-card">
      <div className="log-card-top">
        <div className="log-top-badges">
          <span className="chip-subject">
            {log.subjectName} · {log.unit}
          </span>
          {log.philosopherNames.map((pname) => (
            <span key={pname} className="chip-philosopher">
              {pname}
            </span>
          ))}
          {log.conceptNames.map((cname) => (
            <span key={cname} className="chip-concept-sm">
              {cname}
            </span>
          ))}
          <span className="chip-reason">학습 이유: {log.learningReasonLabel}</span>
          {log.isDemoSample && <DemoBadge label="데모 예시 로그" />}
        </div>

        <div className="log-top-right">
          <StatusBadge status={log.understandingStatus} />
          <span className="log-date">{formattedDate}</span>
        </div>
      </div>

      {/* 학습한 기출 선지 */}
      <div className="log-option-box">
        <div className="log-q-meta">
          출발 선지: {log.questionInfo} (선지 {log.optionNumber}번)
        </div>
        <blockquote className="log-option-quote">"{log.optionText}"</blockquote>
      </div>

      {/* 핵심 개념 변화 3단계 그리드: 기존 이해 -> 발견한 오개념 -> 새롭게 이해한 개념 */}
      <div className="log-conceptual-change-grid">
        <div className="change-box box-before">
          <div className="change-label">1. 기존의 나의 이해</div>
          <p>{log.initialUnderstanding}</p>
        </div>

        <div className="change-box box-misconception">
          <div className="change-label">2. 발견한 오개념</div>
          <p>{log.discoveredMisconception}</p>
        </div>

        <div className="change-box box-after">
          <div className="change-label">3. 새롭게 이해한 개념 (자기설명)</div>
          <p>{log.newlyUnderstoodConcept}</p>
        </div>
      </div>

      {/* AI 피드백 요약 & 사상가 비교 & 추가 학습 */}
      <div className="log-secondary-grid">
        <div className="log-info-block">
          <strong>AI 피드백 요약:</strong>
          <p>{log.aiFeedbackSummary}</p>
        </div>
        <div className="log-info-block">
          <strong>관련 사상가 및 개념 비교:</strong>
          <p>{log.philosopherComparisonNote}</p>
        </div>
      </div>

      {/* 유사 선지 검증 결과 (있는 경우) */}
      {log.verificationResult && (
        <div className="log-verification-summary">
          <div className="verify-sum-header">
            <strong>
              유사 선지 적용 검증 결과 ({log.verificationResult.targetQuestionInfo}):
            </strong>
            <StatusBadge status={log.verificationResult.status} size="sm" />
          </div>
          <p className="verify-sum-option">
            검증 선지: "{log.verificationResult.targetOptionText}"
          </p>
          <p className="verify-sum-reason">
            나의 판단 및 이유 ({log.verificationResult.userJudgment ? 'O' : 'X'}):{' '}
            {log.verificationResult.userReasoning}
          </p>
        </div>
      )}

      {/* 추가 학습 필요 부분 & 출처 & 액션 버튼 */}
      <div className="log-card-footer">
        <div className="log-footer-meta">
          <div>
            <strong>추가 학습이 필요한 부분:</strong> {log.furtherStudyNeeded}
          </div>
          <div className="log-sources-text">
            참고 자료 및 출처: {log.sources.join(' · ')}
          </div>
        </div>

        <div className="log-action-buttons">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onEdit}
          >
            <EditIcon size={14} />
            <span>직접 수정</span>
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onDelete}
          >
            <TrashIcon size={14} />
            <span>삭제</span>
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={onStartClinic}
          >
            <span>선지 클리닉 복습</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

