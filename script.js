let allQuestions = [];

const container = document.getElementById("questionsContainer");
const searchInput = document.getElementById("searchInput");
const searchOptionsToggle = document.getElementById("searchOptionsToggle");

fetch("gh-300-full.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data.questions;
    renderQuestions(allQuestions);
  });

function renderQuestions(questions) {
  container.innerHTML = "";
  let questionNumber = 1;

  if (questions.length === 0) {
    container.innerHTML = "<p>No matching questions found.</p>";
    return;
  }

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "question-card";

    card.innerHTML = `
      <div class="question-title">
        Question ${questionNumber++}
      </div>
      <div>${q.question || "<em>No question text provided</em>"}</div>
      <ul class="options">
        ${Object.entries(q.options).map(([key, value]) => `
          <li class="${q.correct_answer.includes(key) ? "correct" : ""}">
            <strong>${key}.</strong> ${value}
          </li>
        `).join("")}
      </ul>
    `;

    container.appendChild(card);
  });
}

function filterQuestions() {
  const keyword = searchInput.value.toLowerCase();
  const searchOptions = searchOptionsToggle.checked;

  const filtered = allQuestions.filter(q => {
    const questionText = (q.question || "").toLowerCase();

    let optionText = "";
    if (searchOptions) {
      optionText = Object.values(q.options)
        .join(" ")
        .toLowerCase();
    }

    return (
      questionText.includes(keyword) ||
      (searchOptions && optionText.includes(keyword))
    );
  });

  renderQuestions(filtered);
}

searchInput.addEventListener("input", filterQuestions);
searchOptionsToggle.addEventListener("change", filterQuestions);
