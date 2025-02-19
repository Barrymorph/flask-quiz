from flask import Flask, render_template, request, jsonify
import random
import json

app = Flask(__name__)

# Carica le domande dalle varie materie
def load_questions(filename):
    try:
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# Mappatura file per ogni materia
files = {
    "1": "cultura_specifica.json",
    "2": "cultura_generale.json",
    "3": "informatica.json",
    "4": "logica.json"
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_questions", methods=["POST"])
def get_questions():
    data = request.json
    materia = data.get("materia")
    num_questions = data.get("num_questions")

    if materia == "full":
        selected_questions = []
        if all(m in files for m in ["1", "2", "3", "4"]):
            selected_questions.extend(random.sample(load_questions(files["1"]), 45))
            selected_questions.extend(random.sample(load_questions(files["2"]), 25))
            selected_questions.extend(random.sample(load_questions(files["3"]), 20))
            selected_questions.extend(random.sample(load_questions(files["4"]), 10))
        else:
            return jsonify({"success": False, "message": "Errore nel caricamento delle domande."}), 400
    else:
        if materia not in files:
            return jsonify({"success": False, "message": "Materia non valida"}), 400
        selected_questions = random.sample(load_questions(files[materia]), num_questions)

    return jsonify({"success": True, "questions": selected_questions})

if __name__ == "__main__":
    app.run(debug=True)
