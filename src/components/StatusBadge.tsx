/**
 * @file src/components/StatusBadge.tsx
 * @description 개념 이해도 상태(이해 확인 / 부분 이해 / 추가 학습 필요 / 검증 전 / 미학습) 및
 * 데모 데이터 표시 배지를 일관된 디자인으로 렌더링하는 공통 컴포넌트입니다.
 */

import type { UnderstandingStatus } from '../types';

interface StatusBadgeProps {
  status: UnderstandingStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusStyles: Record<UnderstandingStatus, string> = {
    '이해 확인': 'badge-status badge-verified',
    '부분 이해': 'badge-status badge-partial',
    '추가 학습 필요': 'badge-status badge-needs-work',
    '검증 전': 'badge-status badge-pending',
    '미학습': 'badge-status badge-unstudied',
  };

  const dotColors: Record<UnderstandingStatus, string> = {
    '이해 확인': '#15803d',
    '부분 이해': '#b45309',
    '추가 학습 필요': '#b91c1c',
    '검증 전': '#1d4ed8',
    '미학습': '#9ca3af',
  };

  return (
    <span className={`${statusStyles[status]} ${size === 'sm' ? 'badge-sm' : ''}`}>
      <span
        className="status-dot"
        style={{ backgroundColor: dotColors[status] }}
      />
      {status}
    </span>
  );
}

export function DemoBadge({ label = '데모용 자체 제작 데이터' }: { label?: string }) {
  return (
    <span className="badge-demo" title="실제 평가원 기출이 아닌 교육용 자체 제작 데이터입니다.">
      {label}
    </span>
  );
}

