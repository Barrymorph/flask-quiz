document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("start-btn");
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
            fetchQuestions();
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

    function fetchQuestions() {
        fetch("/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                materia: selectedMateria,
                num_questions: totalQuestions
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data || data.error) {
                alert("Errore nel caricamento delle domande: " + (data.error || "Risposta vuota"));
                return;
            }

            questions = data;
            setupContainer.style.display = "none";
            quizContainer.style.display = "block";
            progressContainer.style.display = "block";
            scoreDisplay.innerText = `Punteggio: 0`;
            showQuestion();
        })
        .catch(error => console.error("❌ Errore nel caricamento delle domande:", error));
    }

    function showQuestion() {
        if (currentQuestionIndex >= questions.length) {
            clearInterval(timerInterval);
           alert(`Quiz terminato! Punteggio finale: ${score.toFixed(2)}`);
            sendResults();
            return;
        }

        const questionData = questions[currentQuestionIndex];
        quizContainer.innerHTML = `<h2>${questionData.question}</h2>`;

        questionData.options.forEach((option, index) => {
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

        // Aggiunge il pulsante "Salta"
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

    function sendResults() {
        fetch("/save_score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_name: playerName,
                test_type: selectedMateria,
                total_questions: totalQuestions,
                correct_answers: correctAnswers,
                wrong_answers: wrongAnswers,
                skipped_answers: skippedAnswers
            })
        })
        .then(response => response.json())
        .then(data => {
            alert("Punteggio inviato a WordPress!");
            console.log("Risultato salvato:", data);
        })
        .catch(error => console.error("❌ Errore nel salvataggio del punteggio:", error));
    }
});
