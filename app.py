from flask import Flask, render_template, request, redirect, session, jsonify
import json, os
from datetime import datetime

app = Flask(__name__)
app.secret_key = "secret-key"
DATA_FILE = "user_data.json"

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/")
def home():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    if username:
        session["user_name"] = username
        return redirect("/main")
    return redirect("/")

@app.route("/main")
def main():
    if "user_name" not in session:
        return redirect("/")
    return render_template("index.html", user_name=session["user_name"])

@app.route("/mypage")
def mypage():
    if "user_name" not in session:
        return redirect("/")
    return render_template("mypage.html", user_name=session["user_name"])

@app.route("/stats")
def stats():
    if "user_name" not in session:
        return redirect("/")
    return render_template("stats.html", user_name=session["user_name"])

@app.route("/api/history")
def api_history():
    if "user_name" not in session:
        return jsonify([])
    data = load_data()
    return jsonify(data.get(session["user_name"], []))

@app.route("/api/save", methods=["POST"])
def api_save():
    if "user_name" not in session:
        return jsonify({"status": "error", "message": "로그인이 필요합니다."}), 403

    record = request.get_json()
    record["date"] = datetime.now().strftime("%Y-%m-%d")
    record["type"] = record.get("type", "일반")
    record["routine"] = record.get("routine", False)
    record["weekday"] = record.get("weekday", "")

    data = load_data()
    username = session["user_name"]
    data.setdefault(username, []).append(record)
    save_data(data)
    return jsonify({"status": "success"})
