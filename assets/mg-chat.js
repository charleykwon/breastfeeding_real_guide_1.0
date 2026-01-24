// Momgyeot Chat Widget (isolated)
(function () {
  const MG_BASE = "";
  const ESCALATE_PATH = "/api/escalate";

  // ---------- UI ----------
  const style = document.createElement("style");
  style.textContent = `
:root{
  --mb-sage:#8FAF9A;
  --mb-blush:#E8C9C1;
  --mb-cream:#FBF7F3;
  --mb-text:#2F2F2F;
  --mb-sub:#6F6F6F;
  --mb-line:rgba(0,0,0,.10);
  --mb-shadow:0 12px 30px rgba(0,0,0,.14);
  --mb-radius:18px;
}
#mgChatBtn{
  position:fixed; right:16px; bottom:16px; z-index:999999;
  width:64px; height:64px;
  border-radius:20px;
  border:0;
  cursor:pointer;
  box-shadow:var(--mb-shadow);
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, #f6f0ee 40%, #e9d6d0 100%);
  display:flex; align-items:center; justify-content:center;
  font-size:22px;
}
#mgChatBtn::after{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius:22px;
  border:2px solid rgba(143,175,154,.35);
  pointer-events:none;
}
#mgChatBtn:hover{
  transform: translateY(-1px);
}
#mgChat{
  position:fixed; right:16px; bottom:92px; z-index:999999;
  width:380px; max-width:92vw;
  height:560px; max-height:74vh;
  background:#fff;
  border:1px solid var(--mb-line);
  border-radius:var(--mb-radius);
  box-shadow:var(--mb-shadow);
  display:none;
  overflow:hidden;
}
#mgHead{
  position:relative;
  padding:12px 12px 10px 12px;
  font-weight:900;
  display:flex;
  justify-content:space-between;
  align-items:center;
  background: linear-gradient(90deg, rgba(232,201,193,.95), rgba(143,175,154,.20));
  border-bottom:1px solid rgba(0,0,0,.06);
}
#mgHead::before{
  content:"";
  position:absolute; left:0; top:0; right:0;
  height:6px;
  background: linear-gradient(90deg, var(--mb-blush), var(--mb-sage));
}
#mgHead span{
  display:flex; align-items:center; gap:10px;
  color:var(--mb-text);
}
#mgHead span::before{
  content:"";
  width:22px; height:22px;
  border-radius:8px;
  background: rgba(255,255,255,.65);
  border:1px solid rgba(0,0,0,.06);
  box-shadow: 0 6px 14px rgba(0,0,0,.08);
  display:inline-block;
}
#mgRoadmapBtn{
  font-size:12px;
  font-weight:800;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(0,0,0,.10);
  background: rgba(255,255,255,.6);
  cursor:pointer;
}
#mgRoadmapBtn:hover{ background: rgba(255,255,255,.85); }
#mgClose{
  width:34px; height:34px;
  border-radius:12px;
  border:1px solid rgba(0,0,0,.10);
  background: rgba(255,255,255,.55);
  cursor:pointer;
  font-size:18px;
  display:flex; align-items:center; justify-content:center;
}
#mgBody{
  padding:14px;
  height:404px;
  overflow:auto;
  font-size:13px;
  line-height:1.55;
  background: var(--mb-cream);
}
.mgMsg{ margin:10px 0; }
.mgCard{
  background:#fff;
  border:1px solid rgba(0,0,0,.08);
  border-radius:14px;
  padding:10px 10px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
}
button.mgq{
  padding:8px 10px;
  border-radius:12px;
  border:1px solid rgba(0,0,0,.14);
  background:#fff;
  cursor:pointer;
  font-weight:800;
  font-size:13px;
  margin:6px 6px 0 0;
}
button.mgq:hover{
  border-color: rgba(143,175,154,.55);
  box-shadow: 0 10px 20px rgba(0,0,0,.06);
}
button.mgq.pcq{
  border-color: rgba(143,175,154,.55);
}
#mgForm{
  display:flex;
  gap:8px;
  padding:12px;
  border-top:1px solid rgba(0,0,0,.06);
  background:#fff;
}
#mgInput{
  flex:1;
  padding:10px 10px;
  border-radius:14px;
  border:1px solid rgba(0,0,0,.16);
  outline:none;
  font-size:13px;
}
#mgSend{
  padding:10px 12px;
  border-radius:14px;
  border:0;
  background: var(--mb-sage);
  color:#fff;
  cursor:pointer;
  font-weight:900;
  font-size:13px;
}
#mgSend:hover{ filter: brightness(0.98); }
@media (max-width: 768px){
  #mgChat{
    left:0; right:0; bottom:0;
    width:100vw;
    height:74vh;
    border-radius:18px 18px 0 0;
  }
}
details{margin-top:10px}
summary{cursor:pointer;font-weight:800}
/* ===== 입력창 하단 고정 ===== */
#mgChat{
  display:flex !important;
  flex-direction:column !important;
}

#mgBody{
  flex:1 1 auto !important;
  overflow:auto !important;
  padding-bottom: 96px !important; /* 입력창 높이만큼 */
  -webkit-overflow-scrolling: touch;
}

#mgForm{
  position:sticky !important;
  bottom:0 !important;
  left:0; right:0;
  z-index:10 !important;
  background:#fff !important;
  border-top:1px solid rgba(0,0,0,.06) !important;
  box-shadow: 0 -10px 22px rgba(0,0,0,.06);
}

@media (max-width: 768px){
  #mgForm{
    padding-bottom: env(safe-area-inset-bottom);
  }
}
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
      <div style="display:flex;align-items:center;gap:8px;">
        <button id="mgRoadmapBtn">도움 로드맵</button>
        <button id="mgClose">✕</button>
      </div>
    </div>
    <div id="mgBody">
      <div class="mgMsg">
        지금 상황을 혼자 견디지 않아도 돼요.<br/>
        제가 옆에서 하나씩 같이 볼게요.
      </div>
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

  // ====== Pre-check Questions ======
  const precheck = {
    step: 0,
    answers: {},
    started: false
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
    body.scrollTop = body.scrollHeight + 9999;  // ✅ 끝까지 확실히
  };

  function renderPhoneEscalationCard() {
    if (document.getElementById("mgEscalateCard")) return;

    add(`
      <div id="mgEscalateCard" class="mgCard" style="border:1px solid rgba(143,175,154,.55); background:rgba(143,175,154,.08);">
        <div style="font-weight:900; margin-bottom:6px;">전문가에게 전화로 한 번 더 물어볼까요?</div>
        <div style="opacity:.9; line-height:1.55;">
          원하시면 <b>전화 상담</b>으로 조용히 도와드릴게요.<br/>
          <b>접수는 언제든 가능</b>하지만, <b>콜백은 평일에만</b> 진행돼요.
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <input id="mgPhone" placeholder="전화번호 (예: 010-1234-5678)"
            style="flex:1; min-width:220px; padding:10px 12px; border-radius:12px; border:1px solid rgba(0,0,0,.18);" />

          <input id="mgTime" placeholder="연락 가능한 시간 (선택)"
            style="flex:1; min-width:220px; padding:10px 12px; border-radius:12px; border:1px solid rgba(0,0,0,.18);" />
        </div>

        <label style="display:block; margin-top:10px; font-size:12px; opacity:.85;">
          <input id="mgConsent" type="checkbox" />
          전화상담을 위해 연락처 제공에 동의해요.
        </label>

        <div style="margin-top:10px; display:flex; gap:8px;">
          <button id="mgRequestCall"
            style="flex:1; padding:10px 12px; border-radius:12px; border:0; cursor:pointer; font-weight:900; background:#8FAF9A; color:white;">
            전화 상담 요청하기 (평일 콜백)
          </button>

          <button id="mgNoCall"
            style="flex:1; padding:10px 12px; border-radius:12px; border:1px solid rgba(0,0,0,.18); cursor:pointer; background:white; font-weight:800;">
            지금은 괜찮아요
          </button>
        </div>

        <div style="margin-top:8px; font-size:12px; opacity:.75;">
          ※ 응급 상황(고열·오한·심한 통증)은 의료기관 도움을 우선 고려해요.
        </div>
      </div>
    `);

    const btnReq = document.getElementById("mgRequestCall");
    const btnNo = document.getElementById("mgNoCall");

    if (btnNo) {
      btnNo.onclick = () => {
        const card = document.getElementById("mgEscalateCard");
        if (card) card.remove();
        add(`<div class="mgCard">알겠어요. 지금은 맘곁이 옆에서 계속 같이 볼게요.</div>`);
      };
    }

    if (btnReq) {
      btnReq.onclick = async () => {
        const phone = (document.getElementById("mgPhone")?.value || "").trim();
        const time = (document.getElementById("mgTime")?.value || "").trim();
        const consent = document.getElementById("mgConsent")?.checked;

        if (!consent) {
          add(`<div class="mgCard">연락처 제공 동의에 체크해주시면 요청을 진행할 수 있어요.</div>`);
          return;
        }
        if (!phone) {
          add(`<div class="mgCard">전화번호를 한 번만 적어주세요.</div>`);
          return;
        }

        add(`<div class="mgCard">좋아요. 요청 내용을 조용히 전달하고, 24시간 내 전화로 답변드릴게요.</div>`);

        try {
          const res = await fetch(MG_BASE + ESCALATE_PATH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact_phone: phone,
              preferred_time: time,
              context: precheck?.answers || {},
              question: window.__mgLastQuestion || "",
              source: "ebook"
            })
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            const caseId = data.case_id ? ` (접수번호: ${esc(data.case_id)})` : "";
            add(`<div class="mgCard">접수 완료${caseId}. 곧 연락드릴게요.</div>`);
            const card = document.getElementById("mgEscalateCard");
            if (card) card.remove();
          } else {
            add(`<div class="mgCard">요청을 처리하는 중 문제가 생겼어요. 잠시 후 다시 시도해주셔도 괜찮아요.</div>`);
          }
        } catch (e) {
          add(`<div class="mgCard">연결 상태를 확인한 뒤 다시 시도해 주세요.</div>`);
        }
      };
    }
  }

  // (A) precheck 질문 표시 함수 - btn.onclick에서만 호출됨
  function showPrecheckQuestion() {
    const q = precheckQuestions[precheck.step];
    if (!q) return;

    let html = `<div class="mgMsg"><b>${q.text}</b></div><div class="mgMsg">`;
    q.options.forEach(opt => {
      html += `<button class="mgq pcq" data-precheck="${q.key}" data-value="${opt}">${opt}</button>`;
    });
    html += `</div>`;
    add(html);
  }

  btn.onclick = () => {
    chat.style.display = "flex";
    input.focus();

    try { precheck.step = 0; precheck.answers = {}; } catch(e){}
    try { body.innerHTML = ""; } catch(e){}

    add(`<div class="mgCard">지금 상황을 혼자 견디지 않아도 돼요. 제가 옆에서 하나씩 같이 볼게요.</div>`);
    showPrecheckQuestion();
  };

  chat.querySelector("#mgClose").onclick = () => {
    chat.style.display = "none";
  };

  chat.querySelector("#mgRoadmapBtn").onclick = () => {
    chat.style.display = "none";
    if (typeof window.openModal === "function") {
      window.openModal("roadmapModal");
    } else {
      location.hash = "#roadmap";
      const el = document.getElementById("roadmap");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // body 클릭 핸들러
  body.addEventListener("click", (e) => {
    const b = e.target.closest("button.mgq");
    if (!b) return;

    const key = b.dataset.precheck;
    const val = b.dataset.value;

    if (key) {
      precheck.answers[key] = val;

      if (key === "risk_check" && val !== "해당 없음") {
        precheck.answers.risk_flag = true;
      }

      precheck.step += 1;

      if (precheck.step < precheckQuestions.length) {
        showPrecheckQuestion();
      } else {
        add(`<div class="mgCard">좋아요. 이제 궁금한 점을 편하게 적어주세요.</div>`);
        add(`<div class="mgMsg">
          <button class="mgq" data-q="초유가 안 나와요">초유가 안 나와요</button>
          <button class="mgq" data-q="젖물림이 안 돼요">젖물림이 안 돼요</button>
          <button class="mgq" data-q="젖양이 부족한 것 같아요">젖양이 부족한 것 같아요</button>
        </div>`);
      }
      return;
    }

    if (precheck.step < precheckQuestions.length) {
      add(`<div class="mgCard">답변 전에 3가지만 먼저 확인할게요.</div>`);
      showPrecheckQuestion();
      return;
    }

    const q = b.dataset.q || b.textContent.trim();
    if (!q) return;

    input.value = q;
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  });

  async function ask(q) {
    window.__mgLastQuestion = q;
    add(`<b>나</b><div>${esc(q)}</div>`);
    add(`<b>맘곁</b><div class="mgCard">찾는 중…</div>`);

    try {
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

      if (!data || !data.answer) {
        add(`<div class="mgCard">지금 이 질문은 조금 더 살펴볼게요.</div>`);
        return;
      }

      const a = data.answer;
      add(`
        <div class="mgCard">
          <div><b>맘곁</b></div>
          <div style="margin-top:6px;">${esc(a.empathy || "")}</div>
          <div style="margin-top:10px; opacity:.9;">${esc(a.summary || "")}</div>
          <div style="margin-top:10px;"><b>지금 해볼 수 있는 것</b></div>
          <ul style="margin:6px 0 0 18px;">
            ${(a.do_now || []).map(x => '<li>' + esc(x) + '</li>').join("")}
          </ul>
          <div style="margin-top:10px;"><b>주의 신호</b></div>
          <ul style="margin:6px 0 0 18px;">
            ${(a.watch || []).map(x => '<li>' + esc(x) + '</li>').join("")}
          </ul>
        </div>
      `);

      if (data && data.suggest_escalation === true) {
        renderPhoneEscalationCard();
      }
    } catch (err) {
      body.lastChild.remove();
      add(`<div class="mgCard">연결에 문제가 있어요. 잠시 후 다시 시도해주세요.</div>`);
    }
  }

  // form submit 핸들러
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (precheck.step < precheckQuestions.length) {
      add(`<div class="mgCard">답변 전에 3가지만 먼저 확인할게요.</div>`);
      showPrecheckQuestion();
      return;
    }

    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });

  // ===============================
  // 외부(전자책/SOS 버튼)에서 챗봇 제어용 API
  // ===============================
  window.mgChat = window.mgChat || {};

  window.mgChat.open = () => {
    chat.style.display = "block";
    input.focus();
    if (!precheck.started && precheck.step === 0) {
      precheck.started = true;
      showPrecheckQuestion();
    }
  };

  window.mgChat.openWith = (q) => {
    chat.style.display = "block";
    input.focus();
    if (precheck.step >= precheckQuestions.length && q) {
      input.value = q;
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    } else if (!precheck.started && precheck.step === 0) {
      precheck.started = true;
      showPrecheckQuestion();
    }
  };
})();
