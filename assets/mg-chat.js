// Momgyeot Chat Widget (isolated)
(function () {
  const MG_BASE = "https://24909645-4f9f-4168-80dc-0820106f38bf-00-en1n9q11juye.spock.replit.dev";

  // ---------- UI ----------
  const style = document.createElement("style");
  style.textContent = `
  #mgChatBtn{position:fixed;right:16px;bottom:16px;z-index:9999;width:56px;height:56px;border-radius:16px;border:0;font-size:22px;cursor:pointer}
  #mgChat{position:fixed;right:16px;bottom:82px;z-index:9999;width:360px;max-width:92vw;height:520px;max-height:72vh;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,.18);display:none;overflow:hidden}
  #mgHead{padding:12px 14px;font-weight:800;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,0,0,.08)}
  #mgBody{padding:12px 14px;height:390px;overflow:auto;font-size:14px;line-height:1.5}
  #mgForm{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.08)}
  #mgInput{flex:1;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.18)}
  #mgSend{padding:10px 12px;border-radius:12px;border:0;cursor:pointer;font-weight:800}
  .mgMsg{margin:10px 0}
  .mgCard{padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.04);margin-top:6px}
  details{margin-top:10px}
  summary{cursor:pointer;font-weight:800}
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "mgChatBtn";
  btn.textContent = "💬";

  const chat = document.createElement("div");
  chat.id = "mgChat";
  chat.innerHTML = `
    <div id="mgHead">
      <span>맘곁 모유수유 동반자</span>
      <button id="mgClose" style="border:0;background:transparent;font-size:18px;cursor:pointer">✕</button>
    </div>
    <div id="mgBody">
 add(`<div class="mgMsg">
지금 상황을 혼자 견디지 않아도 돼요.<br/>
제가 옆에서 하나씩 같이 볼게요.
</div>`);
    </div>
    <form id="mgForm">
      <input id="mgInput" placeholder="예: 초유가 거의 안 나오는 것 같아요" />
      <button id="mgSend" type="submit">보내기</button>
    </form>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(chat);

  // ---------- Logic ----------
  const body = chat.querySelector("#mgBody");
  const input = chat.querySelector("#mgInput");
  const form = chat.querySelector("#mgForm");
  
  // ====== Pre-check Questions (A) ======
const precheck = {
  step: 0,
  answers: {}
};

const precheckQuestions = [
  {
    key: "baby_age",
    text: "아기가 태어난 지 얼마나 되었나요?",
    options: ["신생아 (0–4주)", "1–3개월", "4–6개월", "6개월 이상"]
  },
  {
    key: "main_issue",
    text: "지금 가장 힘든 건 어떤 쪽인가요?",
    options: ["젖물림/자세", "젖양 걱정", "가슴 통증/열감", "아기 체중/수유량", "기타"]
  },
  {
    key: "risk_check",
    text: "아래 중 해당되는 것이 있나요?",
    options: [
      "38도 이상 발열",
      "가슴이 심하게 붓고 열감",
      "아기가 6시간 이상 소변 없음",
      "너무 불안하거나 눈물이 멈추지 않음",
      "해당 없음"
    ]
  }
];

function showPrecheckQuestion() {
  const q = precheckQuestions[precheck.step];
  if (!q) return;

  let html = `<div class="mgMsg"><b>${q.text}</b></div><div class="mgMsg">`;
  q.options.forEach(opt => {
    html += `<button class="mgq" data-precheck="${q.key}" data-value="${opt}">${opt}</button>`;
  });
  html += `</div>`;
  add(html);
}
}  
  const esc = (s) =>
    (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const add = (html) => {
    const d = document.createElement("div");
    d.className = "mgMsg";
    d.innerHTML = html;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  };

 btn.onclick = () => {
  chat.style.display = "block";
  input.focus();

  if (precheck.step === 0) {
    showPrecheckQuestion();
  }
};
};

  chat.querySelector("#mgClose").onclick = () => {
    chat.style.display = "none";
  };

body.addEventListener("click", (e) => {
  const b = e.target.closest("button.mgq");
  if (!b) return;

  // 1) Precheck 버튼이면: 저장 → 다음 질문
  const key = b.dataset.precheck;
  const val = b.dataset.value;

  if (key) {
    precheck.answers[key] = val;

    // risk_check에서 "해당 없음" 아니면 고위험 플래그
    if (key === "risk_check" && val !== "해당 없음") {
      precheck.answers.risk_flag = true;
    }

    precheck.step += 1;

    // 다음 질문 또는 종료
    if (precheck.step < precheckQuestions.length) {
      showPrecheckQuestion();
    } else {
      add(`<div class="mgCard">좋아요. 이제 궁금한 점을 편하게 적어주세요.</div>`);
      // (선택) 빠른 질문 버튼 다시 보여주고 싶으면 여기서 add로 렌더
      // add(`<div class="mgMsg">...</div>`);
    }
    return;
  }

  // 2) 일반 질문 버튼이면: 기존대로 질문 submit
  const q = b.dataset.q || b.textContent.trim();
  if (!q) return;

});
// ✅ precheck가 끝나기 전엔 질문을 보내지 않음
if (precheck.step < precheckQuestions.length) {
  add(`<div class="mgCard">답변 전에 3가지만 먼저 확인할게요.</div>`);
  showPrecheckQuestion();
  return;
}

  input.value = q;
  form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

async function ask(q) {
    add(`<b>나</b><div>${esc(q)}</div>`);
    add(`<b>맘곁</b><div class="mgCard">찾는 중…</div>`);

    const res = await fetch(MG_BASE + "/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  text: q,
  context: precheck.answers,
  source: "ebook"
})
    });

    const data = await res.json();
    body.lastChild.remove();

    if (!data || !data.picked) {
      add(`<div class="mgCard">관련 내용을 찾지 못했어요.</div>`);
      return;
    }

    const p = data.picked;
    add(`
      <div class="mgCard">
        <b>${esc(p.title)}</b>
        <div>${esc(p.content)}</div>
      </div>
    `);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });
})();
// ===============================
// 외부(전자책/SOS 버튼)에서 챗봇 제어용 API
// ===============================
window.mgChat = window.mgChat || {};

window.mgChat.open = () => {
  chat.style.display = "block";
  input.focus();
};

window.mgChat.openWith = (q) => {
  chat.style.display = "block";
  input.focus();
  if (q) {
    input.value = q;
    form.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  }
};
