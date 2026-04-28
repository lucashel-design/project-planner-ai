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

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectProjectType(initialIdea) {
  const text = normalizeText(initialIdea);

  if (
    text.includes("marketing") ||
    text.includes("campanha") ||
    text.includes("campana") ||
    text.includes("anuncio") ||
    text.includes("conteudo") ||
    text.includes("contenido") ||
    text.includes("instagram") ||
    text.includes("publicidade") ||
    text.includes("publicidad")
  ) {
    return "marketing";
  }

  if (
    text.includes("app") ||
    text.includes("aplicacion") ||
    text.includes("software") ||
    text.includes("site") ||
    text.includes("web") ||
    text.includes("plataforma")
  ) {
    return "app";
  }

  return "generic";
}

/* ============================
   ANALIZAR NECESIDAD DE BRIEFING
============================ */

function analyzeBriefingNeeds(initialIdea, projectType) {
  const text = normalizeText(initialIdea);

  const missingInfo = [];

  const hasGoal =
    text.includes("quiero") ||
    text.includes("crear") ||
    text.includes("hacer") ||
    text.includes("vender") ||
    text.includes("organizar") ||
    text.includes("atraer") ||
    text.includes("conseguir") ||
    text.includes("mejorar");

  const hasAudience =
    text.includes("para") ||
    text.includes("clientes") ||
    text.includes("usuarios") ||
    text.includes("personas") ||
    text.includes("empresas") ||
    text.includes("mujeres") ||
    text.includes("hombres") ||
    text.includes("restaurantes");

  const hasDeadline =
    text.includes("hoy") ||
    text.includes("manana") ||
    text.includes("semana") ||
    text.includes("mes") ||
    text.includes("dias") ||
    text.includes("urgente") ||
    text.includes("rapido");

  const hasResources =
    text.includes("con") ||
    text.includes("tengo") ||
    text.includes("herramienta") ||
    text.includes("equipo") ||
    text.includes("presupuesto") ||
    text.includes("dinero");

  const hasConstraint =
    text.includes("sin") ||
    text.includes("poco") ||
    text.includes("limitado") ||
    text.includes("no se") ||
    text.includes("no tengo") ||
    text.includes("dificultad") ||
    text.includes("problema");

  const hasChannelOrTech =
    text.includes("instagram") ||
    text.includes("facebook") ||
    text.includes("tiktok") ||
    text.includes("web") ||
    text.includes("javascript") ||
    text.includes("react") ||
    text.includes("github") ||
    text.includes("wordpress");

  if (!hasGoal) missingInfo.push("goal");
  if (!hasAudience) missingInfo.push("audience");
  if (!hasDeadline) missingInfo.push("deadline");
  if (!hasResources) missingInfo.push("resources");
  if (!hasConstraint) missingInfo.push("constraint");

  if (projectType === "marketing" && !hasChannelOrTech) {
    missingInfo.push("channel");
  }

  if (projectType === "app" && !hasChannelOrTech) {
    missingInfo.push("tech");
  }

  let questionCount = 5;
  let complexity = "medium";

  if (missingInfo.length <= 2) {
    questionCount = 3;
    complexity = "simple";
  } else if (missingInfo.length <= 4) {
    questionCount = 5;
    complexity = "medium";
  } else {
    questionCount = 7;
    complexity = "complex";
  }

  return {
    complexity,
    questionCount,
    missingInfo
  };
}

