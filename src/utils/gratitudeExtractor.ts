/**
 * 감사일기 문맥 키워드 및 어구(Phrase) 추출 엔진
 * - 단순 단어 쪼개기가 아닌 [명사/대상 + 행위/상태]의 맥락을 살려 추출
 * - 조사/어미/보조사 및 의미 없는 파편 단어('않고', '나온', '있었던') 원천 제거
 * - '감사', '고마워' 등 과도하게 반복되는 일반 인사어 배제
 */

// 감사 관련 과대 빈도 단어 (워드클라우드를 독점하지 않도록 제외)
const GRATITUDE_GENERIC_WORDS = new Set([
  '감사', '감사해', '감사했다', '감사합니다', '감사함', '감사의', '고마워', '고마웠다', '고맙다', '고마움',
  '칭찬해', '칭찬', '뿌듯했다', '뿌듯함', '행복했다', '행복', '좋았다', '좋았어', '좋았음', '기분', '기분이'
]);

// 문맥 파편 및 기능어 불용어 (어미, 보조사, 시제, 불완전 형용사/부사 등)
const FUNCTIONAL_STOPWORDS = new Set([
  '않고', '않은', '않아', '않았다', '않아서', '못하고', '못한', '못해',
  '있었던', '있어서', '있는', '있던', '있게', '있고', '있었다', '있었어', '있었는데',
  '없었던', '없어서', '없는', '없던', '없게', '없고', '없었다', '없었는데',
  '나온', '나와서', '나오고', '나온다', '나왔다', '나왔어',
  '모르는', '모르고', '몰랐던', '알려준', '알려주었다',
  '끝까지', '어제', '오늘', '내일', '방금', '아까', '항상', '매일', '자주',
  '정말', '진짜', '너무', '아주', '매우', '가장', '다시', '계속', '스스로',
  '오랜만에', '조금', '많이', '가만히', '천천히', '열심히', '스스로', '함께',
  '그리고', '하지만', '그래서', '그런데', '그래도', '또한',
  '통해', '대해', '위해', '관한', '따라', '인해',
  '일어날', '다녀온', '마시며', '먹으며', '걸어온', '뛰어준', '버텨준',
  '좋아하는', '좋아하', '신나게', '따뜻하고', '맛있었어', '맛있', '맛있게',
  '개운하게', '친절하게', '두근거렸지만', '빌려주어서', '흘러나왔다', '닦아내어',
  '등교해서', '미루지', '끝낸', '마쳤다', '어려웠던', '편하게', '피곤하지',
  '씩씩하게', '건네준', '방과', '구역', '기운'
]);

// 한국어 명사 뒤에 붙는 조사 목록 (긴 조사부터 매칭하여 안전하게 분리)
const JOSA_SUFFIXES = [
  '에서는', '에게는', '으로는',
  '에서', '에게', '한테', '으로', '마다', '처럼', '같이',
  '보다', '만큼', '이라', '라는',
  '까지', '부터', '이란',
  '이가', '이나',
  '은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '만', '로'
];

/**
 * 어절 끝의 한국어 조사를 깔끔하게 제거하여 원형 명사 복원
 * 예: '단어를' -> '단어', '급식으로' -> '급식', '체력에' -> '체력', '몸에' -> '몸'
 */
export function stripJosa(token: string): string {
  let cleaned = token.replace(/[^가-힣a-zA-Z0-9]/g, '').trim();
  if (cleaned.length <= 1) return cleaned;

  // 특수 결합어 보호 (조사 제거 대상 아님)
  const PRESERVE = new Set(['피구', '축구', '체육', '급식', '친구', '우유', '노을', '숙제', '보고서', '다리']);
  if (PRESERVE.has(cleaned)) return cleaned;

  // 1글자 신체 부위 및 명사(몸, 눈, 손, 발, 귀, 꿈, 땀, 힘) 뒤에 붙은 조사 정제
  const ONE_LETTER_NOUNS = new Set(['몸', '눈', '손', '발', '귀', '꿈', '땀', '힘']);
  if (cleaned.length === 2 && ONE_LETTER_NOUNS.has(cleaned[0]) && ['에', '이', '을', '과', '도', '만', '로'].includes(cleaned[1])) {
    return cleaned[0] === '몸' ? '건강한 몸' : cleaned[0] === '눈' ? '두 눈' : cleaned[0];
  }

  for (const josa of JOSA_SUFFIXES) {
    if (cleaned.endsWith(josa) && cleaned.length >= josa.length + 2) {
      const stem = cleaned.slice(0, -josa.length);
      if (stem.length >= 2) {
        return stem;
      }
    }
  }
  return cleaned;
}

/**
 * 대표적인 학생 일상 2어절 결합 패턴 사전 (문맥 보존용 매핑)
 */
