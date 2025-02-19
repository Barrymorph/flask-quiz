document.addEventListener("DOMContentLoaded", function () {
    console.log("📜 Script JavaScript Caricato ✅");

    const startBtn = document.getElementById("start-btn");
    const testButtons = document.querySelectorAll(".test-btn");
    const questionOptions = document.getElementById("question-options");
    const quizContainer = document.getElementById("quiz-container");
    const timerDisplay = document.getElementById("timer");
    const timeLeftSpan = document.getElementById("time-left");
    let timer, totalTime, score = 0;
    let currentQuestionIndex = 0;
    let questions = [];

    startBtn.addEventListener("click", function () {
        document.getElementById("intro").style.display = "none";
        document.getElementById("setup").style.display = "block";
    });

    testButtons.forEach(button => {
        button.addEventListener("click", function () {
            const materia = this.dataset.materia;
            
            if (materia === "full") {
                // Test Completo: invia direttamente richiesta senza chiedere il numero di domande
                fetchQuestions("full", 100);
            } else {
                questionOptions.style.display = "block";
                document.querySelectorAll(".num-questions").forEach(numButton => {
                    numButton.addEventListener("click", function () {
                        fetchQuestions(materia, parseInt(this.dataset.num));
                    });
                });
            }
        });
    });

    function fetchQuestions(materia, numQuestions) {
        fetch("https://flask-quiz.onrender.com/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materia: materia, num_questions: numQuestions })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                questions = data.questions;
                startQuiz(numQuestions);
            } else {
                alert("Errore nel caricamento delle domande.");
            }
        })
        .catch(error => console.error("Errore:", error));
    }

    function startQuiz(numQuestions) {
        document.getElementById("setup").style.display = "none";
        quizContainer.style.display = "block";
        timerDisplay.style.display = "block";

        // Imposta il timer in base al numero di domande
        if (numQuestions === 30) totalTime = 25 * 60;
        else if (numQuestions === 50) totalTime = 35 * 60;
        else if (numQuestions === 70) totalTime = 55 * 60;
        else totalTime = 75 * 60; // Test completo

        startTimer();
        showQuestion();
    }

    function startTimer() {
        timer = setInterval(() => {
            if (totalTime > 0) {
                totalTime--;
                timeLeftSpan.textContent = totalTime;
            } else {
                clearInterval(timer);
                alert("Tempo scaduto!");
                endQuiz();
            }
        }, 1000);
    }

    function showQuestion() {
        if (currentQuestionIndex >= questions.length) {
            endQuiz();
            return;
        }

        let q = questions[currentQuestionIndex];
        quizContainer.innerHTML = `
            <h3>${q.question}</h3>
            ${q.options.map((opt, index) => `<button class="option" data-index="${index}">${opt}</button>`).join("")}
        `;

        document.querySelectorAll(".option").forEach(btn => {
            btn.addEventListener("click", function () {
                let userAnswer = parseInt(this.dataset.index);
                checkAnswer(userAnswer, q.correct_index);
            });
        });
    }

    function checkAnswer(userAnswer, correctIndex) {
        if (userAnswer === correctIndex) {
            score++;
        }
        currentQuestionIndex++;
        showQuestion();
    }

    function endQuiz() {
        clearInterval(timer);
        quizContainer.innerHTML = `<h2>Quiz completato!</h2><p>Punteggio: ${score}</p>`;
    }
});
