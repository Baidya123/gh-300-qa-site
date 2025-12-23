let allQuestions = [];

const container = document.getElementById("questionsContainer");
const searchInput = document.getElementById("searchInput");
const searchOptionsToggle = document.getElementById("searchOptionsToggle");

fetch("gh-300-full.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data.questions;
    let questionNumber = 1;
    allQuestions.forEach(q => {
      q.questionNumber = q.questionNumber || questionNumber++;
    });
    renderQuestions(allQuestions);
  });

function renderQuestions(questions, keyword = "", highlightOptions = false) {
  container.innerHTML = "";

  if (questions.length === 0) {
    container.innerHTML = "<p>No matching questions found.</p>";
    return;
  }

  // Helper function to highlight keyword in text
  function highlightText(text, keyword) {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "question-card";

    card.innerHTML = `
      <div class="question-title">
        Q${q.question_number}
      </div>
      <div>${highlightText(q.question || "<em>No question text provided</em>", keyword)}</div>
      <ul class="options">
        ${Object.entries(q.options).map(([key, value]) => `
          <li class="${q.correct_answer.includes(key) ? "correct" : ""}">
            <strong>${key}.</strong> ${highlightOptions ? highlightText(value, keyword) : value}
          </li>
        `).join("")}
      </ul>
    `;

    container.appendChild(card);
  });
}

function filterQuestions() {
  const originalKeyword = searchInput.value;
  const keyword = originalKeyword.toLowerCase();
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

  renderQuestions(filtered, originalKeyword, searchOptions);
}

searchInput.addEventListener("input", filterQuestions);
searchOptionsToggle.addEventListener("change", filterQuestions);
