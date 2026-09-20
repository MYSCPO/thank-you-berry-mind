import { MoodType, QuadrantConfig, Quote, Meditation, Student, DiaryEntry } from '../types';

export const MOOD_MAP: Record<string, MoodType> = {
  // A형
  '놀란':'A형','서프라이즈':'A형','긍정적인':'A형','들뜬':'A형','흥겨운':'A형',
  '아주신나는':'A형','황홀한':'A형','기운이넘치는':'A형','활발한':'A형','흥분한':'A형',
  '낙관적인':'A형','열광하는':'A형','만족스러운':'A형','집중하는':'A형','행복한':'A형',
  '자랑스러운':'A형','짜릿한':'A형','신나는':'A형','기쁨':'A형','뿌듯함':'A형',
  '쾌활한':'A형','열정적인':'A형','의기양양한':'A형','즐거운':'A형','설레는':'A형',
  // B형
  '느긋한':'B형','태평한':'B형','자족하는':'B형','다정한':'B형','충만한':'B형',
  '평온한':'B형','안전한':'B형','감사하는':'B형','편안한':'B형','안정적인':'B형',
  '여유로운':'B형','차분한':'B형','생각이깊은':'B형','평화로운':'B형','편한':'B형',
  '근심적은':'B형','나른한':'B형','호젓한':'B형','고요한':'B형','안온한':'B형',
  '평온':'B형','안정':'B형','편안':'B형','만족한':'B형','따뜻한':'B형',
  // C형
  '격분한':'C형','공황에빠진':'C형','스트레스받는':'C형','초조한':'C형','충격받은':'C형',
  '격노한':'C형','몹시화가난':'C형','좌절한':'C형','신경이날카로운':'C형','겁먹은':'C형',
  '화난':'C형','안절부절못하는':'C형','불안한':'C형','우려하는':'C형','근심하는':'C형',
  '짜증나는':'C형','거슬리는':'C형','불쾌한':'C형','짜증':'C형','화남':'C형',
  '불안':'C형','긴장':'C형','스트레스':'C형','두려운':'C형','조급한':'C형',
  // D형
  '역겨운':'D형','실망스러운':'D형','의욕없는':'D형','낙담한':'D형','비관적인':'D형',
  '시무룩한':'D형','슬픔':'D형','지루함':'D형','소외된':'D형','비참한':'D형',
  '외로운':'D형','기죽은':'D형','우울한':'D형','둔한':'D형','기진맥진한':'D형',
  '지친':'D형','절망적인':'D형','가망없는':'D형','고독한':'D형','소모된':'D형',
  '슬픈':'D형','우울':'D형','피곤':'D형','무기력':'D형','허무한':'D형',
};

