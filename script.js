// --- Simple Login Overlay ---
const MAIN_CONTENT_ID = "mainContent";
const LOGIN_OVERLAY_ID = "loginOverlay";

// Supabase config
const SUPABASE_URL = "https://tvtxasywjdlzmpjikmqh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dHhhc3l3amRsem1wamlrbXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODYxMjcsImV4cCI6MjA4OTg2MjEyN30.y-ThLV65BKtxzGpAcf077qz05-he5u6IwKcOZbDNQSE"; // anon/public key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function showLoginOverlay() {
  // Hide main content
  let mainContent = document.getElementById(MAIN_CONTENT_ID);
  if (mainContent) mainContent.style.display = "none";

  // Create login overlay if not exists
  let overlay = document.getElementById(LOGIN_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = LOGIN_OVERLAY_ID;
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0,0,0,0.7)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 9999;
    overlay.innerHTML = `
      <form id="loginForm" style="background:#fff;padding:2em 3em;border-radius:8px;box-shadow:0 2px 16px #0003;min-width:300px;">
        <h2 style="margin-top:0">Login</h2>
        <div style="margin-bottom:1em;">
          <input id="loginUser" type="email" placeholder="Email" style="width:100%;padding:0.5em;" required>
        </div>
        <div style="margin-bottom:1em;">
          <input id="loginPass" type="password" placeholder="Password" style="width:100%;padding:0.5em;" required>
        </div>
        <div id="loginError" style="color:red;display:none;margin-bottom:1em;"></div>
        <button type="submit" style="width:100%;padding:0.5em;">Login</button>
      </form>
    `;
    document.body.appendChild(overlay);
    document.getElementById("loginForm").onsubmit = async function(e) {
      e.preventDefault();
      const email = document.getElementById("loginUser").value;
      const pass = document.getElementById("loginPass").value;
      const { error, data } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (!error) {
        overlay.style.display = "none";
        if (mainContent) mainContent.style.display = "";
        sessionStorage.setItem("loggedIn", "1");
      } else {
        document.getElementById("loginError").textContent = error.message;
        document.getElementById("loginError").style.display = "block";
      }
    };
    // No sign-up link or handler
  } else {
    overlay.style.display = "flex";
  }
}

// Sign-up overlay and logic removed (app is login-only)

async function checkLogin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    let mainContent = document.getElementById(MAIN_CONTENT_ID);
    if (mainContent) mainContent.style.display = "";
    let overlay = document.getElementById(LOGIN_OVERLAY_ID);
    if (overlay) overlay.style.display = "none";
    sessionStorage.setItem("loggedIn", "1");
    return true;
  } else {
    showLoginOverlay();
    return false;
  }
}

// Wrap all main content in a div for easy show/hide
document.addEventListener("DOMContentLoaded", () => {
  let mainContent = document.getElementById(MAIN_CONTENT_ID);
  if (!mainContent) {
    mainContent = document.createElement("div");
    mainContent.id = MAIN_CONTENT_ID;
    // Move all body children except login overlay into mainContent
    Array.from(document.body.children).forEach(child => {
      if (child.id !== LOGIN_OVERLAY_ID) mainContent.appendChild(child);
    });
    document.body.appendChild(mainContent);
  }
  checkLogin();
});

let allQuestions = [];
let currentExamFile = null;

const container = document.getElementById("questionsContainer");
const searchInput = document.getElementById("searchInput");
const searchOptionsToggle = document.getElementById("searchOptionsToggle");

// Add dropdown for exam file selection

// Only initialize exam select if logged in
function initExamSelect() {
  let examSelect = document.getElementById("examSelect");
  if (!examSelect) {
    examSelect = document.createElement("select");
    examSelect.id = "examSelect";
    document.querySelector("header").appendChild(examSelect);
  }

  // Fetch exam file list from index.json
  fetch("index.json")
    .then(res => res.json())
    .then(files => {
      examSelect.innerHTML = files.map(f => {
        // Display a friendly name (remove .json, replace dashes/underscores)
        const label = f.replace(/\.json$/, "").replace(/[-_]/g, " ").toUpperCase();
        return `<option value="${f}">${label}</option>`;
      }).join("");
      // Set default
      currentExamFile = files[0];
      loadQuestions();
    });

  examSelect.addEventListener("change", () => {
    currentExamFile = examSelect.value;
    loadQuestions();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (checkLogin()) {
    initExamSelect();
  } else {
    // Wait for login, then initialize
    const observer = new MutationObserver(() => {
      if (sessionStorage.getItem("loggedIn") === "1") {
        initExamSelect();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

function loadQuestions() {
  if (!currentExamFile) return;
  fetch(`exams/${currentExamFile}`)
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
