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
   DETECTAR TIPO DE PROJETO
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
  if (!clean) return "este projeto";
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 80)}...`;
}

function getBriefingQuestions(initialIdea) {
  const projectType = detectProjectType(initialIdea);
  const projectRef = buildProjectReference(initialIdea);

  console.log("=================================");
  console.log("IDEIA:", initialIdea);
  console.log("TIPO DETETADO:", projectType);
  console.log("=================================");

  if (projectType === "marketing") {
    return {
      projectType,
      questions: [
        { key: "result", text: `Que resultado queres gerar com "${projectRef}"?` },
        { key: "customer", text: `Quem é o cliente que queres atrair com "${projectRef}"?` },
        { key: "channel", text: `Em que canal queres focar primeiro neste projeto?` },
        { key: "offer", text: `Que produto ou serviço queres promover neste projeto?` },
        { key: "difficulty", text: `Qual é hoje a maior dificuldade neste projeto?` }
      ]
    };
  }

  if (projectType === "app") {
    return {
      projectType,
      questions: [
        { key: "problem", text: `Que problema "${projectRef}" resolve?` },
        { key: "user", text: `Quem vai usar "${projectRef}"?` },
        { key: "mainFeature", text: `Qual é a funcionalidade principal da primeira versão?` },
        { key: "techPreference", text: `Tens alguma tecnologia em mente para este projeto?` },
        { key: "constraint", text: `Qual é a maior limitação para este projeto?` }
      ]
    };
  }

  return {
    projectType,
    questions: [
      { key: "goal", text: `Qual é o resultado final que queres alcançar com "${projectRef}"?` },
      { key: "target", text: `Quem será impactado por "${projectRef}"?` },
      { key: "deadline", text: `Há algum prazo para "${projectRef}"?` },
      { key: "resources", text: `Que recursos já tens para este projeto?` },
      { key: "constraint", text: `Qual é a maior dificuldade neste projeto?` }
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

function formatBriefingMessage(questionText) {
  return `
    <div style="border:3px solid red; padding:16px; border-radius:8px; margin-top:8px; background:yellow; color:black;">
      <p style="margin:0 0 8px 0; font-size:20px;"><strong>=== ${getBriefingProgressText()} ===</strong></p>
      <p style="margin:0; font-size:18px;">${questionText}</p>
    </div>
  `;
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

  briefingSession = {
    active: true,
    currentQuestionIndex: 0,
    questions: briefingConfig.questions,
    lastMessage: briefingConfig.questions[0].text,
    briefing: {
      initialIdea: initialIdea.trim(),
      projectType: briefingConfig.projectType,
      answers: {}
    }
  };

  return briefingSession.questions[0].text;
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
      reply: "No encontré la pregunta actual del briefing."
    };
  }

  if (!cleanAnswer) {
    return {
      done: false,
      reply: currentQuestion.text
    };
  }

  briefingSession.briefing.answers[currentQuestion.key] = cleanAnswer;
  briefingSession.currentQuestionIndex++;

  if (briefingSession.currentQuestionIndex < briefingSession.questions.length) {
    const nextQuestion = briefingSession.questions[briefingSession.currentQuestionIndex].text;
    briefingSession.lastMessage = nextQuestion;

    return {
      done: false,
      reply: nextQuestion
    };
  }

  return {
    done: true,
    summary: formatBriefingSummary(briefingSession.briefing)
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
  console.log("refreshUI() iniciou");

  const projects = loadProjects();
  const activeProjectId = getActiveProjectId();
  const activeProject = getActiveProject();

  console.log("projects:", projects);
  console.log("activeProjectId:", activeProjectId);
  console.log("activeProject:", activeProject);

  renderProjectsList(projects, activeProjectId);
  console.log("renderProjectsList OK");

  renderOutput(activeProject);
  console.log("renderOutput OK");

  attachActionListeners();
  console.log("attachActionListeners OK");

  const assistantOutput = document.getElementById("assistantOutput");

  if (briefingSession.active && briefingSession.lastMessage && assistantOutput) {
    assistantOutput.innerHTML = formatBriefingMessage(briefingSession.lastMessage);
  }
}

function attachActionListeners() {
  console.log("attachActionListeners() iniciou");

  const startBriefingBtn = document.getElementById("startBriefingBtn");
  const completeBtn = document.getElementById("completeTaskBtn");
  const askBtn = document.getElementById("askBtn");
  const input = document.getElementById("input");
  const questionInput = document.getElementById("questionInput");
  const assistantOutput = document.getElementById("assistantOutput");

  if (startBriefingBtn) {
    startBriefingBtn.onclick = () => {
      console.log("CLICK startBriefingBtn");

      const initialIdea = input.value.trim();
      console.log("initialIdea:", initialIdea);

      if (!initialIdea) {
        if (assistantOutput) {
          assistantOutput.innerHTML = "<p>Descreve primeiro a ideia inicial do projeto.</p>";
        }
        return;
      }

      const firstQuestion = startBriefingFlow(initialIdea);
      console.log("firstQuestion:", firstQuestion);

      input.value = "";
      if (questionInput) questionInput.value = "";

      if (assistantOutput) {
        assistantOutput.innerHTML = formatBriefingMessage(firstQuestion);
      }

      briefingSession.lastMessage = firstQuestion;
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
          assistantOutput.innerHTML = "<p>Escreve primeiro uma resposta ou uma pergunta.</p>";
        }
        return;
      }

      // ===== FLUJO DEL BRIEFING =====
      if (briefingSession.active) {
        const result = submitBriefingAnswer(question);
        questionInput.value = "";

        if (assistantOutput) {
          if (result.done) {
            assistantOutput.innerHTML = `<p>${result.reply}</p>`;
          } else {
            assistantOutput.innerHTML = formatBriefingMessage(result.reply);
          }
        }

        if (result.done) {
          assistantOutput.innerHTML = result.summary;

          // esperar clique no botão
          setTimeout(() => {
            const confirmBtn = document.getElementById("confirmBriefingBtn");

            if (confirmBtn) {
              confirmBtn.onclick = () => {
                const plan = createPlanFromBrief(briefingSession.briefing);
                addProject(plan);
                resetBriefingSession();
                refreshUI();

                assistantOutput.innerHTML = "<p>Projeto criado com sucesso a partir do briefing.</p>";
              };
            }
          }, 0);
        }

        return;
      }

      // ===== FLUJO NORMAL DEL ASISTENTE =====
      const activeProject = getActiveProject();

      if (!activeProject) {
        if (assistantOutput) {
          assistantOutput.innerHTML = "<p>Cria ou abre primeiro um projeto.</p>";
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

  document.querySelectorAll(".open-project-btn").forEach(button => {
    button.onclick = () => {
      selectProject(button.dataset.id);
      resetBriefingSession();
      clearAssistantPanel();
      refreshUI();
    };
  });

  document.querySelectorAll(".delete-project-btn").forEach(button => {
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