export const QUADRANT_CONFIGS: Record<'A' | 'B' | 'C' | 'D', QuadrantConfig> = {
  A: {
    id: 'A',
    type: 'A형',
    name: 'A영역',
    concept: '해 (맑음)',
    icon: '☀️',
    energyMood: '에너지↑ 기분↑',
    bgGradient: 'from-amber-50 to-yellow-100/70',
    cardBg: 'bg-[#fff9e6]',
    borderColor: 'border-amber-200',
    accentColor: '#e69500',
    activeBorder: 'border-amber-500 ring-2 ring-amber-400/40 shadow-amber-200/50',
    label: 'A영역 (해 ☀️)',
    description: '에너지가 높고 기분이 아주 좋아요',
    interpret: '지금 너는 에너지가 넘치고 기분도 아주 좋은 상태야!\n무드미터의 노란 햇살 영역 — 활기와 즐거움이 가득한 곳이야. ✨',
    emotions: [
      '신나는', '설레는', '행복한', '뿌듯함', '기쁨', '자랑스러운',
      '들뜬', '즐거운', '긍정적인', '활발한', '열정적인', '짜릿한',
      '만족스러운', '쾌활한', '의기양양한', '낙관적인', '집중하는', '놀란'
    ]
  },
  B: {
    id: 'B',
    type: 'B형',
    name: 'B영역',
    concept: '새싹 (평온)',
    icon: '🌱',
    energyMood: '에너지↓ 기분↑',
    bgGradient: 'from-emerald-50 to-green-100/70',
    cardBg: 'bg-[#f0faf0]',
    borderColor: 'border-emerald-200',
    accentColor: '#2e8b57',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-400/40 shadow-emerald-200/50',
    label: 'B영역 (새싹 🌱)',
    description: '차분하고 마음이 편안해요',
    interpret: '지금 너는 차분하고 마음이 따뜻하게 안정된 상태야.\n무드미터의 초록 새싹 영역 — 고요하고 평화로운 휴식이 깃든 곳이야. 🌿',
    emotions: [
      '평온한', '편안한', '감사하는', '따뜻한', '다정한', '여유로운',
      '차분한', '안정적인', '만족한', '느긋한', '생각이깊은', '평화로운',
      '고요한', '충만한', '자족하는', '안온한', '나른한', '호젓한'
    ]
  },
  C: {
    id: 'C',
    type: 'C형',
    name: 'C영역',
    concept: '구름 (긴장)',
    icon: '☁️',
    energyMood: '에너지↑ 기분↓',
    bgGradient: 'from-rose-50 to-red-100/70',
    cardBg: 'bg-[#fff0f0]',
    borderColor: 'border-rose-200',
    accentColor: '#e04555',
    activeBorder: 'border-rose-500 ring-2 ring-rose-400/40 shadow-rose-200/50',
    label: 'C영역 (구름 ☁️)',
    description: '불안하고 긴장되거나 짜증나요',
    interpret: '지금 마음속에 먹구름이 끼어 긴장하거나 불안한 상태야.\n마음이 급해질 수 있지만, 잠시 숨을 고르면 구름은 걷힐 거야. ⛈️',
    emotions: [
      '불안한', '긴장', '스트레스', '짜증나는', '초조한', '두려운',
      '조급한', '화난', '겁먹은', '좌절한', '우려하는', '안절부절못하는',
      '거슬리는', '불쾌한', '근심하는', '충격받은', '격분한', '신경이날카로운'
    ]
  },
  D: {
    id: 'D',
    type: 'D형',
    name: 'D영역',
    concept: '빗방울 (지침)',
    icon: '💧',
    energyMood: '에너지↓ 기분↓',
    bgGradient: 'from-sky-50 to-blue-100/70',
    cardBg: 'bg-[#eef2ff]',
    borderColor: 'border-sky-200',
    accentColor: '#3a72c7',
    activeBorder: 'border-sky-500 ring-2 ring-sky-400/40 shadow-sky-200/50',
    label: 'D영역 (빗방울 💧)',
    description: '지치고 기분이 가라앉았어요',
    interpret: '지금 몸과 마음이 빗방울처럼 가라앉고 지친 상태야.\n누구나 비 오는 날이 있어. 오늘은 나에게 따뜻한 쉼을 선물해주자. 🌧️',
    emotions: [
      '지친', '피곤', '우울한', '무기력', '외로운', '슬픔',
      '낙담한', '시무룩한', '실망스러운', '의욕없는', '비관적인', '소외된',
      '기죽은', '허무한', '고독한', '절망적인', '비참한', '기진맥진한'
    ]
  }
};

