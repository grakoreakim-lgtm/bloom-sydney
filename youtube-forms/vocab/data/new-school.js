// Vocabulary set: "A New School: Learning for All"
// One file drives BOTH the comic video and the mind-map video.
// Loaded in the browser (window.VOCAB) and in Node (module.exports).

const VOCAB = {
  id: 'new-school',
  title: { en: 'A New School: Learning for All', ko: '모두를 위한 새 학교' },
  level: 'B2',
  image: '../assets/comic.jpg',
  // comic grid: title band on top, 2 rows × 4 columns (fractions of the image)
  grid: { top: 0.085, rows: 2, cols: 4, bubbleHeight: 0.30 },

  // 4 branches of the mind map, each pointing at 2 panels
  branches: [
    { id: 'problem',  label: { en: 'THE OLD MODEL',        ko: '낡은 방식' },      color: '#e85d5d', panels: [1, 2] },
    { id: 'reform',   label: { en: 'HOLISTIC REFORM',      ko: '전인적 개혁' },    color: '#4f7be8', panels: [3, 4] },
    { id: 'strategy', label: { en: 'NEW STRATEGIES',       ko: '새 전략' },        color: '#e8a23f', panels: [5, 6] },
    { id: 'goal',     label: { en: 'THE GOAL: SUCCESS FOR ALL', ko: '목표: 모두의 성공' }, color: '#3fb57a', panels: [7, 8] },
  ],

  // 8 panels. `bubble` is the exact speech-bubble text; `target` is the word we teach.
  // `nuance` = how it differs from the word learners usually confuse it with.
  // `situation` = when a native speaker would actually reach for this word.
  // `quiz` = the bubble with the target blanked, plus a hint.
  panels: [
    { n: 1, bubble: "Our outdated, rigid syllabus doesn't work anymore!",
      target: 'syllabus', pos: '명사', ipa: '/ˈsɪləbəs/',
      meaning: '(한 과목의) 강의 계획서, 교수요목',
      nuance: 'curriculum은 학교 전체 교육과정, syllabus는 한 과목이 "무엇을 어떤 순서로" 배우는지 적은 문서',
      situation: '학기 첫 수업에서 교수가 나눠주는 그 종이. "Check the syllabus"는 "강의계획서 확인해"',
      bonus: { word: 'rigid', meaning: '융통성 없는, 경직된', nuance: 'strict(엄격한)보다 "바꿀 수 없는, 딱딱한" 느낌' },
      quiz: { blank: "Our outdated, rigid ______ doesn't work anymore!", hint: '한 과목의 강의 계획서' } },

    { n: 2, bubble: 'We must solve the growing disparity and deprivation among students!',
      target: 'disparity', pos: '명사', ipa: '/dɪˈspærəti/',
      meaning: '(불공정한) 격차, 불균형',
      nuance: 'difference는 그냥 차이, disparity는 "있어서는 안 되는, 불공정한 차이". 소득·교육·건강 격차에 씀',
      situation: '뉴스·보고서에서 "income disparity(소득 격차)", "regional disparity(지역 격차)"',
      bonus: { word: 'deprivation', meaning: '결핍, 박탈', nuance: 'poverty(가난)보다 "필요한 것을 못 받는 상태"에 초점' },
      quiz: { blank: 'We must solve the growing ______ and deprivation among students!', hint: '불공정한 격차' } },

    { n: 3, bubble: 'Before the faculty, I proposed a holistic reform.',
      target: 'holistic', pos: '형용사', ipa: '/hoʊˈlɪstɪk/',
      meaning: '전체적인, 전인적인',
      nuance: 'comprehensive는 "빠짐없이 다 포함한", holistic은 "부분들이 서로 연결된 하나로 보는". 교육·의료·건강에서 자주 씀',
      situation: '"a holistic approach to education" — 성적만이 아니라 인성·건강·관계까지 보는 교육',
      bonus: { word: 'faculty', meaning: '(대학의) 교수진', nuance: 'teachers는 교사 개개인, faculty는 교수진 전체를 묶어 부르는 말' },
      quiz: { blank: 'Before the faculty, I proposed a ______ reform.', hint: '부분이 아니라 전체를 보는' } },

    { n: 4, bubble: 'We respect all kinds of competence. Vocational training is one of them.',
      target: 'vocational', pos: '형용사', ipa: '/voʊˈkeɪʃənl/',
      meaning: '직업의, 직업 훈련의',
      nuance: 'professional은 "전문직의, 프로다운", vocational은 "특정 직업 기술을 배우는". 요리·용접·간호 같은 실무 훈련',
      situation: '"vocational school(직업학교)", "vocational training(직업 훈련)" — 학위보다 기술 중심일 때',
      bonus: { word: 'competence', meaning: '능력, 역량', nuance: 'ability보다 격식 있고 "일을 제대로 해낼 수 있는 자격"의 느낌' },
      quiz: { blank: 'We respect all kinds of competence. ______ training is one of them.', hint: '직업 기술을 배우는' } },

    { n: 5, bubble: 'We will allocate a budget and provide tailored learning for each student.',
      target: 'allocate', pos: '동사', ipa: '/ˈæləkeɪt/',
      meaning: '(자원·예산을) 할당하다, 배정하다',
      nuance: 'give는 그냥 주다, allocate는 "전체 중 일부를 특정 목적에 공식적으로 떼어 주다". 예산·시간·자리에 씀',
      situation: '"allocate a budget / allocate time / allocate seats" — 회의나 보고서에서',
      bonus: { word: 'tailored', meaning: '맞춤형의', nuance: '재단사(tailor)가 몸에 맞게 옷을 짓듯 "개인에게 맞춘"' },
      quiz: { blank: 'We will ______ a budget and provide tailored learning for each student.', hint: '예산을 배정하다' } },

    { n: 6, bubble: 'Everyone is reaching proficiency in their field!',
      target: 'proficiency', pos: '명사', ipa: '/prəˈfɪʃənsi/',
      meaning: '숙달, 능숙함',
      nuance: 'skill은 기술 자체, proficiency는 "그 기술을 능숙하게 쓰는 수준". 시험 이름에 자주 등장',
      situation: '"English proficiency test", "reach proficiency in Python" — 수준·등급을 말할 때',
      bonus: null,
      quiz: { blank: 'Everyone is reaching ______ in their field!', hint: '능숙한 수준' } },

    { n: 7, bubble: "Academic attainment isn't everything. We also reduced the dropout rate!",
      target: 'attainment', pos: '명사', ipa: '/əˈteɪnmənt/',
      meaning: '(노력해서 얻은) 성취, 달성',
      nuance: 'achievement는 일상에서 두루 쓰고, attainment는 교육·정책 문서에서 "도달한 수준"을 말할 때. "educational attainment(학력 수준)"',
      situation: '통계·정책에서 "levels of attainment", 학위·자격을 얻은 정도',
      bonus: { word: 'dropout', meaning: '중퇴(자)', nuance: '"dropout rate" = 중퇴율. 동사는 drop out of school' },
      quiz: { blank: "Academic ______ isn't everything. We also reduced the dropout rate!", hint: '노력해서 도달한 성취' } },

    { n: 8, bubble: 'This is a truly inclusive learning community for all!',
      target: 'inclusive', pos: '형용사', ipa: '/ɪnˈkluːsɪv/',
      meaning: '포용적인, 모두를 포함하는',
      nuance: 'open(열린)보다 적극적으로 "소외되는 사람이 없게 하는". 반대말은 exclusive(배타적인)',
      situation: '"inclusive education", "an inclusive workplace" — 장애·배경과 상관없이 모두 참여하는',
      bonus: null,
      quiz: { blank: 'This is a truly ______ learning community for all!', hint: '모두를 포함하는 (↔ exclusive)' } },
  ],
};

if (typeof module !== 'undefined') module.exports = VOCAB;
if (typeof window !== 'undefined') window.VOCAB = VOCAB;
