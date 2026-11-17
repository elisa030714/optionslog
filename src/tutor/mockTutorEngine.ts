/**
 * @file src/tutor/mockTutorEngine.ts
 * @description API 키가 없는 로컬 데모 환경(Mock Mode)에서도 전체 교육공학적 학습 흐름을
 * 100% 체험할 수 있도록 사전 설계된 시나리오와 분기형 소크라테스식 피드백을 제공하는 엔진입니다.
 *
 * [포함 기능]
 * 1. 학습 이유별 맞춤형 첫 질문 및 추천 응답 칩 생성
 * 2. 대표 시나리오(Section 7: 롤스 차등의 원칙 & 사회 A vs 사회 B) 완벽 재현
 * 3. 전체 25개 데모 선지에 대한 다단계 분기형 코칭 대화
 * 4. 학습자 요청 시 정답/해설 지연 없는 즉시 공개 원칙 준수
 * 5. 제공된 RAG 데이터 범위 외 질문에 대한 출처 보호 가드레일 작동
 * 6. 4대 기준 기반 유사 선지 이해도 검증(STEP 5) 및 개인화 선지로그 초안 자동 생성(STEP 6)
 */

import type {
  ChatMessage,
  LearningReasonType,
  RetrievedContext,
  VerificationAttempt,
  LearningLog,
  UnderstandingStatus,
} from '../types';
import { getLearningReasonOption } from './prompts';
import { checkOutOfScopeQuery, getOptionWithQuestion } from '../retrieval/ragEngine';

/**
 * STEP 2에서 학습 이유를 선택했을 때 AI 튜터가 건네는 첫 번째 메시지 생성
 */
export function createInitialTutorMessage(
  ctx: RetrievedContext,
  reason: LearningReasonType
): ChatMessage {
  const reasonObj = getLearningReasonOption(reason);
  const { selectedOption, relatedConcepts, explanation } = ctx;
  const primaryConcept = relatedConcepts[0];

  // 대표 시나리오 선지(q2025_09_07_opt1)인 경우 Section 7 시나리오 응답을 첫 추천 칩으로 배치
  let suggestedReplies: string[] = [];

  if (selectedOption.optionId === 'q2025_09_07_opt1') {
    suggestedReplies = [
      '롤스는 평등을 중요하게 생각하는 사상가이기 때문에 맞는 선지라고 생각했어요.',
      '모든 불평등을 없애는 것인지 일부 허용하는 것인지 헷갈렸어요.',
      '정답과 핵심 해설을 먼저 확인하고 싶어요.',
    ];
  } else if (primaryConcept) {
    suggestedReplies = [
      `${primaryConcept.philosopherName}의 '${primaryConcept.conceptName}' 개념과 관련이 있는 것 같은데 조건이 헷갈렸어요.`,
      `선지의 표현이 맞는지 틀리는지 판단 근거를 잘 모르겠어요.`,
      `정답과 핵심 해설을 먼저 알려주세요.`,
    ];
  }

  return {
    id: `msg_init_${Date.now()}`,
    sender: 'tutor',
    content: `선택하신 선지는 **"${selectedOption.text}"** 입니다.\n\n**'${reasonObj.label}'**를 선택해 주셨네요. ${reasonObj.firstTutorQuestion}`,
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    dialogueCategory: '오개념 진단',
    pedagogicalStrategy: '소크라테스식 문답법',
    referencedSources: [
      selectedOption.optionId,
      explanation.explanationId,
      ...relatedConcepts.map((c) => c.conceptId),
    ],
    suggestedReplies,
  };
}

/**
 * 학습자의 채팅 입력에 대해 문맥(RAG)과 대화 턴(Turn)을 분석하여
 * 교육공학적 소크라테스식 응답을 생성하는 Mock AI 튜터 핵심 함수
 */
