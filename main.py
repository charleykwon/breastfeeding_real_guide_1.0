from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("assets", filename)

@app.post("/query")
def query():
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    context = data.get("context", {})

    return jsonify({
        "picked": {
            "title": "맘곁 기본 안내",
            "content": (
                f"지금 말씀해주신 상황을 정리해보면:\n\n"
                f"- 아기 월령: {context.get('baby_age', '미입력')}\n"
                f"- 주요 고민: {context.get('main_issue', '미입력')}\n\n"
                "이 상황은 많은 엄마들이 겪는 과정이에요.\n"
                "지금은 수유 간격을 조금 더 자주 가져가고,\n"
                "엄마 몸을 먼저 편안하게 해주는 게 중요해요."
            )
        },
        "top_k": []
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
