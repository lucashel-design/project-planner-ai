import { createPlanFromBrief } from "./js/planner.js";
import {
  loadProjects,
  addProject,
  getActiveProjectId,
  getActiveProject,
  selectProject,
  deleteProject,
  completeCurrentTask,
  addConversationEntry
} from "./js/state.js";
import { renderOutput, renderProjectsList } from "./js/ui.js";
import { answerQuestion } from "./js/assistant.js";

/* ============================
   DETECTAR TIPO DE PROYECTO
============================ */

console.log("APP COMPLETA CARGADA");

function detectProjectType(initialIdea) {
  const text = (initialIdea || "").toLowerCase();

  if (
    text.includes("marketing") ||
    text.includes("campanha") ||
    text.includes("anúncio") ||
    text.includes("anuncio") ||
    text.includes("conteudo") ||
    text.includes("conteúdo") ||
    text.includes("instagram") ||
    text.includes("publicidade")
  ) {
    return "marketing";
  }

  if (
    text.includes("app") ||
    text.includes("aplicação") ||
    text.includes("aplicacao") ||
    text.includes("software") ||
    text.includes("site") ||
    text.includes("plataforma")
  ) {
    return "app";
  }

  return "generic";
}

function buildProjectReference(initialIdea) {
  const clean = (initialIdea || "").trim();
  if (!clean) return "este proyecto";
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 80)}...`;
}

function getBriefingQuestions(initialIdea) {
  const projectType = detectProjectType(initialIdea);
  const projectRef = buildProjectReference(initialIdea);

  if (projectType === "marketing") {
    return {
      projectType,
      questions: [
        { key: "result", text: `¿Qué resultado quieres generar con "${projectRef}"?` },
        { key: "customer", text: `¿Qué cliente quieres atraer con "${projectRef}"?` },
        { key: "channel", text: `¿En qué canal quieres enfocarte primero en este proyecto?` },
        { key: "offer", text: `¿Qué producto o servicio quieres promover en este proyecto?` },
        { key: "difficulty", text: `¿Cuál es hoy la mayor dificultad en este proyecto?` }
      ]
    };
  }

  if (projectType === "app") {
    return {
      projectType,
      questions: [
        { key: "problem", text: `¿Qué problema resuelve "${projectRef}"?` },
        { key: "user", text: `¿Quién va a usar "${projectRef}"?` },
        { key: "mainFeature", text: `¿Cuál es la funcionalidad principal de la primera versión?` },
        { key: "techPreference", text: `¿Tienes alguna tecnología en mente para este proyecto?` },
        { key: "constraint", text: `¿Cuál es la mayor limitación para este proyecto?` }
      ]
    };
  }

  return {
    projectType,
    questions: [
      { key: "goal", text: `¿Cuál es el resultado final que quieres lograr con "${projectRef}"?` },
      { key: "target", text: `¿Quién se verá impactado por "${projectRef}"?` },
      { key: "deadline", text: `¿Hay algún plazo para "${projectRef}"?` },
      { key: "resources", text: `¿Qué recursos ya tienes para este proyecto?` },
      { key: "constraint", text: `¿Cuál es la mayor dificultad en este proyecto?` }
    ]
  };
}

/* ============================
   BRIEFING SESSION
============================ */

let briefingSession = {
  active: false,
  currentQuestionIndex: 0,
  questions: [],
  lastMessage: "",
  history: [],
  briefing: {
    initialIdea: "",
    projectType: "generic",
    answers: {}
  }
};

function resetBriefingSession() {
  briefingSession = {
    active: false,
    currentQuestionIndex: 0,
    questions: [],
    lastMessage: "",
    history: [],
    briefing: {
      initialIdea: "",
      projectType: "generic",
      answers: {}
    }
  };
}

function getBriefingProgressText() {
  if (!briefingSession.questions.length) return "";
  const current = briefingSession.currentQuestionIndex + 1;
  const total = briefingSession.questions.length;
  return `Briefing — Pregunta ${current} de ${total}`;
}

function renderBriefingHistory() {
  if (!briefingSession.history.length) return "";

  return `
    <div style="margin-bottom: 12px;">
      ${briefingSession.history
        .map((item) => {
          if (item.role === "user") {
            return `
              <div style="text-align: right; margin: 6px 0;">
                <span style="display:inline-block; background:#dbeafe; padding:8px 12px; border-radius:12px;">
                  <strong>Tú:</strong> ${item.text}
                </span>
              </div>
            `;
          }

          return `
            <div style="text-align: left; margin: 6px 0;">
              <span style="display:inline-block; background:#f3f4f6; padding:8px 12px; border-radius:12px;">
                <strong>AI:</strong> ${item.text}
              </span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function formatBriefingMessage(questionText) {
  return `
    <div style="border:3px solid red; padding:16px; border-radius:8px; margin-top:8px; background:yellow; color:black;">
      <p style="margin:0 0 8px 0; font-size:20px;"><strong>${getBriefingProgressText()}</strong></p>
      <p style="margin:0; font-size:18px;">${questionText}</p>
    </div>
  `;
}

function renderCurrentBriefing(assistantOutput) {
  if (!assistantOutput || !briefingSession.active) return;

  assistantOutput.innerHTML =
    renderBriefingHistory() +
    formatBriefingMessage(briefingSession.lastMessage);
}

function formatBriefingSummary(briefing) {
  const answers = briefing.answers;

  const rows = Object.entries(answers)
    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
    .join("");

  return `
    <div style="border:2px solid #333; padding:16px; border-radius:8px; margin-top:8px; background:#f5f5f5;">
      <h3>Resumen del briefing</h3>
      ${rows}
      <p style="margin-top:12px;"><strong>¿Quieres crear el proyecto con esta información?</strong></p>
      <button id="confirmBriefingBtn">Crear proyecto</button>
    </div>
  `;
}

function startBriefingFlow(initialIdea) {
  const briefingConfig = getBriefingQuestions(initialIdea);
  const firstQuestion = briefingConfig.questions[0].text;

  briefingSession = {
    active: true,
    currentQuestionIndex: 0,
    questions: briefingConfig.questions,
    lastMessage: firstQuestion,
    history: [{ role: "assistant", text: firstQuestion }],
    briefing: {
      initialIdea: initialIdea.trim(),
      projectType: briefingConfig.projectType,
      answers: {}
    }
  };

  return firstQuestion;
}

function submitBriefingAnswer(answer) {
  if (!briefingSession.active) {
    return {
      done: false,
      reply: "El briefing no está activo."
    };
  }

  const cleanAnswer = answer.trim();
  const currentQuestion = briefingSession.questions[briefingSession.currentQuestionIndex];

  if (!currentQuestion) {
    return {
      done: false,
      reply: "Error interno: no hay pregunta actual."
    };
  }

  if (!cleanAnswer) {
    return {
      done: false,
      reply: currentQuestion.text
    };
  }

  briefingSession.history.push({
    role: "user",
    text: cleanAnswer
  });

  briefingSession.briefing.answers[currentQuestion.key] = cleanAnswer;

  const isLastQuestion =
    briefingSession.currentQuestionIndex === briefingSession.questions.length - 1;

  if (isLastQuestion) {
    return {
      done: true,
      summary: formatBriefingSummary(briefingSession.briefing)
    };
  }

  briefingSession.currentQuestionIndex++;

  const nextQuestion =
    briefingSession.questions[briefingSession.currentQuestionIndex].text;

  briefingSession.lastMessage = nextQuestion;

  briefingSession.history.push({
    role: "assistant",
    text: nextQuestion
  });

  return {
    done: false,
    reply: nextQuestion
  };
}

/* ============================
   UI
============================ */

function clearAssistantPanel() {
  const assistantOutput = document.getElementById("assistantOutput");
  const questionInput = document.getElementById("questionInput");

  if (assistantOutput) assistantOutput.innerHTML = "";
  if (questionInput) questionInput.value = "";
}

function refreshUI() {
  const projects = loadProjects();
  const activeProjectId = getActiveProjectId();
  const activeProject = getActiveProject();

  renderProjectsList(projects, activeProjectId);
  renderOutput(activeProject);
  attachActionListeners();

  const assistantOutput = document.getElementById("assistantOutput");

  if (briefingSession.active && assistantOutput) {
    renderCurrentBriefing(assistantOutput);
  }
}

function attachActionListeners() {
  const startBriefingBtn = document.getElementById("startBriefingBtn");
  const completeBtn = document.getElementById("completeTaskBtn");
  const askBtn = document.getElementById("askBtn");
  const input = document.getElementById("input");
  const questionInput = document.getElementById("questionInput");
  const assistantOutput = document.getElementById("assistantOutput");

  if (startBriefingBtn) {
    startBriefingBtn.onclick = () => {
      const initialIdea = input.value.trim();

      if (!initialIdea) {
        if (assistantOutput) {
          assistantOutput.innerHTML = "<p>Describe primero la idea inicial del proyecto.</p>";
        }
        return;
      }

      startBriefingFlow(initialIdea);

      input.value = "";
      if (questionInput) questionInput.value = "";

      renderCurrentBriefing(assistantOutput);
    };
  }

  if (completeBtn) {
    completeBtn.onclick = () => {
      const activeProject = getActiveProject();
      if (!activeProject) return;

      completeCurrentTask(activeProject);
      clearAssistantPanel();
      refreshUI();
    };
  }

  if (askBtn) {
    askBtn.onclick = () => {
      const question = questionInput.value.trim();

      if (!question) {
        if (assistantOutput) {
          assistantOutput.innerHTML = "<p>Escribe primero una respuesta o una pregunta.</p>";
        }
        return;
      }

      // ===== FLUJO DEL BRIEFING =====
      if (briefingSession.active) {
        const result = submitBriefingAnswer(question);
        questionInput.value = "";

        if (result.done) {
          if (assistantOutput) {
            assistantOutput.innerHTML = result.summary;
          }

          setTimeout(() => {
            const confirmBtn = document.getElementById("confirmBriefingBtn");

            if (confirmBtn) {
              confirmBtn.onclick = () => {
                const plan = createPlanFromBrief(briefingSession.briefing);
                addProject(plan);
                resetBriefingSession();
                refreshUI();

                if (assistantOutput) {
                  assistantOutput.innerHTML = "<p>Proyecto creado con éxito a partir del briefing.</p>";
                }
              };
            }
          }, 0);
        } else {
          renderCurrentBriefing(assistantOutput);
        }

        return;
      }

      // ===== FLUJO NORMAL DEL ASISTENTE =====
      const activeProject = getActiveProject();

      if (!activeProject) {
        if (assistantOutput) {
          assistantOutput.innerHTML = "<p>Crea o abre primero un proyecto.</p>";
        }
        return;
      }

      const result = answerQuestion(question, activeProject);
      addConversationEntry(activeProject, question, result.answer, result.intent);

      questionInput.value = "";
      refreshUI();

      if (assistantOutput) {
        assistantOutput.innerHTML = result.answer;
      }
    };
  }

  document.querySelectorAll(".open-project-btn").forEach((button) => {
    button.onclick = () => {
      selectProject(button.dataset.id);
      resetBriefingSession();
      clearAssistantPanel();
      refreshUI();
    };
  });

  document.querySelectorAll(".delete-project-btn").forEach((button) => {
    button.onclick = () => {
      deleteProject(button.dataset.id);
      resetBriefingSession();
      clearAssistantPanel();
      refreshUI();
    };
  });
}

window.addEventListener("DOMContentLoaded", () => {
  refreshUI();
});