export function generateMockTutorReply(
  ctx: RetrievedContext,
  userMessage: string,
  history: ChatMessage[]
): ChatMessage {
  const trimmed = userMessage.trim();
  const { selectedOption, explanation, relatedConcepts, contrastingConcepts } = ctx;
  const primaryConcept = relatedConcepts[0];
  const studentTurnCount = history.filter((m) => m.sender === 'student').length + 1;
  const nowStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const baseSources = [
    explanation.explanationId,
    ...relatedConcepts.map((c) => c.conceptId),
  ];

  // 1. 데이터 범위 외 질문 가드레일 검사 (Section 9 & 10: 제공된 자료 외 임의 생성 금지)
  const scopeCheck = checkOutOfScopeQuery(trimmed);
  if (scopeCheck.isOutOfScope) {
    return {
      id: `msg_tutor_${Date.now()}`,
      sender: 'tutor',
      content: `질문해주신 **'${scopeCheck.detectedKeyword}'** 사상가/개념은 현재 선지로그 MVP에 탑재된 검증 학습 자료(**생활과 윤리 - 사회 정의: 롤스·노직**) 범위에 포함되어 있지 않습니다.\n\n선지로그 AI 튜터는 검증되지 않은 사상가의 주장이나 임의의 공식 해설을 지어내지 않는 것을 원칙으로 합니다. 해당 사상가에 대한 정확한 안내를 위해 추후 검증 데이터 추가가 필요합니다. 현재 선지인 **${primaryConcept?.philosopherName ?? '사회 정의'}**의 개념으로 다시 이야기를 이어가 볼까요?`,
      timestamp: nowStr,
      dialogueCategory: '개념 설명',
      pedagogicalStrategy: '스캐폴딩(비계 설정)',
      referencedSources: baseSources,
      suggestedReplies: [
        '네, 현재 선지의 핵심 개념으로 돌아갈게요.',
        '이 선지의 정답과 해설을 알려주세요.',
      ],
    };
  }

  // 2. 학습자가 정답/해설을 직접 요청한 경우 (Section 10: 정답 공개를 무조건 지연시키지 않는다)
  if (
    trimmed.includes('정답') ||
    trimmed.includes('해설') ||
    trimmed.includes('알려주') ||
    trimmed.includes('모르겠')
  ) {
    const judgmentLabel = explanation.correctJudgment ? '옳은 선지 (O)' : '틀린 선지 (X)';
    return {
      id: `msg_tutor_${Date.now()}`,
      sender: 'tutor',
      content: `물론이죠! 정답 공개를 미루지 않고 바로 핵심부터 짚어드릴게요.\n\n- **선지 판단**: **${judgmentLabel}**\n- **핵심 근거**: ${explanation.keyEvidence}\n- **상세 해설**: ${explanation.explanation}\n\n해설을 읽어보니 어떤 부분이 핵심 함정이었는지 보이시나요? 이해한 내용을 **자신의 한 문장**으로 바꿔 적어보시면 기억에 훨씬 오래 남을 거예요!`,
      timestamp: nowStr,
      dialogueCategory: '개념 설명',
      pedagogicalStrategy: '자기설명 유도',
      referencedSources: baseSources,
      conceptCardTriggerId: primaryConcept?.conceptId,
      suggestedReplies: [
        selectedOption.optionId === 'q2025_09_07_opt1'
          ? '롤스는 모든 불평등이 없어져야 한다고 주장하는 것이 아니라, 정의의 원칙을 충족할 때 불평등을 허용한다고 생각해요.'
          : `${primaryConcept?.philosopherName}의 '${primaryConcept?.conceptName}' 조건을 정확히 구분해야 한다는 점을 이해했어요.`,
        '롤스와 노직의 입장을 표로 비교해 보고 싶어요.',
        '이제 다른 기출 선지로 이해도 검증을 해볼래요!',
      ],
      readyForVerification: true,
    };
  }

  // 3. 사상가 비교 요청 처리
  if (trimmed.includes('비교') || (trimmed.includes('롤스') && trimmed.includes('노직'))) {
    return {
      id: `msg_tutor_${Date.now()}`,
      sender: 'tutor',
      content: `좋은 질문입니다! 수능 사회 정의 단원에서는 **롤스**와 **노직**의 공통점(절차적 정의, 기본적 자유 보장)과 차이점(천부적 재능 분포의 공동 자산 여부, 복지 재분배 과세에 대한 입장)을 비교하는 문제가 가장 자주 출제됩니다.\n\n아래 **사상가 비교 카드**를 함께 살펴보면서, 현재 선지("${selectedOption.text}")가 두 사상가 중 누구의 어떤 기준과 연결되는지 확인해 볼까요?`,
      timestamp: nowStr,
      dialogueCategory: '사상가 비교',
      pedagogicalStrategy: '구성주의 비교',
      referencedSources: [
        ...baseSources,
        ...contrastingConcepts.map((c) => c.conceptId),
      ],
      comparisonCardTrigger: true,
      suggestedReplies: [
        '비교표를 보니 두 사상가의 차이가 명확해졌어요!',
        '구체적인 사회적 사례로도 비교해 볼 수 있나요?',
        '이제 이해도 검증 단계로 넘어가고 싶어요.',
      ],
      readyForVerification: studentTurnCount >= 2,
    };
  }

  // =========================================================================
  // 4. [Section 7 필수 대표 시나리오 완벽 구현: q2025_09_07_opt1]
  // 선지: "롤스는 정의로운 사회에서 모든 사회적·경제적 불평등이 제거되어야 한다고 본다."
  // =========================================================================
  if (selectedOption.optionId === 'q2025_09_07_opt1') {
    // 시나리오 Turn 1: "롤스는 평등을 중요하게 생각하는 사상가이기 때문에 맞는 선지라고 생각했어요."
    if (
      studentTurnCount === 1 ||
      (trimmed.includes('평등') && (trimmed.includes('맞는') || trimmed.includes('중요')))
    ) {
      return {
        id: `msg_tutor_${Date.now()}`,
        sender: 'tutor',
        content: `롤스가 평등을 중요하게 생각한다는 점에 주목했군요. 그렇다면 롤스는 모든 사람이 동일한 소득을 가져야 한다고 보았을까요?`,
        timestamp: nowStr,
        dialogueCategory: '오개념 진단',
        pedagogicalStrategy: '소크라테스식 문답법',
        referencedSources: ['exp_q2025_09_07_opt1', 'concept_rawls_difference'],
        suggestedReplies: [
          '꼭 동일해야 하는 것은 아니고 가난한 사람들을 배려해야 한다는 것 아닌가요?',
          '기본적 자유는 평등해야 하지만 소득까지 완전히 같아야 하는 건 아닌 것 같아요.',
        ],
      };
    }

    // 시나리오 Turn 2: "꼭 동일해야 하는 것은 아니고 가난한 사람들을 배려해야 한다는 것 아닌가요?"
    if (
      studentTurnCount === 2 ||
      trimmed.includes('동일') ||
      trimmed.includes('가난') ||
      trimmed.includes('배려') ||
      trimmed.includes('같아야')
    ) {
      return {
        id: `msg_tutor_${Date.now()}`,
        sender: 'tutor',
        content: `좋아요. 롤스의 **차등의 원칙**을 생각해 볼까요? 다른 정의의 원칙들이 충족되었다고 가정할 때, 다음 두 사회 중 어느 사회가 차등의 원칙에 더 부합할까요?\n\n• **사회 A**: 구성원 모두의 소득이 **30**으로 동일함.\n• **사회 B**: 구성원의 소득은 **80, 60, 40**으로 서로 다르지만 최소 수혜자의 소득(**40**)은 사회 A(**30**)보다 높음.\n\n*(참고: 위 사례는 개념 이해를 돕기 위한 단순화된 교육용 예시이며, 실제 차등의 원칙에 관한 판단에는 평등한 자유의 원칙·공정한 기회균등의 원칙과 가능한 사회 제도에 대한 고려가 함께 필요합니다.)*`,
        timestamp: nowStr,
        dialogueCategory: '사례 적용',
        pedagogicalStrategy: '스캐폴딩(비계 설정)',
        referencedSources: ['concept_rawls_difference', 'exp_q2025_09_07_opt1'],
        suggestedReplies: [
          '사회 B요. 불평등이 있더라도 최소 수혜자에게 더 유리하기 때문이에요.',
          '사회 A요. 모두가 30으로 평등하기 때문이에요.',
        ],
      };
    }

    // 만약 학습자가 사회 A라고 답한 경우 부드러운 스캐폴딩 제공
    if (trimmed.includes('사회 A') || trimmed.includes('사회A')) {
      return {
        id: `msg_tutor_${Date.now()}`,
        sender: 'tutor',
        content: `사회 A는 모두가 30으로 똑같아서 평등해 보이죠! 하지만 가장 형편이 어려운 **'최소 수혜자'** 입장에서 한번 생각해 볼까요?\n\n사회 A에서 최소 수혜자의 소득은 **30**이고, 사회 B에서 최소 수혜자의 소득은 **40**입니다. 롤스의 차등의 원칙은 **'최소 수혜자에게 최대의 이익'**이 돌아가는 사회를 정의롭다고 봅니다. 그렇다면 최소 수혜자에게 더 유리한 사회는 어디일까요?`,
        timestamp: nowStr,
        dialogueCategory: '사례 적용',
        pedagogicalStrategy: '스캐폴딩(비계 설정)',
        referencedSources: ['concept_rawls_difference'],
        suggestedReplies: [
          '사회 B요. 불평등이 있더라도 최소 수혜자에게 더 유리하기 때문이에요.',
        ],
      };
    }

    // 시나리오 Turn 3: "사회 B요. 불평등이 있더라도 최소 수혜자에게 더 유리하기 때문이에요."
    if (
      studentTurnCount === 3 ||
      trimmed.includes('사회 B') ||
      trimmed.includes('사회B') ||
      trimmed.includes('최소 수혜자')
    ) {
      return {
        id: `msg_tutor_${Date.now()}`,
        sender: 'tutor',
        content: `맞아요! 불평등(80, 60, 40)이 존재하더라도 최소 수혜자의 몫(40)이 평등 분배 상황(30)보다 더 높아졌기 때문에 사회 B가 차등의 원칙에 부합합니다.\n\n그렇다면 처음 선지(**"롤스는 정의로운 사회에서 모든 사회적·경제적 불평등이 제거되어야 한다고 본다"**)에서 어떤 표현이 잘못되었는지 자신의 언어로 다시 설명해 볼 수 있겠어요?`,
        timestamp: nowStr,
        dialogueCategory: '자기설명',
        pedagogicalStrategy: '자기설명 유도',
        referencedSources: ['exp_q2025_09_07_opt1', 'concept_rawls_difference'],
        suggestedReplies: [
          '롤스는 모든 불평등이 없어져야 한다고 주장하는 것이 아니라, 정의의 원칙을 충족할 때 불평등을 허용한다고 생각해요.',
          '모든 사회적·경제적 불평등을 제거하는 것이 아니라 최소 수혜자에게 최대 이익이 되면 불평등이 정당화돼요.',
        ],
      };
    }

    // 시나리오 Turn 4 (자기설명 완료): 해설 정리 및 STEP 5 이해도 검증 안내
    return {
      id: `msg_tutor_${Date.now()}`,
      sender: 'tutor',
      content: `정말 훌륭하게 정리했어요! 자신의 언어로 핵심을 정확히 설명해 주셨습니다.\n\n📌 **[최종 개념 및 해설 정리]**\n- **선지 정오**: **틀린 선지 (X)**\n- **핵심 이유**: ${explanation.explanation}\n- **주의할 전제 조건**: 차등의 원칙이 적용되려면 제1원칙(평등한 자유의 원칙)과 공정한 기회균등의 원칙이 축차적 순서에 따라 먼저 충족되어야 하며, 가능한 사회 기본 구조 안에서 판단해야 합니다.\n\n이제 아래 **[STEP 5. 다른 기출 선지로 이해도 검증하기]** 버튼을 눌러, 방금 완성한 개념을 새로운 선지에 적용해 볼까요?`,
      timestamp: nowStr,
      dialogueCategory: '개념 설명',
      pedagogicalStrategy: '개념 변화 학습',
      referencedSources: ['exp_q2025_09_07_opt1', 'concept_rawls_difference'],
      conceptCardTriggerId: 'concept_rawls_difference',
      readyForVerification: true,
      suggestedReplies: [
        '롤스와 노직을 비교표로 한 번 더 확인하고 싶어요.',
      ],
    };
  }

  // =========================================================================
  // 5. 그 외 모든 24개 데모 선지에 대한 일반화된 3단계 교육공학적 대화 흐름
  // =========================================================================
  if (studentTurnCount === 1) {
    const exampleCase = primaryConcept?.examples[0];
    return {
      id: `msg_tutor_${Date.now()}`,
      sender: 'tutor',
      content: `말씀해주신 생각에서 **${primaryConcept?.philosopherName}**의 **'${primaryConcept?.conceptName}'** 개념에 접근하는 좋은 단서가 보여요!\n\n한 가지만 먼저 질문해 볼게요. ${primaryConcept?.philosopherName}의 입장에서 볼 때, **${primaryConcept?.necessaryConditions[0] ?? primaryConcept?.keyPrinciples[0]}**라는 조건을 고려하면 이 선지의 주장이 항상 성립할 수 있을까요?\n\n${
        exampleCase
          ? `💡 **생각해 볼 사례 (${exampleCase.title})**:\n${exampleCase.situation}`
          : ''
      }`,
      timestamp: nowStr,
      dialogueCategory: '사례 적용',
      pedagogicalStrategy: '소크라테스식 문답법',
      referencedSources: baseSources,
      suggestedReplies: [
        `아, 그 전제 조건을 생각하면 선지의 표현은 ${explanation.correctJudgment ? '타당한' : '잘못된'} 설명이네요!`,
        '그 조건이 왜 중요한지 조금 더 쉽게 설명해 주세요.',
        '롤스와 노직의 입장을 비교해서 보고 싶어요.',
      ],
    };
  }

  if (studentTurnCount === 2) {
    return {
      id: `msg_tutor_${Date.now()}`,
      sender: 'tutor',
      content: `핵심에 아주 가까워졌어요! **${primaryConcept?.philosopherName}**의 **'${primaryConcept?.conceptName}'**에서 가장 자주 출제되는 포인트는 바로 이것입니다:\n\n> **핵심 판단 근거**: ${explanation.keyEvidence}\n\n그렇다면 이 선지가 왜 **${explanation.correctJudgment ? '옳은 선지(O)' : '틀린 선지(X)'}**인지, 오늘 발견한 포인트를 담아 **자신의 말로 한 문장**으로 정리해 볼 수 있을까요?`,
      timestamp: nowStr,
      dialogueCategory: '자기설명',
      pedagogicalStrategy: '자기설명 유도',
      referencedSources: baseSources,
      conceptCardTriggerId: primaryConcept?.conceptId,
      suggestedReplies: [
        `${primaryConcept?.philosopherName}는 ${primaryConcept?.keyPrinciples[0]}라고 보기 때문에 이 선지는 ${explanation.correctJudgment ? '맞습니다' : '틀립니다'}.`,
        '해설 전체 내용을 정리해 주세요.',
      ],
    };
  }

  // Turn 3 이상: 자기설명 칭찬 + 공식 해설 요약 + 이해도 검증(STEP 5) 안내
  return {
    id: `msg_tutor_${Date.now()}`,
    sender: 'tutor',
    content: `아주 명확한 자기설명입니다! 스스로 문장으로 정리했기 때문에 다른 변형 선지가 나와도 흔들리지 않을 거예요.\n\n📌 **[검증 자료 기반 최종 정리]**\n- **정오 판단**: **${explanation.correctJudgment ? '옳은 선지 (O)' : '틀린 선지 (X)'}**\n- **공식 해설**: ${explanation.explanation}\n- **자주 하는 실수**: ${explanation.commonMisconceptions[0] ?? '핵심 조건 누락 주의'}\n\n이제 **[STEP 5. 개념 이해도 검증]** 단계에서 유사 기출 선지에 이 개념을 직접 적용해 봅시다!`,
    timestamp: nowStr,
    dialogueCategory: '개념 설명',
    pedagogicalStrategy: '개념 변화 학습',
    referencedSources: baseSources,
    conceptCardTriggerId: primaryConcept?.conceptId,
    readyForVerification: true,
    suggestedReplies: [
      '롤스와 노직 비교 카드도 보여주세요.',
    ],
  };
}

