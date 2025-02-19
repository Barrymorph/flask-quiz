import os
import json
import random
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Percorso dei file JSON delle domande
QUESTIONS_PATH = "questions"

# Mappa dei file JSON per ogni materia
files = {
    "1": "materia1.json",
    "2": "materia2.json",
    "3": "materia3.json",
    "4": "materia4.json"
}

# Funzione per caricare le domande da un file JSON
def load_questions(filename):
    try:
        with open(os.path.join(QUESTIONS_PATH, filename), "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ Errore: file {filename} non trovato.")
        return []
    except json.JSONDecodeError:
        print(f"⚠️ Errore: file {filename} non valido JSON.")
        return []

# Route per ottenere le domande
@app.route("/get_questions", methods=["POST"])
def get_questions():
    data = request.get_json()
    materia = data.get("materia")
    num_questions = data.get("num_questions")

    selected_questions = []

    if materia == "full":  # Test completo (100 domande)
        questions_1 = load_questions(files["1"])
        questions_2 = load_questions(files["2"])
        questions_3 = load_questions(files["3"])
        questions_4 = load_questions(files["4"])

        selected_questions.extend(random.sample(questions_1, min(45, len(questions_1))))
        selected_questions.extend(random.sample(questions_2, min(25, len(questions_2))))
        selected_questions.extend(random.sample(questions_3, min(20, len(questions_3))))
        selected_questions.extend(random.sample(questions_4, min(10, len(questions_4))))

    elif materia in files:
        questions = load_questions(files[materia])
        selected_questions = random.sample(questions, min(num_questions, len(questions)))

    else:
        return jsonify({"error": "Materia non valida"}), 400

    return jsonify(selected_questions)

# Avvio dell'app Flask
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
