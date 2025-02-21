document.addEventListener("DOMContentLoaded", function () {
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

    function startQuiz(materia, player) {
        selectedMateria = materia;
        playerName = player || "Anonimo";
        
        fetch(`https://flask-quiz.onrender.com/get_questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materia: selectedMateria })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Errore nel caricamento delle domande: " + (data.error || "Nessuna risposta"));
                return;
            }
            questions = data.questions;
            totalQuestions = questions.length;
            
            document.getElementById("setup").style.display = "none";
            quizContainer.style.display = "block";
            progressContainer.style.display = "block";
            scoreDisplay.innerText = `Punteggio: 0`;

            setTimer();  // Avvia il timer
            showQuestion();
        })
        .catch(error => console.error("❌ Errore nel caricamento delle domande:", error));
    }

    function setTimer() {
        timeRemaining = totalQuestions * 30; // 30 secondi per ogni domanda

        timerElement.innerText = formatTime(timeRemaining);
        document.getElementById("timer").style.display = "block";

        timerInterval = setInterval(() => {
            timeRemaining--;
            timerElement.innerText = formatTime(timeRemaining);

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert("Tempo scaduto! Il quiz è terminato.");
                showFinalScore();
                sendResults();
            }
        }, 1000);
    }

    function formatTime(seconds) {
        let min = Math.floor(seconds / 60);
        let sec = seconds % 60;
        return `${min} min ${sec} sec`;
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

        questionData.options.sort(() => Math.random() - 0.5);  // 🔀 Mischia le opzioni

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

        // Pulsante "Salta"
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

    // Inizializza il quiz al caricamento della pagina
    const urlParams = new URLSearchParams(window.location.search);
    const materia = urlParams.get("materia");
    const player = urlParams.get("player");

    if (materia) {
        startQuiz(materia, player);
    }
});
