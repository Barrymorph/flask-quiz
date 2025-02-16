import pandas as pd
import json

# Nome del file Excel
excel_file = "Banca per test.xls"

# Carica i nomi dei fogli disponibili
xls = pd.ExcelFile(excel_file)
sheets = xls.sheet_names  # Ottiene i nomi dei fogli

print("📂 Fogli trovati nel file:", sheets)

# Creiamo un dizionario per associare numeri alle materie
materie = {str(i+1): sheet for i, sheet in enumerate(sheets)}

# Loop per ogni foglio e creazione dei JSON
for num, sheet in materie.items():
    print(f"🔄 Elaborando '{sheet}'...")

    # Carica i dati del foglio
    df = pd.read_excel(excel_file, sheet_name=sheet, dtype=str)
    
    # Assicuriamoci che il file abbia le colonne corrette
    expected_columns = ["Domanda", "Opzione A", "Opzione B", "Opzione C", "Opzione D", "Risposta corretta"]
    if not all(col in df.columns for col in expected_columns):
        print(f"⚠️ Il foglio '{sheet}' non ha le colonne giuste. Saltato!")
        continue

    # Creiamo il formato JSON
    questions = []
    for _, row in df.iterrows():
        domanda = row["Domanda"]
        options = [row["Opzione A"], row["Opzione B"], row["Opzione C"], row["Opzione D"]]
        answer = row["Risposta corretta"]

        # Aggiungi la domanda in formato JSON
        questions.append({
            "question": domanda,
            "options": options,
            "answer": answer
        })

    # Salva il JSON
    output_file = f"materia{num}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=4, ensure_ascii=False)

    print(f"✅ File {output_file} generato con {len(questions)} domande!")

print("🎉 Tutti i file JSON sono stati creati correttamente!")
