/**
 * @file src/App.tsx
 * @description 선지로그(SeonjiLog) 메인 애플리케이션 엔트리 컴포넌트입니다.
 * 좌측 사이드바 네비게이션(홈 / 기출 검색 / 선지 클리닉 / 나의 선지로그 / 개념 지도)과
 * 전체 학습 세션 상태(선택된 선지, 저장된 학습로그, AI 모드)를 통합 관리합니다.
 */

import { useState } from 'react';
import type { LearningLog, PageTab } from './types';
import {
  getSavedLearningLogs,
  saveLearningLog,
  deleteLearningLog,
  resetLearningLogsToDemo,
  getRecentOptionIds,
  addRecentOptionId,
  getAiModePreference,
  setAiModePreference,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ClinicPage } from './pages/ClinicPage';
import { MyLogsPage } from './pages/MyLogsPage';
import { ConceptMapPage } from './pages/ConceptMapPage';

export function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('home');
  const [activeOptionId, setActiveOptionId] = useState<string>('q2025_09_07_opt1');
  const [recentOptionIds, setRecentOptionIds] = useState<string[]>(() =>
    getRecentOptionIds()
  );
  const [savedLogs, setSavedLogs] = useState<LearningLog[]>(() =>
    getSavedLearningLogs()
  );
  const [aiMode, setAiMode] = useState<'mock' | 'api'>(() =>
    getAiModePreference()
  );
  const [searchInitialKeyword, setSearchInitialKeyword] = useState<string>('');
  const [logsInitialConceptFilter, setLogsInitialConceptFilter] =
    useState<string>('all');

  // 특정 선지로 선지 클리닉 즉시 시작
  const handleStartClinicWithOption = (optionId: string) => {
    setActiveOptionId(optionId);
    const updatedRecent = addRecentOptionId(optionId);
    setRecentOptionIds(updatedRecent);
    setActiveTab('clinic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 홈에서 키워드 검색 시 기출 검색 탭으로 이동
  const handleNavigateWithSearch = (query: string) => {
    setSearchInitialKeyword(query);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 개념 지도에서 특정 개념의 선지로그 보기로 이동
  const handleNavigateToLogsWithConcept = (conceptId: string) => {
    setLogsInitialConceptFilter(conceptId);
    setActiveTab('logs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 학습로그 저장 또는 수정
  const handleSaveOrUpdateLog = (log: LearningLog) => {
    const next = saveLearningLog(log);
    setSavedLogs(next);
  };

  // 학습로그 삭제
  const handleDeleteLog = (logId: string) => {
    const next = deleteLearningLog(logId);
    setSavedLogs(next);
  };

  // 데모 예시 로그 복원
  const handleResetDemoLogs = () => {
    const next = resetLearningLogsToDemo();
    setSavedLogs(next);
  };

  // AI 모드 전환 ('mock' | 'api')
  const handleChangeAiMode = (mode: 'mock' | 'api') => {
    setAiMode(mode);
    setAiModePreference(mode);
  };

  return (
    <div className="seonjilog-app-shell">
      <Sidebar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab !== 'search') setSearchInitialKeyword('');
          if (tab !== 'logs') setLogsInitialConceptFilter('all');
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        aiMode={aiMode}
        onChangeAiMode={handleChangeAiMode}
        savedLogsCount={savedLogs.length}
        activeOptionId={activeOptionId}
      />

      <main className="seonjilog-main-content">
        {activeTab === 'home' && (
          <HomePage
            recentOptionIds={recentOptionIds}
            activeOptionId={activeOptionId}
            savedLogs={savedLogs}
            onStartClinicWithOption={handleStartClinicWithOption}
            onNavigateWithSearch={handleNavigateWithSearch}
            onChangeTab={setActiveTab}
          />
        )}

        {activeTab === 'search' && (
          <SearchPage
            key={searchInitialKeyword || 'default_search'}
            initialKeyword={searchInitialKeyword}
            onStartClinicWithOption={handleStartClinicWithOption}
          />
        )}

        {activeTab === 'clinic' && (
          <ClinicPage
            key={activeOptionId}
            optionId={activeOptionId}
            aiMode={aiMode}
            onSelectOption={handleStartClinicWithOption}
            onSaveLog={handleSaveOrUpdateLog}
            onChangeTab={setActiveTab}
          />
        )}

        {activeTab === 'logs' && (
          <MyLogsPage
            key={logsInitialConceptFilter}
            logs={savedLogs}
            onUpdateLog={handleSaveOrUpdateLog}
            onDeleteLog={handleDeleteLog}
            onResetDemoLogs={handleResetDemoLogs}
            onStartClinicWithOption={handleStartClinicWithOption}
            initialConceptFilter={logsInitialConceptFilter}
          />
        )}

        {activeTab === 'map' && (
          <ConceptMapPage
            logs={savedLogs}
            onStartClinicWithOption={handleStartClinicWithOption}
            onNavigateToLogsWithConcept={handleNavigateToLogsWithConcept}
            onChangeTab={setActiveTab}
          />
        )}
      </main>
    </div>
  );
}

export default App;