/**
 * [STEP 5. 개념 이해도 검증 평가 엔진 - Section 6E]
 * 학습자가 유사 선지에 대해 입력한 O/X 판단과 서술 이유를 4대 평가 기준으로 분석하여
 * '이해 확인' | '부분 이해' | '추가 학습 필요' 상태와 상세 피드백을 반환합니다.
 */
export function evaluateUnderstandingMock(params: {
  targetOptionId: string;
  userJudgment: boolean;
  userReasoning: string;
}): VerificationAttempt {
  const { targetOptionId, userJudgment, userReasoning } = params;
  const fullData = getOptionWithQuestion(targetOptionId);
  const cleanReason = userReasoning.trim();

  if (!fullData) {
    throw new Error(`유효하지 않은 검증 선지 ID입니다: ${targetOptionId}`);
  }

  const { question, option, explanation } = fullData;
  const isJudgmentCorrect = userJudgment === explanation.correctJudgment;

  // 4대 기준 키워드 및 논리 휴리스틱 검사
  const hasPhilosopherConfusion =
    (option.philosopherIds.includes('rawls') &&
      !option.philosopherIds.includes('nozick') &&
      cleanReason.includes('노직은') &&
      !cleanReason.includes('롤스')) ||
    (option.philosopherIds.includes('nozick') &&
      !option.philosopherIds.includes('rawls') &&
      cleanReason.includes('롤스는') &&
      !cleanReason.includes('노직'));

  const conceptKeywords = [
    '차등',
    '최소 수혜자',
    '불평등',
    '자유',
    '우선',
    '기회균등',
    '취득',
    '이전',
    '교정',
    '자발적',
    '정형',
    '비정형',
    '역사적',
    '절차',
    '공동',
    '자산',
    '소유',
    '무지의 베일',
    '원초적',
    '원칙',
  ];

  const matchedKeywords = conceptKeywords.filter((kw) => cleanReason.includes(kw));
  const hasSufficientLength = cleanReason.length >= 12;
  const hasCoreConcept = matchedKeywords.length >= 1 && hasSufficientLength;
  const hasConditionConsideration =
    matchedKeywords.length >= 2 ||
    cleanReason.includes('조건') ||
    cleanReason.includes('경우') ||
    cleanReason.includes('때문') ||
    cleanReason.includes('아니라') ||
    cleanReason.includes('위해');

  let status: Exclude<UnderstandingStatus, '미학습' | '검증 전'>;
  let overallFeedback = '';

  if (isJudgmentCorrect && !hasPhilosopherConfusion && hasCoreConcept && hasConditionConsideration) {
    status = '이해 확인';
    overallFeedback = `정오답 판단(${explanation.correctJudgment ? 'O' : 'X'})뿐만 아니라 핵심 개념과 전제 조건까지 정확하게 적용하여 설명했습니다! 학습한 개념이 새로운 선지로 성공적으로 전이(Transfer)되었습니다.`;
  } else if (isJudgmentCorrect && !hasPhilosopherConfusion) {
    status = '부분 이해';
    overallFeedback = `선지의 정오답(${explanation.correctJudgment ? 'O' : 'X'})은 정확히 맞혔지만, 판단 이유에 핵심 개념어나 전제 조건(${explanation.keyEvidence})이 조금 더 구체적으로 포함되면 완벽한 이해에 도달할 수 있습니다.`;
  } else {
    status = '추가 학습 필요';
    overallFeedback = isJudgmentCorrect
      ? `정오답은 맞혔으나 사상가의 입장을 일부 혼동한 표현이 있습니다. ${explanation.keyEvidence}`
      : `아쉽게도 이 선지는 '${explanation.correctJudgment ? '옳은 선지(O)' : '틀린 선지(X)'}'입니다. ${explanation.explanation}`;
  }

  return {
    targetOptionId,
    targetOptionText: option.text,
    targetQuestionInfo: `${question.academicYear}학년도 ${question.examType} ${question.questionNumber}번 [데모]`,
    userJudgment,
    correctJudgment: explanation.correctJudgment,
    userReasoning: cleanReason,
    status,
    overallFeedback,
    criteriaEvaluation: {
      accurateConcept: {
        passed: hasCoreConcept,
        comment: hasCoreConcept
          ? `핵심 개념어(${matchedKeywords.slice(0, 3).join(', ')})를 사용하여 개념을 적절히 설명했습니다.`
          : '판단 이유에 핵심 개념어(예: 최소 수혜자, 축차적 우선성, 비정형적 원리 등)를 명시해 보세요.',
      },
      noPhilosopherConfusion: {
        passed: !hasPhilosopherConfusion,
        comment: !hasPhilosopherConfusion
          ? '사상가(롤스/노직)의 입장을 혼동하지 않고 일관되게 서술했습니다.'
          : '롤스와 노직의 입장이 서로 바뀌어 서술된 부분이 없는지 다시 확인해 보세요.',
      },
      considersConditions: {
        passed: hasConditionConsideration && isJudgmentCorrect,
        comment:
          hasConditionConsideration && isJudgmentCorrect
            ? '선지의 정당화 조건과 전제를 함께 고려하여 판단했습니다.'
            : `필수 조건 점검 필요: ${explanation.keyEvidence}`,
      },
      appliesToNewCase: {
        passed: isJudgmentCorrect && hasCoreConcept,
        comment:
          isJudgmentCorrect && hasCoreConcept
            ? '표현이 달라진 다른 기출 선지에도 개념을 정확히 적용했습니다.'
            : '다른 표현으로 출제된 선지에 개념을 적용하는 연습이 조금 더 필요합니다.',
      },
    },
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * [STEP 6. 개인별 개념 학습로그 초안 자동 생성 함수 - Section 6F]
 * 클리닉 대화 내용과 이해도 검증 결과를 종합하여 14개 필수 항목을 갖춘 학습로그 초안을 생성합니다.
 */
export function generateLearningLogDraftMock(params: {
  ctx: RetrievedContext;
  learningReason: LearningReasonType;
  messages: ChatMessage[];
  verification?: VerificationAttempt;
}): LearningLog {
  const { ctx, learningReason, messages, verification } = params;
  const { question, selectedOption, explanation, relatedConcepts, philosopherProfiles } = ctx;
  const reasonObj = getLearningReasonOption(learningReason);

  const studentMessages = messages.filter((m) => m.sender === 'student');
  const firstStudentMsg =
    studentMessages[0]?.content ??
    (selectedOption.optionId === 'q2025_09_07_opt1'
      ? '롤스는 평등을 중요하게 생각하는 사상가이기 때문에 모든 불평등을 제거해야 한다는 맞는 선지라고 생각함.'
      : '선지의 핵심 조건과 사상가의 입장을 정확히 연결하지 못해 헷갈렸음.');

  const lastStudentMsg =
    studentMessages.length > 1
      ? studentMessages[studentMessages.length - 1].content
      : explanation.keyEvidence;

  const status: Exclude<UnderstandingStatus, '미학습'> =
    verification?.status ?? (studentMessages.length >= 2 ? '부분 이해' : '검증 전');

  const nowIso = new Date().toISOString();

  return {
    logId: `log_${selectedOption.optionId}_${Date.now()}`,
    subject: question.subject,
    subjectName: question.subjectName,
    unit: question.unit,
    philosopherIds: selectedOption.philosopherIds,
    philosopherNames: philosopherProfiles.map((p) => p.nameKo),
    conceptIds: relatedConcepts.map((c) => c.conceptId),
    conceptNames: relatedConcepts.map((c) => c.conceptName),
    questionId: question.questionId,
    questionInfo: `${question.academicYear}학년도 ${question.examType} ${question.questionNumber}번 [데모용 자체 제작]`,
    optionId: selectedOption.optionId,
    optionNumber: selectedOption.optionNumber,
    optionText: selectedOption.text,
    learningReason,
    learningReasonLabel: reasonObj.label,
    initialUnderstanding: firstStudentMsg,
    discoveredMisconception:
      explanation.commonMisconceptions[0] ??
      '사상가의 핵심 전제 조건을 누락하고 표면적 키워드로만 선지를 판단함.',
    newlyUnderstoodConcept: lastStudentMsg,
    aiFeedbackSummary: `${explanation.explanation} (${explanation.keyEvidence})`,
    philosopherComparisonNote:
      '롤스는 천부적 재능의 분포를 공동 자산으로 보아 최소 수혜자에게 최대 이익이 되는 불평등을 허용(차등의 원칙)하는 반면, 노직은 자기 소유권에 기초하여 취득·이전·교정의 역사적 절차가 정당하면 결과적 격차와 무관하게 정의롭다고 본다.',
    verificationResult: verification,
    understandingStatus: status,
    furtherStudyNeeded:
      status === '이해 확인'
        ? '평등한 자유의 원칙 → 공정한 기회균등의 원칙 → 차등의 원칙으로 이어지는 축차적 우선성 변형 선지까지 주기적으로 복습하기'
        : `${relatedConcepts.map((c) => c.conceptName).join(', ')}의 필수 성립 조건(${relatedConcepts[0]?.necessaryConditions[0] ?? ''})을 다시 점검하고 유사 선지에 한 번 더 적용해보기`,
    createdAt: nowIso,
    updatedAt: nowIso,
    sources: [
      `${explanation.sourceTitle} (${explanation.sourcePage})`,
      ...relatedConcepts.map((c) => c.source),
    ],
    isDemoSample: false,
  };
}

