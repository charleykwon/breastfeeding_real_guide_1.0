from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

EBOOK_CONTENT = {
    "젖물림": {
        "baby_ages": ["신생아 (0–4주)", "1–3개월"],
        "keywords": ["젖물림", "자세", "물림", "아파요", "통증", "유두"],
        "content": {
            "title": "젖물림과 자세",
            "tips": [
                "아기 입이 크게 벌어질 때까지 기다렸다가 유륜까지 깊이 물려주세요",
                "아기 배와 엄마 배가 맞닿도록 안아주세요",
                "수유 중 통증이 지속되면 손가락으로 살짝 떼고 다시 물려주세요"
            ],
            "detail": "젖물림이 잘 안 되면 아기가 유두만 빨게 되어 엄마도 아프고, 아기도 젖을 충분히 먹기 어려워요. 아기 입술이 바깥으로 뒤집어지고 턱이 가슴에 닿아야 해요."
        }
    },
    "젖양": {
        "baby_ages": ["신생아 (0–4주)", "1–3개월", "4–6개월"],
        "keywords": ["젖양", "부족", "안 나와요", "적어요", "모자라", "초유"],
        "content": {
            "title": "젖양 늘리기",
            "tips": [
                "수유 횟수를 하루 8~12회로 늘려보세요",
                "밤중 수유를 유지하면 호르몬 분비에 도움이 돼요",
                "스트레스를 줄이고 충분한 수분 섭취가 중요해요"
            ],
            "detail": "처음 며칠간 초유 양은 매우 적지만, 그게 정상이에요. 아기 위장 크기도 작아서 소량으로 충분해요. 자주 물리면 젖 생산 신호가 늘어나요."
        }
    },
    "통증": {
        "baby_ages": ["신생아 (0–4주)", "1–3개월", "4–6개월", "6개월 이상"],
        "keywords": ["통증", "아파요", "열감", "붓고", "울혈", "유선염", "유두"],
        "content": {
            "title": "가슴 통증과 울혈",
            "tips": [
                "수유 전 따뜻한 타월로 가슴을 감싸주세요",
                "수유 후에는 냉찜질이 부기를 가라앉혀줘요",
                "통증이 심하면 수유 자세를 바꿔보세요"
            ],
            "detail": "산후 2~5일경 젖이 돌 때 울혈이 생길 수 있어요. 자주 수유하고 적절히 유축하면 완화돼요. 38도 이상 열이 나면 유선염 가능성이 있어 전문가 상담이 필요해요."
        }
    },
    "체중": {
        "baby_ages": ["신생아 (0–4주)", "1–3개월", "4–6개월"],
        "keywords": ["체중", "수유량", "늘지 않", "몸무게", "성장"],
        "content": {
            "title": "아기 체중과 수유량",
            "tips": [
                "신생아는 첫 주에 출생 체중의 7~10% 감소가 정상이에요",
                "2주 후에는 출생 체중을 회복해야 해요",
                "하루 소변 6회 이상, 대변 3~4회 이상이면 충분히 먹고 있는 거예요"
            ],
            "detail": "체중 증가가 걱정되면 기저귀 체크가 도움이 돼요. 소변이 충분하고 대변 색이 노란색이면 아기가 잘 먹고 있다는 신호예요."
        }
    },
    "기타": {
        "baby_ages": ["신생아 (0–4주)", "1–3개월", "4–6개월", "6개월 이상"],
        "keywords": [],
        "content": {
            "title": "모유수유 일반 안내",
            "tips": [
                "엄마가 편안해야 아기도 편안해요",
                "완벽하지 않아도 괜찮아요, 조금씩 익숙해지는 과정이에요",
                "도움이 필요할 땐 언제든 전문가에게 물어보세요"
            ],
            "detail": "모유수유는 배워가는 과정이에요. 처음부터 잘하는 사람은 없어요. 엄마와 아기가 서로 맞춰가며 익숙해지는 시간이 필요해요."
        }
    }
}

HIGH_RISK_CONDITIONS = [
    "38도 이상 발열",
    "가슴이 심하게 붓고 열감",
    "아기가 6시간 이상 소변 없음",
    "너무 불안하거나 눈물이 멈추지 않음"
]