export const CHEER_MESSAGES: Record<MoodType, string[]> = {
  'A형': [
    '너의 빛나는 밝은 에너지가 교실 전체를 환하게 비추고 있어! 이 기분 좋은 순간을 듬뿍 만끽해봐 ☀️',
    '신나고 기분 좋은 하루를 보내고 있구나! 오늘 느낀 기쁨의 씨앗을 감사일기에 쏙 담아두자 🍓',
    '자신감과 활기가 넘치는 멋진 날이야! 네 긍정적인 미소가 주변 친구들에게도 큰 힘이 될 거야.'
  ],
  'B형': [
    '차분하고 평온한 마음은 가장 단단한 힘이야. 편안한 숨을 들이쉬며 오늘 하루를 고마움으로 채워보자 🌱',
    '마음의 여유를 가질 줄 아는 네가 참 멋져. 잔잔하고 따뜻한 이 기운을 소중히 간직해봐 :)',
    '고요한 호수처럼 맑은 너의 마음! 잔잔함 속에서 오늘 하루 감사했던 일들을 천천히 떠올려보자 🍵'
  ],
  'C형': [
    '지금 마음이 복잡하고 불안해도 괜찮아. 누구나 때로는 비바람을 만나거든. 깊게 세 번 숨을 쉬어보자 🫁',
    '짜증이나 긴장은 네가 그만큼 무언가에 진심이라는 신호야. 너는 충분히 잘 이겨낼 수 있어, 힘내!',
    '잠시 어깨의 힘을 빼고 가슴을 펴보자. 이 순간도 지나갈 거야. 너의 곁에서 늘 응원하고 있어 🌿'
  ],
  'D형': [
    '오늘 하루 많이 지쳤구나. 버텨내 준 것만으로도 넌 정말 대단해. 오늘만큼은 너 자신을 꼭 안아줘 💧',
    '힘든 마음을 솔직하게 알아채 준 네 용기를 칭찬해. 비가 내린 뒤에 땅이 더 단단해지듯 너도 자라고 있어.',
    '지치고 기운 없을 땐 푹 쉬어도 괜찮아. 오늘 하루를 견딘 너에게 따뜻한 위로와 토닥임을 전해 🍓'
  ]
};

export const QUOTES: Quote[] = [
  { author: '마하트마 간디', quote: '감사하는 마음은 가장 위대한 미덕일 뿐 아니라 다른 모든 미덕의 어머니이다.', source: '명상록' },
  { author: '랄프 왈도 에머슨', quote: '매일 아침 눈을 뜰 때마다 감사할 줄 아는 사람은 늘 행복의 문 앞에 서 있다.', source: '자연' },
  { author: '헬렌 켈러', quote: '태양을 향해 고개를 들라. 그러면 그림자는 보이지 않을 것이다.', source: '사흘만 볼 수 있다면' },
  { author: '로마 명언', quote: '감사는 고귀한 영혼이 지닌 가장 아름다운 향기이다.', source: '고대 경구' },
  { author: '오프라 윈프리', quote: '내가 가진 것에 감사하면 더 많은 것을 갖게 되지만, 없는 것에 집착하면 결코 만족할 수 없다.', source: '내가 확실히 아는 것들' },
  { author: '빅터 프랭클', quote: '어떤 상황에서도 우리에게 남겨진 마지막 자유는 자신의 태도를 선택하는 것이다.', source: '죽음의 수용소에서' },
  { author: '땡큐베리마인드', quote: '작은 감사의 한 줄이 내일의 나를 더 단단하고 따뜻하게 만들어 줍니다 🌱', source: '마음챙김 수첩' }
];

export interface MeditationVideo {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  duration: string;
  url: string;
  youtubeId: string;
  tag: string;
}

