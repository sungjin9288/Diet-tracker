from flask import Flask, render_template, request, jsonify, session
import os

app = Flask(__name__)
app.secret_key = "super-secret"

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        if username:
            session["user"] = username
            return redirect("/dashboard")
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("index.html")

@app.route("/mypage")
def mypage():
    return render_template("mypage.html")

@app.route("/save", methods=["POST"])
def save_data():
    data = request.get_json()
    return jsonify({"status": "ok"})

@app.route("/history")
def get_history():
    return jsonify([])

if __name__ == "__main__":
    app.run()
