/**
 * @file src/pages/SearchPage.tsx
 * @description [Section 6B] 기출문제 및 선지 검색 화면입니다.
 * - 방식 1: 기출문제 기준 검색 (과목 / 학년도 / 시험 회차 / 문항 번호 → 제시문 및 1~5번 전체 선지 확인 후 선택)
 * - 방식 2: 개념 기준 검색 (사상가 이름 / 핵심 개념 / 단원명 / 키워드 → 관련 기출 선지 목록 제공)
 * 자체 제작 데모 문항에는 반드시 '데모용 자체 제작 데이터' 배지를 명시합니다.
 */

import { useState } from 'react';
import type { ExamType, PhilosopherId, SubjectId } from '../types';
import {
  getAllQuestions,
  getAllConcepts,
  getAllSubjects,
  getConceptById,
  getPhilosopherById,
} from '../retrieval/ragEngine';
import { SearchIcon, ArrowRightIcon, BookOpenIcon } from '../components/Icons';
import { DemoBadge } from '../components/StatusBadge';

interface SearchPageProps {
  initialKeyword?: string;
  onStartClinicWithOption: (optionId: string) => void;
}

export function SearchPage({
  initialKeyword = '',
  onStartClinicWithOption,
}: SearchPageProps) {
  const allQuestions = getAllQuestions();
  const allConcepts = getAllConcepts();
  const allSubjects = getAllSubjects();

  const [searchMode, setSearchMode] = useState<'by_question' | 'by_concept'>(
    initialKeyword ? 'by_concept' : 'by_question'
  );

  // 방식 1 필터 상태
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('life_ethics');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedExamType, setSelectedExamType] = useState<ExamType | 'all'>('all');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    allQuestions[0]?.questionId ?? 'q2025_09_07'
  );

  // 방식 2 필터 상태
  const [philosopherFilter, setPhilosopherFilter] = useState<PhilosopherId | 'all'>('all');
  const [conceptFilter, setConceptFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>(initialKeyword);

  // 방식 1 필터링된 문항 목록
  const filteredQuestions = allQuestions.filter((q) => {
    if (q.subject !== selectedSubject) return false;
    if (selectedYear !== 'all' && q.academicYear !== selectedYear) return false;
    if (selectedExamType !== 'all' && q.examType !== selectedExamType) return false;
    return true;
  });

  const activeQuestion =
    filteredQuestions.find((q) => q.questionId === selectedQuestionId) ??
    filteredQuestions[0] ??
    allQuestions[0];

  // 방식 2 필터링된 선지 목록
  const allOptionItems = allQuestions.flatMap((q) =>
    q.options.map((opt) => ({
      question: q,
      option: opt,
      concepts: opt.conceptIds
        .map((cid) => getConceptById(cid))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
      philosophers: opt.philosopherIds
        .map((pid) => getPhilosopherById(pid))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    }))
  );

  const filteredOptionItems = allOptionItems.filter((item) => {
    if (
      philosopherFilter !== 'all' &&
      !item.option.philosopherIds.includes(philosopherFilter)
    ) {
      return false;
    }
    if (
      conceptFilter !== 'all' &&
      !item.option.conceptIds.includes(conceptFilter)
    ) {
      return false;
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      const searchableText = [
        item.option.text,
        item.question.unit,
        ...item.concepts.map((c) => `${c.conceptName} ${c.definition}`),
        ...item.philosophers.map((p) => `${p.nameKo} ${p.coreKeyword}`),
      ]
        .join(' ')
        .toLowerCase();
      if (!searchableText.includes(kw)) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* 페이지 헤더 */}
      <header className="page-header">
        <div>
          <div className="page-header-badges">
            <span className="step-pill">STEP 1. 복습할 기출 선지 선택</span>
            <DemoBadge label="자체 제작 데모 문항 5세트 (총 25개 선지)" />
          </div>
          <h1 className="page-title">기출문제 및 선지 검색</h1>
          <p className="page-desc">
            시험지·교재에서 풀었던 문항 번호로 찾거나, 사상가 및 핵심 개념 키워드로 복습할 선지를 선택하세요.
          </p>
        </div>

        {/* 검색 방식 전환 탭 */}
        <div className="mode-switch-tabs">
          <button
            type="button"
            className={`mode-tab-btn ${searchMode === 'by_question' ? 'active' : ''}`}
            onClick={() => setSearchMode('by_question')}
          >
            방식 1. 기출문제 기준 검색
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${searchMode === 'by_concept' ? 'active' : ''}`}
            onClick={() => setSearchMode('by_concept')}
          >
            방식 2. 개념·사상가 기준 검색
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 방식 1. 기출문제 기준 검색 (과목 / 학년도 / 시험 회차 / 문항 번호) */}
      {/* ================================================================= */}
      {searchMode === 'by_question' ? (
        <div className="search-question-layout">
          {/* 상단 필터 바 */}
          <div className="filter-bar-card">
            <div className="filter-group">
              <label className="filter-label">과목</label>
              <select
                className="select-input"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
              >
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.isAvailable}>
                    {s.name} {!s.isAvailable ? '(준비 중)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">학년도</label>
              <select
                className="select-input"
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value === 'all' ? 'all' : Number(e.target.value)
                  )
                }
              >
                <option value="all">전체 학년도</option>
                <option value={2025}>2025학년도 (데모)</option>
                <option value={2024}>2024학년도 (데모)</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">시험 회차</label>
              <select
                className="select-input"
                value={selectedExamType}
                onChange={(e) =>
                  setSelectedExamType(e.target.value as ExamType | 'all')
                }
              >
                <option value="all">전체 시험 회차</option>
                <option value="6월 모의평가">6월 모의평가</option>
                <option value="9월 모의평가">9월 모의평가</option>
                <option value="수능">수능</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">문항 번호 선택</label>
              <select
                className="select-input"
                value={activeQuestion?.questionId ?? ''}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
              >
                {filteredQuestions.map((q) => (
                  <option key={q.questionId} value={q.questionId}>
                    {q.academicYear}학년도 {q.examType} {q.questionNumber}번 ({q.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 좌측 문항 목록 + 우측 선택 문항 제시문 및 전체 선지 */}
          <div className="question-browser-grid">
            <div className="question-list-sidebar">
              <div className="sidebar-list-header">
                검색된 문항 ({filteredQuestions.length}건)
              </div>
              {filteredQuestions.map((q) => {
                const isSelected = activeQuestion?.questionId === q.questionId;
                return (
                  <button
                    key={q.questionId}
                    type="button"
                    className={`question-list-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedQuestionId(q.questionId)}
                  >
                    <div className="q-item-top">
                      <span className="q-item-year">
                        {q.academicYear} {q.examType}
                      </span>
                      <span className="q-item-num">{q.questionNumber}번</span>
                    </div>
                    <div className="q-item-unit">
                      {q.subjectName} · {q.unit}
                    </div>
                    <p className="q-item-preview">{q.options[0]?.text}</p>
                  </button>
                );
              })}
            </div>

            {activeQuestion && (
              <div className="question-detail-viewer">
                <div className="q-viewer-header">
                  <div>
                    <div className="q-viewer-badges">
                      <span className="chip-subject">
                        {activeQuestion.subjectName} · {activeQuestion.unit}
                      </span>
                      <span className="chip-exam">
                        {activeQuestion.academicYear}학년도 {activeQuestion.examType}{' '}
                        {activeQuestion.questionNumber}번
                      </span>
                      <DemoBadge label="데모용 자체 제작 문항" />
                    </div>
                    <h2 className="q-viewer-title">{activeQuestion.questionText}</h2>
                  </div>
                </div>

                {/* 제시문 박스 */}
                <div className="q-passage-box">
                  <div className="passage-label">
                    <BookOpenIcon size={15} />
                    <span>문항 제시문</span>
                  </div>
                  <p className="passage-text">{activeQuestion.passage}</p>
                </div>

                {/* 전체 선지 목록 (복습할 선지 선택) */}
                <div className="q-options-section">
                  <div className="options-header-row">
                    <h3>전체 선지 목록 — 복습하고 싶은 선지를 선택하세요</h3>
                    <span className="options-subhint">
                      틀린 선지뿐 아니라 맞혔지만 헷갈린 선지, 더 깊이 공부하고 싶은 선지 모두 선택 가능합니다.
                    </span>
                  </div>

                  <div className="options-select-list">
                    {activeQuestion.options.map((opt) => {
                      const isScenarioHighlight =
                        opt.optionId === 'q2025_09_07_opt1';
                      return (
                        <div
                          key={opt.optionId}
                          className={`option-select-card ${
                            isScenarioHighlight ? 'scenario-highlight' : ''
                          }`}
                        >
                          <div className="option-card-main">
                            <span className="option-circle-num">
                              {opt.optionNumber}
                            </span>
                            <div className="option-text-wrap">
                              <p className="option-full-text">{opt.text}</p>
                              <div className="option-tags-row">
                                {opt.philosopherIds.map((pid) => {
                                  const p = getPhilosopherById(pid);
                                  return p ? (
                                    <span key={pid} className="chip-philosopher">
                                      {p.nameKo}
                                    </span>
                                  ) : null;
                                })}
                                {opt.conceptIds.map((cid) => {
                                  const c = getConceptById(cid);
                                  return c ? (
                                    <span key={cid} className="chip-concept-sm">
                                      {c.conceptName}
                                    </span>
                                  ) : null;
                                })}
                                {isScenarioHighlight && (
                                  <span className="badge-scenario-star">
                                    ★ 대표 AI 튜터 시나리오 선지
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={() => onStartClinicWithOption(opt.optionId)}
                          >
                            <span>이 선지 복습하기</span>
                            <ArrowRightIcon size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="q-source-footer">
                  출처 표기: {activeQuestion.source}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================================================================= */
        /* 방식 2. 개념 기준 검색 (사상가 / 핵심 개념 / 단원명 / 키워드)       */
        /* ================================================================= */
        <div className="search-concept-layout">
          <div className="concept-search-controls-card">
            <div className="concept-search-input-row">
              <SearchIcon size={18} className="search-bar-icon" />
              <input
                type="text"
                className="home-search-input"
                placeholder="사상가 이름, 핵심 개념, 단원명, 키워드 검색 (예: 롤스, 차등의 원칙, 분배적 정의, 노직, 소유 권리, 기부...)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {keyword && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setKeyword('')}
                >
                  검색어 지우기
                </button>
              )}
            </div>

            <div className="concept-filter-rows">
              <div className="filter-chip-row">
                <span className="filter-row-label">사상가 필터:</span>
                <button
                  type="button"
                  className={`chip-filter ${philosopherFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPhilosopherFilter('all')}
                >
                  전체 사상가
                </button>
                <button
                  type="button"
                  className={`chip-filter ${philosopherFilter === 'rawls' ? 'active' : ''}`}
                  onClick={() => setPhilosopherFilter('rawls')}
                >
                  존 롤스 (Rawls)
                </button>
                <button
                  type="button"
                  className={`chip-filter ${philosopherFilter === 'nozick' ? 'active' : ''}`}
                  onClick={() => setPhilosopherFilter('nozick')}
                >
                  로버트 노직 (Nozick)
                </button>
              </div>

              <div className="filter-chip-row">
                <span className="filter-row-label">핵심 개념 필터:</span>
                <button
                  type="button"
                  className={`chip-filter ${conceptFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setConceptFilter('all')}
                >
                  전체 개념 ({allConcepts.length})
                </button>
                {allConcepts
                  .filter(
                    (c) =>
                      philosopherFilter === 'all' ||
                      c.philosopherId === philosopherFilter
                  )
                  .map((c) => (
                    <button
                      key={c.conceptId}
                      type="button"
                      className={`chip-filter ${
                        conceptFilter === c.conceptId ? 'active' : ''
                      }`}
                      onClick={() => setConceptFilter(c.conceptId)}
                    >
                      {c.philosopherName} · {c.conceptName}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="concept-results-header">
            <span>
              검색된 기출 선지 총 <strong>{filteredOptionItems.length}</strong>건
              (단원: 생활과 윤리 &gt; 사회 정의)
            </span>
            <DemoBadge label="데모용 자체 제작 선지 데이터" />
          </div>

          <div className="concept-options-grid">
            {filteredOptionItems.map(({ question, option, concepts, philosophers }) => (
              <div key={option.optionId} className="concept-option-result-card">
                <div className="result-card-top">
                  <span className="chip-exam">
                    {question.academicYear} {question.examType} {question.questionNumber}번 · 선지 {option.optionNumber} [데모]
                  </span>
                  <div className="result-tags">
                    {philosophers.map((p) => (
                      <span key={p.philosopherId} className="chip-philosopher">
                        {p.nameKo}
                      </span>
                    ))}
                    {concepts.map((c) => (
                      <span key={c.conceptId} className="chip-concept-sm">
                        {c.conceptName}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="result-option-text">"{option.text}"</p>

                <div className="result-card-bottom">
                  <span className="result-concept-def">
                    핵심 개념: {concepts.map((c) => c.conceptName).join(', ')}
                  </span>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => onStartClinicWithOption(option.optionId)}
                  >
                    <span>선지 클리닉 시작</span>
                    <ArrowRightIcon size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
