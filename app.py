import os
import json
import random
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Percorso ai file JSON delle domande
QUESTIONS_PATH = "questions/"

# Funzione per caricare le domande da un file JSON
def load_questions(filename):
    with open(os.path.join(QUESTIONS_PATH, filename), "r", encoding="utf-8") as f:
        return json.load(f)

# API per ottenere domande casuali
@app.route("/get_questions", methods=["POST"])
def get_questions():
    data = request.json

    if not data or "materia" not in data or "num_questions" not in data:
        return jsonify({"error": "Dati mancanti"}), 400

    materia = data["materia"]
    num_questions = int(data["num_questions"])

    files = {
        "1": "materia1.json",
        "2": "materia2.json",
        "3": "materia3.json",
        "4": "materia4.json",
        "full": "materia_completa.json"
    }

    if materia not in files:
        return jsonify({"error": "Materia non valida"}), 400

    questions = load_questions(files[materia])
    selected_questions = random.sample(questions, min(num_questions, len(questions)))

    for q in selected_questions:
        random.shuffle(q["options"])  # Mischia le risposte

    return jsonify(selected_questions)

# Funzione per inviare i punteggi a WordPress
def save_score_to_wp(name, test_type, total, score, correct, wrong, skipped):
    url = "https://www.generazionefuturacaivano.it/wp-json/quiz/v1/save_score"
    data = {
        "user_name": name,
        "test_type": test_type,
        "total_questions": total,
        "score": score,
        "correct_percentage": (correct / total) * 100 if total > 0 else 0,
        "wrong_percentage": (wrong / total) * 100 if total > 0 else 0,
        "skipped_percentage": (skipped / total) * 100 if total > 0 else 0,
    }

    print("📢 Dati inviati a WordPress:", data)  # Debug per verificare i dati

    try:
        response = requests.post(url, json=data)
        print("📩 Risposta di WordPress:", response.text)  # Debug della risposta di WordPress
        return response.json()
    except requests.exceptions.RequestException as e:
        print("❌ Errore nell'invio a WordPress:", e)
        return {"error": str(e)}

# API per salvare il punteggio quando il quiz finisce
@app.route("/save_score", methods=["POST"])
def save_score():
    data = request.json
    user_name = data.get("user_name")
    test_type = data.get("test_type")
    total_questions = int(data.get("total_questions", 0))
    correct_answers = int(data.get("correct_answers", 0))
    wrong_answers = int(data.get("wrong_answers", 0))
    skipped_answers = int(data.get("skipped_answers", 0))

    # Calcolo del punteggio
    final_score = correct_answers - (wrong_answers * 0.33)

    # Invia i dati a WordPress
    result = save_score_to_wp(user_name, test_type, total_questions, final_score, correct_answers, wrong_answers, skipped_answers)

    return jsonify({"message": "Punteggio salvato", "wordpress_response": result})

# Pagina principale
@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
