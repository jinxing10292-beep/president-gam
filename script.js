(() => {
  const routeButtons = [...document.querySelectorAll("[data-route]")];
  const views = [...document.querySelectorAll("[data-view]")];
  const toast = document.querySelector(".toast");
  let toastTimer;

  function navigate(route) {
    const target = document.querySelector(`#view-${CSS.escape(route)}`);
    if (!target) return;

    views.forEach((view) => {
      const active = view === target;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
    });

    const selectedNavRoute = ["stats", "event"].includes(route) ? "home" : route;
    routeButtons.forEach((button) => {
      if (button.matches(".bottom-nav [data-route]")) {
        if (button.dataset.route === selectedNavRoute) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  document.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      event.preventDefault();
      navigate(routeButton.dataset.route);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    switch (actionButton.dataset.action) {
      case "open-schedule":
        navigate("schedule");
        break;
      case "open-activities":
        navigate("schedule");
        break;
      case "open-briefing":
        navigate("event");
        break;
      case "all-stats":
        navigate("stats");
        break;
      case "profile":
        navigate("more");
        break;
      case "activity-feedback":
        showToast("이 메뉴는 다음 게임 시스템 업데이트에서 사용할 수 있습니다.");
        break;
      case "event-choice":
        showToast("선택 결과가 기록됐습니다. 상세 결과는 다음 단계에서 적용됩니다.");
        break;
      default:
        break;
    }
  });

  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("is-selected"));
      button.classList.add("is-selected");
      showToast(`${button.textContent.trim()} 인물 목록`);
    });
  });

  document.querySelectorAll("[data-stat-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.statGroup;
      document.querySelectorAll("[data-stat-group]").forEach((tab) => tab.classList.toggle("is-selected", tab === button));
      document.querySelectorAll("[data-ability-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.abilityPanel !== group;
      });
    });
  });
})();