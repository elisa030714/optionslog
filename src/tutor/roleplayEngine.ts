/**
 * @file src/tutor/roleplayEngine.ts
 * @description [Section 6D-4] 선택적 심화 학습 기능인 'AI 사상가와 대화하기(역할극)' 및
 * '동일 사회적 상황에 대한 사상가 가상 토론' 시뮬레이션 엔진입니다.
 *
 * ※ 주의: 본 기능은 실제 역사적 사상가의 발언을 그대로 재현하는 것이 아니라,
 * 검증된 개념 데이터(concepts.json, philosophers.json)에 기반한 교육용 시뮬레이션입니다.
 */

import type { PhilosopherId } from '../types';
import { getAllConcepts, getPhilosopherById } from '../retrieval/ragEngine';

export interface RoleplayTopic {
  topicId: string;
  title: string;
  questionForPhilosopher: string;
  rawlsResponse: string;
  nozickResponse: string;
  tutorTakeaway: string;
  relatedConceptIds: string[];
}

/** 사상가 가상 토론 및 질문 주제 목록 */
export const ROLEPLAY_TOPICS: RoleplayTopic[] = [
  {
    topicId: 'topic_inequality',
    title: '경제적 불평등은 언제 정의로운가요?',
    questionForPhilosopher: '사회에 빈부 격차나 소득 불평등이 존재하는 것이 정의로울 수 있나요?',
    rawlsResponse:
      '[교육용 시뮬레이션 - 롤스 관점] 저는 모든 경제적 불평등을 무조건 없애야 한다고 보지 않습니다. 평등한 기본적 자유와 공정한 기회균등이 보장된 상태에서, 그 불평등이 사회의 가장 불리한 위치에 있는 최소 수혜자에게 최대의 이익을 가져다준다면(차등의 원칙) 그러한 불평등은 정의롭습니다.',
    nozickResponse:
      '[교육용 시뮬레이션 - 노직 관점] 불평등이라는 결과의 크기나 모양(정형)은 정의의 판단 기준이 아닙니다! 각 개인이 타인의 권리를 침해하지 않고 정당하게 최초 취득했거나, 당사자 간 자유롭고 자발적인 교환(이전)을 통해 형성된 재산이라면 결과적으로 아무리 큰 빈부 격차가 생겨도 그 소유는 전적으로 정의롭습니다.',
    tutorTakeaway:
      '수능 핵심 포인트: 롤스와 노직 모두 결과의 획일적 평등(균등 분배)을 주장하지 않으며, 각자의 조건 아래 경제적 불평등을 정당화할 수 있다고 봅니다.',
    relatedConceptIds: ['concept_rawls_difference', 'concept_nozick_entitlement'],
  },
  {
    topicId: 'topic_talent',
    title: '타고난 재능으로 번 돈은 온전히 내 것인가요?',
    questionForPhilosopher: '개인이 타고난 천부적 재능을 발휘해 얻은 높은 소득을 어떻게 보시나요?',
    rawlsResponse:
      '[교육용 시뮬레이션 - 롤스 관점] 어떤 재능을 타고나는지는 도덕적 우연일 뿐입니다. 물론 재능 자체를 개인에게서 빼앗을 수는 없지만, 사회 전체의 천부적 재능의 분포(distribution)는 공동의 자산으로 간주해야 합니다. 따라서 재능을 발휘해 얻은 이득은 최소 수혜자의 처지를 개선하는 방식으로 함께 나누도록 사회 기본 구조를 설계해야 합니다.',
    nozickResponse:
      '[교육용 시뮬레이션 - 노직 관점] 개인은 자신의 신체와 천부적 자산에 대해 배타적 소유 권리를 가집니다! 내가 내 재능을 소유한다면, 그 재능을 정당하게 발휘해 얻은 산출물 역시 온전히 나의 소유입니다. 천부적 재능의 분포를 공동 자산으로 보아 강제로 재분배하는 것은 개인의 자기 소유권을 침해하는 것입니다.',
    tutorTakeaway:
      '수능 핵심 포인트: "천부적 재능의 분포를 공동의 자산으로 간주하는가?" → 롤스(O), 노직(X). 단, 롤스도 재능 자체를 국가가 몰수하자는 것은 아닙니다.',
    relatedConceptIds: ['concept_rawls_difference', 'concept_nozick_acquisition'],
  },
  {
    topicId: 'topic_tax_welfare',
    title: '복지를 위한 국가의 세금 부과와 자발적 기부는요?',
    questionForPhilosopher: '사회적 약자를 돕기 위한 국가의 재분배 과세와 개인의 기부에 대해 어떻게 생각하시나요?',
    rawlsResponse:
      '[교육용 시뮬레이션 - 롤스 관점] 개인의 자발적 자선만으로는 사회 기본 구조의 공정성을 보장하기 어렵습니다. 국가는 공정한 기회균등과 차등의 원칙을 실현하기 위해 조세와 복지 제도를 통해 사회적·경제적 불평등을 제도적으로 조정해야 합니다.',
    nozickResponse:
      '[교육용 시뮬레이션 - 노직 관점] 복지 재분배를 위해 근로소득에 세금을 부과하는 것은 국가가 시민에게 그 시간만큼 강제 노동을 시키는 것과 다름없습니다. 국가는 신체·재산 보호와 과거의 사기·강탈 교정에만 머무는 최소국가여야 합니다. 다만 부유한 개인이 자신의 정당한 재산을 빈곤층에게 자발적으로 기부하는 것은 정당한 이전의 원리에 부합하는 아주 훌륭한 행위입니다!',
    tutorTakeaway:
      '수능 핵심 포인트: 노직은 "국가의 강제적 재분배 과세"는 반대하지만, "개인의 자발적 기부(증여)"와 "과거 부정의(사기·강탈)를 바로잡는 교정을 위한 국가 개입"은 인정합니다.',
    relatedConceptIds: ['concept_nozick_transfer', 'concept_nozick_rectification', 'concept_rawls_difference'],
  },
];

