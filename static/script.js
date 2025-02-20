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
            if (selectedMateria === "full") {
                totalQuestions = 100;
                playerName = document.getElementById("player-name").value || "Anonimo";
                setTimer();
                fetchQuestions();
            } else {
                questionOptions.style.display = "block";
            }
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
        const timeMapping = { 30: 1500, 50: 2100, 70: 3300, 100: 4500 };
        timeRemaining = timeMapping[totalQuestions] || 4500;

        timerElement.innerText = `${Math.floor(timeRemaining / 60)} min ${timeRemaining % 60} sec`;
        document.getElementById("timer").style.display = "block";

        timerInterval = setInterval(() => {
            timeRemaining--;
            timerElement.innerText = `${Math.floor(timeRemaining / 60)} min ${timeRemaining % 60} sec`;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert("Tempo scaduto! Il quiz è terminato.");
                sendResults();
            }
        }, 1000);
    }

    function fetchQuestions() {
        fetch("https://flask-quiz.onrender.com/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                materia: selectedMateria,
                num_questions: totalQuestions
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Errore nel caricamento delle domande: " + (data.error || "Risposta vuota"));
                return;
            }

            questions = data.questions.map(q => ({
                ...q,
                options: q.options.sort(() => Math.random() - 0.5)  // Mischia le risposte
            }));

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
        const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
        progressBar.style.width = Math.min(progress, 100) + "%";  // Impedisce che vada fuori bordo
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
