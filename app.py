import os
import json
import random
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Percorso della cartella delle domande
QUESTIONS_DIR = os.path.join(os.getcwd(), "questions")

# Mappa dei file JSON per ogni materia
files = {
    "1": "materia1.json",
    "2": "materia2.json",
    "3": "materia3.json",
    "4": "materia4.json"
}

# Funzione per caricare le domande da un file JSON
def load_questions(filename):
    filepath = os.path.join(QUESTIONS_DIR, filename)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ Errore: file {filepath} non trovato.")
        return []
    except json.JSONDecodeError:
        print(f"⚠️ Errore: file {filepath} non valido JSON.")
        return []

# Route principale
@app.route("/")
def index():
    return render_template("index.html")

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

        if len(questions_1) < 45 or len(questions_2) < 25 or len(questions_3) < 20 or len(questions_4) < 10:
            return jsonify({"error": "Non ci sono abbastanza domande disponibili."}), 400

        selected_questions.extend(random.sample(questions_1, 45))
        selected_questions.extend(random.sample(questions_2, 25))
        selected_questions.extend(random.sample(questions_3, 20))
        selected_questions.extend(random.sample(questions_4, 10))

    elif materia in files:
        questions = load_questions(files[materia])
        if len(questions) < num_questions:
            return jsonify({"error": "Non ci sono abbastanza domande disponibili."}), 400
        selected_questions = random.sample(questions, num_questions)

    else:
        return jsonify({"error": "Materia non valida"}), 400

    # Mischia le opzioni delle domande
    for question in selected_questions:
        random.shuffle(question["options"])

    return jsonify({"success": True, "questions": selected_questions})

# Avvio dell'app Flask
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