def count_risk_factors(context):
    risk_check = context.get("risk_check", "해당 없음")
    count = 0
    for condition in HIGH_RISK_CONDITIONS:
        if condition in risk_check:
            count += 1
    if "불안" in str(context.get("main_issue", "")) or "감당" in str(context.get("text", "")):
        count += 1
    return count

def match_content(text, context):
    baby_age = context.get("baby_age", "")
    main_issue = context.get("main_issue", "")
    
    best_match = None
    best_score = 0
    
    for category, data in EBOOK_CONTENT.items():
        score = 0
        
        if baby_age in data["baby_ages"]:
            score += 3
        
        if category in main_issue or main_issue in category:
            score += 5
        
        for keyword in data["keywords"]:
            if keyword in text or keyword in main_issue:
                score += 2
        
        if score > best_score:
            best_score = score
            best_match = data["content"]
    
    if best_match is None or best_score < 2:
        best_match = EBOOK_CONTENT["기타"]["content"]
    
    return best_match, best_score

def generate_answer(text, context, matched_content):
    baby_age = context.get("baby_age", "미입력")
    main_issue = context.get("main_issue", "미입력")
    
    empathy = "지금 많이 걱정되시죠. 그 마음 충분히 이해해요."
    
    situation = f"말씀하신 상황을 정리해보면, 아기는 {baby_age}이고, 주로 {main_issue} 관련해서 고민이 있으시네요."
    
    tips = matched_content["tips"][:2]
    action = "지금 바로 해볼 수 있는 것들이에요:\n" + "\n".join([f"• {tip}" for tip in tips])
    
    detail = matched_content.get("detail", "")
    
    answer = f"{empathy}\n\n{situation}\n\n{action}"
    if detail:
        answer += f"\n\n{detail}"
    
    return answer

def determine_confidence(score):
    if score >= 8:
        return "high"
    elif score >= 4:
        return "medium"
    else:
        return "low"

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("assets", filename)

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"}), 200

@app.post("/api/query")
def api_query():
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    context = data.get("context", {})
    
    if not text:
        return jsonify({"error": "질문이 비어있어요"}), 400
    
    matched_content, score = match_content(text, context)
    answer = generate_answer(text, context, matched_content)
    confidence = determine_confidence(score)
    
    risk_count = count_risk_factors(context)
    suggest_escalation = risk_count >= 2
    
    if risk_count == 1:
        answer += "\n\n혹시 증상이 지속되거나 심해지면, 전문가 상담을 고려해보셔도 좋아요."
    elif suggest_escalation:
        answer += "\n\n지금 상황이 좀 걱정되네요. 가까운 병원이나 모유수유 전문가와 상담해보시는 게 좋겠어요."
    
    return jsonify({
        "answer": answer,
        "confidence": confidence,
        "suggest_escalation": suggest_escalation
    }), 200

@app.post("/query")
def query_legacy():
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    context = data.get("context", {})
    
    matched_content, score = match_content(text, context)
    answer = generate_answer(text, context, matched_content)
    
    risk_count = count_risk_factors(context)
    if risk_count == 1:
        answer += "\n\n혹시 증상이 지속되거나 심해지면, 전문가 상담을 고려해보셔도 좋아요."
    elif risk_count >= 2:
        answer += "\n\n지금 상황이 좀 걱정되네요. 가까운 병원이나 모유수유 전문가와 상담해보시는 게 좋겠어요."
    
    return jsonify({
        "picked": {
            "title": matched_content["title"],
            "content": answer
        },
        "top_k": []
    }), 200

@app.post("/api/escalate")
def escalate():
    data = request.get_json() or {}
    context = data.get("context", {})
    reason = data.get("reason", "사용자 요청")
    
    return jsonify({
        "message": "전문가 연결이 필요한 상황으로 기록되었습니다.",
        "action": "nearest_ibclc",
        "context_summary": {
            "baby_age": context.get("baby_age", "미입력"),
            "main_issue": context.get("main_issue", "미입력"),
            "risk_factors": context.get("risk_check", "해당 없음")
        },
        "reason": reason
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
