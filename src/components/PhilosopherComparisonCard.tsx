/**
 * @file src/components/PhilosopherComparisonCard.tsx
 * @description [Section 6D-2 & 6D-3] 사상가 비교표(롤스 vs 노직) 및 상황·사례 적용 컴포넌트입니다.
 * 검증된 개념 데이터(philosophers.json)를 기반으로 두 사상가의 핵심 차이와 수능 출제 포인트를 비교합니다.
 */

import { useState } from 'react';
import {
  getPhilosopherComparisonTable,
  getCaseStudies,
  getAllPhilosophers,
} from '../retrieval/ragEngine';
import { ScaleIcon, LightbulbIcon, EyeIcon } from './Icons';
import { DemoBadge } from './StatusBadge';

export function PhilosopherComparisonCard() {
  const comparisonRows = getPhilosopherComparisonTable();
  const caseStudies = getCaseStudies();
  const philosophers = getAllPhilosophers();
  const [revealedCases, setRevealedCases] = useState<Record<string, boolean>>({});
  const [userThoughts, setUserThoughts] = useState<Record<string, string>>({});

  const toggleRevealCase = (caseId: string) => {
    setRevealedCases((prev) => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  return (
    <div className="comparison-card-container">
      <div className="comparison-header">
        <div>
          <div className="concept-meta-row">
            <span className="chip-subject">생활과 윤리 · 사회 정의</span>
            <DemoBadge label="검증 개념 기반 비교 데이터" />
          </div>
          <h3 className="comparison-title">
            <ScaleIcon size={20} />
            <span>사상가 심층 비교: 존 롤스 vs 로버트 노직</span>
          </h3>
        </div>
      </div>

      {/* 사상가 요약 프로필 카드 */}
      <div className="philosopher-profiles-grid">
        {philosophers.map((p) => (
          <div
            key={p.philosopherId}
            className={`philosopher-mini-card ${
              p.philosopherId === 'rawls' ? 'rawls-border' : 'nozick-border'
            }`}
          >
            <div className="phil-name-row">
              <strong>
                {p.nameKo} ({p.nameEn})
              </strong>
              <span className="phil-work">{p.coreWork}</span>
            </div>
            <div className="phil-keyword">{p.coreKeyword}</div>
            <p className="phil-summary">{p.summary}</p>
          </div>
        ))}
      </div>

      {/* 6대 기준 비교표 */}
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>비교 기준</th>
              <th style={{ width: '32%' }}>갑: 존 롤스 (John Rawls)</th>
              <th style={{ width: '32%' }}>을: 로버트 노직 (Robert Nozick)</th>
              <th style={{ width: '20%' }}>수능 출제 & 혼동 포인트</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, idx) => (
              <tr key={idx}>
                <td className="criteria-cell">{row.criteria}</td>
                <td className="rawls-cell">{row.rawls}</td>
                <td className="nozick-cell">{row.nozick}</td>
                <td className="exam-point-cell">{row.examPoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 6D-3: 상황 및 사례 적용 */}
      <div className="case-application-section">
        <div className="section-label-with-icon">
          <LightbulbIcon size={18} />
          <span>상황 및 사례 적용 워크숍 — 각 사상가의 입장에서 판단해 보기</span>
        </div>
        <div className="case-studies-grid">
          {caseStudies.map((cs) => {
            const isRevealed = Boolean(revealedCases[cs.caseId]);
            return (
              <div key={cs.caseId} className="case-study-box">
                <div className="case-study-title">{cs.title}</div>
                <p className="case-study-situation">{cs.situation}</p>
                <div className="case-study-prompt">{cs.questionPrompt}</div>

                <div className="case-study-input-row">
                  <input
                    type="text"
                    className="input-text"
                    placeholder="롤스와 노직이 어떻게 판단할지 나의 생각을 짧게 적어보세요 (선택)"
                    value={userThoughts[cs.caseId] || ''}
                    onChange={(e) =>
                      setUserThoughts((prev) => ({
                        ...prev,
                        [cs.caseId]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => toggleRevealCase(cs.caseId)}
                  >
                    <EyeIcon size={15} />
                    <span>{isRevealed ? '사상가 판단 접기' : '사상가별 판단 확인'}</span>
                  </button>
                </div>

                {isRevealed && (
                  <div className="case-perspectives-box">
                    <div className="perspective-item rawls-bg">
                      <strong>롤스의 입장:</strong> {cs.rawlsPerspective}
                    </div>
                    <div className="perspective-item nozick-bg">
                      <strong>노직의 입장:</strong> {cs.nozickPerspective}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

