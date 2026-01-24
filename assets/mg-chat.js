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
      <div class="mgMsg">지금 가장 궁금한 한 가지를 적어주세요.</div>
      <div class="mgMsg">
        <button class="mgQ" data-q="초유가 거의 안 나오는 것 같아요">초유가 거의 안 나와요</button>
        <button class="mgQ" data-q="젖물림이 잘 안 되는 것 같아요">젖물림이 잘 안 돼요</button>
        <button class="mgQ" data-q="가슴이 돌처럼 딱딱하고 아파요">가슴이 딱딱해요</button>
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
  };

  chat.querySelector("#mgClose").onclick = () => {
    chat.style.display = "none";
  };

  body.addEventListener("click", (e) => {
    if (e.target.classList.contains("mgQ")) {
      input.value = e.target.dataset.q;
      form.dispatchEvent(new Event("submit"));
    }
  });

  async function ask(q) {
    add(`<b>나</b><div>${esc(q)}</div>`);
    add(`<b>맘곁</b><div class="mgCard">찾는 중…</div>`);

    const res = await fetch(MG_BASE + "/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: q })
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
