from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
import uuid
try:
    from zoneinfo import ZoneInfo
except Exception:
    ZoneInfo = None

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": [
    "https://charleykwon.github.io",
    "https://charleykwon.github.io/breastfeeding_real_guide_1.0",
    "https://momgyeot.com",
    "https://www.momgyeot.com"
]}})

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("assets", filename)

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "momgyeot-breastfeeding-api"}), 200

def log_analytics(payload: dict):
    os.makedirs("logs", exist_ok=True)
    log = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "session_id": payload.get("session_id") or f"anon-{uuid.uuid4().hex[:8]}",
        "source": payload.get("source", "ebook"),
        "baby_age": payload.get("baby_age"),
        "main_issue": payload.get("main_issue"),
        "risk_check": payload.get("risk_check"),
        "question": payload.get("text", ""),
        "topic": payload.get("topic"),
        "confidence": payload.get("confidence"),
        "suggest_escalation": payload.get("suggest_escalation", False)
    }
    with open("logs/analytics.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(log, ensure_ascii=False) + "\n")

def save_escalation(record: dict):
    os.makedirs("logs", exist_ok=True)
    with open("logs/escalations.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

RISK_TRIGGERS = [
    "38도 이상 발열",
    "가슴이 심하게 붓고 열감",
    "아기가 6시간 이상 소변 없음",
    "너무 불안하거나 눈물이 멈추지 않음"
]

def count_risk_factors(context: dict) -> int:
    rc = context.get("risk_check", "")
    count = 0
    if isinstance(rc, list):
        for item in rc:
            if item in RISK_TRIGGERS:
                count += 1
    elif isinstance(rc, str):
        for trigger in RISK_TRIGGERS:
            if trigger in rc:
                count += 1
    return count

def detect_topic(text: str, context: dict) -> str:
    main_issue = context.get("main_issue", "")
    combined = f"{text} {main_issue}".lower()
    
    if any(kw in combined for kw in ["가슴 통증", "열감", "딱딱", "젖몸살", "울혈", "붓", "아파요"]):
        if "가슴" in combined or "통증" in combined or "열감" in combined:
            return "breast_pain"
    if main_issue == "가슴 통증/열감":
        return "breast_pain"
    
    if any(kw in combined for kw in ["젖양", "안 나와", "부족", "모유량", "적어", "초유"]):
        return "low_supply"
    if main_issue == "젖양 걱정":
        return "low_supply"
    
    if any(kw in combined for kw in ["젖물림", "자세", "물기", "물려"]):
        return "latch"
    if main_issue == "젖물림/자세":
        return "latch"
    
    if "체중" in combined or "수유량" in combined:
        return "weight"
    if main_issue == "아기 체중/수유량":
        return "weight"
    
    return "general"

TOPIC_RESPONSES = {
    "breast_pain": {
        "empathy": "가슴이 아프고 불편하시죠. 정말 힘드실 거예요. 지금 상황을 함께 살펴볼게요.",
        "do_now": [
            "수유 전 2~3분 따뜻한 타월로 가슴을 감싸주세요.",
            "수유 후에는 냉찜질로 부기를 가라앉혀주세요.",
            "아기가 잘 비워주는 방향으로 자세를 바꿔가며 자주 물려보세요."
        ],
        "watch": [
            "고열(38도↑)·오한·붉은 부위 확장·심한 통증이 함께 있으면 유선염 가능성이 있어요.",
            "증상이 24시간 이상 지속되면 전문가/의료진 상담을 고려해주세요."
        ],
        "next_questions": [
            "통증이 수유할 때만 있나요, 아니면 계속 있나요?",
            "붉은 부위가 있거나 열이 나시나요?"
        ],
        "confidence": "high"
    },
    "low_supply": {
        "empathy": "젖양이 걱정되시는 거죠. 많은 엄마들이 같은 고민을 해요. 함께 살펴볼게요.",
        "do_now": [
            "수유/유축 간격을 짧게(2~3시간) 가져가며 자극 횟수를 늘려보세요.",
            "밤중 수유를 유지하면 호르몬 분비에 도움이 돼요.",
            "'젖이 얼마나 나오나'보다 '아기 기저귀/수유 후 반응'으로 먼저 확인해보세요."
        ],
        "watch": [
            "아기 소변이 하루 6회 이상, 대변 3~4회 이상이면 충분히 먹고 있는 신호예요.",
            "아기가 처지거나 소변이 6시간 이상 없으면 전문가 상담이 필요해요."
        ],
        "next_questions": [
            "아기 기저귀는 하루에 몇 번 정도 갈아주시나요?",
            "수유 후 아기가 편안해 보이나요?"
        ],
        "confidence": "high"
    },
    "latch": {
        "empathy": "젖물림이 잘 안 되면 엄마도 아프고 아기도 힘들죠. 천천히 맞춰가면 돼요.",
        "do_now": [
            "아기 몸을 엄마 쪽으로 더 가까이 붙여서 '몸-몸' 정렬부터 맞춰보세요.",
            "입이 크게 벌어지는 순간(하품처럼) 유륜이 더 들어가도록 빠르게 당겨 물려보세요.",
            "수유 중 통증이 지속되면 손가락으로 살짝 떼고 다시 물려주세요."
        ],
        "watch": [
            "젖꼭지가 납작해지거나 갈라지면 물림 자세를 다시 확인해보세요.",
            "통증이 수유 내내 계속되면 전문가 도움을 받아보세요."
        ],
        "next_questions": [
            "수유할 때 어느 정도 아프세요?",
            "아기 입술이 바깥으로 뒤집어져 있나요?"
        ],
        "confidence": "high"
    },
    "weight": {
        "empathy": "아기 체중이 걱정되시는 거죠. 부모라면 당연히 신경 쓰이는 부분이에요.",
        "do_now": [
            "하루 소변 6회 이상, 대변 3~4회 이상이면 충분히 먹고 있는 거예요.",
            "신생아는 첫 주에 출생 체중의 7~10% 감소가 정상이에요.",
            "2주 후에는 출생 체중을 회복하는지 확인해보세요."
        ],
        "watch": [
            "체중이 2주 후에도 출생 시보다 적으면 전문가 상담이 필요해요.",
            "아기가 처지거나 수유 거부가 있으면 빨리 확인해주세요."
        ],
        "next_questions": [
            "아기가 태어난 지 며칠 되었나요?",
            "마지막 체중 측정은 언제였나요?"
        ],
        "confidence": "medium"
    },
    "general": {
        "empathy": "지금 상황을 혼자 견디지 않아도 돼요. 제가 옆에서 하나씩 같이 볼게요.",
        "do_now": [
            "지금 상황을 조금 더 정확히 보기 위해 가장 힘든 점을 하나만 알려주세요.",
            "통증/열감/수유 간격/아기 소변 횟수 중 걱정되는 게 있나요?",
            "원하시면 관련 가이드를 함께 찾아서 단계별로 정리해볼게요."
        ],
        "watch": [
            "고열(38도↑)·심한 통증·아기 소변 없음이 있으면 전문가 상담을 고려해주세요.",
            "엄마가 너무 지치거나 불안하면 도움을 요청하는 것도 방법이에요."
        ],
        "next_questions": [
            "지금 가장 힘든 건 어떤 부분인가요?",
            "아기가 태어난 지 얼마나 되었나요?"
        ],
        "confidence": "low"
    }
}

def build_answer(text: str, context: dict):
    baby_age = context.get("baby_age", "미입력")
    main_issue = context.get("main_issue", "미입력")
    
    topic = detect_topic(text, context)
    template = TOPIC_RESPONSES.get(topic, TOPIC_RESPONSES["general"])
    
    summary = f"아기 시기: {baby_age} · 가장 힘든 점: {main_issue}로 정리돼요."
    
    return {
        "topic": topic,
        "answer": {
            "empathy": template["empathy"],
            "summary": summary,
            "do_now": template["do_now"],
            "watch": template["watch"],
            "next_questions": template["next_questions"]
        },
        "confidence": template["confidence"]
    }

@app.post("/api/query")
def api_query():
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    context = data.get("context") or {}
    source = data.get("source") or "ebook"
    session_id = data.get("session_id")

    if not text:
        resp = {
            "answer": {
                "empathy": "괜찮아요. 지금 가장 궁금한 한 가지만 적어주시면 돼요.",
                "summary": "짧게라도 좋으니 지금 상황을 알려주세요.",
                "do_now": ["예: 젖물림이 아파요", "예: 가슴이 딱딱해요", "예: 젖양이 부족한 것 같아요"],
                "watch": [],
                "next_questions": []
            },
            "confidence": "low",
            "suggest_escalation": False
        }
        return jsonify(resp), 200

    risk_count = count_risk_factors(context)
    suggest_escalation = risk_count >= 2
    
    built = build_answer(text, context)
    
    resp = {
        "answer": built["answer"],
        "confidence": built["confidence"],
        "suggest_escalation": suggest_escalation
    }
    
    if suggest_escalation:
        resp["escalation_type"] = "phone_24h"
        resp["escalation_cta_label"] = "24시간 전문가 전화 상담 연결"

    log_analytics({
        "session_id": session_id,
        "source": source,
        "baby_age": context.get("baby_age"),
        "main_issue": context.get("main_issue"),
        "risk_check": context.get("risk_check"),
        "text": text,
        "topic": built["topic"],
        "confidence": built["confidence"],
        "suggest_escalation": suggest_escalation
    })

    return jsonify(resp), 200

@app.post("/query")
def query_legacy():
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    context = data.get("context") or {}

    if not text:
        return jsonify({
            "answer": {
                "empathy": "괜찮아요. 지금 가장 궁금한 한 가지만 적어주시면 돼요.",
                "summary": "짧게라도 좋으니 지금 상황을 알려주세요.",
                "do_now": ["예: 젖물림이 아파요", "예: 가슴이 딱딱해요", "예: 젖양이 부족한 것 같아요"],
                "watch": [],
                "next_questions": []
            },
            "confidence": "low",
            "suggest_escalation": False
        }), 200

    risk_count = count_risk_factors(context)
    suggest_escalation = risk_count >= 2
    built = build_answer(text, context)

    resp = {
        "answer": built["answer"],
        "confidence": built["confidence"],
        "suggest_escalation": suggest_escalation
    }
    
    if suggest_escalation:
        resp["escalation_type"] = "phone_24h"
        resp["escalation_cta_label"] = "24시간 전문가 전화 상담 연결"

    return jsonify(resp), 200

def is_weekend_seoul():
    if ZoneInfo:
        now = datetime.now(ZoneInfo("Asia/Seoul"))
    else:
        now = datetime.utcnow()
    return now.weekday() >= 5


@app.post("/api/escalate")
def escalate():
    data = request.get_json() or {}

    phone = (data.get("contact_phone") or "").strip()
    preferred_time = (data.get("preferred_time") or "").strip()
    context = data.get("context") or {}
    question = (data.get("question") or "").strip()
    source = data.get("source") or "ebook"

    if not phone:
        return jsonify({"ok": False, "error": "missing_phone"}), 400

    case_id = f"MB-{uuid.uuid4().hex[:8].upper()}"

    weekend = is_weekend_seoul()
    callback_policy = "weekday_only"
    user_message = (
        "접수 완료. 평일에 전화로 조용히 연락드릴게요."
        if not weekend
        else "접수 완료. 주말에는 접수만 가능하며, 평일에 순차적으로 연락드릴게요."
    )

    record = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "case_id": case_id,
        "source": source,
        "callback_policy": callback_policy,
        "weekend_received": weekend,
        "contact_phone": phone,
        "preferred_time": preferred_time,
        "question": question,
        "context": context,
        "status": "received"
    }
    save_escalation(record)

    return jsonify({
        "ok": True,
        "case_id": case_id,
        "message": user_message
    }), 200

EXPERT_KEY = os.environ.get("EXPERT_KEY", "")

def check_expert_key(key):
    return key and key == EXPERT_KEY

@app.get("/expert")
def expert_page():
    key = request.args.get("key", "")
    if not check_expert_key(key):
        return "<h2>접근 권한이 없습니다.</h2>", 403
    return send_file("expert.html")

@app.get("/api/expert/cases")
def get_expert_cases():
    key = request.args.get("key", "")
    if not check_expert_key(key):
        return jsonify({"error": "unauthorized"}), 403
    
    cases = []
    notes_by_case = {}
    
    if os.path.exists("logs/expert_notes.jsonl"):
        with open("logs/expert_notes.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        note = json.loads(line)
                        cid = note.get("case_id")
                        if cid:
                            if cid not in notes_by_case:
                                notes_by_case[cid] = []
                            notes_by_case[cid].append(note)
                    except:
                        pass
    
    if os.path.exists("logs/escalations.jsonl"):
        with open("logs/escalations.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        case = json.loads(line)
                        cid = case.get("case_id")
                        if cid and cid in notes_by_case:
                            latest_note = notes_by_case[cid][-1]
                            if latest_note.get("status"):
                                case["status"] = latest_note["status"]
                            case["notes"] = notes_by_case[cid]
                        cases.append(case)
                    except:
                        pass
    
    cases.sort(key=lambda x: x.get("ts", ""), reverse=True)
    return jsonify(cases), 200

@app.post("/api/expert/note")
def save_expert_note():
    key = request.args.get("key", "")
    if not check_expert_key(key):
        return jsonify({"error": "unauthorized"}), 403
    
    data = request.get_json() or {}
    case_id = data.get("case_id")
    status = data.get("status")
    note = data.get("note", "")
    
    if not case_id:
        return jsonify({"error": "missing_case_id"}), 400
    
    record = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "case_id": case_id,
        "status": status,
        "note": note
    }
    
    os.makedirs("logs", exist_ok=True)
    with open("logs/expert_notes.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    
    return jsonify({"ok": True, "saved": record}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
