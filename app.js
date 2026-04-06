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

function detectProjectType(initialIdea) {
  const text = (initialIdea || "").toLowerCase();

  if (
    text.includes("marketing") ||
    text.includes("campanha") ||
    text.includes("anúncio") ||
    text.includes("conteudo") ||
    text.includes("instagram") ||
    text.includes("publicidade")
  ) {
    return "marketing";
  }

  if (
    text.includes("app") ||
    text.includes("aplicação") ||
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
    briefing: {
      initialIdea: "",
      projectType: "generic",
      answers: {}
    }
  };
}

function startBriefingFlow(initialIdea) {
  const briefingConfig = getBriefingQuestions(initialIdea);

  briefingSession = {
    active: true,
    currentQuestionIndex: 0,
    questions: briefingConfig.questions,
    briefing: {
      initialIdea: initialIdea.trim(),
      projectType: briefingConfig.projectType,
      answers: {}
    }
  };

  return briefingSession.questions[0].text;
}

function submitBriefingAnswer(answer) {
  const cleanAnswer = answer.trim();
  const currentQuestion = briefingSession.questions[briefingSession.currentQuestionIndex];

  briefingSession.briefing.answers[currentQuestion.key] = cleanAnswer;
  briefingSession.currentQuestionIndex++;

  if (briefingSession.currentQuestionIndex < briefingSession.questions.length) {
    return {
      done: false,
      reply: briefingSession.questions[briefingSession.currentQuestionIndex].text
    };
  }

  return {
    done: true,
    reply: "Briefing completo. Vou criar o projeto."
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
      if (!initialIdea) return;

      const firstQuestion = startBriefingFlow(initialIdea);
      assistantOutput.innerHTML = `<p>${firstQuestion}</p>`;
      input.value = "";
    };
  }

  if (askBtn) {
    askBtn.onclick = () => {
      const question = questionInput.value.trim();

      if (briefingSession.active) {
        const result = submitBriefingAnswer(question);
        assistantOutput.innerHTML = `<p>${result.reply}</p>`;
        questionInput.value = "";

        if (result.done) {
          const plan = createPlanFromBrief(briefingSession.briefing);
          addProject(plan);
          resetBriefingSession();
          refreshUI();
        }

        return;
      }

      const activeProject = getActiveProject();
      const result = answerQuestion(question, activeProject);
      addConversationEntry(activeProject, question, result.answer, result.intent);

      questionInput.value = "";
      refreshUI();
      assistantOutput.innerHTML = result.answer;
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