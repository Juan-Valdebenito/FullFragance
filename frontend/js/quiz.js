let quizNotes = [];
let quizStep = 0;
const quizScores = {};
const QUIZ_BATCH = 4;

async function maybeOpenQuiz(user) {
  if (!user || user.scentPreferences) return;
  await loadQuizNotes();
  openQuizModal();
}

async function loadQuizNotes() {
  if (quizNotes.length) return;
  const { notes } = await Api.getNotes();
  quizNotes = notes;
}

function openQuizModal() {
  quizStep = 0;
  Object.keys(quizScores).forEach((k) => delete quizScores[k]);
  document.getElementById("quizError").textContent = "";
  document.getElementById("quizModal").classList.add("active");
  renderQuizStep();
}

function closeQuizModal() {
  document.getElementById("quizModal").classList.remove("active");
}

function renderQuizStep() {
  const start = quizStep * QUIZ_BATCH;
  const batch = quizNotes.slice(start, start + QUIZ_BATCH);
  const totalSteps = Math.ceil(quizNotes.length / QUIZ_BATCH);
  const progress = ((quizStep + 1) / totalSteps) * 100;

  document.getElementById("quizProgressBar").style.width = progress + "%";
  document.getElementById("quizTitle").textContent =
    quizStep === 0 ? "¿Qué notas te gustan más?" : `Notas ${start + 1}–${start + batch.length}`;

  const content = document.getElementById("quizContent");
  content.innerHTML = batch
    .map(
      (note) => `
      <div class="quiz-note" data-id="${note.id}">
        <div class="quiz-note-head">
          <span class="quiz-family">${note.family}</span>
          <strong>${note.name}</strong>
        </div>
        <p class="quiz-desc">${note.description}</p>
        <div class="quiz-rating">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) => `
            <button type="button" class="rating-btn ${quizScores[note.id] === n ? "active" : ""}" data-note="${note.id}" data-value="${n}">${n}</button>
          `
            )
            .join("")}
          <span class="rating-label">${ratingLabel(quizScores[note.id])}</span>
        </div>
      </div>
    `
    )
    .join("");

  content.querySelectorAll(".rating-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const noteId = btn.dataset.note;
      const value = Number(btn.dataset.value);
      quizScores[noteId] = value;
      renderQuizStep();
    });
  });

  const isLast = quizStep >= totalSteps - 1;
  document.getElementById("quizNextBtn").textContent = isLast ? "Ver recomendaciones" : "Siguiente";
}

function ratingLabel(n) {
  if (!n) return "Sin calificar";
  const labels = ["", "Poco", "Algo", "Bien", "Mucho", "¡Me encanta!"];
  return labels[n] || "";
}

async function submitQuiz() {
  const rated = Object.keys(quizScores).length;
  if (rated < 3) {
    document.getElementById("quizError").textContent =
      "Califica al menos 3 notas para obtener recomendaciones.";
    return false;
  }

  try {
    const { user, recommendations } = await Api.saveScentQuiz(quizScores);
    currentUser = user;
    closeQuizModal();
    showQuizResults(recommendations);
    return true;
  } catch (err) {
    document.getElementById("quizError").textContent = err.message;
    return false;
  }
}

function showQuizResults(recommendations) {
  const grid = document.getElementById("quizResultsGrid");
  grid.innerHTML = renderRecommendationCards(recommendations);
  bindFavoriteButtons(grid);
  document.getElementById("quizResultsModal").classList.add("active");
}

function closeQuizResults() {
  document.getElementById("quizResultsModal").classList.remove("active");
  goToDashboard();
}

document.getElementById("quizNextBtn").addEventListener("click", async () => {
  const totalSteps = Math.ceil(quizNotes.length / QUIZ_BATCH);
  if (quizStep < totalSteps - 1) {
    quizStep++;
    renderQuizStep();
    return;
  }
  await submitQuiz();
});

document.getElementById("quizSkipBtn").addEventListener("click", () => {
  closeQuizModal();
  goToDashboard();
});

document.getElementById("quizResultsCloseBtn").addEventListener("click", closeQuizResults);

document.getElementById("retakeQuizBtn").addEventListener("click", async () => {
  await loadQuizNotes();
  openQuizModal();
});
