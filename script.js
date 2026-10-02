(() => {
  const saveKey = "today-in-office-save-v1";
  const statNames = new Map([
    ["지역 민심", "support"],
    ["인지도", "awareness"],
    ["정책력", "policy"],
    ["체력", "stamina"]
  ]);
  const weekdayNames = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  const statElements = [...document.querySelectorAll(".status-item")];
  const peopleElements = [...document.querySelectorAll(".person-list li")];
  const ticker = document.querySelector(".news-ticker");
  const actionLeftElement = document.querySelector('[data-stat="actions-left"]');
  const actionTotalElement = document.querySelector('[data-stat="actions-total"]');
  const urgentSection = document.querySelector(".urgent-section");
  const urgentLabel = document.querySelector(".urgency-label");
  const urgentDeadline = document.querySelector(".urgent-heading > span:last-child");
  const urgentTitle = document.querySelector("#urgent-title");
  const urgentDescription = urgentSection.querySelector(":scope > p");
  const urgentButton = document.querySelector('[data-action="respond-to-flood"]');
  const turnYear = document.querySelector(".turn-label > span");
  const turnDate = document.querySelector(".turn-label > strong");
  const initialSupport = Number(document.querySelector('.status-item dt')?.nextElementSibling?.querySelector("strong")?.textContent) || 58;

  const initialStats = Object.fromEntries(statElements.map((item) => {
    const name = statNames.get(item.querySelector("dt").textContent.trim());
    return [name, Number(item.querySelector("dd strong").textContent) || 0];
  }));
  const initialPeople = peopleElements.map((item) => ({
    name: item.querySelector("div:nth-child(2) strong").textContent,
    score: Number(item.querySelector(".relationship-score").textContent) || 0
  }));

  const defaultState = {
    day: 3,
    actionsLeft: 2,
    actionsTotal: 3,
    timeMinutes: 9 * 60 + 12,
    stats: { ...initialStats, support: initialSupport },
    people: initialPeople,
    crisis: { active: true, deadline: 2, responses: [], outcome: "" },
    history: []
  };

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey));
      if (!saved || typeof saved !== "object") return defaultState;

      return {
        ...defaultState,
        ...saved,
        day: Number.isInteger(saved.day) && saved.day > 0 ? saved.day : defaultState.day,
        actionsLeft: clamp(Number(saved.actionsLeft) || 0, 0, defaultState.actionsTotal),
        actionsTotal: defaultState.actionsTotal,
        timeMinutes: Number.isFinite(saved.timeMinutes) ? saved.timeMinutes : defaultState.timeMinutes,
        stats: Object.fromEntries(Object.keys(defaultState.stats).map((key) => [
          key,
          clamp(Number(saved.stats?.[key] ?? defaultState.stats[key]))
        ])),
        people: defaultState.people.map((person, index) => ({
          ...person,
          score: clamp(Number(saved.people?.[index]?.score ?? person.score))
        })),
        crisis: {
          ...defaultState.crisis,
          ...saved.crisis,
          deadline: clamp(Number(saved.crisis?.deadline ?? defaultState.crisis.deadline), 0, 30),
          responses: Array.isArray(saved.crisis?.responses) ? saved.crisis.responses : [],
          active: saved.crisis?.active !== false,
          outcome: typeof saved.crisis?.outcome === "string" ? saved.crisis.outcome : ""
        },
        history: Array.isArray(saved.history) ? saved.history.slice(-60) : []
      };
    } catch {
      return defaultState;
    }
  }

  const state = loadState();

  function saveState() {
    try {
      localStorage.setItem(saveKey, JSON.stringify(state));
    } catch {
      announce("저장 공간을 사용할 수 없어 이번 진행은 이 기기에 저장되지 않습니다.");
    }
  }

  function addHistory(message) {
    state.history.unshift({ day: state.day, message });
    state.history = state.history.slice(0, 60);
  }

  function announce(message) {
    let notice = document.querySelector(".game-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "game-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      Object.assign(notice.style, {
        position: "fixed",
        zIndex: "30",
        right: "16px",
        bottom: "calc(82px + env(safe-area-inset-bottom))",
        left: "16px",
        width: "fit-content",
        maxWidth: "min(500px, calc(100vw - 32px))",
        marginInline: "auto",
        padding: "12px 16px",
        borderLeft: "4px solid #d4ed76",
        borderRadius: "3px",
        background: "#17231e",
        color: "#fff",
        boxShadow: "0 8px 28px rgba(23, 35, 30, .2)",
        fontSize: "13px",
        fontWeight: "650"
      });
      document.body.append(notice);
    }
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(announce.timeout);
    announce.timeout = setTimeout(() => { notice.hidden = true; }, 3200);
  }

  function renderStats() {
    for (const item of statElements) {
      const stat = statNames.get(item.querySelector("dt").textContent.trim());
      const value = state.stats[stat];
      const score = item.querySelector("dd strong");
      const progress = item.querySelector("progress");
      score.textContent = value;
      progress.value = value;
      progress.textContent = `${value}%`;
      progress.setAttribute("aria-label", `${item.querySelector("dt").textContent} 100점 중 ${value}점`);
    }

    peopleElements.forEach((item, index) => {
      const score = item.querySelector(".relationship-score");
      score.textContent = state.people[index].score;
      score.setAttribute("aria-label", `관계도 ${state.people[index].score}`);
    });

    actionLeftElement.textContent = state.actionsLeft;
    actionTotalElement.textContent = state.actionsTotal;
  }

  function renderTurn() {
    const dayOfYear = ((state.day - 1) % 365) + 1;
    const year = Math.floor((state.day - 1) / 365) + 1;
    turnYear.textContent = `의원 ${year}년 차`;
    turnDate.textContent = `${weekdayNames[(state.day - 1) % weekdayNames.length]} · ${dayOfYear}일 차`;
  }

  function renderCrisis() {
    if (state.crisis.active) {
      urgentLabel.textContent = "긴급 현안";
      urgentDeadline.textContent = `대응까지 ${state.crisis.deadline}일`;
      urgentTitle.textContent = "남부 지역 집중호우 피해";
      urgentDescription.textContent = `침수 피해가 커지며 주민 지원과 긴급 예산 편성 요구가 이어지고 있습니다. 대응 진행 ${state.crisis.responses.length}/2`;
      urgentButton.disabled = false;
      urgentButton.textContent = "현장 대응 살펴보기";
      return;
    }

    urgentLabel.textContent = state.crisis.outcome === "resolved" ? "현안 해결" : "후속 보도";
    urgentDeadline.textContent = state.crisis.outcome === "resolved" ? "대응 완료" : "대응 시한 종료";
    urgentTitle.textContent = state.crisis.outcome === "resolved" ? "재난 지원안에 합의했습니다" : "재난 대응 지연 논란";
    urgentDescription.textContent = state.crisis.outcome === "resolved"
      ? "현장 방문과 국회 협의가 이어져 긴급 지원 절차가 시작됐습니다."
      : "대응 시한을 놓쳐 주민 지원과 국회 협의가 늦어지고 있습니다.";
    urgentButton.disabled = true;
    urgentButton.textContent = state.crisis.outcome === "resolved" ? "대응 완료" : "시한 종료";
  }

  function renderControls() {
    const noActions = state.actionsLeft <= 0;
    document.querySelectorAll('[data-action="visit-region"], [data-action="prepare-budget"], [data-action="negotiate"]').forEach((button) => {
      button.disabled = noActions;
    });
    urgentButton.disabled = noActions || !state.crisis.active;
  }

  function render() {
    renderStats();
    renderTurn();
    renderCrisis();
    renderControls();
  }

  function addNews(category, message) {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const label = document.createElement("span");
    const text = document.createElement("p");
    const minutes = state.timeMinutes % (24 * 60);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    const formattedTime = `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;

    time.dateTime = formattedTime;
    time.textContent = formattedTime;
    label.className = "news-category";
    label.textContent = category;
    text.textContent = message;
    item.append(time, label, text);
    ticker.prepend(item);
    while (ticker.children.length > 8) ticker.lastElementChild.remove();
  }

  const activityEffects = {
    "visit-region": {
      label: "지역 현장 방문",
      channel: "field",
      apply() {
        state.stats.support += 6;
        state.stats.awareness += 2;
        state.stats.stamina -= 9;
        state.people[0].score += 3;
        return "남부 지역을 방문해 주민 의견을 듣고 피해 현황을 확인했습니다.";
      }
    },
    "prepare-budget": {
      label: "긴급 예산안 준비",
      channel: "budget",
      apply() {
        state.stats.policy += 5;
        state.stats.stamina -= 6;
        return "긴급 복구 예산안을 마련해 국회 논의 안건으로 올렸습니다.";
      }
    },
    negotiate: {
      label: "여야 의원과 협상",
      channel: "coalition",
      apply() {
        state.stats.support += 2;
        state.stats.policy += 1;
        state.stats.stamina -= 5;
        state.people[0].score += 2;
        state.people[1].score += 5;
        return "여야 의원과 재난 지원을 위한 공동 논의를 시작했습니다.";
      }
    },
    "respond-to-flood": {
      label: "집중호우 현장 대응",
      channel: "field",
      apply() {
        state.stats.support += 4;
        state.stats.awareness += 3;
        state.stats.stamina -= 10;
        state.people[0].score += 2;
        return "긴급 대응팀과 함께 피해 현장을 살펴보고 지원 우선순위를 정했습니다.";
      }
    }
  };

  function resolveCrisisIfReady() {
    if (state.crisis.active && state.crisis.responses.length >= 2) {
      state.crisis.active = false;
      state.crisis.outcome = "resolved";
      state.stats.support += 4;
      addHistory("재난 현장 대응과 국회 지원 협의를 성사시켜 긴급 현안을 해결했습니다.");
      addNews("속보", "여야, 남부 지역 긴급 복구 지원안에 합의");
      announce("집중호우 현안을 해결했습니다. 지역 민심이 올랐습니다.");
    }
  }

  function performActivity(actionId) {
    const activity = activityEffects[actionId];
    if (!activity || state.actionsLeft <= 0) return;

    state.actionsLeft -= 1;
    state.timeMinutes += 60;
    const result = activity.apply();
    for (const stat of Object.keys(state.stats)) state.stats[stat] = clamp(state.stats[stat]);
    state.people.forEach((person) => { person.score = clamp(person.score); });

    if (state.crisis.active && !state.crisis.responses.includes(activity.channel)) {
      state.crisis.responses.push(activity.channel);
    }

    addHistory(result);
    addNews("의정 활동", result);
    resolveCrisisIfReady();
    render();
    saveState();
    announce(`${activity.label} 완료 · 남은 행동 ${state.actionsLeft}회`);
  }

  const dailyHeadlines = [
    { category: "민생", text: "생활 물가 부담에 서민 지원책 요구 확대", stat: "support", change: -2 },
    { category: "국회", text: "여야, 민생 법안 우선 처리에 공감대", stat: "policy", change: 2 },
    { category: "지역", text: "지역 상권 회복 조짐에 주민 기대감 상승", stat: "support", change: 2 },
    { category: "여론", text: "지역구 현안 해결을 요구하는 목소리 이어져", stat: "awareness", change: 1 }
  ];

  function finishDay() {
    if (state.actionsLeft > 0) {
      addHistory(`남은 행동 ${state.actionsLeft}회를 사용하지 않고 하루를 마쳤습니다.`);
    }

    state.day += 1;
    state.actionsLeft = state.actionsTotal;
    state.stats.stamina = clamp(state.stats.stamina + 8);

    if (state.crisis.active) {
      state.crisis.deadline = Math.max(0, state.crisis.deadline - 1);
      if (state.crisis.deadline === 0) {
        state.crisis.active = false;
        state.crisis.outcome = "missed";
        state.stats.support = clamp(state.stats.support - 6);
        addHistory("재난 대응 시한을 놓쳐 지역 민심이 하락했습니다.");
        addNews("속보", "남부 지역 지원 지연에 주민 불만 확산");
      }
    }

    const headline = dailyHeadlines[Math.floor(Math.random() * dailyHeadlines.length)];
    state.stats[headline.stat] = clamp(state.stats[headline.stat] + headline.change);
    state.timeMinutes = 9 * 60;
    addHistory(`${headline.text} (${headline.change > 0 ? "+" : ""}${headline.change} ${headline.stat === "support" ? "민심" : headline.stat === "policy" ? "정책력" : "인지도"})`);
    addNews(headline.category, headline.text);
    render();
    saveState();
    announce(`${state.day}일 차가 시작됐습니다. ${headline.text}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDialog(title, entries) {
    let dialog = document.querySelector("#game-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "game-dialog";
      dialog.setAttribute("aria-labelledby", "game-dialog-title");
      dialog.style.cssText = "width:min(92vw,520px);max-height:80vh;padding:0;border:1px solid #d7d9cf;border-radius:5px;background:#fbfaf5;color:#17231e;box-shadow:0 20px 70px #17231e40";
      document.body.append(dialog);
    }

    dialog.replaceChildren();
    const header = document.createElement("header");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #d7d9cf";
    const heading = document.createElement("h2");
    heading.id = "game-dialog-title";
    heading.textContent = title;
    heading.style.cssText = "margin:0;font-size:19px";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "닫기";
    close.setAttribute("aria-label", "창 닫기");
    close.style.cssText = "min-height:36px;padding:0 10px;border:1px solid #1c593f;border-radius:3px;background:transparent;color:#1c593f;font:inherit;cursor:pointer";
    close.addEventListener("click", () => dialog.close());
    header.append(heading, close);

    const list = document.createElement("ol");
    list.style.cssText = "display:grid;gap:10px;margin:0;padding:18px 24px 22px 42px;overflow:auto";
    if (!entries.length) {
      const empty = document.createElement("li");
      empty.textContent = "아직 기록이 없습니다.";
      list.append(empty);
    } else {
      entries.forEach((entry) => {
        const item = document.createElement("li");
        item.textContent = entry;
        list.append(item);
      });
    }

    dialog.append(header, list);
    if (!dialog.open) dialog.showModal();
  }

  function openHistory() {
    const entries = state.history.map((entry) => `${entry.day}일 차 · ${entry.message}`);
    openDialog("의정 활동 기록", entries);
  }

  function showDetails() {
    const names = { support: "지역 민심", awareness: "인지도", policy: "정책력", stamina: "체력" };
    const entries = Object.entries(state.stats).map(([key, value]) => `${names[key]} ${value}/100`);
    entries.push(`오늘 남은 행동 ${state.actionsLeft}/${state.actionsTotal}`);
    entries.push(...state.people.map((person) => `${person.name} · 관계도 ${person.score}/100`));
    openDialog("현재 상태", entries);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    const actionId = button.dataset.action;
    if (activityEffects[actionId]) {
      performActivity(actionId);
      return;
    }

    if (actionId === "end-day") {
      finishDay();
      return;
    }
    if (actionId === "show-details") {
      showDetails();
      return;
    }
    if (actionId === "show-activities") {
      document.querySelector("#today").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (actionId === "show-people") {
      document.querySelector("#people").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const viewButton = event.target.closest("[data-view]");
    if (!viewButton) return;
    document.querySelectorAll(".bottom-nav [data-view]").forEach((navButton) => {
      navButton.removeAttribute("aria-current");
    });
    viewButton.setAttribute("aria-current", "page");

    const destinations = {
      home: "#home",
      activities: "#today",
      news: "#news",
      people: "#people"
    };
    if (viewButton.dataset.view === "history") {
      openHistory();
    } else {
      document.querySelector(destinations[viewButton.dataset.view])?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.matches("#game-dialog")) {
      const bounds = event.target.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!inside) event.target.close();
    }
  });

  render();
})();