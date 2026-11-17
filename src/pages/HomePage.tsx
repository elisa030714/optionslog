/**
 * @file src/pages/HomePage.tsx
 * @description [Section 6A] 홈 화면 컴포넌트입니다.
 * 학습자가 접속했을 때 과도한 통계 대신 곧바로 복습을 시작할 수 있도록
 * 과목 선택, 빠른 기출 검색창, 이어서 학습하기, 최근 학습 선지, 복습 필요 개념, 개념 학습 진행 현황을 제공합니다.
 */

import { useState } from 'react';
import type { LearningLog, PageTab, SubjectId } from '../types';
import {
  getAllSubjects,
  getAllConcepts,
  getOptionWithQuestion,
  getConceptById,
} from '../retrieval/ragEngine';
import { getConceptStatusMap } from '../utils/storage';
import {
  SearchIcon,
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  AlertCircleIcon,
} from '../components/Icons';
import { StatusBadge, DemoBadge } from '../components/StatusBadge';

interface HomePageProps {
  recentOptionIds: string[];
  activeOptionId: string;
  savedLogs: LearningLog[];
  onStartClinicWithOption: (optionId: string) => void;
  onNavigateWithSearch: (query: string) => void;
  onChangeTab: (tab: PageTab) => void;
}

export function HomePage({
  recentOptionIds,
  activeOptionId,
  savedLogs,
  onStartClinicWithOption,
  onNavigateWithSearch,
  onChangeTab,
}: HomePageProps) {
  const subjects = getAllSubjects();
  const concepts = getAllConcepts();
  const conceptStatusMap = getConceptStatusMap(savedLogs);

  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('life_ethics');
  const [quickQuery, setQuickQuery] = useState('');

  // 현재 이어서 학습할 선지 정보
  const activeOptionData =
    getOptionWithQuestion(activeOptionId) ??
    getOptionWithQuestion('q2025_09_07_opt1');

  // 최근 학습한 선지 목록
  const recentOptions = recentOptionIds
    .map((oid) => getOptionWithQuestion(oid))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  // 복습이 필요한 개념 ('추가 학습 필요' 또는 '부분 이해' 상태인 개념 우선 표시)
  const conceptsNeedingReview = concepts.filter((c) => {
    const st = conceptStatusMap[c.conceptId]?.status;
    return st === '추가 학습 필요' || st === '부분 이해';
  });

  // 진행 현황 집계
  const verifiedCount = concepts.filter(
    (c) => conceptStatusMap[c.conceptId]?.status === '이해 확인'
  ).length;
  const partialCount = concepts.filter(
    (c) => conceptStatusMap[c.conceptId]?.status === '부분 이해'
  ).length;
  const needsWorkCount = concepts.filter(
    (c) => conceptStatusMap[c.conceptId]?.status === '추가 학습 필요'
  ).length;
  const unstudiedCount = concepts.filter(
    (c) => conceptStatusMap[c.conceptId]?.status === '미학습'
  ).length;

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateWithSearch(quickQuery);
  };

  return (
    <div className="page-container">
      {/* 1. 히어로 배너: 서비스명, 슬로건, 빠른 검색창 */}
      <section className="home-hero-card">
        <div className="hero-top-badges">
          <span className="badge-pill-navy">AI 기반 수능 사회탐구 개념 학습 · 오개념 교정</span>
          <DemoBadge label="MVP 데모 버전 (생활과 윤리 · 사회 정의)" />
        </div>
        <h1 className="hero-title">
          선지로그 <span className="hero-title-en">SeonjiLog</span>
        </h1>
        <p className="hero-slogan">
          "하나의 선지에서, 하나의 개념을 완성하다."
        </p>
        <p className="hero-subtitle">
          기출문제 풀이 후 틀렸거나 헷갈렸던 선지를 선택해 보세요. AI 튜터와의 소크라테스식 문답으로 내 오개념을 발견하고 나만의 개념 학습로그를 완성합니다.
        </p>

        {/* 기출문제 및 개념 빠른 검색창 */}
        <form className="home-search-bar" onSubmit={handleQuickSearchSubmit}>
          <SearchIcon size={20} className="search-bar-icon" />
          <input
            type="text"
            className="home-search-input"
            placeholder="사상가, 핵심 개념, 키워드로 기출 선지 검색 (예: 롤스, 차등의 원칙, 노직, 교정의 원리...)"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <span>기출 선지 검색</span>
            <ArrowRightIcon size={16} />
          </button>
        </form>

        <div className="quick-keyword-row">
          <span className="quick-keyword-label">빠른 개념 키워드:</span>
          {['롤스', '차등의 원칙', '평등한 자유의 원칙', '노직', '정당한 이전의 원리', '교정의 원리'].map(
            (kw) => (
              <button
                key={kw}
                type="button"
                className="chip-keyword"
                onClick={() => onNavigateWithSearch(kw)}
              >
                #{kw}
              </button>
            )
          )}
        </div>
      </section>

      {/* 2. 이어서 학습하기 & 대표 시나리오 원클릭 체험 */}
      <section className="home-continue-section">
        <div className="continue-card primary-continue">
          <div className="continue-card-top">
            <span className="continue-tag">
              <SparklesIcon size={15} />
              <span>이어서 학습하기 (핵심 시나리오 체험)</span>
            </span>
            {activeOptionData && (
              <span className="continue-q-info">
                {activeOptionData.question.academicYear}학년도{' '}
                {activeOptionData.question.examType}{' '}
                {activeOptionData.question.questionNumber}번 · 선지{' '}
                {activeOptionData.option.optionNumber} [데모]
              </span>
            )}
          </div>
          <blockquote className="continue-option-quote">
            "{activeOptionData?.option.text}"
          </blockquote>
          <div className="continue-card-footer">
            <div className="continue-concepts">
              {activeOptionData?.option.conceptIds.map((cid) => {
                const c = getConceptById(cid);
                return c ? (
                  <span key={cid} className="chip-concept-sm">
                    {c.philosopherName} · {c.conceptName}
                  </span>
                ) : null;
              })}
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                onStartClinicWithOption(
                  activeOptionData?.option.optionId ?? 'q2025_09_07_opt1'
                )
              }
            >
              <span>선지 클리닉 바로 시작</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. 학습할 과목 선택 */}
      <section className="home-section">
        <div className="section-header-row">
          <h2 className="section-heading">학습할 과목 선택</h2>
          <span className="section-subtext">
            MVP에서는 '생활과 윤리 - 사회 정의' 단원을 지원하며, 타 과목도 확장 가능한 구조로 설계되어 있습니다.
          </span>
        </div>
        <div className="subject-cards-grid">
          {subjects.map((subj) => {
            const isSelected = selectedSubject === subj.id;
            return (
              <div
                key={subj.id}
                className={`subject-select-card ${isSelected ? 'selected' : ''} ${
                  !subj.isAvailable ? 'coming-soon' : ''
                }`}
                onClick={() => {
                  if (subj.isAvailable) {
                    setSelectedSubject(subj.id);
                  }
                }}
              >
                <div className="subject-card-top">
                  <span className="subject-name">{subj.name}</span>
                  {subj.isAvailable ? (
                    <span className="badge-available">MVP 학습 가능</span>
                  ) : (
                    <span className="badge-preparing">준비 중</span>
                  )}
                </div>
                <div className="subject-unit">{subj.unitName}</div>
                <p className="subject-desc">{subj.description}</p>
                {subj.isAvailable ? (
                  <button
                    type="button"
                    className="btn-secondary btn-sm mt-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeTab('search');
                    }}
                  >
                    <span>문항 및 선지 선택하기</span>
                    <ArrowRightIcon size={14} />
                  </button>
                ) : (
                  <div className="preparing-notice">
                    향후 평가원 기출 및 EBS 연계 데이터 추가 예정
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. 최근 학습한 선지 & 복습이 필요한 개념 (2단 그리드) */}
      <div className="home-two-col-grid">
        {/* 최근 학습한 선지 */}
        <section className="home-panel-card">
          <div className="panel-card-header">
            <h2 className="panel-card-title">
              <BookOpenIcon size={18} />
              <span>최근 학습한 선지</span>
            </h2>
            <button
              type="button"
              className="btn-text-link"
              onClick={() => onChangeTab('search')}
            >
              전체 선지 보기 →
            </button>
          </div>
          <div className="recent-options-list">
            {recentOptions.map(({ question, option }) => (
              <div key={option.optionId} className="recent-option-item">
                <div className="recent-option-meta">
                  <span className="q-tag">
                    {question.academicYear} {question.examType} {question.questionNumber}번 (선지 {option.optionNumber})
                  </span>
                  <div className="concept-tags-inline">
                    {option.conceptIds.map((cid) => {
                      const c = getConceptById(cid);
                      return c ? (
                        <span key={cid} className="mini-tag">
                          {c.conceptName}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <p className="recent-option-text">"{option.text}"</p>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onStartClinicWithOption(option.optionId)}
                >
                  <span>다시 복습하기</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 복습이 필요한 개념 & 나의 개념 학습 진행 현황 */}
        <div className="home-right-stack">
          <section className="home-panel-card">
            <div className="panel-card-header">
              <h2 className="panel-card-title">
                <AlertCircleIcon size={18} />
                <span>복습이 필요한 개념</span>
              </h2>
              <button
                type="button"
                className="btn-text-link"
                onClick={() => onChangeTab('map')}
              >
                개념 지도 열기 →
              </button>
            </div>
            {conceptsNeedingReview.length === 0 ? (
              <div className="empty-state-compact">
                현재 '추가 학습 필요' 상태로 기록된 개념이 없습니다. 아직 학습하지 않은 '미학습' 개념들을 탐색해 보세요!
              </div>
            ) : (
              <div className="review-concepts-list">
                {conceptsNeedingReview.map((concept) => {
                  const statusInfo = conceptStatusMap[concept.conceptId];
                  const targetOptionId =
                    concept.relatedOptionIds[0] ?? 'q2025_09_07_opt1';
                  return (
                    <div key={concept.conceptId} className="review-concept-row">
                      <div>
                        <div className="review-concept-title">
                          <span className="chip-philosopher">
                            {concept.philosopherName}
                          </span>
                          <strong>{concept.conceptName}</strong>
                          <StatusBadge status={statusInfo.status} size="sm" />
                        </div>
                        <p className="review-concept-hint">
                          {statusInfo.latestLog?.furtherStudyNeeded ||
                            concept.commonMisconceptions[0]}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => onStartClinicWithOption(targetOptionId)}
                      >
                        <span>선지 복습</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 나의 개념 학습 진행 현황 (과도한 통계 대신 간결한 진행 요약) */}
          <section className="home-panel-card">
            <div className="panel-card-header">
              <h2 className="panel-card-title">나의 개념 학습 진행 현황</h2>
              <span className="total-concepts-count">
                사회 정의 핵심 개념 총 {concepts.length}개
              </span>
            </div>

            <div className="progress-bar-stacked">
              <div
                className="progress-seg seg-verified"
                style={{ width: `${(verifiedCount / concepts.length) * 100}%` }}
                title={`이해 확인: ${verifiedCount}개`}
              />
              <div
                className="progress-seg seg-partial"
                style={{ width: `${(partialCount / concepts.length) * 100}%` }}
                title={`부분 이해: ${partialCount}개`}
              />
              <div
                className="progress-seg seg-needs-work"
                style={{ width: `${(needsWorkCount / concepts.length) * 100}%` }}
                title={`추가 학습 필요: ${needsWorkCount}개`}
              />
            </div>

            <div className="progress-summary-pills">
              <div className="summary-pill-item">
                <StatusBadge status="이해 확인" size="sm" />
                <strong>{verifiedCount}개</strong>
              </div>
              <div className="summary-pill-item">
                <StatusBadge status="부분 이해" size="sm" />
                <strong>{partialCount}개</strong>
              </div>
              <div className="summary-pill-item">
                <StatusBadge status="추가 학습 필요" size="sm" />
                <strong>{needsWorkCount}개</strong>
              </div>
              <div className="summary-pill-item">
                <StatusBadge status="미학습" size="sm" />
                <strong>{unstudiedCount}개</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

