let quiz = { title: "", questions: [] };

// Load saved quiz if it exists
window.onload = () => {
  const savedQuiz = localStorage.getItem("quiz");
  if (savedQuiz) {
    quiz = JSON.parse(savedQuiz);
    document.getElementById("quiz-title").value = quiz.title;
    alert("A saved quiz was loaded. You can play it directly!");
    startQuiz();
  }
};

// Generate quiz from AI
async function generateQuizFromAI() {
  const topic = document.getElementById("topic").value.trim();
  const difficulty = document.getElementById("difficulty").value.trim();

  if (!topic || !difficulty) {
    alert("⚠️ Please enter a topic and difficulty!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, difficulty }),
    });

    if (!response.ok) throw new Error("Failed to generate quiz");

    const quizData = await response.json();

    if (!Array.isArray(quizData) || quizData.length === 0) {
      console.error("Invalid AI response:", quizData);
      alert("❌ Failed to generate quiz. AI returned invalid data.");
      return;
    }

    quiz.title = `${topic} (${difficulty}) Quiz`;
    quiz.questions = quizData.map(q => {
      const correctIndex = q.options?.indexOf(q.answer);
      return {
        question: q.question,
        options: q.options || [],
        correct: correctIndex >= 0 ? correctIndex : 0,
        longAnswer: !q.options || q.options.length === 0 // if no options → long answer
      };
    });

    localStorage.setItem("quiz", JSON.stringify(quiz));
    alert("✅ AI Quiz generated successfully!");
    startQuiz();

  } catch (error) {
    console.error(error);
    alert("❌ Failed to generate quiz. Check backend/server.");
  }
}

// Add manual question
function addQuestion() {
  const qDiv = document.createElement("div");
  qDiv.className = "question";
  qDiv.innerHTML = `
    <input type="text" placeholder="Question text" class="q-text">

    <label>
      <input type="checkbox" class="long-answer-toggle" onchange="toggleLongAnswer(this)">
      Long Answer
    </label>

    <div class="options-container">
      <input type="text" placeholder="Option 1" class="opt">
      <input type="text" placeholder="Option 2" class="opt">
      <input type="text" placeholder="Option 3" class="opt">
      <input type="text" placeholder="Option 4" class="opt">
      <input type="number" placeholder="Correct Option (1-4)" class="correct" min="1" max="4">
    </div>
  `;
  document.getElementById("questions").appendChild(qDiv);
}

// Toggle between MCQ and Long Answer in manual mode
function toggleLongAnswer(checkbox) {
  const optionsContainer = checkbox.closest(".question").querySelector(".options-container");

  if (checkbox.checked) {
    optionsContainer.innerHTML = `<textarea placeholder="Enter long answer here..." class="long-answer-text"></textarea>`;
  } else {
    optionsContainer.innerHTML = `
      <input type="text" placeholder="Option 1" class="opt">
      <input type="text" placeholder="Option 2" class="opt">
      <input type="text" placeholder="Option 3" class="opt">
      <input type="text" placeholder="Option 4" class="opt">
      <input type="number" placeholder="Correct Option (1-4)" class="correct" min="1" max="4">
    `;
  }
}

// Save manual quiz
function saveQuiz() {
  quiz.title = document.getElementById("quiz-title").value.trim();
  quiz.questions = [];

  const qDivs = document.querySelectorAll(".question");
  qDivs.forEach(div => {
    const qText = div.querySelector(".q-text").value.trim();
    const isLongAnswer = div.querySelector(".long-answer-toggle")?.checked;

    if (isLongAnswer) {
      if (qText) {
        quiz.questions.push({ question: qText, longAnswer: true, options: [], correct: null });
      }
    } else {
      const opts = div.querySelectorAll(".opt");
      const options = [...opts].map(o => o.value.trim());
      const correct = parseInt(div.querySelector(".correct").value) - 1;

      if (qText && options.every(o => o !== "") && correct >= 0 && correct < 4) {
        quiz.questions.push({ question: qText, options, correct, longAnswer: false });
      }
    }
  });

  if (!quiz.title || quiz.questions.length === 0) {
    alert("⚠️ Please enter a title and at least one valid question!");
    return;
  }

  localStorage.setItem("quiz", JSON.stringify(quiz));
  alert("✅ Quiz saved successfully! Now play it.");
  startQuiz();
}

// Display quiz for playing
function startQuiz() {
  document.getElementById("quiz-maker").style.display = "none";
  document.getElementById("quiz-player").style.display = "block";

  document.getElementById("play-title").innerText = quiz.title;
  const quizContent = document.getElementById("quiz-content");
  quizContent.innerHTML = "";

  quiz.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "play-question";
    div.innerHTML = `<p><strong>${i + 1}. ${q.question}</strong></p>`;

    if (q.longAnswer) {
      div.innerHTML += `<textarea placeholder="Write your answer here..." class="long-answer-user"></textarea>`;
    } else {
      q.options.forEach((opt, j) => {
        div.innerHTML += `
          <label>
            <input type="radio" name="q${i}" value="${j}"> ${opt}
          </label><br>
        `;
      });
    }
    quizContent.appendChild(div);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Submit quiz and show results
function submitQuiz() {
  let score = 0;
  let resultsHTML = "";

  quiz.questions.forEach((q, i) => {
    resultsHTML += `<div class="result-item"><p><strong>${i + 1}. ${q.question}</strong></p>`;

    if (q.longAnswer) {
      const ans = document.querySelectorAll(".long-answer-user")[i].value.trim();
      resultsHTML += `<p><em>Your Answer:</em> ${ans || "❌ Not Answered"}</p>`;
      resultsHTML += `<p class="review-note">✅ This is a long-answer question. Please review manually.</p>`;
    } else {
      const ans = document.querySelector(`input[name="q${i}"]:checked`);
      const userAnswer = ans ? q.options[parseInt(ans.value)] : null;
      const correctAnswer = q.options[q.correct];

      if (ans && parseInt(ans.value) === q.correct) {
        score++;
        resultsHTML += `<p>✔️ Correct! Your Answer: ${userAnswer}</p>`;
      } else {
        resultsHTML += `<p>❌ Wrong! Your Answer: ${userAnswer || "Not Answered"}</p>`;
        resultsHTML += `<p>✅ Correct Answer: ${correctAnswer}</p>`;
      }
    }

    resultsHTML += `</div><hr>`;
  });

  document.getElementById("quiz-player").style.display = "none";
  document.getElementById("results").style.display = "block";
  document.getElementById("score").innerText =
    `🎉 You scored ${score} / ${quiz.questions.filter(q => !q.longAnswer).length} (MCQs auto-graded)`;

  document.getElementById("detailed-results").innerHTML = resultsHTML;
}

// Restart quiz
function restart() {
  localStorage.removeItem("quiz");
  location.reload();
}