export const MEDITATION_POOL: Record<MoodType, MeditationVideo[]> = {
  'A형': [
    {
      id: 'a1',
      emoji: '☀️',
      title: '5분 호흡명상 — 뇌를 위한 최고의 휴식법',
      desc: '넘치는 밝은 에너지를 기분 좋게 정돈하고 맑은 집중력을 깨워요.',
      duration: '5분 소요',
      url: 'https://www.youtube.com/watch?v=dZewQEbQQM0',
      youtubeId: 'dZewQEbQQM0',
      tag: '기본 추천'
    },
    {
      id: 'a2',
      emoji: '✨',
      title: '마음챙김 명상 — 지금 이 순간에 집중하기',
      desc: '행복한 감각을 온전히 음미하며 지금 여기에 차분히 머물러요.',
      duration: '7분 소요',
      url: 'https://youtu.be/inxASczOPTM',
      youtubeId: 'inxASczOPTM',
      tag: '추가 추천'
    }
  ],
  'B형': [
    {
      id: 'b1',
      emoji: '🌱',
      title: '마음챙김 — 호흡 명상',
      desc: '평온하고 고요한 숨결을 따라 몸과 마음의 긴장을 부드럽게 풀어요.',
      duration: '5분 소요',
      url: 'https://www.youtube.com/watch?v=tNao3xp5yjM',
      youtubeId: 'tNao3xp5yjM',
      tag: '기본 추천'
    },
    {
      id: 'b2',
      emoji: '🍵',
      title: '잔잔한 마음챙김 명상',
      desc: '따뜻한 차 한 잔처럼 마음을 잔잔하고 편안하게 안아줘요.',
      duration: '6분 소요',
      url: 'https://youtu.be/ZD6YZZ4ghJ4',
      youtubeId: 'ZD6YZZ4ghJ4',
      tag: '추가 추천'
    }
  ],
  'C형': [
    {
      id: 'c1',
      emoji: '🫁',
      title: '마음이 차분해지는 5분 호흡운동',
      desc: '긴장되고 불안한 마음을 들이마시고 내쉬는 5분 호흡으로 가라앉혀요.',
      duration: '5분 소요',
      url: 'https://www.youtube.com/watch?v=bG4e-HnlJTE',
      youtubeId: 'bG4e-HnlJTE',
      tag: '기본 추천'
    },
    {
      id: 'c2',
      emoji: '🌿',
      title: '불안을 가라앉히는 호흡 명상',
      desc: '복잡한 생각을 잠시 내려놓고 어깨와 가슴의 긴장을 털어내요.',
      duration: '6분 소요',
      url: 'https://youtu.be/ukSkm4c6N7E',
      youtubeId: 'ukSkm4c6N7E',
      tag: '추가 추천'
    }
  ],
  'D형': [
    {
      id: 'd1',
      emoji: '💧',
      title: '뇌를 10분만에 리셋하는 마음챙김 명상',
      desc: '지치고 무거운 뇌에 깊은 휴식을 선물하고 새 힘을 채워요.',
      duration: '10분 소요',
      url: 'https://www.youtube.com/watch?v=6nJztK7RBbQ',
      youtubeId: '6nJztK7RBbQ',
      tag: '기본 추천'
    },
    {
      id: 'd2',
      emoji: '🫂',
      title: '지친 마음을 위한 회복 명상',
      desc: '오늘 하루도 수고한 나 자신을 너그럽고 다정하게 토닥여줘요.',
      duration: '6분 소요',
      url: 'https://youtu.be/ZD6YZZ4ghJ4',
      youtubeId: 'ZD6YZZ4ghJ4',
      tag: '추가 추천'
    }
  ]
};

export const MEDITATIONS: Record<MoodType, Meditation> = {
  'A형': {
    emoji: '☀️',
    title: '5분 호흡명상 — 뇌를 위한 최고의 휴식법',
    desc: '넘치는 에너지를 고르게 정돈하고 온전한 집중력을 깨워요.',
    duration: '5분 소요 · 집중력 향상',
    url: 'https://www.youtube.com/watch?v=dZewQEbQQM0'
  },
  'B형': {
    emoji: '🌱',
    title: '마음챙김 — 호흡 명상',
    desc: '평온하고 안정된 이 기분을 몸 구석구석 기억하도록 깊이 호흡해요.',
    duration: '5분 소요 · 마음 안정 & 자존감',
    url: 'https://www.youtube.com/watch?v=tNao3xp5yjM'
  },
  'C형': {
    emoji: '🫁',
    title: '마음이 차분해지는 5분 호흡운동',
    desc: '들이마시고 멈추고 내쉬며 긴장된 자율신경을 편안하게 이완해요.',
    duration: '5분 소요 · 긴장 완화 & 불안 진정',
    url: 'https://www.youtube.com/watch?v=bG4e-HnlJTE'
  },
  'D형': {
    emoji: '💧',
    title: '뇌를 10분만에 리셋하는 마음챙김 명상',
    desc: '무기력하거나 가라앉을 때, 아무 판단 없이 나를 따뜻하게 쉬게 해줘요.',
    duration: '10분 소요 · 피로 회복 & 정서 충전',
    url: 'https://www.youtube.com/watch?v=6nJztK7RBbQ'
  }
};

