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

/* ============================
   DETECTAR COMPLEJIDAD
============================ */

function detectProjectComplexity(initialIdea) {
  const text = (initialIdea || "").toLowerCase().trim();

  if (text.length < 30) {
    return "simple";
  }

  if (
    text.includes("app") ||
    text.includes("software") ||
    text.includes("plataforma") ||
    text.includes("integración") ||
    text.includes("integracao") ||
    text.includes("sistema") ||
    text.includes("automatización") ||
    text.includes("automacao")
  ) {
    return "complex";
  }

  if (
    text.includes("marketing") ||
    text.includes("instagram") ||
    text.includes("negocio") ||
    text.includes("negócio") ||
    text.includes("empresa") ||
    text.includes("campaña") ||
    text.includes("campanha")
  ) {
    return "medium";
  }

  return "medium";
}

function buildProjectReference(initialIdea) {
  const clean = (initialIdea || "").trim();
  if (!clean) return "este proyecto";
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 80)}...`;
}

/* ============================
   GENERADOR DE TEXTO
   (preparado para futura IA)
============================ */

function generateQuestionText(key, projectRef) {
  switch (key) {
    // APP
    case "problem":
      return `¿Qué problema concreto quieres resolver con "${projectRef}"?`;

    case "user":
      return `¿Quién usaría realmente "${projectRef}" en su día a día?`;

    case "mainFeature":
      return `¿Qué tendría que hacer sí o sí la primera versión para que "${projectRef}" ya sea útil?`;

    case "techPreference":
      return `¿Tienes alguna tecnología en mente para este proyecto o prefieres empezar de la forma más simple posible?`;

    case "constraint":
      return `¿Cuál es la mayor limitación ahora mismo para sacar adelante este proyecto?`;

    // MARKETING
    case "result":
      return `¿Qué resultado concreto quieres generar con "${projectRef}"?`;

    case "customer":
      return `¿Qué tipo de cliente quieres atraer exactamente con este proyecto?`;

    case "channel":
      return `¿En qué canal quieres enfocarte primero para mover este proyecto?`;

    case "offer":
      return `¿Qué producto, servicio u oferta vas a empujar en este proyecto?`;

    case "difficulty":
      return `¿Qué es lo que más te está frenando ahora mismo en este proyecto?`;

    // GENERIC
    case "goal":
      return `¿Cuál es el resultado final que quieres lograr con "${projectRef}"?`;

    case "target":
      return `¿Quién se verá impactado por "${projectRef}"?`;

    case "deadline":
      return `¿Hay algún plazo o urgencia real para este proyecto?`;

    case "resources":
      return `¿Qué recursos, herramientas o apoyos ya tienes para este proyecto?`;

    default:
      return `Cuéntame un poco más sobre "${projectRef}"`;
  }
}

/* ============================
   DEFINICIÓN DE PREGUNTAS
============================ */

function getBriefingQuestions(initialIdea) {
  const projectType = detectProjectType(initialIdea);
  const complexity = detectProjectComplexity(initialIdea);
  const projectRef = buildProjectReference(initialIdea);

  let baseQuestionKeys = [];
  let questionKeys = [];

  if (projectType === "marketing") {
    baseQuestionKeys = [
      "result",
      "customer",
      "channel",
      "offer",
      "difficulty",
      "resources",
      "deadline"
    ];
  } else if (projectType === "app") {
    baseQuestionKeys = [
      "problem",
      "user",
      "mainFeature",
      "techPreference",
      "constraint",
      "resources",
      "deadline"
    ];
  } else {
    baseQuestionKeys = [
      "goal",
      "target",
      "deadline",
      "resources",
      "constraint",
      "channel",
      "offer"
    ];
  }

  if (complexity === "simple") {
    questionKeys = baseQuestionKeys.slice(0, 3);
  } else if (complexity === "medium") {
    questionKeys = baseQuestionKeys.slice(0, 5);
  } else {
    questionKeys = baseQuestionKeys.slice(0, 7);
  }

  return {
    projectType,
    complexity,
    questions: questionKeys.map((key) => ({
      key,
      text: generateQuestionText(key, projectRef)
    }))
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
    complexity: "medium",
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
      complexity: "medium",
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
    <div style="border:2px solid #ccc; padding:16px; border-radius:8px; margin-top:8px; background:#fffbe6; color:#111;">
      <p style="margin:0 0 8px 0; font-size:18px;">
        <strong>${getBriefingProgressText()}</strong>
      </p>
      <p style="margin:0; font-size:17px;">${questionText}</p>
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
      <p><strong>Tipo de proyecto:</strong> ${briefing.projectType}</p>
      <p><strong>Complejidad detectada:</strong> ${briefing.complexity}</p>
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
      complexity: briefingConfig.complexity,
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