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

    routeButtons.forEach((button) => {
      if (button.matches(".bottom-nav [data-route]")) {
        if (button.dataset.route === route) button.setAttribute("aria-current", "page");
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
        showToast("긴급 브리핑을 확인했습니다. 현장 대응 일정은 준비 중입니다.");
        break;
      case "all-stats":
        navigate("politics");
        break;
      case "profile":
        navigate("more");
        break;
      case "activity-feedback":
        showToast("이 메뉴는 다음 게임 시스템 업데이트에서 사용할 수 있습니다.");
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
})();