export const STOPWORDS = new Set([
  '이','가','을','를','은','는','의','에','와','과','도','만','로','으로','에서','에게','한테',
  '이랑','랑','이나','나','까지','부터','마다','처럼','같이','보다','만큼','이라도','라도',
  '있어','없어','있는','없는','있게','있어서','없어서','있고','없고','있었','없었',
  '하는','하고','해서','했고','했어','하게','하면','하지','한다','합니다','해요','해줘',
  '되는','되고','되어','되서','됐고','됐어','되었','되면',
  '같은','같아','같이','같고','같아서',
  '이런','그런','저런','어떤','모든','각각','여러','다른',
  '오늘','어제','내일','이번','지난','다음','아까','방금','이제','아직','벌써','드디어',
  '학교에','수업에','수업을','체육시간에','아침에','점심에','저녁에',
  '그리고','그런데','하지만','그래서','그래도','또한','또','물론','특히','정말','진짜',
  '너무','매우','아주','좀','더','잘','못','안','왜','어떻게','언제','어디',
  '나','우리','나의','내가','우리가','친구가','선생님이','엄마가','아빠가',
  '있','없','하','되','같','이','그','저','것','수','등','때','후','전','중'
]);

export const INITIAL_STUDENTS: Student[] = [
  { grade: '1', classroom: '1', number: '1', name: '김민준' },
  { grade: '1', classroom: '1', number: '2', name: '이서아' },
  { grade: '1', classroom: '1', number: '3', name: '박도윤' },
  { grade: '1', classroom: '2', number: '1', name: '최지우' },
  { grade: '1', classroom: '2', number: '2', name: '정하율' },
  { grade: '2', classroom: '1', number: '1', name: '강시우' },
  { grade: '2', classroom: '1', number: '2', name: '조은우' },
  { grade: '2', classroom: '1', number: '3', name: '윤서연' },
  { grade: '2', classroom: '3', number: '7', name: '김하은' }, // Current demo student
  { grade: '2', classroom: '3', number: '8', name: '장민서' },
  { grade: '2', classroom: '3', number: '9', name: '임예준' },
  { grade: '3', classroom: '1', number: '1', name: '한지민' },
  { grade: '3', classroom: '1', number: '2', name: '오수아' },
  { grade: '3', classroom: '2', number: '1', name: '송현우' }
];

