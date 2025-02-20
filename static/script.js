document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("start-btn");
    const fullTestButton = document.getElementById("full-test-btn");
    const setupContainer = document.getElementById("setup");
    const questionOptions = document.getElementById("question-options");
    const quizContainer = document.getElementById("quiz-container");
    const progressBar = document.getElementById("progress-bar");
    const progressContainer = document.getElementById("progress");
    const scoreDisplay = document.getElementById("score-display");
    const timerElement = document.getElementById("time-left");
    
    let playerName = "";
    let selectedMateria = "";
    let totalQuestions = 0;
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;
    let questions = [];
    let timeRemaining = 0;
    let timerInterval;

    startButton.addEventListener("click", function () {
        document.getElementById("intro").style.display = "none";
        setupContainer.style.display = "block";
    });

    fullTestButton.addEventListener("click", function () {
        playerName = document.getElementById("player-name").value || "Anonimo";
        fetchQuestions("full", 100);  // ✅ Avvia il test completo con 100 domande
    });

    document.querySelectorAll(".test-btn").forEach(button => {
        button.addEventListener("click", function () {
            selectedMateria = this.getAttribute("data-materia");
            questionOptions.style.display = "block";
        });
    });

    document.querySelectorAll(".num-questions").forEach(button => {
        button.addEventListener("click", function () {
            totalQuestions = parseInt(this.getAttribute("data-num"));
            playerName = document.getElementById("player-name").value || "Anonimo";
            setTimer();
            fetchQuestions(selectedMateria, totalQuestions);
        });
    });

    function setTimer() {
        if (totalQuestions === 30) timeRemaining = 1500; // 25 min
        else if (totalQuestions === 50) timeRemaining = 2100; // 35 min
        else if (totalQuestions === 70) timeRemaining = 3300; // 55 min
        else timeRemaining = 4500; // 100 domande = 75 min

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

    function fetchQuestions(materia, num_questions) {
        fetch("https://flask-quiz.onrender.com/get_questions", {  // ✅ URL corretto per Flask
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materia, num_questions })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Errore nel caricamento delle domande: " + (data.message || "Risposta vuota"));
                return;
            }

            questions = data.questions;
            shuffleAnswers(); // ✅ Mischia le risposte
            setupContainer.style.display = "none";
            quizContainer.style.display = "block";
            progressContainer.style.display = "block";
            scoreDisplay.innerText = `Punteggio: 0`;
            showQuestion();
        })
        .catch(error => console.error("❌ Errore nel caricamento delle domande:", error));
    }

    function shuffleAnswers() {
        questions.forEach(question => {
            question.options = question.options.sort(() => Math.random() - 0.5);
        });
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

        questionData.options.forEach(option => {
            const button = document.createElement("button");
            button.textContent = option;
            button.classList.add("option");
            button.addEventListener("click", function () {
                if (option === questionData.answer) {
                    button.style.backgroundColor = "green"; // Risposta corretta
                    score += 1;
                    correctAnswers++;
                } else {
                    button.style.backgroundColor = "red"; // Risposta errata
                    score -= 0.33;
                    wrongAnswers++;
                    document.querySelectorAll(".option").forEach(btn => {
                        if (btn.textContent === questionData.answer) {
                            btn.style.backgroundColor = "green"; // Mostra la risposta giusta
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
        const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
        progressBar.style.width = progress + "%";
    }

    function updateScore() {
        scoreDisplay.innerText = `Punteggio: ${score.toFixed(2)}`;
    }

    function showFinalScore() {
        quizContainer.innerHTML = `
            <h2>Quiz terminato!</h2>
            <p><strong>Punteggio finale:</strong> ${score.toFixed(2)}</p>
            <p><strong>Risposte corrette:</strong> ${correctAnswers} (${((correctAnswers / totalQuestions) * 100).toFixed(2)}%)</p>
            <p><strong>Risposte sbagliate:</strong> ${wrongAnswers} (${((wrongAnswers / totalQuestions) * 100).toFixed(2)}%)</p>
            <p><strong>Domande saltate:</strong> ${skippedAnswers} (${((skippedAnswers / totalQuestions) * 100).toFixed(2)}%)</p>
            <button onclick="location.reload()">Riprova il Test</button>
        `;
    }

    function sendResults() {
        const formData = new FormData();
        formData.append("action", "save_quiz_score");
        formData.append("user_name", playerName);
        formData.append("test_type", selectedMateria);
        formData.append("total_questions", totalQuestions);
        formData.append("score", score.toFixed(2));
        formData.append("correct_percentage", ((correctAnswers / totalQuestions) * 100).toFixed(2));
        formData.append("wrong_percentage", ((wrongAnswers / totalQuestions) * 100).toFixed(2));
        formData.append("skipped_percentage", ((skippedAnswers / totalQuestions) * 100).toFixed(2));

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
