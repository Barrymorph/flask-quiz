from flask import Flask, render_template, request, jsonify
import json
import random
from datetime import datetime
import os
import unicodedata  

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

files = {
    "1": os.path.join(BASE_DIR, "materia1.json"),
    "2": os.path.join(BASE_DIR, "materia2.json"),
    "3": os.path.join(BASE_DIR, "materia3.json"),
    "4": os.path.join(BASE_DIR, "materia4.json")
}

def normalize_text(text):
    """Rimuove spazi extra, normalizza accenti e converte in minuscolo."""
    return unicodedata.normalize("NFKC", str(text).strip().lower())

def load_questions(filename):
    """Carica e normalizza le domande da un file JSON."""
    with open(filename, "r", encoding="utf-8") as f:
        questions = json.load(f)

    for q in questions:
        q["question"] = normalize_text(q["question"])  
        q["answer"] = normalize_text(q["answer"])  
        q["options"] = [normalize_text(opt) for opt in q["options"]]  
        random.shuffle(q["options"])  

    return questions

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get_questions", methods=["POST"])
def get_questions():
    """Gestisce la richiesta di domande dal frontend."""
    data = request.json
    materia = data["materia"]
    num_questions = int(data["num_questions"])

    time_limits = {30: 1200, 50: 2100, 70: 3300, 100: 4500}  # Secondi

    if materia not in files and materia != "full":
        return jsonify({"error": "Materia non valida"}), 400

    if materia == "full":
        all_questions = {
            "1": load_questions(files["1"]),
            "2": load_questions(files["2"]),
            "3": load_questions(files["3"]),
            "4": load_questions(files["4"])
        }
        selected_questions = (
            random.sample(all_questions["1"], 50) +
            random.sample(all_questions["2"], 25) +
            random.sample(all_questions["3"], 15) +
            random.sample(all_questions["4"], 10)
        )
    else:
        questions = load_questions(files[materia])
        if len(questions) < num_questions:
            return jsonify({"error": "Non ci sono abbastanza domande disponibili"}), 400
        selected_questions = random.sample(questions, num_questions)

    return jsonify({"questions": selected_questions, "time_limit": time_limits[num_questions]})

@app.route("/save_score", methods=["POST"])
def save_score():
    """Salva il punteggio del test in un file CSV."""
    data = request.json
    player_name = data["name"]
    score = round(data["score"], 2)
    test_type = data["test_type"]
    total_questions = data["total_questions"]
    correct_answers = data["correct_answers"]
    wrong_answers = data["wrong_answers"]
    skipped_answers = data["skipped_answers"]
    max_score = total_questions * 1  # Max punteggio possibile
    score_percentage = round((score / max_score) * 100, 2)
    date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    correct_percentage = round((correct_answers / total_questions) * 100, 2)
    wrong_percentage = round((wrong_answers / total_questions) * 100, 2)
    skipped_percentage = round((skipped_answers / total_questions) * 100, 2)

    filename = os.path.join(BASE_DIR, f"static/{player_name}_scores.csv")

    with open(filename, "a", encoding="utf-8") as f:
        f.write(f"{date},{test_type},{total_questions},{score},{score_percentage}%,{correct_percentage}%,{wrong_percentage}%,{skipped_percentage}%\n")

    return jsonify({"message": "Punteggio salvato!", "file": f"/static/{player_name}_scores.csv"})

if __name__ == "__main__":
    app.run(debug=True)
