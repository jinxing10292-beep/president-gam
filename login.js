import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.SUPABASE_CONFIG;
const supabase = config?.isConfigured() ? createClient(config.url, config.anonKey) : null;
const forms = document.querySelectorAll("[data-auth-form]");
const modeButtons = document.querySelectorAll("[data-auth-mode]");
const status = document.querySelector("[data-auth-status]");

function showStatus(message, isError = false) {
  status.textContent = message;
  status.hidden = false;
  status.classList.toggle("is-error", isError);
}

function setBusy(form, busy) {
  const button = form.querySelector(".auth-submit");
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.authMode;
    modeButtons.forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-selected", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    forms.forEach((form) => { form.hidden = form.dataset.authForm !== mode; });
    status.hidden = true;
  });
});

if (!supabase) {
  showStatus("Supabase 연결 설정이 필요합니다. supabase-config.js에 프로젝트 URL과 anon key를 입력하세요.", true);
  document.querySelectorAll(".auth-submit").forEach((button) => { button.disabled = true; });
} else {
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.replace("index.html");
}

document.querySelector('[data-auth-form="login"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;
  const form = event.currentTarget;
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  setBusy(form, true);
  status.hidden = true;

  try {
    const response = await fetch(`${config.url}/functions/v1/username-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`
      },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "닉네임 또는 비밀번호가 올바르지 않습니다.");
    const { error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token
    });
    if (error) throw error;
    window.location.replace("index.html");
  } catch (error) {
    showStatus(error.message || "로그인할 수 없습니다. 잠시 후 다시 시도하세요.", true);
  } finally {
    setBusy(form, false);
  }
});

document.querySelector('[data-auth-form="signup"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;
  const form = event.currentTarget;
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  setBusy(form, true);
  status.hidden = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    if (data.session) {
      window.location.replace("index.html");
      return;
    }
    showStatus("계정이 만들어졌습니다. 이메일을 확인한 뒤 닉네임과 비밀번호로 로그인하세요.");
    form.reset();
  } catch (error) {
    showStatus(error.message || "계정을 만들 수 없습니다. 닉네임 중복 여부를 확인하세요.", true);
  } finally {
    setBusy(form, false);
  }
});