export const INITIAL_DIARIES: DiaryEntry[] = [
  {
    id: 'd-001',
    timestamp: '2026-09-08T09:15:00.000Z',
    dateStr: '2026-09-08',
    grade: '2',
    classroom: '3',
    number: '7',
    studentName: '김하은',
    moodType: 'B형',
    emotionWord: '평온한',
    gratitude1: '아침에 개운하게 일어날 수 있었던 건강한 몸에 고마워.',
    gratitude2: '좋아하는 딸기 우유를 마시며 등교해서 기분이 좋았다.',
    gratitude3: '수학 숙제를 미루지 않고 어제 밤에 다 끝낸 점 칭찬해!',
    message: '차분하고 평온한 마음은 가장 단단한 힘이야 🌱'
  },
  {
    id: 'd-002',
    timestamp: '2026-09-10T14:30:00.000Z',
    dateStr: '2026-09-10',
    grade: '2',
    classroom: '3',
    number: '7',
    studentName: '김하은',
    moodType: 'A형',
    emotionWord: '신나는',
    gratitude1: '체육 시간에 피구 경기에서 끝까지 신나게 뛰어준 두 다리 고마워.',
    gratitude2: '급식으로 나온 닭강정이 따뜻하고 정말 맛있었어.',
    gratitude3: '친구 민서가 모르는 영어 단어를 친절하게 알려주었다.',
    message: '너의 밝은 에너지가 교실을 환하게 비추고 있어 ☀️'
  },
  {
    id: 'd-003',
    timestamp: '2026-09-12T16:00:00.000Z',
    dateStr: '2026-09-12',
    grade: '2',
    classroom: '3',
    number: '7',
    studentName: '김하은',
    moodType: 'C형',
    emotionWord: '초조한',
    gratitude1: '긴장해서 두근거렸지만 심호흡하며 잘 버텨준 심장에게 고마워.',
    gratitude2: '음악 시간에 선생님께서 피아노 연주 소리가 곱다고 칭찬해주셨다.',
    gratitude3: '수행평가 발표 차례를 피하지 않고 끝까지 마쳤다.',
    message: '잠시 어깨 힘을 빼고 심호흡해보자, 넌 잘 해낼 수 있어 🌿'
  },
  {
    id: 'd-004',
    timestamp: '2026-09-15T15:20:00.000Z',
    dateStr: '2026-09-15',
    grade: '2',
    classroom: '3',
    number: '7',
    studentName: '김하은',
    moodType: 'A형',
    emotionWord: '행복한',
    gratitude1: '감기 기운이 있었는데 푹 자고 금방 회복된 튼튼한 체력에 감사해.',
    gratitude2: '방과 후 친구들과 떡볶이를 먹으며 실컷 웃은 시간.',
    gratitude3: '청소 구역을 맡아 깨끗하게 닦아내어 선생님께 칭찬받았다.',
    message: '신나고 기분 좋은 하루! 행복의 씨앗을 듬뿍 간직하자 🍓'
  },
  {
    id: 'd-005',
    timestamp: '2026-09-16T17:00:00.000Z',
    dateStr: '2026-09-16',
    grade: '2',
    classroom: '3',
    number: '8',
    studentName: '장민서',
    moodType: 'A형',
    emotionWord: '뿌듯함',
    gratitude1: '오랜만에 운동장 세 바퀴를 뛰고도 지치지 않은 체력에 감사.',
    gratitude2: '하늘 노을이 분홍빛으로 물들어서 기분이 몽글몽글했다.',
    gratitude3: '어려웠던 과학 실험 보고서를 스스로 완성해냈다.',
    message: '스스로를 자랑스러워해도 충분해! 멋진 성취 축하해 ✨'
  },
  {
    id: 'd-006',
    timestamp: '2026-09-16T18:00:00.000Z',
    dateStr: '2026-09-16',
    grade: '2',
    classroom: '3',
    number: '9',
    studentName: '임예준',
    moodType: 'B형',
    emotionWord: '감사하는',
    gratitude1: '시력이 나빠지지 않고 맑은 세상을 볼 수 있는 두 눈에 감사.',
    gratitude2: '점심시간에 좋아하는 음악이 방송으로 흘러나왔다.',
    gratitude3: '짝꿍이 필기도구를 빌려주어서 편하게 필기할 수 있었다.',
    message: '잔잔하고 따뜻한 여유를 소중히 간직해봐 🌱'
  },
  {
    id: 'd-007',
    timestamp: '2026-09-17T08:30:00.000Z',
    dateStr: '2026-09-17',
    grade: '2',
    classroom: '1',
    number: '1',
    studentName: '강시우',
    moodType: 'D형',
    emotionWord: '피곤',
    gratitude1: '피곤하지만 학교까지 씩씩하게 걸어온 내 다리에게 고맙다.',
    gratitude2: '친구가 건네준 초콜릿 한 조각이 큰 힘이 되었다.',
    gratitude3: '졸음을 참고 1교시 수업에 집중하려고 애쓴 나.',
    message: '오늘 하루를 견딘 너에게 따뜻한 위로와 휴식을 선물해 💧'
  },
  {
    id: 'd-008',
    timestamp: '2026-09-17T09:00:00.000Z',
    dateStr: '2026-09-17',
    grade: '1',
    classroom: '1',
    number: '1',
    studentName: '김민준',
    moodType: 'A형',
    emotionWord: '즐거운',
    gratitude1: '다치지 않고 건강하게 뛰어놀 수 있어서 감사.',
    gratitude2: '새로 사귄 짝꿍과 취미가 같아서 대화가 잘 통했다.',
    gratitude3: '아침 일찍 일어나 지각하지 않고 일찍 도착했다.',
    message: '신나고 밝은 하루가 펼쳐질 거야! 활기찬 너를 응원해 ☀️'
  }
];
