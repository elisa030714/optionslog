/**
 * @file src/components/Sidebar.tsx
 * @description 좌측 사이드바 네비게이션 및 AI 작동 모드(Mock 데모 모드 / GPT API 연동 모드) 표시 컴포넌트입니다.
 * Notion, Linear 스타일의 정제된 학습용 SaaS 인터페이스를 제공합니다.
 */

import type { PageTab } from '../types';
import {
  HomeIcon,
  SearchIcon,
  SparklesIcon,
  FileTextIcon,
  MapNetworkIcon,
  BookOpenIcon,
} from './Icons';

interface SidebarProps {
  activeTab: PageTab;
  onChangeTab: (tab: PageTab) => void;
  aiMode: 'mock' | 'api';
  onChangeAiMode: (mode: 'mock' | 'api') => void;
  savedLogsCount: number;
  activeOptionId: string;
}

export function Sidebar({
  activeTab,
  onChangeTab,
  aiMode,
  onChangeAiMode,
  savedLogsCount,
}: SidebarProps) {
  const navItems: Array<{
    id: PageTab;
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    {
      id: 'home',
      label: '홈',
      subLabel: '복습 시작 및 진행 현황',
      icon: <HomeIcon size={18} />,
    },
    {
      id: 'search',
      label: '기출 검색',
      subLabel: '문항·개념 기준 선지 탐색',
      icon: <SearchIcon size={18} />,
    },
    {
      id: 'clinic',
      label: '선지 클리닉',
      subLabel: 'AI 튜터 1:1 개념 교정',
      icon: <SparklesIcon size={18} />,
      badge: '핵심',
    },
    {
      id: 'logs',
      label: '나의 선지로그',
      subLabel: '개인화 개념 학습노트',
      icon: <FileTextIcon size={18} />,
      badge: savedLogsCount,
    },
    {
      id: 'map',
      label: '개념 지도',
      subLabel: '단원·사상가별 이해도 트리',
      icon: <MapNetworkIcon size={18} />,
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* 브랜드 헤더 */}
      <div className="sidebar-brand" onClick={() => onChangeTab('home')}>
        <div className="brand-logo-box">
          <BookOpenIcon size={20} />
        </div>
        <div>
          <div className="brand-title-row">
            <span className="brand-name">선지로그</span>
            <span className="brand-en">SeonjiLog</span>
          </div>
          <p className="brand-slogan">하나의 선지에서, 하나의 개념을 완성하다</p>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="sidebar-nav" aria-label="주요 메뉴">
        <div className="sidebar-section-title">학습 메뉴</div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onChangeTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text-group">
                <span className="nav-label">{item.label}</span>
                <span className="nav-sublabel">{item.subLabel}</span>
              </span>
              {item.badge !== undefined && (
                <span
                  className={`nav-badge ${
                    item.badge === '핵심' ? 'nav-badge-accent' : ''
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 교육 철학 박스 */}
      <div className="sidebar-philosophy-card">
        <div className="philosophy-label">핵심 철학</div>
        <p>
          "선지는 학습의 출발점이고,
          <br />
          개념 이해는 학습의 목적이며,
          <br />
          로그는 학습의 결과물이다."
        </p>
      </div>

      {/* AI 모드 스위치 (Mock Mode vs GPT API Mode) */}
      <div className="sidebar-ai-mode-box">
        <div className="ai-mode-header">
          <span className="ai-mode-title">AI 튜터 엔진 모드</span>
          <span
            className={`ai-mode-pill ${
              aiMode === 'mock' ? 'pill-mock' : 'pill-api'
            }`}
          >
            {aiMode === 'mock' ? 'Mock 데모' : 'GPT API'}
          </span>
        </div>
        <div className="ai-mode-toggle-group">
          <button
            type="button"
            className={`mode-btn ${aiMode === 'mock' ? 'active' : ''}`}
            onClick={() => onChangeAiMode('mock')}
          >
            Mock 시나리오 (기본)
          </button>
          <button
            type="button"
            className={`mode-btn ${aiMode === 'api' ? 'active' : ''}`}
            onClick={() => onChangeAiMode('api')}
          >
            /api/tutor 연동
          </button>
        </div>
        <p className="ai-mode-desc">
          {aiMode === 'mock'
            ? '현재 실제 GPT API가 연결되지 않은 사전 검증 시나리오 데모 모드입니다. API 키 없이 전체 학습 흐름을 체험할 수 있습니다.'
            : 'Vercel 서버 함수(/api/tutor)를 통해 OpenAI API를 호출합니다. 키 미설정 시 안전하게 Mock 모드로 자동 전환됩니다.'}
        </p>
      </div>
    </aside>
  );
}

