(() => {
  const saveKey = "national-diary-save-v1";
  const routes = [...document.querySelectorAll("[data-route]")];
  const views = [...document.querySelectorAll("[data-view]")];
  const toast = document.querySelector(".toast");
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  let toastTimer;

  const initialState = {
    date: "2026-10-02",
    day: 3,
    ap: 7,
    maxAp: 10,
    assets: { cash: 85000000, property: 210000000, finance: 55000000 },
    skills: {
      politics: 45, leadership: 38, negotiation: 32, speech: 28,
      policy: 26, administration: 22, diplomacy: 18, economy: 22,
      law: 24, popularity: 30, judgment: 40, stamina: 64, stress: 34
    },
    political: { awareness: 25, support: 18, influence: 12, partyInfluence: 8, reputation: 52, trust: 61 },
    country: { gdp: 2410, budget: 623, debt: 1275, inflation: 2.1, unemployment: 3.2, happiness: 68 },
    relationships: [
      { id: "seoyun", name: "김서윤", role: "여당 · 재난대책위원", category: "정당", score: 62 },
      { id: "dohyun", name: "박도현", role: "야당 · 예산결산위원", category: "국회", score: 38 },
      { id: "haneul", name: "이하늘", role: "지역 언론 · 기자", category: "언론", score: 27 },
      { id: "minjae", name: "최민재", role: "지역구 · 상인회장", category: "지역구", score: 51 }
    ],
    event: "flood-press",
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

  const activities = {
    field: {
      title: "지역 주민 만나기", cost: 2, category: "지역",
      message: "지역 시장을 찾아 주민들의 민원과 생활 현안을 들었습니다.",
      skills: { popularity: 2, speech: 1, stamina: -3 },
      political: { support: 2, awareness: 2 }, relationships: { minjae: 4 }, money: -100000
    },
    study: {
      title: "정책 연구", cost: 3, category: "국회",
      message: "지역 상권 회복 지원 정책을 분석하고 대안을 정리했습니다.",
      skills: { policy: 3, economy: 2, judgment: 1, stamina: -2 }, political: { influence: 1 }, money: 0
    },
    press: {
      title: "기자 인터뷰", cost: 2, category: "정치",
      message: "지역 현안에 대한 입장을 언론을 통해 시민에게 알렸습니다.",
      skills: { speech: 2, popularity: 1, stress: 2 }, political: { awareness: 3, reputation: 1, trust: 1 }, relationships: { haneul: 3 }, money: -50000
    },
    rest: {
      title: "휴식하기", cost: 1, category: "개인",
      message: "일정을 비우고 충분히 쉬며 컨디션을 회복했습니다.",
      skills: { stamina: 14, stress: -10 }, political: {}, money: -30000
    },
    bill: {
      title: "법안 검토", cost: 3, category: "국회",
      message: "관련 법안과 조문을 검토해 정책 제안의 근거를 보강했습니다.",
      skills: { law: 3, policy: 2, judgment: 1, stamina: -3 }, political: { influence: 1 }, money: 0
    },
    committee: {
      title: "상임위 질의 준비", cost: 2, category: "국회",
      message: "상임위원회 질의 자료를 준비하고 현안 대응 방안을 정리했습니다.",
      skills: { politics: 2, speech: 1, administration: 1, stamina: -2 }, political: { awareness: 1, influence: 1 }, money: 0
    },
    party: {
      title: "당내 회의 참석", cost: 2, category: "정치",
      message: "동료 의원들과 민생 의제를 조율하고 협력 관계를 다졌습니다.",
      skills: { negotiation: 2, leadership: 1, stamina: -2 }, political: { partyInfluence: 2, influence: 1 }, relationships: { seoyun: 3 }, money: -50000
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
        { title: "안전 예산 확보를 추진한다.", effect: "정치력 +1 · 자산 -₩100,000", skills: { politics: 1 }, political: { influence: 1, support: 1 }, money: -100000, result: "통학로 개선을 위한 예산 확보 절차를 시작했습니다." }
      ]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey));
      if (!saved || typeof saved !== "object") return clone(initialState);
      const state = {
        ...clone(initialState),
        ...saved,
        assets: { ...initialState.assets, ...saved.assets },
        skills: { ...initialState.skills, ...saved.skills },
        political: { ...initialState.political, ...saved.political },
        country: { ...initialState.country, ...saved.country },
        relationships: Array.isArray(saved.relationships) && saved.relationships.length
          ? saved.relationships
          : clone(initialState.relationships),
        history: Array.isArray(saved.history) ? saved.history.slice(-80) : [],
        news: Array.isArray(saved.news) ? saved.news.slice(0, 6) : []
      };
      state.ap = clamp(Number(state.ap) || 0, 0, state.maxAp);
      state.day = Math.max(1, Number(state.day) || initialState.day);
      state.date = /^\d{4}-\d{2}-\d{2}$/.test(state.date) ? state.date : initialState.date;
      state.assets.cash = Math.max(0, Number(state.assets.cash) || 0);
      state.assets.property = Math.max(0, Number(state.assets.property) || 0);
      state.assets.finance = Math.max(0, Number(state.assets.finance) || 0);
      for (const key of Object.keys(state.skills)) state.skills[key] = clamp(Number(state.skills[key]) || 0);
      for (const key of Object.keys(state.political)) state.political[key] = clamp(Number(state.political[key]) || 0);
      state.relationships.forEach((person) => { person.score = clamp(Number(person.score) || 0); });
      if (state.event && !eventCatalog[state.event]) state.event = null;
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
    if (hundredMillion > 0) return `${hundredMillion}억 ${new Intl.NumberFormat("ko-KR").format(tenThousand)}만`;
    return `${new Intl.NumberFormat("ko-KR").format(Math.floor(amount / 10000))}만`;
  }

  function dateParts() {
    const date = new Date(`${state.date}T00:00:00Z`);
    return { date, weekday: weekdayNames[date.getUTCDay()] };
  }

  function navigate(route) {
    const target = document.querySelector(`#view-${CSS.escape(route)}`);
    if (!target) return;
    views.forEach((view) => {
      const active = view === target;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
    });
    const selectedNavRoute = ["stats", "event"].includes(route) ? "home" : route;
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
    const dateKicker = document.querySelector(".agenda-section .eyebrow");
    dateKicker.textContent = `${weekday.toUpperCase()}, ${String(date.getUTCMonth() + 1).padStart(2, "0")} ${String(date.getUTCDate()).padStart(2, "0")}`;
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
    const metricMap = [
      [".metric-support > strong", `${state.political.support}%`],
      [".metric-influence > strong", `${state.political.influence}pt`],
      [".metric-reputation > strong", `${state.political.awareness}%`],
      [".metric-energy > strong", `${state.skills.stamina}/100`]
    ];
    metricMap.forEach(([selector, value]) => { document.querySelector(selector).textContent = value; });
    document.querySelector(".influence-track i").style.width = `${state.political.influence}%`;
    document.querySelector(".energy-track i").style.width = `${state.skills.stamina}%`;
    document.querySelector(".metric-support .metric-top .trend").textContent = `${state.political.support >= initialState.political.support ? "+" : ""}${state.political.support - initialState.political.support}%`;
    document.querySelector(".metric-reputation .metric-top .trend").textContent = `${state.political.awareness}/100`;
    document.querySelector(".metric-energy .metric-top .trend").textContent = state.skills.stress > 65 ? "스트레스 높음" : "컨디션 양호";
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
    const total = state.assets.cash + state.assets.property + state.assets.finance;
    document.querySelector(".assets-total > strong").textContent = formatWon(total);
    const values = document.querySelectorAll(".portfolio-list article > b");
    values[0].textContent = formatWon(state.assets.cash);
    values[1].textContent = formatWon(state.assets.property);
    values[2].textContent = formatWon(state.assets.finance);
    const bars = document.querySelectorAll(".portfolio-list article > i b");
    bars[0].style.width = `${total ? state.assets.cash / total * 100 : 0}%`;
    bars[1].style.width = `${total ? state.assets.property / total * 100 : 0}%`;
    bars[2].style.width = `${total ? state.assets.finance / total * 100 : 0}%`;
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
    document.querySelector('[data-ui="event-eyebrow"]').textContent = event.eyebrow;
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

  function render() {
    renderHeader();
    renderResources();
    renderMetrics();
    renderAbilities();
    renderAssets();
    renderRelationships();
    renderEvent();
    renderNews();
    document.querySelectorAll('[data-action="run-activity"]').forEach((button) => {
      const activity = activities[button.dataset.activityId];
      button.disabled = !activity || state.ap < activity.cost;
    });
  }

  function tryRandomEvent() {
    if (state.event || Math.random() > 0.2) return false;
    const available = Object.keys(eventCatalog).filter((id) => id !== "flood-press");
    state.event = available[Math.floor(Math.random() * available.length)];
    addNews("속보", eventCatalog[state.event].title, eventCatalog[state.event].description);
    return true;
  }

  function runActivity(id) {
    const activity = activities[id];
    if (!activity) return;
    if (state.ap < activity.cost) {
      showToast(`행동 포인트가 부족합니다. ${activity.cost} AP가 필요합니다.`);
      return;
    }

    state.ap = Math.max(0, state.ap - activity.cost);
    changeMap(state.skills, activity.skills);
    changeMap(state.political, activity.political);
    changeRelationships(activity.relationships);
    if (activity.money) state.assets.cash = Math.max(0, state.assets.cash + activity.money);
    record(`${activity.title}: ${activity.message}`);
    addNews(activity.category, activity.title, activity.message);
    render();
    saveState();
    showToast(`${activity.title} 완료 · ${activity.cost} AP 사용`);

    if (tryRandomEvent()) {
      saveState();
      render();
      window.setTimeout(() => navigate("event"), 450);
    }
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
    state.event = null;
    render();
    saveState();
    navigate("home");
    showToast(choice.result);
  }

  function endDay() {
    if (state.event) {
      state.political.support = clamp(state.political.support - 2);
      record(`이벤트 대응을 미뤄 지지율이 2 하락했습니다: ${eventCatalog[state.event].title}`);
      addNews("여론", "현안 대응이 늦어지고 있습니다", "주민과 언론의 후속 대응 요구가 이어집니다.");
      state.event = null;
    }
    const next = new Date(`${state.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    state.date = next.toISOString().slice(0, 10);
    state.day += 1;
    state.ap = state.maxAp;
    state.skills.stamina = clamp(state.skills.stamina + 8);
    state.skills.stress = clamp(state.skills.stress - 4);
    const headline = state.day % 2 === 0
      ? { category: "경제", title: "소상공인 지원 대책 논의 확대", detail: "정부와 국회가 추가 지원책을 검토하고 있습니다.", target: "support", amount: 1 }
      : { category: "국회", title: "민생 법안 처리 협의 이어져", detail: "여야 의원들이 법안 처리 일정을 조율하고 있습니다.", target: "influence", amount: 1 };
    if (headline.target === "support") state.political.support = clamp(state.political.support + headline.amount);
    else state.political.influence = clamp(state.political.influence + headline.amount);
    addNews(headline.category, headline.title, headline.detail);
    record(`새로운 하루가 시작됐습니다. 행동 포인트가 ${state.maxAp}로 회복됐습니다.`);
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
        navigate("schedule");
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

  render();
})();