function buildProjectReference(initialIdea) {
  const clean = (initialIdea || "").trim();
  if (!clean) return "este proyecto";
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 80)}...`;
}

/* ============================
   GENERADOR DE TEXTO
   preparado para futura IA
============================ */

function generateQuestionText(key, projectRef) {
  switch (key) {
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

    case "goal":
      return `¿Cuál es el resultado final que quieres lograr con "${projectRef}"?`;

    case "target":
      return `¿Quién se verá impactado por "${projectRef}"?`;

    case "deadline":
      return `¿Hay algún plazo o urgencia real para este proyecto?`;

    case "resources":
      return `¿Qué recursos, herramientas o apoyos ya tienes para este proyecto?`;

    case "resourceGap":
      return `Veo que los recursos son limitados. ¿Qué te falta más ahora mismo: tiempo, dinero, herramientas o ayuda de otra persona?`;

    case "deadlinePressure":
      return `Como parece que hay urgencia, ¿cuál sería un plazo realista mínimo para que este proyecto empiece a dar resultado?`;

    case "techSupport":
      return `Si la parte técnica te limita, ¿prefieres aprender lo básico tú mismo o apoyarte en herramientas / ayuda externa para avanzar más rápido?`;

    case "constraintDetail":
      return `Para entender mejor el bloqueo: ¿esa limitación principal es más de tiempo, dinero, conocimiento o ejecución?`;

    default:
      return `Cuéntame un poco más sobre "${projectRef}"`;
  }
}

/* ============================
   DEFINICIÓN DE PREGUNTAS
============================ */

function getBriefingQuestions(initialIdea) {
  const projectType = detectProjectType(initialIdea);
  const analysis = analyzeBriefingNeeds(initialIdea, projectType);
  const projectRef = buildProjectReference(initialIdea);

  let baseQuestionKeys = [];

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

  const questionKeys = baseQuestionKeys.slice(0, analysis.questionCount);

  return {
    projectType,
    complexity: analysis.complexity,
    missingInfo: analysis.missingInfo,
    questionCount: analysis.questionCount,
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
  askedAdaptiveKeys: [],
  briefing: {
    initialIdea: "",
    projectType: "generic",
    complexity: "medium",
    missingInfo: [],
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
    askedAdaptiveKeys: [],
    briefing: {
      initialIdea: "",
      projectType: "generic",
      complexity: "medium",
      missingInfo: [],
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
      <p><strong>Contexto faltante detectado:</strong> ${briefing.missingInfo.join(", ") || "poco contexto faltante"}</p>
      ${rows}
      <p style="margin-top:12px;"><strong>¿Quieres crear el proyecto con esta información?</strong></p>
      <button id="confirmBriefingBtn">Crear proyecto</button>
    </div>
  `;
}

/* ============================
   FOLLOW-UPS DINÁMICOS
============================ */

function shouldAskAdaptiveFollowUp(currentKey, answer) {
  const text = normalizeText(answer);

  if (
    currentKey === "resources" &&
    (
      text.includes("no tengo") ||
      text.includes("ninguno") ||
      text.includes("ninguna") ||
      text.includes("pocos") ||
      text.includes("poco") ||
      text.includes("limitado") ||
      text.includes("limitada")
    )
  ) {
    return "resourceGap";
  }

  if (
    currentKey === "deadline" &&
    (
      text.includes("hoy") ||
      text.includes("manana") ||
      text.includes("esta semana") ||
      text.includes("urgente") ||
      text.includes("rapido") ||
      text.includes("ya")
    )
  ) {
    return "deadlinePressure";
  }

  if (
    currentKey === "techPreference" &&
    (
      text.includes("no se") ||
      text.includes("ninguna") ||
      text.includes("no tengo idea") ||
      text.includes("no entiendo") ||
      text.includes("no programo")
    )
  ) {
    return "techSupport";
  }

  if (
    currentKey === "constraint" &&
    (
      text.includes("tiempo") ||
      text.includes("dinero") ||
      text.includes("conocimiento") ||
      text.includes("tecnico") ||
      text.includes("ejecucion")
    )
  ) {
    return "constraintDetail";
  }

  return null;
}

function insertAdaptiveQuestionIfNeeded(currentKey, answer) {
  const adaptiveKey = shouldAskAdaptiveFollowUp(currentKey, answer);

  if (!adaptiveKey) return;
  if (briefingSession.askedAdaptiveKeys.includes(adaptiveKey)) return;

  const projectRef = buildProjectReference(briefingSession.briefing.initialIdea);

  const adaptiveQuestion = {
    key: adaptiveKey,
    text: generateQuestionText(adaptiveKey, projectRef)
  };

  const insertIndex = briefingSession.currentQuestionIndex + 1;

  briefingSession.questions.splice(insertIndex, 0, adaptiveQuestion);
  briefingSession.askedAdaptiveKeys.push(adaptiveKey);
}

/* ============================
   BRIEFING FLOW
============================ */

function startBriefingFlow(initialIdea) {
  const briefingConfig = getBriefingQuestions(initialIdea);
  const firstQuestion = briefingConfig.questions[0].text;

  briefingSession = {
    active: true,
    currentQuestionIndex: 0,
    questions: briefingConfig.questions,
    lastMessage: firstQuestion,
    history: [{ role: "assistant", text: firstQuestion }],
    askedAdaptiveKeys: [],
    briefing: {
      initialIdea: initialIdea.trim(),
      projectType: briefingConfig.projectType,
      complexity: briefingConfig.complexity,
      missingInfo: briefingConfig.missingInfo,
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

  insertAdaptiveQuestionIfNeeded(currentQuestion.key, cleanAnswer);

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