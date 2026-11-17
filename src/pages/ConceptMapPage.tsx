/**
 * @file src/pages/ConceptMapPage.tsx
 * @description [Section 6G] '나의 개념 지도' 화면입니다.
 * [과목: 생활과 윤리] -> [단원: 사회 정의] -> [사상가: 롤스 / 노직] -> [세부 개념] 계층 구조를 제공하며,
 * 각 개념의 학습 상태(이해 확인 / 부분 이해 / 추가 학습 필요 / 미학습)를 시각적으로 표시합니다.
 * ※ 학습 기록이 없는 개념은 임의로 취약 개념이라 판단하지 않고 반드시 '미학습'으로 표시합니다.
 */

import { useState } from 'react';
import type { LearningLog, PageTab } from '../types';
import {
  getAllConcepts,
  getAllPhilosophers,
  getAllSubjects,
  getConceptById,
} from '../retrieval/ragEngine';
import { getConceptStatusMap } from '../utils/storage';
import { ConceptDetailCard } from '../components/ConceptDetailModal';
import { StatusBadge, DemoBadge } from '../components/StatusBadge';
import {
  MapNetworkIcon,
  FileTextIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from '../components/Icons';

interface ConceptMapPageProps {
  logs: LearningLog[];
  onStartClinicWithOption: (optionId: string) => void;
  onNavigateToLogsWithConcept: (conceptId: string) => void;
  onChangeTab: (tab: PageTab) => void;
}

export function ConceptMapPage({
  logs,
  onStartClinicWithOption,
  onNavigateToLogsWithConcept,
}: ConceptMapPageProps) {
  const subjects = getAllSubjects();
  const philosophers = getAllPhilosophers();
  const concepts = getAllConcepts();
  const statusMap = getConceptStatusMap(logs);

  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    concepts[0]?.conceptId ?? 'concept_rawls_difference'
  );

  const selectedConcept =
    getConceptById(selectedConceptId) ?? concepts[0];

  const matchingLogsForSelected = logs.filter((l) =>
    l.conceptIds.includes(selectedConcept.conceptId)
  );

  return (
    <div className="page-container">
      {/* 페이지 헤더 */}
      <header className="page-header">
        <div>
          <div className="page-header-badges">
            <span className="step-pill">계층형 개념 이해도 트리</span>
            <DemoBadge label="미학습 개념 자동 구분 지원" />
          </div>
          <h1 className="page-title">나의 개념 지도</h1>
          <p className="page-desc">
            과목·단원·사상가별 개념 체계를 한눈에 확인하세요. 아직 학습 기록이 없는 개념은 취약 개념으로 단정하지 않고 <strong>'미학습'</strong>으로 표시합니다.
          </p>
        </div>

        {/* 범례 */}
        <div className="concept-map-legend">
          <StatusBadge status="이해 확인" size="sm" />
          <StatusBadge status="부분 이해" size="sm" />
          <StatusBadge status="추가 학습 필요" size="sm" />
          <StatusBadge status="미학습" size="sm" />
        </div>
      </header>

      {/* 메인 2단 레이아웃: 좌측 계층 트리 / 우측 선택 개념 상세 + 관련 선지로그 + 관련 기출 선지 */}
      <div className="concept-map-two-col">
        {/* 좌측: 계층 구조 트리 (생활과 윤리 > 사회 정의 > 롤스 / 노직 > 핵심 개념) */}
        <div className="concept-tree-card">
          <div className="tree-root-node">
            <MapNetworkIcon size={18} />
            <span>수능 사회탐구 개념 계층 구조</span>
          </div>

          {subjects.map((subj) => (
            <div key={subj.id} className="tree-subject-block">
              <div
                className={`tree-subject-header ${
                  subj.isAvailable ? 'available' : 'preparing'
                }`}
              >
                <strong>{subj.name}</strong>
                <span className="tree-unit-badge">{subj.unitName}</span>
              </div>

              {subj.isAvailable ? (
                <div className="tree-unit-children">
                  {philosophers.map((phil) => {
                    const philConcepts = concepts.filter(
                      (c) => c.philosopherId === phil.philosopherId
                    );
                    return (
                      <div
                        key={phil.philosopherId}
                        className="tree-philosopher-group"
                      >
                        <div className="tree-philosopher-header">
                          <span className="phil-badge-dot" />
                          <strong>
                            {phil.nameKo} ({phil.nameEn})
                          </strong>
                          <span className="phil-sub-keyword">
                            {phil.coreKeyword}
                          </span>
                        </div>

                        <div className="tree-concept-nodes">
                          {philConcepts.map((c) => {
                            const st = statusMap[c.conceptId] ?? {
                              status: '미학습' as const,
                              logCount: 0,
                            };
                            const isSelected =
                              c.conceptId === selectedConcept.conceptId;

                            return (
                              <button
                                key={c.conceptId}
                                type="button"
                                className={`tree-concept-node-btn ${
                                  isSelected ? 'active' : ''
                                }`}
                                onClick={() =>
                                  setSelectedConceptId(c.conceptId)
                                }
                              >
                                <div className="node-left">
                                  <ChevronRightIcon size={15} />
                                  <span className="node-concept-name">
                                    {c.conceptName}
                                  </span>
                                </div>
                                <div className="node-right">
                                  {st.logCount > 0 && (
                                    <span className="node-log-count">
                                      로그 {st.logCount}건
                                    </span>
                                  )}
                                  <StatusBadge status={st.status} size="sm" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="tree-preparing-placeholder">
                  현재 MVP 준비 중인 과목입니다. 추후 단원 및 개념 트리가 확장됩니다.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 우측: 선택한 개념의 학습 상태, 연결된 선지로그, 핵심 개념 카드 및 관련 기출 선지 */}
        <div className="concept-map-detail-column">
          {/* 1. 해당 개념과 연결된 나의 선지로그 요약 카드 */}
          <div className="map-logs-summary-card">
            <div className="map-logs-header">
              <div>
                <span className="section-label">
                  선택한 개념의 나의 학습 상태 및 선지로그
                </span>
                <h3 className="map-selected-title">
                  {selectedConcept.philosopherName} —{' '}
                  {selectedConcept.conceptName}
                </h3>
              </div>
              <StatusBadge
                status={
                  statusMap[selectedConcept.conceptId]?.status ?? '미학습'
                }
              />
            </div>

            {matchingLogsForSelected.length === 0 ? (
              <div className="unstudied-concept-notice">
                <p>
                  아직 <strong>'{selectedConcept.conceptName}'</strong> 개념에 대해 저장된 학습로그가 없어 <strong>[미학습]</strong> 상태입니다. 아래 관련 기출 선지 중 하나를 선택해 첫 선지 클리닉을 시작해 보세요!
                </p>
                {selectedConcept.relatedOptionIds[0] && (
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() =>
                      onStartClinicWithOption(
                        selectedConcept.relatedOptionIds[0]
                      )
                    }
                  >
                    <span>첫 기출 선지로 클리닉 시작하기</span>
                    <ArrowRightIcon size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="map-linked-logs-list">
                {matchingLogsForSelected.map((log) => (
                  <div key={log.logId} className="map-mini-log-card">
                    <div className="mini-log-top">
                      <span className="q-tag">{log.questionInfo}</span>
                      <StatusBadge status={log.understandingStatus} size="sm" />
                    </div>
                    <p className="mini-log-option">"{log.optionText}"</p>
                    <div className="mini-log-change">
                      <div>
                        <strong>발견한 오개념:</strong>{' '}
                        {log.discoveredMisconception}
                      </div>
                      <div>
                        <strong>새롭게 이해한 개념:</strong>{' '}
                        {log.newlyUnderstoodConcept}
                      </div>
                    </div>
                    <div className="mini-log-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() =>
                          onNavigateToLogsWithConcept(selectedConcept.conceptId)
                        }
                      >
                        <FileTextIcon size={14} />
                        <span>선지로그 전체 보기</span>
                      </button>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => onStartClinicWithOption(log.optionId)}
                      >
                        <span>이 선지 다시 복습</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 핵심 개념 상세 카드 및 관련 기출 선지 목록 */}
          <ConceptDetailCard
            concept={selectedConcept}
            onSelectConcept={(cid) => setSelectedConceptId(cid)}
            onStartClinicWithOption={(oid) => onStartClinicWithOption(oid)}
          />
        </div>
      </div>
    </div>
  );
}

