document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("start-btn");
    const testButtons = document.querySelectorAll(".test-btn");
    const quizContainer = document.getElementById("quiz-container");
    const progressBar = document.getElementById("progress-bar");
    const scoreDisplay = document.getElementById("score-display");
    const timerElement = document.getElementById("time-left");
    let playerName = "";
    let selectedMateria = "";
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;
    let timeRemaining = 0;
    let timerInterval;

    if (startButton) {
        startButton.addEventListener("click", function () {
            document.getElementById("intro").style.display = "none";
            document.getElementById("setup").style.display = "block";
        });
    }

    testButtons.forEach(button => {
        button.addEventListener("click", function () {
            selectedMateria = this.getAttribute("data-materia");
            playerName = document.getElementById("player-name").value || "Anonimo";

            fetchQuestions();
        });
    });

    function fetchQuestions() {
        fetch("https://flask-quiz.onrender.com/get_questions", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materia: selectedMateria })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Errore nel caricamento delle domande: " + (data.message || "Risposta vuota"));
                return;
            }
            questions = data.questions;
            document.getElementById("setup").style.display = "none";
            quizContainer.style.display = "block";
            scoreDisplay.innerText = `Punteggio: 0`;
            startTimer();
            showQuestion();
        })
        .catch(error => console.error("❌ Errore nel caricamento delle domande:", error));
    }

    function startTimer() {
        timeRemaining = questions.length * 30;
        timerElement.innerText = Math.floor(timeRemaining / 60) + " min " + (timeRemaining % 60) + " sec";
        document.getElementById("timer").style.display = "block";

        timerInterval = setInterval(() => {
            timeRemaining--;
            timerElement.innerText = Math.floor(timeRemaining / 60) + " min " + (timeRemaining % 60) + " sec";

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert("Tempo scaduto! Il quiz è terminato.");
                sendResults();
            }
        }, 1000);
    }

    function showQuestion() {
        if (currentQuestionIndex >= questions.length) {
            clearInterval(timerInterval);
            showFinalScore();
            sendResults();
            return;
        }

        const questionData = questions[currentQuestionIndex];
        quizContainer.innerHTML = `<h2>${questionData.question}</h2>`;

        const options = [...questionData.options].sort(() => Math.random() - 0.5); 

        options.forEach(option => {
            const button = document.createElement("button");
            button.textContent = option;
            button.classList.add("option");
            button.addEventListener("click", function () {
                if (option === questionData.answer) {
                    button.style.backgroundColor = "green";
                    score += 1;
                    correctAnswers++;
                } else {
                    button.style.backgroundColor = "red";
                    score -= 0.33;
                    wrongAnswers++;
                    document.querySelectorAll(".option").forEach(btn => {
                        if (btn.textContent === questionData.answer) {
                            btn.style.backgroundColor = "green";
                        }
                    });
                }
                updateScore();
                setTimeout(() => {
                    currentQuestionIndex++;
                    showQuestion();
                }, 1000);
            });
            quizContainer.appendChild(button);
        });

        const skipButton = document.createElement("button");
        skipButton.textContent = "Salta";
        skipButton.classList.add("skip-btn");
        skipButton.addEventListener("click", function () {
            skippedAnswers++;
            currentQuestionIndex++;
            showQuestion();
        });
        quizContainer.appendChild(skipButton);

        updateProgress();
    }

    function updateProgress() {
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = progress + "%";
    }

    function updateScore() {
        scoreDisplay.innerText = `Punteggio: ${score.toFixed(2)}`;
    }

    function showFinalScore() {
        quizContainer.innerHTML = `
            <h2>Quiz terminato!</h2>
            <p><strong>Punteggio finale:</strong> ${score.toFixed(2)}</p>
            <p><strong>Risposte corrette:</strong> ${correctAnswers} (${((correctAnswers / questions.length) * 100).toFixed(2)}%)</p>
            <p><strong>Risposte sbagliate:</strong> ${wrongAnswers} (${((wrongAnswers / questions.length) * 100).toFixed(2)}%)</p>
            <p><strong>Domande saltate:</strong> ${skippedAnswers} (${((skippedAnswers / questions.length) * 100).toFixed(2)}%)</p>
            <button onclick="location.reload()">Riprova il Test</button>
        `;
    }

    function sendResults() {
        const formData = new FormData();
        formData.append("action", "save_quiz_score");
        formData.append("user_name", playerName);
        formData.append("test_type", selectedMateria);
        formData.append("total_questions", questions.length);
        formData.append("score", score.toFixed(2));
        formData.append("correct_percentage", ((correctAnswers / questions.length) * 100).toFixed(2));
        formData.append("wrong_percentage", ((wrongAnswers / questions.length) * 100).toFixed(2));
        formData.append("skipped_percentage", ((skippedAnswers / questions.length) * 100).toFixed(2));

        fetch("https://www.generazionefuturacaivano.it/wp-admin/admin-post.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            alert("Punteggio inviato a WordPress!");
            console.log("Risultato salvato:", data);
        })
        .catch(error => console.error("❌ Errore nel salvataggio del punteggio:", error));
    }
});
