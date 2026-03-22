
let allQuestions = [];
let currentExamFile = "gh-300-full.json";

const container = document.getElementById("questionsContainer");
const searchInput = document.getElementById("searchInput");
const searchOptionsToggle = document.getElementById("searchOptionsToggle");

// Add dropdown for exam file selection
let examSelect = document.getElementById("examSelect");
if (!examSelect) {
  examSelect = document.createElement("select");
  examSelect.id = "examSelect";
  examSelect.innerHTML = `
    <option value="gh-300-full.json">GH-300</option>
    <option value="az-900-local.json">AZ-900</option>
  `;
  document.querySelector("header").appendChild(examSelect);
}

examSelect.addEventListener("change", () => {
  currentExamFile = examSelect.value;
  loadQuestions();
});

function loadQuestions() {
  fetch(currentExamFile)
    .then(res => res.json())
    .then(data => {
      allQuestions = data.questions;
      let questionNumber = 1;
      allQuestions.forEach(q => {
        q.questionNumber = q.questionNumber || questionNumber++;
      });
      renderQuestions(allQuestions);
    });
}

// Initial load
loadQuestions();


function renderQuestions(questions, keyword = "", highlightOptions = false) {
  container.innerHTML = "";

  if (questions.length === 0) {
    container.innerHTML = "<p>No matching questions found.</p>";
    return;
  }

  // Helper function to highlight keyword in text (plain text only)
  function highlightText(text, keyword) {
    if (!keyword || !text) return text;
    // Only highlight in plain text, not inside HTML tags
    // If text contains HTML, skip highlighting
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "question-card";

    // Render question (may contain HTML/images)
    let questionHTML = q.question ? q.question : "<em>No question text provided</em>";
    if (keyword && !/<[a-z][\s\S]*>/i.test(questionHTML)) {
      questionHTML = highlightText(questionHTML, keyword);
    }

    // Render options (may be null or contain HTML/images)
    let optionsHTML = "";
    if (q.options && typeof q.options === "object") {
      optionsHTML = `<ul class="options">${Object.entries(q.options).map(([key, value]) => {
        let optionValue = value || "";
        if (highlightOptions && !/<[a-z][\s\S]*>/i.test(optionValue)) {
          optionValue = highlightText(optionValue, keyword);
        }
        return `<li class="${q.correct_answer && q.correct_answer.includes(key) ? "correct" : ""}"><strong>${key}.</strong> ${optionValue}</li>`;
      }).join("")}</ul>`;
    }

    // Render correct answer(s) if options are null (e.g., drag-and-drop/image answers)
    let answerHTML = "";
    if ((!q.options || q.options === null) && q.correct_answer && Array.isArray(q.correct_answer)) {
      answerHTML = `<div class="answer-area"><strong>Answer:</strong> ${q.correct_answer.map(ans => ans).join("<br>")}</div>`;
    }

    card.innerHTML = `
      <div class="question-title">Q${q.questionNumber}</div>
      <div class="question-text">${questionHTML}</div>
      ${optionsHTML}
      ${answerHTML}
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
    if (searchOptions && q.options && typeof q.options === "object") {
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
