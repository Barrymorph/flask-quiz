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

    document.querySelectorAll(".test-btn").forEach(button => {
        button.addEventListener("click", function () {
            selectedMateria = this.getAttribute("data-materia");

            if (selectedMateria === "full") {
                playerName = document.getElementById("player-name").value || "Anonimo";
                fetchQuestions(true);
            } else {
                questionOptions.style.display = "block";
            }
        });
    });

    document.querySelectorAll(".num-questions").forEach(button => {
        button.addEventListener("click", function () {
            totalQuestions = parseInt(this.getAttribute("data-num"));
            playerName = document.getElementById("player-name").value || "Anonimo";
            fetchQuestions(false);
        });
    });

    function fetchQuestions(isFullTest) {
        let requestBody = isFullTest
            ? { materia: "full" }
            : { materia: selectedMateria, num_questions: totalQuestions };

        fetch("https://flask-quiz.onrender.com/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Errore nel caricamento delle domande: " + (data.message || "Risposta vuota"));
                return;
            }

            questions = data.questions.map(q => ({
                ...q,
                options: shuffleArray(q.options) // Mischia le risposte
            }));

            setupContainer.style.display = "none";
            quizContainer.style.display = "block";
            progressContainer.style.display = "block";
            scoreDisplay.innerText = `Punteggio: 0`;
            showQuestion();
        })
        .catch(error => console.error("❌ Errore nel caricamento delle domande:", error));
    }

    function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
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
            button.classList.add("answer-btn");
            button.addEventListener("click", function () {
                if (option === questionData.answer) {
                    button.classList.add("correct");
                    score += 1;
                    correctAnswers++;
                } else {
                    button.classList.add("wrong");
                    score -= 0.33;
                    wrongAnswers++;
                }
                updateScore();
                setTimeout(() => {
                    currentQuestionIndex++;
                    showQuestion();
                }, 1000);
            });
            quizContainer.appendChild(button);
        });

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