const COMMON_CONTEXT_PHRASES: Array<{ pattern: RegExp; phrase: string }> = [
  // 급식 / 음식
  { pattern: /급식.*닭강정|닭강정.*급식|닭강정/i, phrase: '급식 닭강정' },
  { pattern: /맛있.*급식|급식.*맛있|급식/i, phrase: '맛있는 급식' },
  { pattern: /딸기.*우유/i, phrase: '딸기 우유' },
  { pattern: /친구.*떡볶이|떡볶이.*친구|떡볶이/i, phrase: '친구와 떡볶이' },
  { pattern: /초콜릿.*(받|건네|선물|힘)|초콜릿/i, phrase: '친구의 초콜릿' },

  // 학교 활동 / 체육
  { pattern: /피구.*경기|체육.*피구|피구/i, phrase: '피구 경기' },
  { pattern: /체육.*시간|체육.*달리|체육/i, phrase: '체육 시간' },
  { pattern: /음악.*시간|피아노.*연주|피아노/i, phrase: '피아노 연주' },
  { pattern: /과학.*실험|보고서.*완성|과학/i, phrase: '과학 실험 보고서' },
  { pattern: /수학.*숙제|숙제.*끝|숙제/i, phrase: '숙제 완수' },
  { pattern: /수행평가.*(마침|끝|발표)|수행평가/i, phrase: '수행평가 완수' },
  { pattern: /청소.*구역|청소.*칭찬|청소/i, phrase: '교실 청소' },
  { pattern: /1교시.*수업|수업.*집중/i, phrase: '수업 집중' },
  { pattern: /운동장.*(뛰|바퀴)/i, phrase: '운동장 달리기' },
  { pattern: /점심시간.*(음악|방송)|점심.*음악/i, phrase: '점심 방송 음악' },

  // 또래 / 친구 관계
  { pattern: /단어.*알려|영어.*알려/i, phrase: '모르는 단어 설명' },
  { pattern: /필기도구.*빌려|필기.*도움/i, phrase: '필기도구 배려' },
  { pattern: /친구.*(도움|알려|배려|빌려)/i, phrase: '친구의 배려' },
  { pattern: /친구.*(웃|대화|이야기)/i, phrase: '친구와 즐거운 대화' },
  { pattern: /새로.*사귄.*짝꿍|짝꿍.*대화|짝꿍/i, phrase: '짝꿍과의 소통' },

  // 건강 / 신체 / 일상
  { pattern: /개운하게.*일어|아침.*일찍|일찍.*도착|지각하지/i, phrase: '상쾌한 아침 기상' },
  { pattern: /건강한.*몸|튼튼한.*체력|체력/i, phrase: '건강한 체력' },
  { pattern: /다치지.*않고|건강하게/i, phrase: '다치지 않은 건강' },
  { pattern: /하늘.*노을|분홍빛.*노을|노을/i, phrase: '예쁜 하늘 노을' },
  { pattern: /맑은.*세상.*(눈|시력)|시력/i, phrase: '맑게 보는 두 눈' },
  { pattern: /심호흡.*(버텨|진정|가라)/i, phrase: '심호흡으로 진정' },
  { pattern: /감기.*회복/i, phrase: '감기 빠른 회복' },
  { pattern: /걸어온.*(다리|발)|다리.*고마/i, phrase: '튼튼한 두 다리' }
];

/**
 * 한 문장에서 의미 있는 맥락 키워드 및 어구를 추출하는 함수
 */
export function extractContextualKeywords(sentence: string): string[] {
  if (!sentence || typeof sentence !== 'string') return [];
  const text = sentence.trim();
  if (!text) return [];

  const extracted: string[] = [];
  const matchedPhrases = new Set<string>();

  // 1단계: 2어절 결합 패턴 사전 매칭 (맥락이 온전히 살아있는 어구 우선)
  for (const { pattern, phrase } of COMMON_CONTEXT_PHRASES) {
    if (pattern.test(text)) {
      extracted.push(phrase);
      matchedPhrases.add(phrase);
    }
  }

  // 2단계: 개별 어절 조사 정제 및 핵심 명사 추출
  const rawTokens = text.split(/[\s,\.!?~。、\(\)\[\]'"]+/);

  for (let i = 0; i < rawTokens.length; i++) {
    const raw = rawTokens[i];
    if (!raw) continue;

    // 조사 제거
    const noun = stripJosa(raw);

    // 동사/형용사 활용 어미(서, 고, 며, 면, 니, 다, 지 등)로 끝나는 동사 파편 추가 제거
    const isVerbConjugation = /[하되먹보살오가나마받뛰걸지]?[서고며니다지]$/.test(noun) && noun.length >= 3;

    // 유효성 검증 (불용어, 인사말, 기능어 차단)
    if (
      noun.length >= 2 &&
      !GRATITUDE_GENERIC_WORDS.has(noun) &&
      !FUNCTIONAL_STOPWORDS.has(noun) &&
      !FUNCTIONAL_STOPWORDS.has(raw) &&
      !isVerbConjugation &&
      !/^[0-9]+$/.test(noun)
    ) {
      // 1단계 결합 어구와 완전히 겹치지 않는 독립 명사만 보조 등록
      const alreadyCovered = Array.from(matchedPhrases).some(p => p.includes(noun));
      if (!alreadyCovered) {
        extracted.push(noun);
      }
    }
  }

  // 문맥 어구가 1개 이상 추출되었다면, 잔여 단일 파편보다 어구를 우선하여 정돈
  const phrasesOnly = extracted.filter(item => item.includes(' '));
  if (phrasesOnly.length > 0) {
    // 어구가 있으면 어구 중심 + 고유명사/핵심명사(단어, 영어 등) 최대 1개 결합
    const nounsOnly = extracted.filter(item => !item.includes(' '));
    return Array.from(new Set([...phrasesOnly, ...nounsOnly.slice(0, 1)]));
  }

  // 중복 제거 후 반환
  return Array.from(new Set(extracted));
}
