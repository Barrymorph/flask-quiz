document.getElementById("start-btn").addEventListener("click", function() {
    document.getElementById("intro").style.display = "none";
    document.getElementById("setup").style.display = "block";
});

let selectedMateria = "";
document.querySelectorAll(".test-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        selectedMateria = this.getAttribute("data-materia");
        document.getElementById("question-options").style.display = "block";
    });
});

document.querySelectorAll(".num-questions").forEach(btn => {
    btn.addEventListener("click", function() {
        const numQuestions = parseInt(this.getAttribute("data-num"));
        const playerName = document.getElementById("player-name").value.trim();

        if (!playerName) {
            alert("❌ Inserisci il tuo nome!");
            return;
        }

        fetch("/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materia: selectedMateria, num_questions: numQuestions })
        })
        .then(response => response.json())
        .then(data => {
            startQuiz(playerName, data.questions, selectedMateria, data.time_limit);
        })
        .catch(error => {
            console.error("Errore nel caricamento delle domande:", error);
            alert("❌ Errore di connessione al server.");
        });
    });
});

function startQuiz(playerName, questions, materia, timeLimit) {
    document.getElementById("setup").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("timer").style.display = "block";
    document.getElementById("progress").style.display = "block";

    let score = 0, index = 0;
    let correctAnswers = 0, wrongAnswers = 0, skippedAnswers = 0;
    
    let timeLeft = timeLimit;
    let timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time-left").innerText = `Tempo rimasto: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("⏳ Tempo scaduto!");
            endQuiz(playerName, score, questions.length, materia, correctAnswers, wrongAnswers, skippedAnswers);
        }
    }, 1000);

    function updateProgress() {
        const progress = (index / questions.length) * 100;
        document.getElementById("progress-bar").style.width = progress + "%";
        document.getElementById("score-display").innerText = `Punteggio: ${score.toFixed(2)}`;
    }

    function showQuestion() {
        if (index >= questions.length) {
            clearInterval(timerInterval);
            endQuiz(playerName, score, questions.length, materia, correctAnswers, wrongAnswers, skippedAnswers);
            return;
        }

        const q = questions[index];
        let options = [...q.options].sort(() => Math.random() - 0.5);

        document.getElementById("quiz-container").innerHTML = `
            <h2>${q.question}</h2>
            ${options.map(opt => `<button class="answer-btn">${opt}</button>`).join("")}
            <button class="skip-btn">⏭️ Salta</button>
        `;

        document.querySelectorAll(".answer-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                const userAnswer = this.innerText.trim().toLowerCase();
                const correctAnswer = q.answer.trim().toLowerCase();

                if (userAnswer === correctAnswer) {
                    score += 1;
                    correctAnswers++;
                    this.classList.add("correct");
                } else {
                    score -= 0.33;
                    wrongAnswers++;
                    this.classList.add("wrong");

                    document.querySelectorAll(".answer-btn").forEach(btn => {
                        if (btn.innerText.trim().toLowerCase() === correctAnswer) {
                            btn.classList.add("correct");
                        }
                    });
                }

                setTimeout(() => {
                    index++;
                    updateProgress();
                    showQuestion();
                }, 1000);
            });
        });

        document.querySelector(".skip-btn").addEventListener("click", function() {
            skippedAnswers++;
            alert(`🔵 Hai saltato la domanda. La risposta corretta era: "${q.answer}"`);
            index++;
            updateProgress();
            showQuestion();
        });
    }

    showQuestion();
}

function endQuiz(name, score, total, materia, correct, wrong, skipped) {
    saveScore(name, score, total, materia, correct, wrong, skipped);

    document.getElementById("quiz-container").innerHTML = `
        <h2>Quiz Completato!</h2>
        <p>Punteggio: ${score.toFixed(2)} / ${total}</p>
        <p>Risposte corrette: ${correct} (${((correct / total) * 100).toFixed(2)}%)</p>
        <p>Risposte errate: ${wrong} (${((wrong / total) * 100).toFixed(2)}%)</p>
        <p>Domande saltate: ${skipped} (${((skipped / total) * 100).toFixed(2)}%)</p>
        <button onclick="location.reload()">🔄 Ripeti il test</button>
    `;
}

function saveScore(name, score, total, materia, correct, wrong, skipped) {
    fetch("/save_score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            name, 
            score, 
            test_type: materia, 
            total_questions: total, 
            correct_answers: correct, 
            wrong_answers: wrong, 
            skipped_answers: skipped 
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("quiz-container").innerHTML += `
            <p>✅ Risultato salvato!</p>
            <a href="${data.file}" download>📄 Scarica il tuo punteggio</a>
        `;
    });
}
