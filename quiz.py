import json
import random
import time
import csv
from datetime import datetime

# File JSON per ogni materia
files = {
    "1": "materia1.json",
    "2": "materia2.json",
    "3": "materia3.json",
    "4": "materia4.json"
}

materie_nomi = {
    "1": "Cultura Specifica",
    "2": "Cultura Generale",
    "3": "Informatica",
    "4": "Logica"
}

# Timer per ogni domanda (opzionale)
DEFAULT_TIME_LIMIT = 60

# Funzione per caricare le domande da un file JSON
def load_questions(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)

# Funzione per mescolare le opzioni mantenendo la risposta corretta
def shuffle_options(question):
    options = question["options"]
    correct_answer = question["answer"]
    random.shuffle(options)
    return {
        "question": question["question"],
        "options": options,
        "answer": correct_answer
    }

# Richiedi il nome del giocatore (serve per il file CSV)
player_name = input("\n🎮 Inserisci il tuo nome: ").strip()
csv_filename = f"{player_name}_scores.csv"

# Menu principale
while True:
    print("\n🎓 Benvenuto al quiz!")
    print("1) Test su una singola materia")
    print("2) Test completo (100 domande)")
    print("3) Visualizza lo storico dei tuoi test")
    print("4) Esci")

    choice = input("\nScegli un'opzione (1-4): ")

    if choice == "1":
        print("\n📚 Seleziona una materia:")
        for key, value in materie_nomi.items():
            print(f"{key}) {value}")

        materia_choice = input("\nScegli una materia (1-4): ")

        if materia_choice in files:
            num_questions = input("\nQuante domande vuoi? (30, 50, 70): ")
            if num_questions not in ["30", "50", "70"]:
                print("❌ Numero di domande non valido.")
                continue
            num_questions = int(num_questions)
            all_questions = load_questions(files[materia_choice])
            selected_questions = random.sample(all_questions, num_questions)
            test_type = f"Test {materie_nomi[materia_choice]} - {num_questions} domande"
        else:
            print("❌ Scelta non valida!")
            continue

    elif choice == "2":
        print("\n🔢 Test completo con 100 domande!")
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
        test_type = "Test Completo - 100 domande"

    elif choice == "3":
        print("\n📊 Storico dei tuoi test:")
        try:
            with open(csv_filename, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                next(reader)  # Salta l'intestazione
                for row in reader:
                    print(f"📅 {row[0]} | {row[1]} | Punteggio: {row[2]}")
        except FileNotFoundError:
            print("⚠️ Nessuno storico trovato!")
        continue

    elif choice == "4":
        print("👋 Grazie per aver giocato! Arrivederci!")
        break

    else:
        print("❌ Scelta non valida!")
        continue

    # Mescola le domande selezionate
    random.shuffle(selected_questions)

    # Chiedi se attivare il timer
    use_timer = input("\nVuoi attivare il timer di 60 secondi per domanda? (s/n): ").strip().lower() == "s"

    # Inizializza il punteggio
    score = 0

    # Loop sulle domande
    for i, q in enumerate(selected_questions, start=1):
        q = shuffle_options(q)
        
        print(f"\n❓ {i}. {q['question']}")
        option_map = {chr(65+j): opt for j, opt in enumerate(q["options"])}

        for key, value in option_map.items():
            print(f"   {key}) {value}")

        # Timer opzionale
        start_time = time.time()
        user_answer = input("\nRisposta (A, B, C, D oppure ENTER per saltare): ").strip().upper()
        elapsed_time = time.time() - start_time

        if use_timer and elapsed_time > DEFAULT_TIME_LIMIT:
            print("⏳ Tempo scaduto! ❌ Nessun punto.")
        elif user_answer == "":
            print("🔵 Nessuna risposta. 0 punti.")
        elif user_answer in option_map and option_map[user_answer] == q["answer"]:
            print("✅ Corretto! +1.00 punti")
            score += 1.00
        else:
            print(f"❌ Sbagliato! La risposta corretta era: {q['answer']} (-0.33 punti)")
            score -= 0.33

    # Mostra il punteggio finale
    print("\n------------------------------------------------")
    print(f"🏆 {player_name}, hai ottenuto {score:.2f} punti su {len(selected_questions)}!")
    print("📄 Il tuo punteggio è stato salvato!")

    # Salva il punteggio in CSV
    date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(csv_filename, "a", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            if f.tell() == 0:
                writer.writerow(["Data", "Tipo di Test", "Punteggio"])
            writer.writerow([date, test_type, round(score, 2)])
    except Exception as e:
        print(f"⚠️ Errore nel salvataggio del CSV: {e}")

    # Chiedi se vuole ripetere il test
    replay = input("\nVuoi ripetere il test? (s/n): ").strip().lower()
    if replay != "s":
        break
