((async () => {
  const supabaseConfig = window.SUPABASE_CONFIG;
  if (supabaseConfig && supabaseConfig.isConfigured()) {
    const { createClient } = await import(supabaseConfig.clientUrl);
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      window.location.replace("login.html");
      return;
    }
    window.gameAuth = { supabase, user: data.session.user };
  }

  const saveKey = window.gameAuth?.user?.id
    ? `national-diary-save-v3:${window.gameAuth.user.id}`
    : "national-diary-save-v3:local";
  const routes = [...document.querySelectorAll("[data-route]")];
  const views = [...document.querySelectorAll("[data-view]")];
  const toast = document.querySelector(".toast");
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  let toastTimer;

  const stockDefinitions = [
    { id: "NEX", name: "넥스칩", sector: "반도체", price: 118500 },
    { id: "SOL", name: "솔라웨이브", sector: "신재생에너지", price: 54200 },
    { id: "MED", name: "메디온", sector: "바이오", price: 64900 },
    { id: "HNB", name: "한빛은행", sector: "금융", price: 42300 },
    { id: "MOB", name: "모빌리티랩", sector: "모빌리티", price: 76400 },
    { id: "CLO", name: "클라우드9", sector: "IT서비스", price: 93600 },
    { id: "BOK", name: "보국건설", sector: "건설", price: 31200 },
    { id: "ONE", name: "온누리식품", sector: "식품", price: 38700 },
    { id: "MIR", name: "미래전력", sector: "전력", price: 27500 },
    { id: "SBL", name: "새봄바이오", sector: "바이오", price: 81600 }
  ];
  const tradeQuantities = Object.fromEntries(stockDefinitions.map((stock) => [stock.id, "1"]));

  const buildings = [
    { id: "district-office", name: "지역구 민원센터", kind: "지역 사무소", price: 45000000, icon: "⌂", description: "주민을 만날 거점을 마련합니다.", effects: "인지도 +3 · 지지율 +2", political: { awareness: 3, support: 2 }, daily: { awareness: 1 } },
    { id: "policy-center", name: "정책연구원", kind: "정책 시설", price: 80000000, icon: "▤", description: "전문 정책 인력과 연구 기반을 확보합니다.", effects: "정책 능력 +4 · 영향력 +2", skills: { policy: 4 }, political: { influence: 2 }, daily: { influence: 1 } },
    { id: "media-studio", name: "시민미디어센터", kind: "언론 시설", price: 95000000, icon: "◉", description: "정책과 활동을 시민에게 더 널리 알립니다.", effects: "인지도 +5 · 대중성 +3", skills: { popularity: 3 }, political: { awareness: 5 }, daily: { awareness: 1 } },
    { id: "community-hall", name: "생활문화회관", kind: "주민 시설", price: 125000000, icon: "✦", description: "지역 모임과 공공 프로그램을 운영합니다.", effects: "지지율 +5 · 신뢰도 +3", political: { support: 5, trust: 3 }, daily: { support: 1 } }
  ];

  const nationalPriorities = [
    { id: "local-economy", title: "지역 경제 회복", detail: "소상공인 금융 지원과 지역 상권 활성화", ap: 3, budget: 4, effects: "GDP +8조 · 실업률 -0.4%p · 행복도 +6", country: { gdp: 8, unemployment: -0.4, happiness: 6, stability: 2 }, political: { support: 4, influence: 3 }, skills: { politics: 2 } },
    { id: "youth-jobs", title: "청년 고용 확대", detail: "청년 채용 지원과 직업 훈련 기회 확대", ap: 3, budget: 6, effects: "GDP +10조 · 실업률 -0.6%p · 행복도 +7", country: { gdp: 10, unemployment: -0.6, happiness: 7, stability: 1 }, political: { support: 3, awareness: 3 }, skills: { policy: 2, economy: 1 } },
    { id: "disaster-system", title: "재난 대응 체계 개선", detail: "현장 대응 인력과 지역 대피 기반 확충", ap: 2, budget: 3, effects: "행복도 +5 · 신뢰도 +6 · 안정도 +8", country: { happiness: 5, trust: 6, stability: 8, debt: 1 }, political: { support: 4, trust: 4 }, skills: { administration: 2 } }
  ];

  const diplomacyCountries = [
    { id: "us", name: "미국", short: "US", detail: "안보 동맹 · 첨단 기술" },
    { id: "japan", name: "일본", short: "JP", detail: "한일 협력 · 공급망" },
    { id: "china", name: "중국", short: "CN", detail: "교역 · 역내 안정" },
    { id: "russia", name: "러시아", short: "RU", detail: "에너지 · 지역 안보" },
    { id: "uk", name: "영국", short: "UK", detail: "통상 · 안보 협력" },
    { id: "france", name: "프랑스", short: "FR", detail: "산업 · 문화 교류" },
    { id: "germany", name: "독일", short: "DE", detail: "제조업 · 기후 기술" },
    { id: "india", name: "인도", short: "IN", detail: "기술 · 인도태평양" },
    { id: "australia", name: "호주", short: "AU", detail: "자원 · 해양 안보" }
  ];

  const diplomacyAgendaThemes = [
    { title: "공급망 안정", details: ["핵심 광물 장기 공급과 공동 비축", "반도체 소재 통관 절차 간소화", "의약품 원료 공급망 다변화", "항만 물류 병목 해소와 운송 협력", "식량 위기 시 긴급 수출 협의"] },
    { title: "무역과 투자", details: ["중소기업 수출 절차 간소화", "상호 투자 심사 기준의 투명성", "디지털 서비스 시장 접근성", "농수산물 검역 기준 조율", "청정 산업 공동 투자 기금"] },
    { title: "기후와 에너지", details: ["재생에너지 기술 공동 개발", "수소 운송 규격과 인증 상호 인정", "탄소 감축 실적 측정 기준 통일", "전력망 위기 시 에너지 협력", "산불과 폭염 조기 경보 정보 공유"] },
    { title: "안보와 평화", details: ["해상 구조와 재난 대응 훈련", "군 통신선의 우발 충돌 방지", "사이버 공격 정보 공유 원칙", "국제 분쟁의 긴장 완화 채널", "방위 산업 기술 보호 기준"] },
    { title: "과학과 기술", details: ["인공지능 안전성 공동 연구", "우주 잔해 추적 정보 교환", "연구자 교류와 공동 특허 절차", "양자 기술의 민간 활용 협력", "통신 표준과 주파수 간섭 조정"] },
    { title: "보건과 안전", details: ["감염병 조기 경보와 검체 공유", "고령화 대응 의료 기술 협력", "의약품 긴급 공급 절차", "식품 안전 사고 공동 조사", "응급 구조대 합동 훈련"] },
    { title: "교육과 인재", details: ["대학 간 학점과 자격 상호 인정", "청년 연구자 교환 프로그램", "직업 훈련 과정 공동 개발", "유학생 안전과 지원 창구", "한국어 및 현지 언어 교육 교류"] },
    { title: "문화와 관광", details: ["청년 예술가 순회 교류전", "관광객 편의를 위한 입국 정보 개선", "문화재 불법 거래 방지 협력", "영화와 게임 공동 제작 지원", "스포츠 교류와 선수 안전 기준"] },
    { title: "개발과 인도 지원", details: ["재난 피해국 긴급 구호 물자 조달", "개발 사업의 공동 평가 기준", "식수와 위생 시설 기술 지원", "농업 생산성 향상 시범 사업", "인도 지원 인력의 현장 안전"] },
    { title: "국제 규범과 제도", details: ["국제기구 의제에 대한 사전 협의", "디지털 개인정보 보호 원칙", "해양 오염 감시 자료 공유", "경제 제재의 인도적 예외 절차", "다자 협정의 분쟁 조정 방식"] }
  ];

  function createAgendaPool(country) {
    return diplomacyAgendaThemes.flatMap((theme, themeIndex) => theme.details.map((detail, detailIndex) => ({
      id: `${country.id}-${themeIndex}-${detailIndex}`,
      title: `${country.name} · ${detail}`,
      detail: `${theme.title} 분야의 양국 공동 협력 방안을 논의합니다.`,
      theme: theme.title
    })));
  }

  function createDiplomacyState() {
    return Object.fromEntries(diplomacyCountries.map((country) => [country.id, {
      relationship: 50,
      usedAgendas: [],
      currentAgendaId: null,
      currentImpact: 0,
      chat: []
    }]));
  }

  const scheduleTemplates = [
    [
      { id: "committee", time: "09:00", category: "상임위", title: "민생경제위원회 회의", place: "국회 본관 3층", detail: "지역 상권 회복 지원안 심사", ap: 3, mandatory: true, skills: { policy: 2, administration: 1, stamina: -2 }, political: { influence: 1 }, result: "상임위원회에서 지역 상권 회복 지원안 심사에 참석했습니다.", skipPenalty: {} },
      { id: "market", time: "11:30", category: "지역구", title: "시장 상인회 간담회", place: "중앙시장", detail: "상인 민원 청취 및 지원안 논의", ap: 2, mandatory: false, skills: { negotiation: 1, popularity: 1, stamina: -2 }, political: { support: 2, awareness: 1 }, relationships: { minjae: 3 }, result: "중앙시장 상인회와 현장 간담회를 진행했습니다.", skipPenalty: { support: -1 } },
      { id: "interview", time: "14:00", category: "언론", title: "지역 라디오 인터뷰", place: "한빛 FM 스튜디오", detail: "지역 교통 공약과 민생 현안", ap: 2, mandatory: false, skills: { speech: 2, stamina: -1 }, political: { awareness: 3, reputation: 1 }, relationships: { haneul: 2 }, result: "지역 라디오 인터뷰에서 교통 공약과 민생 대책을 설명했습니다.", skipPenalty: { awareness: -1 } }
    ],
    [
      { id: "plenary", time: "09:30", category: "본회의", title: "민생 법안 본회의 표결", place: "국회 본회의장", detail: "지역 소상공인 금융 지원안", ap: 3, mandatory: true, skills: { politics: 2, law: 1, stamina: -2 }, political: { influence: 2, trust: 1 }, result: "본회의 표결에 참석해 민생 법안 처리에 참여했습니다.", skipPenalty: {} },
      { id: "constituents", time: "12:00", category: "지역구", title: "주민 민원 상담", place: "지역구 사무실", detail: "교통·주거 관련 민원 면담", ap: 2, mandatory: false, skills: { judgment: 1, popularity: 1 }, political: { support: 2 }, relationships: { minjae: 1 }, result: "주민 민원을 듣고 관계 기관에 확인을 요청했습니다.", skipPenalty: { support: -1 } },
      { id: "policy-brief", time: "15:00", category: "정책", title: "청년 일자리 정책 브리핑", place: "의원회관 2층", detail: "청년 고용 개선안 검토", ap: 2, mandatory: false, skills: { economy: 1, policy: 2, stamina: -1 }, political: { influence: 1 }, result: "청년 고용 정책 브리핑을 듣고 개선 의견을 전달했습니다.", skipPenalty: {} }
    ],
    [
      { id: "party-session", time: "09:00", category: "필수 회의", title: "국회 긴급 현안 보고", place: "국회 본관 2층", detail: "재난 대응 및 예산 조정 협의", ap: 3, mandatory: true, skills: { administration: 2, politics: 1, stamina: -2 }, political: { influence: 1, trust: 1 }, relationships: { seoyun: 1 }, result: "긴급 현안 보고에 참석해 재난 예산 논의에 참여했습니다.", skipPenalty: {} },
      { id: "field-check", time: "13:00", category: "현장", title: "통학로 안전 현장 점검", place: "새빛초등학교 앞", detail: "학부모 및 관계 기관 합동 점검", ap: 2, mandatory: false, skills: { judgment: 1, administration: 1, stamina: -2 }, political: { support: 2, awareness: 1 }, relationships: { seoyun: 1 }, result: "학부모와 관계 기관 담당자들과 통학로 안전을 점검했습니다.", skipPenalty: { support: -1 } },
      { id: "party-meeting", time: "16:00", category: "정치", title: "여야 정책 실무 협의", place: "의원회관 4층", detail: "민생 법안 처리 일정 조율", ap: 2, mandatory: false, skills: { negotiation: 2, stamina: -1 }, political: { partyInfluence: 1, influence: 1 }, relationships: { dohyun: 2, seoyun: 1 }, result: "여야 실무 협의에서 민생 법안 처리 일정을 조율했습니다.", skipPenalty: {} }
    ]
  ];

  const presidentialSchedule = [
    { id: "cabinet", time: "09:00", category: "국무회의", title: "국무회의 주재", place: "대통령 집무실", detail: "부처별 주요 현안과 대응 방안 보고", ap: 4, mandatory: true, skills: { leadership: 2, administration: 2, stamina: -2 }, political: { support: 1, trust: 1 }, result: "국무회의를 주재하고 부처별 현안 대응 방향을 결정했습니다.", skipPenalty: {} },
    { id: "economy-report", time: "11:00", category: "경제", title: "경제 상황 보고", place: "대통령 집무실", detail: "고용·물가·성장 지표 점검", ap: 2, mandatory: false, skills: { economy: 2, judgment: 1, stamina: -1 }, political: {}, result: "경제 지표를 점검하고 후속 검토를 지시했습니다.", skipPenalty: {} },
    { id: "citizen-address", time: "15:00", category: "대국민", title: "대국민 정책 브리핑", place: "춘추관", detail: "정부의 주요 정책과 추진 일정 발표", ap: 2, mandatory: false, skills: { speech: 2, stamina: -1 }, political: { awareness: 2, trust: 1 }, result: "주요 국정 과제와 추진 일정을 국민에게 설명했습니다.", skipPenalty: { trust: -1 } }
  ];

  function createSchedule(day, role = "member") {
    if (role === "president") return clone(presidentialSchedule).map((item) => ({ ...item, status: "pending" }));
    const templateIndex = ((day - 3) % scheduleTemplates.length + scheduleTemplates.length) % scheduleTemplates.length;
    return clone(scheduleTemplates[templateIndex]).map((item) => ({ ...item, status: "pending" }));
  }

  const initialState = {
    date: "2026-10-02",
    day: 3,
    careerDays: 0,
    role: "member",
    election: null,
    ap: 7,
    maxAp: 10,
    schedule: createSchedule(3),
    assets: { cash: 300000000, property: 0, finance: 0 },
    investments: Object.fromEntries(stockDefinitions.map((stock) => [stock.id, 0])),
    market: stockDefinitions.map((stock) => ({ ...stock, previousClose: stock.price, change: 0 })),
    buildings: [],
    completedPriorities: [],
    activeCountryId: "us",
    diplomacy: createDiplomacyState(),
    military: { readiness: 68, defenseBudget: 50, security: 72, exercises: 0 },
    skills: {
      politics: 45, leadership: 38, negotiation: 32, speech: 28,
      policy: 26, administration: 22, diplomacy: 18, economy: 22,
      law: 24, popularity: 30, judgment: 40, stamina: 64, stress: 34
    },
    political: { awareness: 25, support: 18, influence: 12, partyInfluence: 8, reputation: 52, trust: 61 },
    metricHistory: { support: [], influence: [], awareness: [], stamina: [] },
    country: { gdp: 2410, budget: 623, debt: 1275, inflation: 2.1, unemployment: 3.2, happiness: 68, trust: 61, stability: 74 },
    relationships: [
      { id: "seoyun", name: "김서윤", role: "여당 · 재난대책위원", category: "정당", score: 62 },
      { id: "dohyun", name: "박도현", role: "야당 · 예산결산위원", category: "국회", score: 38 },
      { id: "haneul", name: "이하늘", role: "지역 언론 · 기자", category: "언론", score: 27 },
      { id: "minjae", name: "최민재", role: "지역구 · 상인회장", category: "지역구", score: 51 }
    ],
    event: "flood-press",
    eventQueue: [],
    history: [{ date: "2026-10-02", message: "의원 생활 2년 차, 제22대 국회에서 첫 일과를 시작했습니다." }],
    news: []
  };

  const skillLabels = {
    politics: "정치력", leadership: "리더십", negotiation: "협상력", speech: "언변",
    policy: "정책 능력", administration: "행정 능력", diplomacy: "외교력",
    economy: "경제 이해도", law: "법률 이해도", popularity: "대중성",
    judgment: "판단력", stamina: "체력"
  };
  const politicalLabels = {
    awareness: "인지도", support: "지지율", influence: "정치적 영향력",
    partyInfluence: "당내 영향력", reputation: "평판", trust: "신뢰도"
  };
  const aiCandidateProfiles = [
    { name: "강유진", party: "미래연합", region: "서울" },
    { name: "문태오", party: "국민개혁당", region: "부산" },
    { name: "한지우", party: "시민진보당", region: "광주" },
    { name: "서도윤", party: "새로운선택", region: "대전" },
    { name: "장하린", party: "녹색미래당", region: "인천" },
    { name: "오민석", party: "국민연합", region: "대구" },
    { name: "배서연", party: "공정사회당", region: "수원" },
    { name: "신준호", party: "자유개혁당", region: "울산" },
    { name: "임가은", party: "함께민주당", region: "세종" }
  ];
  const abilityKeys = Object.keys(skillLabels);

  const activities = {
    field: {
      title: "지역 주민 만나기", cost: 2, category: "지역",
      message: "지역 시장을 찾아 주민들의 민원과 생활 현안을 들었습니다.",
      skills: { popularity: 2, speech: 1, stamina: -3 },
      political: { support: 2, awareness: 2 }, relationships: { minjae: 4 }, money: -100000, pay: 450000
    },
    study: {
      title: "정책 연구", cost: 3, category: "국회",
      message: "지역 상권 회복 지원 정책을 분석하고 대안을 정리했습니다.",
      skills: { policy: 3, economy: 2, judgment: 1, stamina: -2 }, political: { influence: 1 }, money: 0, pay: 600000
    },
    press: {
      title: "기자 인터뷰", cost: 2, category: "정치",
      message: "지역 현안에 대한 입장을 언론을 통해 시민에게 알렸습니다.",
      skills: { speech: 2, popularity: 1, stress: 2 }, political: { awareness: 3, reputation: 1, trust: 1 }, relationships: { haneul: 3 }, money: -50000, pay: 500000
    },
    rest: {
      title: "휴식하기", cost: 1, category: "개인",
      message: "일정을 비우고 충분히 쉬며 컨디션을 회복했습니다.",
      skills: { stamina: 14, stress: -10 }, political: {}, money: -30000
    },
    bill: {
      title: "법안 검토", cost: 3, category: "국회",
      message: "관련 법안과 조문을 검토해 정책 제안의 근거를 보강했습니다.",
      skills: { law: 3, policy: 2, judgment: 1, stamina: -3 }, political: { influence: 1 }, money: 0, pay: 600000
    },
    committee: {
      title: "상임위 질의 준비", cost: 2, category: "국회",
      message: "상임위원회 질의 자료를 준비하고 현안 대응 방안을 정리했습니다.",
      skills: { politics: 2, speech: 1, administration: 1, stamina: -2 }, political: { awareness: 1, influence: 1 }, money: 0, pay: 500000
    },
    party: {
      title: "당내 회의 참석", cost: 2, category: "정치",
      message: "동료 의원들과 민생 의제를 조율하고 협력 관계를 다졌습니다.",
      skills: { negotiation: 2, leadership: 1, stamina: -2 }, political: { partyInfluence: 2, influence: 1 }, relationships: { seoyun: 3 }, money: -50000, pay: 350000
    },
    exercise: {
      title: "운동하기", cost: 2, category: "개인",
      message: "가벼운 운동으로 체력을 기르고 스트레스를 줄였습니다.",
      skills: { stamina: 8, stress: -6 }, political: {}, money: -20000
    }
  };

  const eventCatalog = {
    "flood-press": {
      category: "긴급 현안", eyebrow: "지역 · 재난 대응", title: "기자들의 집중 취재",
      description: "집중호우 피해가 커지면서 기자들이 지역구 사무실을 찾아왔습니다. 주민 지원 대책에 대한 입장을 묻고 있습니다.",
      choices: [
        { title: "즉시 현장으로 이동한다.", effect: "대중성 +2 · 체력 -1", skills: { popularity: 2, stamina: -1 }, political: { support: 2, awareness: 1 }, relationships: { minjae: 3 }, result: "현장 방문으로 주민들의 신뢰를 얻었습니다." },
        { title: "관계 기관과 대책을 협의한다.", effect: "정치력 +2 · 행정 능력 +1", skills: { politics: 2, administration: 1 }, political: { influence: 2, trust: 1 }, relationships: { seoyun: 3, dohyun: 2 }, result: "기관 및 여야 의원과 긴급 지원 방안을 조율했습니다." },
        { title: "기자회견을 열어 입장을 밝힌다.", effect: "인지도 +3 · 신뢰도 변동", skills: { speech: 2 }, political: { awareness: 3, trust: -1, reputation: 1 }, relationships: { haneul: 3 }, result: "기자회견에서 지원 계획을 발표했습니다. 발언에 대한 후속 검증이 이어집니다." }
      ]
    },
    "bill-request": {
      category: "국회", eyebrow: "국회 · 법안 검토", title: "지역 상권 지원 법안 제안",
      description: "상인회가 의원실에 찾아와 긴급 금융 지원과 지역화폐 확대를 담은 법안 발의를 요청했습니다.",
      choices: [
        { title: "상인회와 공동으로 법안을 준비한다.", effect: "정책 능력 +2 · 관계 +4", skills: { policy: 2, law: 1 }, political: { support: 1 }, relationships: { minjae: 4 }, result: "상인회 의견을 담은 법안 초안을 준비하기 시작했습니다." },
        { title: "예산 영향부터 검토한다.", effect: "경제 이해도 +2 · 판단력 +1", skills: { economy: 2, judgment: 1 }, political: { trust: 1 }, result: "재정 영향을 분석한 뒤 단계별 지원안을 마련하기로 했습니다." },
        { title: "상임위 의원들과 먼저 협의한다.", effect: "협상력 +2 · 영향력 +1", skills: { negotiation: 2 }, political: { influence: 1, partyInfluence: 1 }, relationships: { dohyun: 3, seoyun: 2 }, result: "상임위 동료 의원들과 법안의 쟁점을 논의했습니다." }
      ]
    },
    "staff-request": {
      category: "지역구", eyebrow: "지역구 · 주민 민원", title: "오래된 통학로 안전 문제",
      description: "학부모들이 통학로 보행 환경 개선을 요청했습니다. 예산 확보와 관계 기관 협의가 필요한 사안입니다.",
      choices: [
        { title: "등교 시간에 현장을 확인한다.", effect: "지지율 +2 · 인지도 +1", skills: { popularity: 1, judgment: 1 }, political: { support: 2, awareness: 1 }, result: "등굣길을 직접 확인하고 주민들과 개선 우선순위를 정했습니다." },
        { title: "교육청과 구청에 공동 점검을 요청한다.", effect: "행정 능력 +2 · 관계 +2", skills: { administration: 2, negotiation: 1 }, political: { trust: 1 }, relationships: { seoyun: 2 }, result: "관계 기관의 합동 점검 일정이 잡혔습니다." },
        { title: "안전 예산 확보를 추진한다.", effect: "정치력 +1 · 활동비 -₩10,000,000", skills: { politics: 1 }, political: { influence: 1, support: 1 }, money: -10000000, result: "통학로 개선을 위해 1,000만 원 규모의 현장 설계·안전 진단 활동비를 편성했습니다." }
      ]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  function generateElection() {
    const candidates = [{
      id: "player",
      name: "윤 의원",
      party: "무소속",
      region: "대한민국",
      abilities: Object.fromEntries(abilityKeys.map((key) => [key, state.skills[key]])),
      isPlayer: true
    }, ...aiCandidateProfiles.map((profile, index) => ({
      id: `ai-${index + 1}`,
      ...profile,
      abilities: Object.fromEntries(abilityKeys.map((key) => [key, 15 + Math.floor(Math.random() * 41)])),
      isPlayer: false
    }))];

    candidates.forEach((candidate) => {
      candidate.abilityTotal = Object.values(candidate.abilities).reduce((sum, value) => sum + value, 0);
    });

    const totalAbility = candidates.reduce((sum, candidate) => sum + candidate.abilityTotal, 0);
    let allocated = 0;
    candidates.forEach((candidate) => {
      const exactVotes = 50000000 * candidate.abilityTotal / totalAbility;
      candidate.votes = Math.floor(exactVotes);
      candidate.voteRemainder = exactVotes - candidate.votes;
      candidate.voteShare = exactVotes / 50000000 * 100;
      allocated += candidate.votes;
    });
    const remainderOrder = [...candidates].sort((left, right) => right.voteRemainder - left.voteRemainder);
    for (let remainder = 50000000 - allocated, index = 0; remainder > 0; remainder -= 1, index += 1) {
      remainderOrder[index % remainderOrder.length].votes += 1;
    }
    candidates.forEach((candidate) => { delete candidate.voteRemainder; });
    candidates.sort((left, right) => right.votes - left.votes);
    return {
      date: state.date,
      candidates,
      totalVotes: candidates.reduce((sum, candidate) => sum + candidate.votes, 0),
      winnerId: candidates[0].id,
      playerWon: candidates[0].id === "player"
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey));
      if (!saved || typeof saved !== "object") return clone(initialState);
      const state = {
        ...clone(initialState),
        ...saved,
        careerDays: clamp(Number(saved.careerDays) || 0, 0, 30),
        role: saved.role === "president" ? "president" : "member",
        election: saved.election && Array.isArray(saved.election.candidates) ? saved.election : null,
        eventQueue: Array.isArray(saved.eventQueue) ? saved.eventQueue.filter((id) => eventCatalog[id]).slice(0, 20) : [],
        activeCountryId: diplomacyCountries.some((country) => country.id === saved.activeCountryId) ? saved.activeCountryId : "us",
        diplomacy: Object.fromEntries(diplomacyCountries.map((country) => {
          const savedCountry = saved.diplomacy?.[country.id] || {};
          const validAgendaIds = new Set(createAgendaPool(country).map((agenda) => agenda.id));
          const usedAgendas = Array.isArray(savedCountry.usedAgendas)
            ? [...new Set(savedCountry.usedAgendas.filter((id) => validAgendaIds.has(id)))]
            : [];
          const currentAgendaId = validAgendaIds.has(savedCountry.currentAgendaId) && !usedAgendas.includes(savedCountry.currentAgendaId)
            ? savedCountry.currentAgendaId
            : null;
          const chat = Array.isArray(savedCountry.chat)
            ? savedCountry.chat.filter((message) => message && ["user", "ai"].includes(message.speaker) && typeof message.text === "string").slice(-80)
            : [];
          return [country.id, {
            relationship: Math.min(100, Math.max(-100, Number.isFinite(Number(savedCountry.relationship)) ? Number(savedCountry.relationship) : 50)),
            usedAgendas,
            currentAgendaId,
            currentImpact: Math.min(8, Math.max(-8, Number(savedCountry.currentImpact) || 0)),
            chat
          }];
        })),
        military: { ...initialState.military, ...saved.military },
        assets: { ...initialState.assets, ...saved.assets },
        investments: Object.fromEntries(stockDefinitions.map((stock) => [
          stock.id,
          Math.max(0, Math.floor(Number(saved.investments?.[stock.id]) || 0))
        ])),
        market: stockDefinitions.map((stock) => {
          const savedStock = saved.market?.find((entry) => entry.id === stock.id);
          const price = Math.max(100, Number(savedStock?.price) || stock.price);
          return { ...stock, price, previousClose: Math.max(100, Number(savedStock?.previousClose) || stock.price), change: 0 };
        }),
        buildings: Array.isArray(saved.buildings)
          ? [...new Set(saved.buildings)].filter((id) => buildings.some((building) => building.id === id))
          : [],
        completedPriorities: Array.isArray(saved.completedPriorities)
          ? [...new Set(saved.completedPriorities)].filter((id) => nationalPriorities.some((priority) => priority.id === id))
          : [],
        skills: { ...initialState.skills, ...saved.skills },
        political: { ...initialState.political, ...saved.political },
        metricHistory: Object.fromEntries(Object.keys(initialState.metricHistory).map((key) => [
          key,
          Array.isArray(saved.metricHistory?.[key])
            ? saved.metricHistory[key].map(Number).filter(Number.isFinite).slice(-9)
            : []
        ])),
        country: { ...initialState.country, ...saved.country },
        schedule: Array.isArray(saved.schedule) ? saved.schedule : createSchedule(Number(saved.day) || initialState.day),
        relationships: Array.isArray(saved.relationships) && saved.relationships.length
          ? saved.relationships
          : clone(initialState.relationships),
        history: Array.isArray(saved.history) ? saved.history.slice(-80) : [],
        news: Array.isArray(saved.news) ? saved.news.slice(0, 6) : []
      };
      state.ap = clamp(Number(state.ap) || 0, 0, state.maxAp);
      state.day = Math.max(1, Number(state.day) || initialState.day);
      state.date = /^\d{4}-\d{2}-\d{2}$/.test(state.date) ? state.date : initialState.date;
      state.schedule = state.schedule.filter((item) => scheduleTemplates.flat().some((template) => template.id === item.id))
        .map((item) => ({ ...scheduleTemplates.flat().find((template) => template.id === item.id), ...item }));
      if (!state.schedule.length) state.schedule = createSchedule(state.day);
      state.assets.cash = Math.max(0, Number(state.assets.cash) || 0);
      state.assets.property = Math.max(0, Number(state.assets.property) || 0);
      state.assets.finance = state.market.reduce((total, stock) => total + stock.price * state.investments[stock.id], 0);
      state.assets.property = state.buildings.reduce((total, id) => total + buildings.find((building) => building.id === id).price, 0);
      for (const key of Object.keys(state.skills)) state.skills[key] = clamp(Number(state.skills[key]) || 0);
      for (const key of Object.keys(state.political)) state.political[key] = clamp(Number(state.political[key]) || 0);
      state.country.gdp = Math.max(0, Number(state.country.gdp) || initialState.country.gdp);
      state.country.budget = Math.max(0, Number(state.country.budget) || initialState.country.budget);
      state.country.debt = Math.max(0, Number(state.country.debt) || initialState.country.debt);
      state.country.inflation = Math.max(0, Number(state.country.inflation) || initialState.country.inflation);
      state.country.unemployment = Math.max(0, Number(state.country.unemployment) || initialState.country.unemployment);
      state.country.happiness = clamp(Number(state.country.happiness) || initialState.country.happiness);
      state.country.trust = clamp(Number(state.country.trust) || initialState.country.trust);
      state.country.stability = clamp(Number(state.country.stability) || initialState.country.stability);
      state.military.readiness = clamp(Number(state.military.readiness) || initialState.military.readiness);
      state.military.security = clamp(Number(state.military.security) || initialState.military.security);
      state.military.defenseBudget = Math.max(0, Number(state.military.defenseBudget) || initialState.military.defenseBudget);
      state.military.exercises = Math.max(0, Number(state.military.exercises) || 0);
      state.relationships.forEach((person) => { person.score = clamp(Number(person.score) || 0); });
      if (state.event && !eventCatalog[state.event]) state.event = null;
      if (!state.event && state.eventQueue.length) state.event = state.eventQueue.shift();
      return state;
    } catch {
      return clone(initialState);
    }
  }

  const state = loadState();

  function saveState() {
    try {
      localStorage.setItem(saveKey, JSON.stringify(state));
    } catch {
      showToast("저장 공간을 사용할 수 없습니다.");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function record(message) {
    state.history.unshift({ date: state.date, message });
    state.history = state.history.slice(0, 80);
  }

  function changeMap(target, changes) {
    Object.entries(changes || {}).forEach(([key, delta]) => {
      if (Object.hasOwn(target, key)) target[key] = clamp(target[key] + delta);
    });
  }

  function changeCountry(changes) {
    Object.entries(changes || {}).forEach(([key, delta]) => {
      if (!Object.hasOwn(state.country, key)) return;
      const value = state.country[key] + delta;
      state.country[key] = ["happiness", "trust", "stability"].includes(key)
        ? clamp(value)
        : Math.max(0, value);
    });
  }

  function changeRelationships(changes) {
    Object.entries(changes || {}).forEach(([id, delta]) => {
      const person = state.relationships.find((candidate) => candidate.id === id);
      if (person) person.score = clamp(person.score + delta);
    });
  }

  function formatWon(amount) {
    return `₩${new Intl.NumberFormat("ko-KR").format(Math.round(amount))}`;
  }

  function formatKoreanAsset(amount) {
    const hundredMillion = Math.floor(amount / 100000000);
    const tenThousand = Math.floor((amount % 100000000) / 10000);
    if (hundredMillion > 0 && tenThousand === 0) return `${hundredMillion}억`;
    if (hundredMillion > 0) return `${hundredMillion}억 ${new Intl.NumberFormat("ko-KR").format(tenThousand)}만`;
    return `${new Intl.NumberFormat("ko-KR").format(Math.floor(amount / 10000))}만`;
  }

  function dateParts() {
    const date = new Date(`${state.date}T00:00:00Z`);
    return { date, weekday: weekdayNames[date.getUTCDay()] };
  }

  function requiredAp(exceptId = null) {
    return state.schedule.reduce((total, item) => {
      if (item.status !== "pending" || !item.mandatory || item.id === exceptId) return total;
      return total + item.ap;
    }, 0);
  }

  function navigate(route) {
    const target = document.querySelector(`#view-${CSS.escape(route)}`);
    if (!target) return;
    views.forEach((view) => {
      const active = view === target;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
    });
    const selectedNavRoute = ["stats", "event"].includes(route)
      ? "home"
      : ["relationships", "assets", "investments", "buildings", ...(state.role === "president" ? ["country", "election"] : [])].includes(route) ? "more" : route;
    routes.forEach((button) => {
      if (!button.matches(".bottom-nav [data-route]")) return;
      if (button.dataset.route === selectedNavRoute) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addNews(category, headline, detail) {
    const entry = { category, headline, detail, time: state.date };
    state.news.unshift(entry);
    state.news = state.news.slice(0, 6);
    renderNews();
  }

  function renderNews() {
    if (!state.news.length) return;
    const list = document.querySelector(".news-list");
    list.replaceChildren();
    state.news.slice(0, 5).forEach((entry, index) => {
      const item = document.createElement("article");
      item.className = "news-item";
      const number = document.createElement("span");
      number.className = "news-index";
      number.textContent = String(index + 1).padStart(2, "0");
      const content = document.createElement("div");
      const tag = document.createElement("span");
      tag.className = "news-tag tag-parliament";
      tag.textContent = entry.category;
      const title = document.createElement("h3");
      title.textContent = entry.headline;
      const summary = document.createElement("p");
      summary.textContent = entry.detail;
      content.append(tag, title, summary);
      const time = document.createElement("time");
      time.textContent = entry.time === state.date ? "오늘" : entry.time;
      item.append(number, content, time);
      list.append(item);
    });
  }

  function renderHeader() {
    const { date, weekday } = dateParts();
    document.querySelector(".header-date span").textContent = `대한민국 · ${weekday}`;
    document.querySelector(".header-date strong").textContent = `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
    const dateLabel = `${weekday.toUpperCase()}, ${String(date.getUTCMonth() + 1).padStart(2, "0")} ${String(date.getUTCDate()).padStart(2, "0")}`;
    document.querySelector('[data-ui="schedule-date"]').textContent = dateLabel;
    document.querySelector('[data-ui="role-label"]').textContent = state.role === "president" ? "대통령 · 취임" : "국회의원 · 무소속";
    document.querySelector('[data-ui="career-label"]').textContent = state.role === "president" ? "대통령 임기" : "국회의원 경력";
    document.querySelector('[data-ui="career-day"]').textContent = state.role === "president" ? state.day : state.careerDays;
    document.querySelector(".career-stamp strong small").textContent = state.role === "president" ? "일" : " / 30일";
    document.querySelector(".career-stamp strong small").hidden = false;
    document.querySelector('[data-ui="honorific"]').textContent = state.role === "president" ? "윤 대통령님." : "윤 의원님.";
    const username = window.gameAuth?.user?.user_metadata?.username;
    document.querySelector('[data-ui="profile-name"]').textContent = username || (state.role === "president" ? "윤 대통령" : "윤 의원");
    document.querySelector('[data-ui="profile-role"]').textContent = state.role === "president" ? `대통령 · 취임 ${state.day}일 차` : "초선 · 국회의원";
    document.querySelector('[data-role-only="president"]').hidden = state.role !== "president";
    const countrySlot = document.querySelector('[data-nav-slot="country"]');
    const electionSlot = document.querySelector('[data-nav-slot="election"]');
    countrySlot.dataset.route = state.role === "president" ? "diplomacy" : "country";
    countrySlot.querySelector(".nav-icon").textContent = state.role === "president" ? "◎" : "◉";
    countrySlot.querySelector("span:last-child").textContent = state.role === "president" ? "외교" : "국가";
    electionSlot.dataset.route = state.role === "president" ? "military" : "election";
    electionSlot.querySelector(".nav-icon").textContent = state.role === "president" ? "▥" : "▣";
    electionSlot.querySelector("span:last-child").textContent = state.role === "president" ? "군사" : "선거";
  }

  function renderResources() {
    const resourceValues = document.querySelectorAll(".resource-item strong");
    resourceValues[0].textContent = formatKoreanAsset(state.assets.cash + state.assets.property + state.assets.finance);
    resourceValues[1].textContent = `${state.political.support}%`;
    resourceValues[2].textContent = `${state.ap} / ${state.maxAp}`;
    document.querySelector(".ap-meter i").style.width = `${state.ap / state.maxAp * 100}%`;
    document.querySelector(".ap-meter").setAttribute("aria-label", `행동 포인트 ${state.maxAp} 중 ${state.ap}`);
    document.querySelector(".quick-actions .ap-badge").textContent = `AP ${state.ap}`;
    document.querySelector('[data-ui="ap-summary"]').innerHTML = `${state.ap} <small>/ ${state.maxAp} AP</small>`;
    document.querySelector(".summary-meter i").style.width = `${state.ap / state.maxAp * 100}%`;
  }

  function renderMetrics() {
    const previousValues = Object.fromEntries(Object.entries(state.metricHistory).map(([key, values]) => [
      key,
      values.length > 1 ? values[values.length - 2] : values[0]
    ]));
    const metricMap = [
      [".metric-support > strong", `${state.political.support}%`],
      [".metric-influence > strong", `${state.political.influence}pt`],
      [".metric-reputation > strong", `${state.political.awareness}%`],
      [".metric-energy > strong", `${state.skills.stamina}/100`]
    ];
    metricMap.forEach(([selector, value]) => { document.querySelector(selector).textContent = value; });
    document.querySelector(".energy-track i").style.width = `${state.skills.stamina}%`;
    const metricValues = {
      support: state.political.support,
      influence: state.political.influence,
      awareness: state.political.awareness,
      stamina: state.skills.stamina
    };
    const metricUnits = { support: "%p", influence: "pt", awareness: "%p", stamina: "pt" };
    Object.entries(metricValues).forEach(([key, value]) => {
      const previous = previousValues[key] ?? value;
      const delta = value - previous;
      const trend = document.querySelector(`[data-metric-change="${key}"]`);
      trend.textContent = key === "stamina"
        ? state.skills.stress > 65 ? "긴장" : state.skills.stress > 35 ? "보통" : "여유"
        : `${delta > 0 ? "+" : ""}${delta}${metricUnits[key]}`;
      trend.classList.toggle("trend-up", delta >= 0);
      trend.classList.toggle("trend-warn", key === "stamina" && state.skills.stress > 65);
      trend.classList.toggle("is-negative", delta < 0);
      if (key !== "stamina") renderSparkline(key, state.metricHistory[key]);
    });
    document.querySelector('[data-metric-foot="support"]').textContent = metricSummary("support", metricValues.support, previousValues.support, "%p");
    document.querySelector('[data-metric-foot="influence"]').textContent = metricSummary("influence", metricValues.influence, previousValues.influence, "pt");
    document.querySelector('[data-metric-foot="awareness"]').textContent = metricSummary("awareness", metricValues.awareness, previousValues.awareness, "%p");
    document.querySelector('[data-metric-foot="stamina"]').textContent = `체력 ${state.skills.stamina} · 스트레스 ${state.skills.stress}`;
    renderHistoryBars("awareness", state.metricHistory.awareness);
  }

  function metricSummary(key, value, previous, unit) {
    if (previous === undefined || previous === value) return `현재 ${value}${unit} · 기록 ${state.metricHistory[key].length}회`;
    const difference = value - previous;
    return `최근 ${difference > 0 ? "+" : ""}${difference}${unit} 변동`;
  }

  function renderSparkline(key, history) {
    if (!history?.length) return;
    const samples = [...Array(Math.max(0, 9 - history.length)).fill(history[0]), ...history.slice(-9)];
    const minimum = Math.min(...samples);
    const maximum = Math.max(...samples);
    const padding = Math.max(3, (maximum - minimum) * 0.18);
    const lower = Math.max(0, minimum - padding);
    const upper = Math.min(100, maximum + padding) || 1;
    const range = Math.max(1, upper - lower);
    const points = samples.map((value, index) => ({
      x: index * 100 / Math.max(1, samples.length - 1),
      y: 25 - (value - lower) / range * 21
    }));
    const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const area = `${path} L100 28 L0 28 Z`;
    const lineElement = document.querySelector(`[data-chart-line="${key}"]`);
    const areaElement = document.querySelector(`[data-chart-area="${key}"]`);
    const marker = document.querySelector(`[data-chart-point="${key}"]`);
    if (!lineElement || !areaElement || !marker) return;
    lineElement.setAttribute("d", path);
    areaElement.setAttribute("d", area);
    const last = points[points.length - 1];
    marker.setAttribute("cx", last.x.toFixed(1));
    marker.setAttribute("cy", last.y.toFixed(1));
    marker.closest("svg")?.setAttribute("aria-label", `최근 ${samples.length}회 기록, ${history[history.length - 1]}점`);
  }

  function renderHistoryBars(key, history) {
    if (!history?.length) return;
    const samples = [...Array(Math.max(0, 9 - history.length)).fill(history[0]), ...history.slice(-9)];
    const minimum = Math.min(...samples);
    const range = Math.max(6, Math.max(...samples) - minimum);
    document.querySelectorAll(`[data-history-bars="${key}"] i`).forEach((bar, index) => {
      bar.style.height = `${Math.max(12, 18 + (samples[index] - minimum) / range * 82)}%`;
      bar.classList.toggle("is-latest", index === samples.length - 1);
    });
    document.querySelector(`[data-history-bars="${key}"]`).setAttribute("aria-label", `최근 ${samples.length}회 인지도 기록, 현재 ${history[history.length - 1]}점`);
  }

  function syncMetricHistory() {
    const values = {
      support: state.political.support,
      influence: state.political.influence,
      awareness: state.political.awareness,
      stamina: state.skills.stamina
    };
    Object.entries(values).forEach(([key, value]) => {
      const history = state.metricHistory[key];
      if (!history.length || history[history.length - 1] !== value) {
        history.push(value);
        if (history.length > 9) history.shift();
      }
    });
  }

  function renderAbilities() {
    document.querySelectorAll("[data-ability-panel]").forEach((panel) => {
      const source = panel.dataset.abilityPanel === "skills" ? state.skills : state.political;
      const labels = panel.dataset.abilityPanel === "skills" ? skillLabels : politicalLabels;
      panel.querySelectorAll("article").forEach((item) => {
        const label = item.querySelector("div > span")?.textContent.trim();
        const key = Object.keys(labels).find((candidate) => labels[candidate] === label);
        if (!key) return;
        const value = source[key];
        item.querySelector("strong").textContent = value;
        item.querySelector("i b").style.width = `${value}%`;
      });
    });
  }

  function renderAssets() {
    updateAssetTotals();
    const total = state.assets.cash + state.assets.property + state.assets.finance;
    document.querySelector(".assets-total > strong").textContent = formatWon(total);
    document.querySelector('[data-ui="cash-total"]').textContent = formatWon(state.assets.cash);
    const values = document.querySelectorAll(".portfolio-list article > b");
    values[0].textContent = formatWon(state.assets.cash);
    values[1].textContent = formatWon(state.assets.property);
    values[2].textContent = formatWon(state.assets.finance);
    const bars = document.querySelectorAll(".portfolio-list article > i b");
    bars[0].style.width = `${total ? state.assets.cash / total * 100 : 0}%`;
    bars[1].style.width = `${total ? state.assets.property / total * 100 : 0}%`;
    bars[2].style.width = `${total ? state.assets.finance / total * 100 : 0}%`;
  }

  function updateAssetTotals() {
    state.assets.property = state.buildings.reduce((sum, id) => sum + (buildings.find((building) => building.id === id)?.price || 0), 0);
    state.assets.finance = state.market.reduce((sum, stock) => sum + stock.price * (state.investments[stock.id] || 0), 0);
  }

  function renderCountry() {
    const values = {
      gdp: new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(state.country.gdp),
      budget: new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(state.country.budget),
      unemployment: state.country.unemployment.toFixed(1),
      inflation: state.country.inflation.toFixed(1),
      debt: new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(state.country.debt),
      happiness: Math.round(state.country.happiness),
      trust: Math.round(state.country.trust),
      stability: Math.round(state.country.stability)
    };
    Object.entries(values).forEach(([key, value]) => {
      const element = document.querySelector(`[data-country-value="${key}"]`);
      if (element) element.textContent = value;
    });
    const debtRatio = state.country.gdp ? state.country.debt / state.country.gdp * 100 : 0;
    document.querySelector('[data-country-trend="debt"]').textContent = `GDP 대비 ${debtRatio.toFixed(1)}%`;
    document.querySelector('[data-country-trend="gdp"]').textContent = `시장 평균 ${marketChangePercent() >= 0 ? "+" : ""}${marketChangePercent().toFixed(2)}%`;
    document.querySelector('[data-country-trend="unemployment"]').textContent = state.country.unemployment > 4 ? "고용 부담 높음" : "고용시장 안정";
    document.querySelector('[data-country-trend="inflation"]').textContent = state.country.inflation > 3.5 ? "물가 부담 높음" : "물가 안정권";
    document.querySelector('[data-country-trend="happiness"]').textContent = `국가 신뢰도 ${Math.round(state.country.trust)}`;
  }

  function renderPriorities() {
    const list = document.querySelector('[data-ui="priority-list"]');
    list.replaceChildren();
    nationalPriorities.forEach((priority) => {
      const completed = state.completedPriorities.includes(priority.id);
      const card = document.createElement("article");
      card.className = `priority-card${completed ? " is-complete" : ""}`;
      const info = document.createElement("div");
      info.className = "priority-copy";
      const title = document.createElement("strong");
      title.textContent = priority.title;
      const detail = document.createElement("small");
      detail.textContent = priority.detail;
      const effects = document.createElement("span");
      effects.className = "priority-effects";
      effects.textContent = priority.effects;
      info.append(title, detail, effects);
      const action = document.createElement("button");
      action.type = "button";
      action.dataset.action = "complete-priority";
      action.dataset.priorityId = priority.id;
      action.textContent = completed ? "완료" : `추진 · AP ${priority.ap}`;
      action.disabled = completed || state.ap - priority.ap < requiredAp() || state.country.budget < priority.budget;
      card.append(info, action);
      list.append(card);
    });
  }

  function marketChangePercent() {
    if (!state.market.length) return 0;
    const current = state.market.reduce((sum, stock) => sum + stock.price, 0);
    const previous = state.market.reduce((sum, stock) => sum + stock.previousClose, 0);
    return previous ? (current - previous) / previous * 100 : 0;
  }

  function renderInvestments() {
    const list = document.querySelector('[data-ui="stock-list"]');
    const focusedStockId = document.activeElement?.dataset.quantityStock;
    list.querySelectorAll("[data-quantity-stock]").forEach((input) => {
      tradeQuantities[input.dataset.quantityStock] = input.value;
    });
    const initialTotal = stockDefinitions.reduce((sum, stock) => sum + stock.price, 0);
    const currentTotal = state.market.reduce((sum, stock) => sum + stock.price, 0);
    const index = 1000 * currentTotal / initialTotal;
    const change = marketChangePercent();
    document.querySelector('[data-ui="market-index"]').textContent = index.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const changeElement = document.querySelector('[data-ui="market-change"]');
    changeElement.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
    changeElement.classList.toggle("is-negative", change < 0);
    document.querySelector('[data-ui="invest-cash"]').textContent = formatWon(state.assets.cash);
    document.querySelector('[data-ui="market-clock"]').textContent = `실시간 · ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    list.replaceChildren();

    state.market.forEach((stock) => {
      const shares = state.investments[stock.id] || 0;
      const stockChange = stock.previousClose ? (stock.price - stock.previousClose) / stock.previousClose * 100 : 0;
      const card = document.createElement("article");
      card.className = "stock-card";
      const upper = document.createElement("div");
      upper.className = "stock-main";
      const identity = document.createElement("div");
      identity.className = "stock-identity";
      const ticker = document.createElement("span");
      ticker.className = "stock-ticker";
      ticker.textContent = stock.id;
      const name = document.createElement("strong");
      name.textContent = stock.name;
      const sector = document.createElement("small");
      sector.textContent = stock.sector;
      identity.append(ticker, name, sector);
      const quote = document.createElement("div");
      quote.className = "stock-quote";
      const price = document.createElement("strong");
      price.textContent = formatWon(stock.price);
      const changeLabel = document.createElement("span");
      changeLabel.className = stockChange >= 0 ? "stock-up" : "stock-down";
      changeLabel.textContent = `${stockChange >= 0 ? "▲" : "▼"} ${Math.abs(stockChange).toFixed(2)}%`;
      quote.append(price, changeLabel);
      upper.append(identity, quote);

      const controls = document.createElement("div");
      controls.className = "stock-controls";
      const holding = document.createElement("span");
      holding.textContent = `보유 ${shares}주 · 평가액 ${formatWon(stock.price * shares)}`;
      const quantity = document.createElement("input");
      quantity.className = "share-quantity";
      quantity.type = "number";
      quantity.inputMode = "numeric";
      quantity.min = "1";
      quantity.step = "1";
      quantity.max = String(Math.max(Math.floor(state.assets.cash / stock.price), shares));
      quantity.value = tradeQuantities[stock.id] ?? "1";
      quantity.dataset.quantityStock = stock.id;
      quantity.setAttribute("aria-label", `${stock.name} 거래 수량, 주`);
      quantity.placeholder = "수량";
      const buttons = document.createElement("div");
      buttons.className = "trade-buttons";
      const buy = document.createElement("button");
      buy.type = "button";
      buy.dataset.action = "buy-stock";
      buy.dataset.stockId = stock.id;
      buy.textContent = "매수";
      buy.disabled = state.assets.cash < stock.price;
      const sell = document.createElement("button");
      sell.type = "button";
      sell.dataset.action = "sell-stock";
      sell.dataset.stockId = stock.id;
      sell.textContent = "매도";
      sell.disabled = shares < 1;
      buttons.append(quantity, buy, sell);
      controls.append(holding, buttons);
      card.append(upper, controls);
      list.append(card);
    });
    if (focusedStockId) {
      const replacement = list.querySelector(`[data-quantity-stock="${CSS.escape(focusedStockId)}"]`);
      replacement?.focus({ preventScroll: true });
    }
  }

  function renderBuildings() {
    document.querySelector('[data-ui="building-count"]').textContent = state.buildings.length;
    document.querySelector('[data-ui="building-cash"]').textContent = formatWon(state.assets.cash);
    document.querySelector('[data-ui="building-value"]').textContent = formatWon(state.assets.property);
    const list = document.querySelector('[data-ui="building-list"]');
    list.replaceChildren();
    buildings.forEach((building) => {
      const owned = state.buildings.includes(building.id);
      const card = document.createElement("article");
      card.className = `building-card${owned ? " is-owned" : ""}`;
      const icon = document.createElement("span");
      icon.className = "building-icon";
      icon.textContent = building.icon;
      const info = document.createElement("div");
      info.className = "building-copy";
      const kind = document.createElement("span");
      kind.textContent = building.kind;
      const title = document.createElement("strong");
      title.textContent = building.name;
      const description = document.createElement("small");
      description.textContent = building.description;
      const effects = document.createElement("span");
      effects.className = "building-effects";
      effects.textContent = `구매 효과 · ${building.effects}`;
      const passive = document.createElement("span");
      passive.className = "building-passive";
      passive.textContent = `보유 효과 · 하루마다 ${Object.entries(building.daily).map(([key, value]) => `${politicalLabels[key] || skillLabels[key] || key} +${value}`).join(" · ")}`;
      info.append(kind, title, description, effects, passive);
      const purchase = document.createElement("button");
      purchase.type = "button";
      purchase.dataset.action = "buy-building";
      purchase.dataset.buildingId = building.id;
      purchase.textContent = owned ? "보유 중" : formatWon(building.price);
      purchase.disabled = owned || state.assets.cash < building.price;
      card.append(icon, info, purchase);
      list.append(card);
    });
  }

  function ensureDiplomacyAgenda(countryId) {
    const country = diplomacyCountries.find((entry) => entry.id === countryId);
    const session = state.diplomacy[countryId];
    if (!country || !session) return null;
    const pool = createAgendaPool(country);
    let agenda = pool.find((entry) => entry.id === session.currentAgendaId);
    if (!agenda) {
      const unused = pool.filter((entry) => !session.usedAgendas.includes(entry.id));
      agenda = unused.length ? unused[Math.floor(Math.random() * unused.length)] : null;
      session.currentAgendaId = agenda?.id || null;
      session.currentImpact = 0;
    }
    return agenda;
  }

  function renderDiplomacy() {
    const countryList = document.querySelector('[data-ui="diplomacy-countries"]');
    countryList.replaceChildren();
    diplomacyCountries.forEach((country) => {
      const session = state.diplomacy[country.id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `diplomacy-country${state.activeCountryId === country.id ? " is-selected" : ""}`;
      button.dataset.action = "diplomacy-country";
      button.dataset.countryId = country.id;
      const mark = document.createElement("span");
      mark.className = "diplomacy-country-mark";
      mark.textContent = country.short;
      const text = document.createElement("span");
      text.className = "diplomacy-country-text";
      const name = document.createElement("strong");
      name.textContent = country.name;
      const relation = document.createElement("small");
      relation.textContent = `관계 ${session.relationship} · ${session.usedAgendas.length}/50`;
      text.append(name, relation);
      button.append(mark, text);
      countryList.append(button);
    });

    const country = diplomacyCountries.find((entry) => entry.id === state.activeCountryId) || diplomacyCountries[0];
    const session = state.diplomacy[country.id];
    const agenda = ensureDiplomacyAgenda(country.id);
    const counterpart = document.querySelector('[data-ui="diplomacy-counterpart"]');
    counterpart.replaceChildren();
    const counterpartName = document.createElement("strong");
    counterpartName.textContent = `${country.name} 정상실`;
    const counterpartFocus = document.createElement("span");
    counterpartFocus.textContent = country.detail;
    const relationship = document.createElement("span");
    relationship.className = `diplomacy-relationship${session.relationship < 0 ? " is-negative" : ""}`;
    relationship.textContent = `관계 ${session.relationship > 0 ? "+" : ""}${session.relationship}`;
    counterpart.append(counterpartName, counterpartFocus, relationship);

    const agendaPanel = document.querySelector('[data-ui="diplomacy-agenda"]');
    agendaPanel.replaceChildren();
    if (agenda) {
      const theme = document.createElement("span");
      theme.className = "diplomacy-theme";
      theme.textContent = agenda.theme;
      const title = document.createElement("strong");
      title.textContent = agenda.title;
      const description = document.createElement("p");
      description.textContent = agenda.detail;
      const count = document.createElement("small");
      count.textContent = `미논의 안건 ${50 - session.usedAgendas.length}건`;
      agendaPanel.append(theme, title, description, count);
    } else {
      const done = document.createElement("strong");
      done.textContent = "이 국가의 50개 안건을 모두 논의했습니다.";
      agendaPanel.append(done);
    }

    const chat = document.querySelector('[data-ui="diplomacy-chat"]');
    chat.replaceChildren();
    if (!session.chat.length) {
      const introduction = document.createElement("p");
      introduction.className = "diplomacy-introduction";
      introduction.textContent = agenda
        ? `${country.name} 측이 '${agenda.title}' 안건의 정상 협의를 요청했습니다.`
        : `${country.name} 측과의 공식 안건을 모두 논의했습니다.`;
      chat.append(introduction);
    } else {
      session.chat.slice(-40).forEach((message) => {
        const bubble = document.createElement("article");
        bubble.className = `chat-bubble is-${message.speaker}`;
        const speaker = document.createElement("span");
        speaker.textContent = message.speaker === "user" ? "대한민국" : `${country.name} 측`;
        const text = document.createElement("p");
        text.textContent = message.text;
        bubble.append(speaker, text);
        chat.append(bubble);
      });
      chat.scrollTop = chat.scrollHeight;
    }

    const input = document.querySelector('[data-ui="diplomacy-input"]');
    const sendButton = document.querySelector('[data-action="diplomacy-send"]');
    const nextButton = document.querySelector('[data-action="diplomacy-next"]');
    input.disabled = !agenda;
    sendButton.disabled = !agenda || state.ap < 1;
    nextButton.disabled = !agenda;
    document.querySelector('[data-ui="diplomacy-ap"]').textContent = `행동력 ${state.ap} · 발언 1 AP`;
  }

  function renderMilitary() {
    document.querySelector('[data-military-value="readiness"]').textContent = Math.round(state.military.readiness);
    document.querySelector('[data-military-value="security"]').textContent = Math.round(state.military.security);
    document.querySelector('[data-military-value="defenseBudget"]').textContent = state.military.defenseBudget.toFixed(1);
    document.querySelector('[data-military-bar="readiness"]').style.width = `${state.military.readiness}%`;
    document.querySelector('[data-military-bar="security"]').style.width = `${state.military.security}%`;
    document.querySelector('[data-military-bar="budget"]').style.width = `${Math.min(100, state.military.defenseBudget)}%`;
    document.querySelector('[data-ui="exercise-count"]').textContent = `${state.military.exercises}회`;
    const canWork = state.ap - 2 >= requiredAp();
    document.querySelectorAll('[data-action="military-exercise"], [data-action="military-dialogue"]').forEach((button) => {
      button.disabled = !canWork;
    });
  }

  function renderRelationships() {
    const cards = document.querySelectorAll(".contact-card");
    cards.forEach((card) => {
      const person = state.relationships.find((candidate) => candidate.category === card.dataset.contactCategory
        && candidate.name === card.querySelector(".contact-info strong").textContent);
      if (!person) return;
      card.querySelector(".contact-info strong").textContent = person.name;
      card.querySelector(".contact-info > span").textContent = person.role;
      card.querySelector(".relationship-meter i").style.width = `${person.score}%`;
      card.querySelector(":scope > b").textContent = person.score;
    });
    const average = Math.round(state.relationships.reduce((sum, person) => sum + person.score, 0) / state.relationships.length);
    const summaryValues = document.querySelectorAll(".relationship-summary strong");
    summaryValues[0].innerHTML = `${state.relationships.length}<small>명</small>`;
    summaryValues[1].innerHTML = `${average}<small>/ 100</small>`;
  }

  function renderSchedule() {
    const list = document.querySelector(".daily-agenda");
    list.replaceChildren();
    let attended = 0;
    let skipped = 0;
    let pending = 0;

    state.schedule.forEach((item) => {
      if (item.status === "attended") attended += 1;
      else if (item.status === "skipped") skipped += 1;
      else pending += 1;

      const card = document.createElement("article");
      card.className = `schedule-card ${item.mandatory ? "is-mandatory" : "is-optional"} is-${item.status}`;
      const top = document.createElement("div");
      top.className = "schedule-card-top";
      const time = document.createElement("time");
      time.textContent = item.time;
      const category = document.createElement("span");
      category.className = "schedule-category";
      category.textContent = item.category;
      const status = document.createElement("span");
      status.className = "schedule-status";
      status.textContent = item.status === "attended" ? "참석 완료" : item.status === "skipped" ? "결석 처리" : item.mandatory ? "필수 참석" : "선택 일정";
      top.append(time, category, status);

      const title = document.createElement("h2");
      title.textContent = item.title;
      const detail = document.createElement("p");
      detail.className = "schedule-detail";
      detail.textContent = `${item.place} · ${item.detail}`;
      const bottom = document.createElement("div");
      bottom.className = "schedule-card-bottom";
      const cost = document.createElement("span");
      cost.className = "schedule-cost";
      cost.textContent = `참석 시 AP ${item.ap} 소모`;
      bottom.append(cost);

      if (item.status === "pending") {
        const actions = document.createElement("div");
        actions.className = "schedule-actions";
        const attend = document.createElement("button");
        attend.type = "button";
        attend.dataset.action = "attend-schedule";
        attend.dataset.scheduleId = item.id;
        attend.textContent = "참석";
        attend.disabled = state.ap - item.ap < requiredAp(item.mandatory ? item.id : null);
        actions.append(attend);
        if (!item.mandatory) {
          const skip = document.createElement("button");
          skip.type = "button";
          skip.dataset.action = "skip-schedule";
          skip.dataset.scheduleId = item.id;
          skip.textContent = "결석";
          actions.append(skip);
        }
        bottom.append(actions);
      } else {
        const outcome = document.createElement("span");
        outcome.className = "schedule-outcome";
        outcome.textContent = item.status === "attended" ? item.result : "시간을 확보했지만 일정 효과는 얻지 못했습니다.";
        bottom.append(outcome);
      }

      card.append(top, title, detail, bottom);
      list.append(card);
    });

    const mandatoryPending = state.schedule.some((item) => item.mandatory && item.status === "pending");
    document.querySelector('[data-ui="schedule-progress"]').textContent = `참석 ${attended} · 결석 ${skipped} · 남은 일정 ${pending}`;
    document.querySelector(".mandatory-hint").textContent = mandatoryPending
      ? "● 필수 일정을 마쳐야 하루를 마감할 수 있습니다"
      : "● 필수 일정은 결석할 수 없습니다";
  }

  function renderEvent() {
    const event = eventCatalog[state.event];
    const eventChoices = document.querySelector(".event-choices");
    if (!event) {
      document.querySelector('[data-ui="event-category"]').textContent = "새 소식 없음";
      document.querySelector('[data-ui="event-eyebrow"]').textContent = "현재 처리할 이벤트가 없습니다";
      document.querySelector('[data-ui="event-title"]').textContent = "일과를 이어가세요";
      document.querySelector('[data-ui="event-description"]').textContent = "활동을 진행하면 새로운 사건이 발생할 수 있습니다.";
      eventChoices.hidden = true;
      return;
    }

    document.querySelector('[data-ui="event-category"]').textContent = event.category;
    document.querySelector('[data-ui="event-eyebrow"]').textContent = state.eventQueue.length
      ? `${event.eyebrow} · 대기 이벤트 ${state.eventQueue.length}건`
      : event.eyebrow;
    document.querySelector('[data-ui="event-title"]').textContent = event.title;
    document.querySelector('[data-ui="event-description"]').textContent = event.description;
    eventChoices.hidden = false;
    [...eventChoices.children].forEach((button, index) => {
      const choice = event.choices[index];
      if (!choice) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.dataset.choice = index;
      button.querySelector("strong").textContent = choice.title;
      button.querySelector("small").textContent = choice.effect;
    });
  }

  function renderElection() {
    const outcome = document.querySelector('[data-ui="election-outcome"]');
    const resultList = document.querySelector('[data-ui="election-results"]');
    const continueButton = document.querySelector('[data-action="election-continue"]');
    const election = state.election;
    if (!election) {
      document.querySelector("#election-title").textContent = "다음 대통령 선거";
      outcome.className = "election-outcome election-countdown";
      outcome.textContent = state.role === "president"
        ? "현재 대통령 임기 중입니다. 다음 선거 주기는 아직 시작되지 않았습니다."
        : `국회의원 경력 ${state.careerDays}/30일 · ${Math.max(0, 30 - state.careerDays)}일 뒤 9명의 AI 후보와 전국 선거를 치릅니다.`;
      document.querySelector('[data-ui="election-total"]').textContent = "선거 전";
      document.querySelector('[data-ui="election-candidate-count"]').textContent = "플레이어 + AI 9명";
      resultList.replaceChildren();
      continueButton.hidden = true;
      return;
    }

    const playerWon = election.playerWon;
    document.querySelector("#election-title").textContent = playerWon ? "대통령 당선!" : "대통령 선거 결과";
    outcome.className = `election-outcome ${playerWon ? "is-victory" : "is-defeat"}`;
    const player = election.candidates.find((candidate) => candidate.isPlayer);
    const rank = election.candidates.findIndex((candidate) => candidate.isPlayer) + 1;
    outcome.textContent = playerWon
      ? `윤 의원이 ${formatVotes(player.votes)}표를 얻어 제${rank}대통령에 당선됐습니다.`
      : `윤 의원은 ${formatVotes(player.votes)}표로 ${rank}위를 기록했습니다. 다음 임기를 준비하세요.`;
    document.querySelector('[data-ui="election-total"]').textContent = `${formatVotes(election.totalVotes)}표`;
    document.querySelector('[data-ui="election-candidate-count"]').textContent = `${election.candidates.length}명`;
    resultList.replaceChildren();

    election.candidates.forEach((candidate, index) => {
      const card = document.createElement("article");
      card.className = `election-candidate${candidate.isPlayer ? " is-player" : ""}${index === 0 ? " is-winner" : ""}`;
      const rankElement = document.createElement("span");
      rankElement.className = "candidate-rank";
      rankElement.textContent = String(index + 1).padStart(2, "0");
      const details = document.createElement("div");
      details.className = "candidate-details";
      const nameLine = document.createElement("div");
      nameLine.className = "candidate-name-line";
      const name = document.createElement("strong");
      name.textContent = candidate.name;
      const party = document.createElement("span");
      party.textContent = candidate.isPlayer ? "나" : candidate.party;
      nameLine.append(name, party);
      const meta = document.createElement("small");
      meta.textContent = candidate.isPlayer ? "플레이어 후보" : `${candidate.region} · 능력 총합 ${candidate.abilityTotal}`;
      const bar = document.createElement("div");
      bar.className = "candidate-vote-bar";
      const fill = document.createElement("i");
      const share = candidate.votes / election.totalVotes * 100;
      fill.style.width = `${share}%`;
      bar.append(fill);
      details.append(nameLine, meta, bar);
      const voteBlock = document.createElement("div");
      voteBlock.className = "candidate-vote-count";
      const votes = document.createElement("strong");
      votes.textContent = formatVotes(candidate.votes);
      const percentage = document.createElement("span");
      percentage.textContent = `${share.toFixed(2)}%`;
      voteBlock.append(votes, percentage);
      card.append(rankElement, details, voteBlock);
      resultList.append(card);
    });
    continueButton.hidden = false;
    continueButton.textContent = playerWon ? "대통령 취임" : "다음 임기 시작";
  }

  function formatVotes(votes) {
    return new Intl.NumberFormat("ko-KR").format(votes);
  }

  function render() {
    syncMetricHistory();
    renderHeader();
    renderResources();
    renderMetrics();
    renderAbilities();
    renderAssets();
    renderRelationships();
    renderSchedule();
    renderEvent();
    renderElection();
    renderDiplomacy();
    renderMilitary();
    renderCountry();
    renderPriorities();
    renderInvestments();
    renderBuildings();
    renderNews();
    document.querySelectorAll('[data-action="run-activity"]').forEach((button) => {
      const activity = activities[button.dataset.activityId];
      button.disabled = !activity || state.ap - activity.cost < requiredAp();
    });
    document.querySelector('[data-ui="politics-ap"]').textContent = state.ap;
  }

  function advanceCountry() {
    const previousGdp = state.country.gdp;
    const marketReturn = marketChangePercent();
    let gdpDelta = 0.18 + marketReturn * 0.06 + (Math.random() - 0.5) * 0.16;
    if (Math.abs(gdpDelta) < 0.1) gdpDelta = gdpDelta < 0 ? -0.1 : 0.1;
    state.country.gdp = Math.max(1, state.country.gdp + gdpDelta);
    state.country.budget = Math.max(0, state.country.budget - (0.1 + Math.random() * 0.1));
    state.country.debt += 0.1 + Math.random() * 0.1;
    const inflationDelta = Math.random() < 0.5 ? -0.1 : 0.1;
    state.country.inflation = Math.round(clamp(state.country.inflation + inflationDelta, 0.2, 12) * 10) / 10;
    const employmentChange = gdpDelta > 0.2 ? -0.1 : 0.1;
    state.country.unemployment = Math.round(clamp(state.country.unemployment + employmentChange, 1, 20) * 10) / 10;
    const costPressure = Math.max(0, state.country.inflation - 3) + Math.max(0, state.country.unemployment - 4);
    const happinessChange = costPressure > 1 || gdpDelta <= 0.2 ? -1 : 1;
    state.country.happiness = clamp(state.country.happiness + happinessChange);
    state.country.trust = clamp(state.country.trust + (Math.random() > 0.5 ? 1 : -1));
    state.country.stability = clamp(state.country.stability + (costPressure > 2 || Math.random() <= 0.5 ? -1 : 1));
    state.buildings.forEach((id) => {
      const building = buildings.find((entry) => entry.id === id);
      if (building) changeMap(state.political, building.daily);
    });
    state.market.forEach((stock) => {
      stock.previousClose = stock.price;
      stock.change = 0;
    });
    const headline = state.country.unemployment > 4
      ? { category: "고용", title: "고용 지표 둔화에 청년 일자리 대책 논의", detail: `실업률 ${state.country.unemployment.toFixed(1)}%. 국회에서 고용 대책을 논의합니다.` }
      : state.country.inflation > 3.5
        ? { category: "물가", title: "생활 물가 상승세에 민생 부담 우려", detail: `물가 상승률 ${state.country.inflation.toFixed(1)}%. 물가 안정 대책이 필요합니다.` }
        : { category: "경제", title: "국내 경제 지표가 새롭게 발표됐습니다", detail: `GDP ${state.country.gdp.toFixed(1)}조 원 · 실업률 ${state.country.unemployment.toFixed(1)}% · 물가 ${state.country.inflation.toFixed(1)}%` };
    addNews(headline.category, headline.title, headline.detail);
    record(`국가 지표 갱신: GDP ${previousGdp.toFixed(1)}조 → ${state.country.gdp.toFixed(1)}조, 실업률 ${state.country.unemployment.toFixed(1)}%, 물가 ${state.country.inflation.toFixed(1)}%.`);
  }

  function tickMarket() {
    if (document.hidden) return;
    state.market.forEach((stock) => {
      const commonDrift = (Math.random() - 0.5) * 0.32;
      const companyMove = (Math.random() - 0.5) * (stock.sector === "바이오" ? 1.5 : 1.0);
      stock.price = Math.max(100, Math.round(stock.price * (1 + (commonDrift + companyMove) / 100) / 10) * 10);
      stock.change = stock.previousClose ? (stock.price - stock.previousClose) / stock.previousClose * 100 : 0;
    });
    updateAssetTotals();
    renderInvestments();
    renderAssets();
    if (Math.random() < 0.15) saveState();
  }

  function applyCountryContext(id, skills, political) {
    const skillChanges = { ...skills };
    const politicalChanges = { ...political };
    const communityWork = ["field", "market", "constituents", "field-check"].includes(id);
    const policyWork = ["study", "bill", "policy-brief", "committee"].includes(id);
    let context = "";

    if (communityWork && state.country.unemployment >= 4) {
      politicalChanges.support = (politicalChanges.support || 0) + 2;
      context = "고용 불안이 커 지역 민심 대응 효과가 높았습니다.";
    }
    if (communityWork && state.country.happiness < 60) {
      politicalChanges.support = (politicalChanges.support || 0) + 1;
      context = "낮은 국민 행복도가 지역 현안의 주목도를 높였습니다.";
    }
    if (policyWork && state.country.inflation >= 3.5) {
      skillChanges.economy = (skillChanges.economy || 0) + 2;
      context = "물가 압력이 커 경제 분석 경험을 더 쌓았습니다.";
    }
    if (policyWork && state.country.debt / state.country.gdp >= 0.55) {
      politicalChanges.trust = (politicalChanges.trust || 0) + 1;
      context = "높은 국가 부채를 고려한 재정 검토로 신뢰를 얻었습니다.";
    }
    if (id === "press" && (state.country.unemployment >= 4 || state.country.inflation >= 3.5)) {
      politicalChanges.awareness = (politicalChanges.awareness || 0) + 2;
      context = "경제 현안 보도가 늘어 인터뷰 도달 범위가 넓어졌습니다.";
    }
    return { skills: skillChanges, political: politicalChanges, context };
  }

  function tryRandomEvent() {
    if (state.event || Math.random() > 0.2) return false;
    const available = Object.keys(eventCatalog).filter((id) => id !== "flood-press");
    state.event = available[Math.floor(Math.random() * available.length)];
    addNews("속보", eventCatalog[state.event].title, eventCatalog[state.event].description);
    return true;
  }

  function rollScheduleEvent() {
    const chance = 0.1 + Math.random() * 0.2;
    if (Math.random() >= chance) return false;

    const eventId = Object.keys(eventCatalog)[Math.floor(Math.random() * Object.keys(eventCatalog).length)];
    const opensNow = !state.event;
    if (opensNow) state.event = eventId;
    else state.eventQueue.push(eventId);
    const event = eventCatalog[eventId];
    record(`일정 결정 중 사건 발생: ${event.title}`);
    addNews("돌발 사건", event.title, event.description);
    render();
    saveState();
    navigate("event");
    showToast(opensNow ? "일정 중 사건이 발생했습니다." : "새 사건이 발생해 이벤트 목록에 추가됐습니다.");
    return true;
  }

  function runActivity(id) {
    const activity = activities[id];
    if (!activity) return;
    if (state.ap - activity.cost < requiredAp()) {
      showToast(`필수 일정에 필요한 AP ${requiredAp()}를 남겨야 합니다.`);
      return;
    }

    state.ap = Math.max(0, state.ap - activity.cost);
    const outcome = applyCountryContext(id, activity.skills, activity.political);
    changeMap(state.skills, outcome.skills);
    changeMap(state.political, outcome.political);
    changeRelationships(activity.relationships);
    if (activity.money) state.assets.cash = Math.max(0, state.assets.cash + activity.money);
    if (activity.pay) state.assets.cash += activity.pay;
    if (id === "study") state.country.gdp += 0.1;
    if (id === "field" && state.country.happiness < 65) state.country.happiness = clamp(state.country.happiness + 1);
    const paymentNote = activity.pay ? ` 활동 수당 ${formatWon(activity.pay)} 지급.` : "";
    record(`${activity.title}: ${activity.message}${outcome.context ? ` ${outcome.context}` : ""}${paymentNote}`);
    addNews(activity.category, activity.title, `${activity.message}${outcome.context ? ` ${outcome.context}` : ""}${paymentNote}`);
    render();
    saveState();
    showToast(`${activity.title} 완료 · ${activity.cost} AP 사용${activity.pay ? ` · 수당 ${formatWon(activity.pay)}` : ""}`);

    if (tryRandomEvent()) {
      saveState();
      render();
      window.setTimeout(() => navigate("event"), 450);
    }
  }

  function completePriority(id) {
    const priority = nationalPriorities.find((entry) => entry.id === id);
    if (!priority || state.completedPriorities.includes(id)) return;
    if (state.ap - priority.ap < requiredAp()) {
      showToast(`필수 일정용 AP ${requiredAp()}를 먼저 남겨야 합니다.`);
      return;
    }
    if (state.country.budget < priority.budget) {
      showToast("국가 예산이 부족해 과제를 추진할 수 없습니다.");
      return;
    }

    state.ap -= priority.ap;
    state.country.budget -= priority.budget;
    changeCountry(priority.country);
    changeMap(state.political, priority.political);
    changeMap(state.skills, priority.skills);
    state.completedPriorities.push(id);
    record(`국가 주요 과제 완료: ${priority.title}. ${priority.effects}`);
    addNews("국가 과제", `${priority.title} 성과 발표`, priority.effects);
    render();
    saveState();
    showToast(`${priority.title} 완료 · 국가 지표와 정치 기반이 크게 개선됐습니다.`);
  }

  function tradeStock(id, side) {
    const stock = state.market.find((entry) => entry.id === id);
    if (!stock) return;
    const input = document.querySelector(`[data-quantity-stock="${CSS.escape(id)}"]`);
    const rawQuantity = input?.value.trim() || "";
    const quantity = Number(rawQuantity);
    if (!/^\d+$/.test(rawQuantity) || !Number.isSafeInteger(quantity) || quantity < 1) {
      showToast("거래할 주식 수량을 1주 이상 입력하세요.");
      input?.focus();
      return;
    }
    if (side === "buy") {
      const maximum = Math.floor(state.assets.cash / stock.price);
      if (quantity > maximum) {
        showToast(`현재 살 수 있는 최대 수량은 ${maximum}주입니다.`);
        return;
      }
      state.assets.cash -= stock.price * quantity;
      state.investments[id] += quantity;
      record(`${stock.name} ${quantity}주 매수 · ${formatWon(stock.price * quantity)}`);
      addNews("투자", `${stock.name} ${quantity}주 매수`, `체결가 ${formatWon(stock.price)} · 보유 ${state.investments[id]}주`);
    } else {
      const held = state.investments[id] || 0;
      if (quantity > held) {
        showToast(`보유 수량은 ${held}주입니다. 그보다 많이 팔 수 없습니다.`);
        return;
      }
      state.investments[id] -= quantity;
      state.assets.cash += stock.price * quantity;
      record(`${stock.name} ${quantity}주 매도 · ${formatWon(stock.price * quantity)}`);
      addNews("투자", `${stock.name} ${quantity}주 매도`, `체결가 ${formatWon(stock.price)} · 보유 ${state.investments[id]}주`);
    }
    updateAssetTotals();
    render();
    saveState();
    showToast(`${stock.name} ${quantity}주 ${side === "buy" ? "매수" : "매도"} 체결 · ${formatWon(stock.price * quantity)}`);
  }

  function buyBuilding(id) {
    const building = buildings.find((entry) => entry.id === id);
    if (!building || state.buildings.includes(id)) return;
    if (state.assets.cash < building.price) {
      showToast("현금이 부족해 건물을 매입할 수 없습니다.");
      return;
    }
    state.assets.cash -= building.price;
    state.buildings.push(id);
    changeMap(state.skills, building.skills);
    changeMap(state.political, building.political);
    updateAssetTotals();
    record(`${building.name} 매입: ${building.effects}. 보유하는 동안 매일 추가 효과가 적용됩니다.`);
    addNews("건물 매입", `${building.name} 매입 완료`, `정치 기반 효과: ${building.effects}`);
    render();
    saveState();
    showToast(`${building.name} 매입 · ${building.effects}`);
  }

  function attendSchedule(id) {
    const item = state.schedule.find((entry) => entry.id === id);
    if (!item || item.status !== "pending") return;
    if (state.ap < item.ap || state.ap - item.ap < requiredAp(item.mandatory ? item.id : null)) {
      showToast(`이 일정은 AP ${item.ap}가 필요합니다. 필수 일정 AP를 먼저 확보하세요.`);
      return;
    }

    state.ap -= item.ap;
    item.status = "attended";
    const outcome = applyCountryContext(id, item.skills, item.political);
    changeMap(state.skills, outcome.skills);
    changeMap(state.political, outcome.political);
    changeRelationships(item.relationships);
    if (item.money) state.assets.cash = Math.max(0, state.assets.cash + item.money);
    const payment = state.role === "president" ? 500000 : 300000;
    state.assets.cash += payment;
    if (id === "market" && state.country.unemployment >= 4) state.country.happiness = clamp(state.country.happiness + 1);
    record(`${item.title} 참석: ${item.result}${outcome.context ? ` ${outcome.context}` : ""} 업무 수당 ${formatWon(payment)} 지급.`);
    addNews(item.category, item.title, `${item.result}${outcome.context ? ` ${outcome.context}` : ""} 업무 수당 ${formatWon(payment)} 지급.`);
    render();
    saveState();
    if (!rollScheduleEvent()) showToast(`${item.title} 참석 · AP ${item.ap} 사용 · 수당 ${formatWon(payment)}`);
  }

  function skipSchedule(id) {
    const item = state.schedule.find((entry) => entry.id === id);
    if (!item || item.status !== "pending") return;
    if (item.mandatory) {
      showToast("필수 일정은 결석할 수 없습니다.");
      return;
    }

    item.status = "skipped";
    changeMap(state.political, item.skipPenalty);
    record(`${item.title} 결석: AP를 사용하지 않았습니다.`);
    addNews(item.category, `${item.title} 불참`, "일정에 참석하지 않아 효과가 발생하지 않았습니다.");
    render();
    saveState();
    if (!rollScheduleEvent()) showToast(`${item.title} 결석 처리 · AP를 사용하지 않았습니다.`);
  }

  function resolveEvent(index) {
    const event = eventCatalog[state.event];
    const choice = event?.choices[index];
    if (!choice) return;
    changeMap(state.skills, choice.skills);
    changeMap(state.political, choice.political);
    changeRelationships(choice.relationships);
    if (choice.money) state.assets.cash = Math.max(0, state.assets.cash + choice.money);
    record(`${event.title}: ${choice.result}`);
    addNews(event.category, choice.result, `선택: ${choice.title}`);
    state.event = state.eventQueue.shift() || null;
    render();
    saveState();
    if (state.event) {
      navigate("event");
      showToast("다음 이벤트가 기다리고 있습니다.");
    } else {
      navigate("home");
      showToast(choice.result);
    }
  }

  function conductElection() {
    state.election = generateElection();
    const winner = state.election.candidates[0];
    record(`대통령 선거 실시: ${winner.name} 후보가 ${formatVotes(winner.votes)}표를 얻어 당선됐습니다.`);
    addNews("대통령 선거", `${winner.name} 후보 당선`, `전국 유효 투표 ${formatVotes(state.election.totalVotes)}표 · 출마 후보 10명`);
    render();
    saveState();
    navigate("election");
    showToast("국회의원 경력 30일을 채워 대통령 선거가 열렸습니다.");
  }

  function continueAfterElection() {
    if (!state.election) return;
    const won = state.election.playerWon;
    state.role = won ? "president" : "member";
    state.careerDays = 0;
    state.election = null;
    state.schedule = createSchedule(state.day, state.role);
    if (won) {
      state.political.influence = clamp(state.political.influence + 10);
      state.political.trust = clamp(state.political.trust + 8);
      record("대통령에 취임했습니다. 첫 국무회의와 국정 일정이 시작됩니다.");
    } else {
      record("선거 결과를 받아들이고 다음 30일의 의정 활동을 시작합니다.");
    }
    render();
    saveState();
    navigate("home");
    showToast(won ? "대통령에 취임했습니다." : "새로운 30일 의정 활동을 시작합니다.");
  }

  function evaluateDiplomaticTone(text) {
    const positiveWords = ["협력", "합의", "존중", "공동", "평화", "상호", "지원", "투자", "교류", "환영", "감사", "신뢰", "우호", "함께", "제안"];
    const negativeWords = ["제재", "압박", "위협", "규탄", "거부", "단절", "보복", "침략", "불법", "굴복", "배상", "적대", "철회", "반대", "강경", "용납 못", "협조 안"];
    const positive = positiveWords.reduce((count, word) => count + Number(text.includes(word)), 0);
    const negative = negativeWords.reduce((count, word) => count + Number(text.includes(word)), 0);
    return { positive, negative, score: positive - negative };
  }

  function sendDiplomaticMessage() {
    if (state.role !== "president") return;
    const input = document.querySelector('[data-ui="diplomacy-input"]');
    const text = input.value.trim();
    if (!text) {
      showToast("협상 발언을 입력하세요.");
      input.focus();
      return;
    }
    if (state.ap - 1 < requiredAp()) {
      showToast(`필수 일정용 행동력 ${requiredAp()}를 남겨야 합니다.`);
      return;
    }

    const country = diplomacyCountries.find((entry) => entry.id === state.activeCountryId);
    const session = state.diplomacy[state.activeCountryId];
    const agenda = ensureDiplomacyAgenda(country.id);
    if (!agenda) {
      showToast("이 국가와 논의할 안건을 모두 소진했습니다.");
      return;
    }
    state.ap -= 1;
    const tone = evaluateDiplomaticTone(text);
    const skillBonus = Math.min(2, Math.floor((state.skills.diplomacy + state.skills.negotiation) / 70));
    let proposedImpact = 0;
    let response;

    if (tone.score > 0) {
      proposedImpact = 2 + skillBonus;
      response = `${country.name} 측은 협력 제안을 긍정적으로 검토하겠다고 밝혔습니다. '${agenda.theme}' 분야의 실무 협의를 진행합니다.`;
    } else if (tone.score < 0) {
      proposedImpact = -(4 - skillBonus);
      response = `${country.name} 측은 발언에 유감을 표했습니다. '${agenda.theme}' 협의는 보류되고 외교 관계가 경색됐습니다.`;
    } else if (tone.positive && tone.negative) {
      response = `${country.name} 측은 상반된 메시지에 신중한 입장을 보였습니다. 구체적인 협상 조건을 다시 제안해 달라고 요청합니다.`;
    } else {
      response = `${country.name} 측은 입장을 확인했습니다. '${agenda.theme}' 안건의 구체적인 상호 조건을 요청합니다.`;
    }

    const boundedImpact = clamp(session.currentImpact + proposedImpact, -8, 8);
    const relationshipDelta = boundedImpact - session.currentImpact;
    session.currentImpact = boundedImpact;
    session.relationship = Math.min(100, Math.max(-100, session.relationship + relationshipDelta));
    session.chat.push({ speaker: "user", text });
    session.chat.push({ speaker: "ai", text: response });
    session.chat = session.chat.slice(-80);
    record(`${country.name} 외교 협상 (${agenda.title}): 관계 ${relationshipDelta > 0 ? "+" : ""}${relationshipDelta}. ${text}`);
    addNews("외교", `${country.name}과 외교 협상`, relationshipDelta > 0
      ? `${agenda.theme} 협력 제안으로 양국 관계가 개선됐습니다.`
      : relationshipDelta < 0 ? `강경한 발언으로 ${country.name}과의 협상 분위기가 나빠졌습니다.` : `${agenda.theme} 관련 실무 협의를 이어가기로 했습니다.`);
    input.value = "";
    render();
    saveState();
    showToast(relationshipDelta > 0
      ? `${country.name}과의 관계가 ${relationshipDelta} 개선됐습니다. 행동력 1 사용.`
      : relationshipDelta < 0 ? `부정적 표현으로 관계가 ${Math.abs(relationshipDelta)} 악화됐습니다. 행동력 1 사용.` : "답변을 받았습니다. 행동력 1 사용.");
  }

  function advanceDiplomaticAgenda() {
    if (state.role !== "president") return;
    const session = state.diplomacy[state.activeCountryId];
    if (session.currentAgendaId && !session.usedAgendas.includes(session.currentAgendaId)) {
      session.usedAgendas.push(session.currentAgendaId);
    }
    session.currentAgendaId = null;
    session.currentImpact = 0;
    const agenda = ensureDiplomacyAgenda(state.activeCountryId);
    renderDiplomacy();
    saveState();
    showToast(agenda ? `다음 안건: ${agenda.title}` : "이 국가의 50개 안건을 모두 논의했습니다.");
  }

  function conductMilitaryExercise() {
    if (state.role !== "president") return;
    if (state.ap - 2 < requiredAp() || state.military.defenseBudget < 0.5) {
      showToast("필수 일정 행동력 또는 국방 예산이 부족합니다.");
      return;
    }
    state.ap -= 2;
    state.military.defenseBudget = Math.max(0, state.military.defenseBudget - 0.5);
    state.military.readiness = clamp(state.military.readiness + 6);
    state.military.security = clamp(state.military.security + 1);
    state.military.exercises += 1;
    record("합동 대비 훈련을 실시했습니다. 대비 태세 +6, 국방 예산 -0.5조 원.");
    addNews("안보", "합동 대비 훈련 실시", "군 대응 태세를 점검하고 합동 대응 능력을 높였습니다.");
    render();
    saveState();
    showToast("훈련 완료 · 대비 태세가 높아졌습니다.");
  }

  function requestMilitaryDialogue() {
    if (state.role !== "president") return;
    if (state.ap - 2 < requiredAp() || state.military.defenseBudget < 0.1) {
      showToast("필수 일정 행동력 또는 협상 예산이 부족합니다.");
      return;
    }
    state.ap -= 2;
    state.military.defenseBudget = Math.max(0, state.military.defenseBudget - 0.1);
    state.military.security = clamp(state.military.security + 5);
    state.country.stability = clamp(state.country.stability + 2);
    const country = state.diplomacy[state.activeCountryId];
    country.relationship = Math.min(100, country.relationship + 2);
    record(`긴장 완화 회담을 요청했습니다. 안보 안정도 +5, ${diplomacyCountries.find((entry) => entry.id === state.activeCountryId).name}과의 관계 +2.`);
    addNews("안보 외교", "긴장 완화 회담 요청", "외교 채널을 열어 우발적 긴장 고조를 막기로 했습니다.");
    render();
    saveState();
    showToast("회담 요청 완료 · 안보 안정도가 높아졌습니다.");
  }

  function endDay() {
    if (state.schedule.some((item) => item.status === "pending" && item.mandatory)) {
      navigate("schedule");
      showToast("필수 일정에 참석해야 하루를 마감할 수 있습니다.");
      return;
    }
    if (state.schedule.some((item) => item.status === "pending")) {
      navigate("schedule");
      showToast("남은 일정마다 참석 또는 결석을 선택하세요.");
      return;
    }
    const unhandledEvents = [state.event, ...state.eventQueue].filter(Boolean);
    if (unhandledEvents.length) {
      state.political.support = clamp(state.political.support - 2 * unhandledEvents.length);
      record(`${unhandledEvents.length}건의 미대응 이벤트로 지지율이 ${2 * unhandledEvents.length} 하락했습니다.`);
      addNews("여론", "현안 대응이 늦어지고 있습니다", `${unhandledEvents.length}건의 미대응 현안에 후속 대응 요구가 이어집니다.`);
      state.event = null;
      state.eventQueue = [];
    }
    const next = new Date(`${state.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    state.date = next.toISOString().slice(0, 10);
    state.day += 1;
    state.ap = state.maxAp;
    state.skills.stamina = clamp(state.skills.stamina + 8);
    state.skills.stress = clamp(state.skills.stress - 4);
    advanceCountry();
    record(`새로운 하루가 시작됐습니다. 행동 포인트가 ${state.maxAp}로 회복됐습니다.`);
    if (state.role === "member") {
      state.careerDays += 1;
      if (state.careerDays >= 30) {
        state.careerDays = 30;
        state.schedule = [];
        conductElection();
        return;
      }
    }
    state.schedule = createSchedule(state.day, state.role);
    const hasEvent = tryRandomEvent();
    render();
    saveState();
    if (hasEvent) {
      navigate("event");
      showToast("새로운 사건이 발생했습니다.");
    } else {
      navigate("home");
      showToast(`${dateParts().weekday} 일정이 시작됐습니다. 행동 포인트가 회복됐습니다.`);
    }
  }

  function openDialog(title, entries) {
    let dialog = document.querySelector("#game-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "game-dialog";
      dialog.style.cssText = "width:min(92vw,520px);max-height:80vh;padding:0;border:1px solid #31567d;border-radius:6px;background:#0b2340;color:#edf4ff;box-shadow:0 20px 70px #0009";
      document.body.append(dialog);
    }
    dialog.replaceChildren();
    const header = document.createElement("header");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid #1b3c63";
    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.cssText = "margin:0;font-size:16px";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "닫기";
    close.addEventListener("click", () => dialog.close());
    header.append(heading, close);
    const list = document.createElement("ol");
    list.style.cssText = "display:grid;gap:10px;margin:0;padding:17px 20px 20px 38px;overflow:auto;font-size:12px";
    const messages = entries.length ? entries : ["아직 기록이 없습니다."];
    messages.forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      list.append(item);
    });
    dialog.append(header, list);
    if (!dialog.open) dialog.showModal();
  }

  function filterContacts(filter) {
    document.querySelectorAll(".contact-card").forEach((card) => {
      card.hidden = filter !== "전체" && card.dataset.contactCategory !== filter;
    });
  }

  document.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      event.preventDefault();
      navigate(routeButton.dataset.route);
      return;
    }

    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("is-selected", button === filterButton));
      filterContacts(filterButton.dataset.filter);
      return;
    }

    const statTab = event.target.closest("[data-stat-group]");
    if (statTab) {
      const group = statTab.dataset.statGroup;
      document.querySelectorAll("[data-stat-group]").forEach((button) => button.classList.toggle("is-selected", button === statTab));
      document.querySelectorAll("[data-ability-panel]").forEach((panel) => { panel.hidden = panel.dataset.abilityPanel !== group; });
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    switch (button.dataset.action) {
      case "open-schedule":
        navigate("schedule");
        break;
      case "open-activities": {
        navigate("politics");
        const activityId = button.dataset.activity;
        if (activityId) {
          const card = document.querySelector(`[data-activity-card="${CSS.escape(activityId)}"]`);
          card?.scrollIntoView({ behavior: "smooth", block: "center" });
          card?.classList.add("is-highlighted");
          window.setTimeout(() => card?.classList.remove("is-highlighted"), 1400);
        }
        break;
      }
      case "run-activity":
        runActivity(button.dataset.activityId);
        break;
      case "complete-priority":
        completePriority(button.dataset.priorityId);
        break;
      case "buy-stock":
        tradeStock(button.dataset.stockId, "buy");
        break;
      case "sell-stock":
        tradeStock(button.dataset.stockId, "sell");
        break;
      case "buy-building":
        buyBuilding(button.dataset.buildingId);
        break;
      case "diplomacy-country":
        state.activeCountryId = button.dataset.countryId;
        render();
        saveState();
        break;
      case "diplomacy-send":
        sendDiplomaticMessage();
        break;
      case "diplomacy-next":
        advanceDiplomaticAgenda();
        break;
      case "military-exercise":
        conductMilitaryExercise();
        break;
      case "military-dialogue":
        requestMilitaryDialogue();
        break;
      case "attend-schedule":
        attendSchedule(button.dataset.scheduleId);
        break;
      case "skip-schedule":
        skipSchedule(button.dataset.scheduleId);
        break;
      case "open-briefing":
        if (!state.event) {
          showToast("현재 처리할 긴급 브리핑이 없습니다.");
          break;
        }
        renderEvent();
        saveState();
        navigate("event");
        break;
      case "all-stats":
        navigate("stats");
        break;
      case "profile":
        navigate("more");
        break;
      case "event-choice":
        resolveEvent(Number(button.dataset.choice));
        break;
      case "election-continue":
        continueAfterElection();
        break;
      case "end-day":
        endDay();
        break;
      case "open-history":
        openDialog("정치 기록", state.history.map((item) => `${item.date} · ${item.message}`));
        break;
      case "save-game":
        saveState();
        showToast("현재 진행 상황을 저장했습니다.");
        break;
      case "logout":
        if (window.gameAuth?.supabase) {
          window.gameAuth.supabase.auth.signOut().finally(() => window.location.replace("login.html"));
        } else {
          window.location.replace("login.html");
        }
        break;
      case "reset-game":
        if (window.confirm("저장된 진행 상황을 지우고 새 게임을 시작할까요?")) {
          localStorage.removeItem(saveKey);
          window.location.reload();
        }
        break;
      case "activity-feedback":
        showToast("이 메뉴는 아직 준비 중입니다.");
        break;
      default:
        break;
    }
  });

  document.addEventListener("input", (event) => {
    const quantity = event.target.closest("[data-quantity-stock]");
    if (quantity) tradeQuantities[quantity.dataset.quantityStock] = quantity.value;
  });

  document.querySelector('[data-ui="diplomacy-input"]').addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendDiplomaticMessage();
    }
  });

  render();
  window.setInterval(tickMarket, 4000);
  window.setInterval(saveState, 30000);
})());