/**
 * 학습자가 사상가에게 자유 질문을 입력했을 때 검증된 개념 데이터를 바탕으로
 * 해당 사상가의 페르소나 시뮬레이션 응답을 생성하는 함수
 */
export function generatePhilosopherRoleplayReply(
  philosopherId: PhilosopherId,
  userQuestion: string
): {
  reply: string;
  referencedConceptIds: string[];
} {
  const q = userQuestion.trim();
  const profile = getPhilosopherById(philosopherId);
  const concepts = getAllConcepts().filter((c) => c.philosopherId === philosopherId);

  if (philosopherId === 'rawls') {
    if (q.includes('자유') || q.includes('제1원칙') || q.includes('제한')) {
      return {
        reply: `[교육용 시뮬레이션 - ${profile?.nameKo}] 제 정의론에서 제1원칙인 '평등한 자유의 원칙'은 제2원칙보다 축차적으로 우선합니다. 따라서 최소 수혜자의 경제적 이익이나 사회 전체의 복지를 높인다는 명목으로도 시민의 기본적 자유를 침해하거나 제한할 수 없습니다. 기본적 자유는 오직 다른 기본적 자유와 충돌할 때 더 큰 자유 체계를 보호하기 위해서만 제한될 수 있습니다.`,
        referencedConceptIds: ['concept_rawls_equal_liberty'],
      };
    }
    if (q.includes('무지의 베일') || q.includes('원초적') || q.includes('이타심')) {
      return {
        reply: `[교육용 시뮬레이션 - ${profile?.nameKo}] 원초적 입장은 역사적 실재 사건이 아니라 공정한 합의를 이끌어내기 위한 가상적 사고실험입니다. 당사자들은 '무지의 베일'을 써서 자신의 사회적 지위나 천부적 재능은 모르지만 인간 사회의 일반적인 사실은 알고 있습니다. 또한 그들은 이타심 때문이 아니라, 상호 무관심한 합리성을 바탕으로 자신이 최소 수혜자가 될 위험에 대비해 차등의 원칙에 합의합니다.`,
        referencedConceptIds: ['concept_rawls_procedural_justice'],
      };
    }
    return {
      reply: `[교육용 시뮬레이션 - ${profile?.nameKo}] 공정으로서의 정의 관점에서 말씀드리자면, 정의로운 사회는 모든 불평등을 없애는 사회가 아닙니다. 평등한 자유의 원칙과 공정한 기회균등의 원칙이 충족된 상태에서, 천부적 재능의 분포를 공동의 자산으로 삼아 최소 수혜자에게 최대 이익이 돌아가도록(차등의 원칙) 사회 기본 구조를 편성하는 것이 핵심입니다.`,
      referencedConceptIds: concepts.map((c) => c.conceptId),
    };
  }

  // 노직(nozick)인 경우
  if (q.includes('교정') || q.includes('사기') || q.includes('강탈') || q.includes('개입')) {
    return {
      reply: `[교육용 시뮬레이션 - ${profile?.nameKo}] 저는 최소국가를 지지하지만, 모든 국가 개입을 부정하는 무정부주의자가 아닙니다! 만약 과거의 취득이나 이전 과정에서 절도, 사기, 폭력적 강탈과 같은 부정의가 발생했다면, '교정의 원리'에 따라 국가가 개입하여 이를 바로잡고 피해자에게 되돌려주어야 합니다.`,
      referencedConceptIds: ['concept_nozick_rectification'],
    };
  }
  if (q.includes('기부') || q.includes('자선') || q.includes('이전') || q.includes('교환')) {
    return {
      reply: `[교육용 시뮬레이션 - ${profile?.nameKo}] 제가 반대하는 것은 국가가 세금이라는 강제력으로 개인의 정당한 소유물을 빼앗아 재분배하는 것입니다. 반면 정당한 소유권을 가진 개인이 자유로운 계약으로 교환하거나 빈곤층에게 자발적으로 기부·증여하는 것은 '정당한 이전의 원리'에 완벽히 부합하는 정의로운 일입니다.`,
      referencedConceptIds: ['concept_nozick_transfer'],
    };
  }
  return {
    reply: `[교육용 시뮬레이션 - ${profile?.nameKo}] 제 소유 권리론은 역사적·비정형적 원리입니다. 분배 결과가 어떤 특정 정형(도덕적 공적, 필요 등)에 맞는지 묻지 마십시오. 오직 타인의 처지를 부당하게 악화시키지 않은 '정당한 최초 취득'과 '자발적 이전', 그리고 부정의에 대한 '교정의 원리'라는 역사적 절차를 거쳤는지만 확인하면 됩니다.`,
    referencedConceptIds: concepts.map((c) => c.conceptId),
  };
}

