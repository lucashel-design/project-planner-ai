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

const BRIEFING_QUESTIONS = [
  {
    key: "goal",
    text: "Qual é o resultado final que queres alcançar?"
  },
  {
    key: "audience",
    text: "Para quem é este projeto?"
  },
  {
    key: "deadline",
    text: "Qual é o prazo ou urgência?"
  },
  {
    key: "resources",
    text: "Que recursos ou ferramentas já tens?"
  },
  {
    key: "constraint",
    text: "Qual é a maior dificuldade ou restrição neste projeto?"
  }
];

// Sessão temporária em memória.
// Se a página for recarregada, o briefing perde-se.
let briefingSession = {
  active: false,
  currentQuestionIndex: 0,
  briefing: {
    initialIdea: "",
    goal: "",
    audience: "",
    deadline: "",
    resources: "",
    constraint: ""
  }
};

function resetBriefingSession() {
  briefingSession = {
    active: false,
    currentQuestionIndex: 0,
    briefing: {
      initialIdea: "",
      goal: "",
      audience: "",
      deadline: "",
      resources: "",
      constraint: ""
    }
  };
}

function startBriefingFlow(initialIdea) {
  briefingSession = {
    active: true,
    currentQuestionIndex: 0,
    briefing: {
      initialIdea: initialIdea.trim(),
      goal: "",
      audience: "",
      deadline: "",
      resources: "",
      constraint: ""
    }
  };

  return BRIEFING_QUESTIONS[0].text;
}

function getCurrentBriefingQuestion() {
  if (!briefingSession.active) return null;
  return BRIEFING_QUESTIONS[briefingSession.currentQuestionIndex] || null;
}

function submitBriefingAnswer(answer) {
  if (!briefingSession.active) {
    return {
      done: false,
      reply: "O briefing não está ativo."
    };
  }

  const cleanAnswer = answer.trim();
  const currentQuestion = getCurrentBriefingQuestion();

  if (!currentQuestion) {
    return {
      done: false,
      reply: "Não encontrei a pergunta atual do briefing."
    };
  }

  if (!cleanAnswer) {
    return {
      done: false,
      reply: currentQuestion.text
    };
  }

  briefingSession.briefing[currentQuestion.key] = cleanAnswer;
  briefingSession.currentQuestionIndex += 1;

  const hasNextQuestion =
    briefingSession.currentQuestionIndex < BRIEFING_QUESTIONS.length;

  if (hasNextQuestion) {
    return {
      done: false,
      reply: BRIEFING_QUESTIONS[briefingSession.currentQuestionIndex].text
    };
  }

  return {
    done: true,
    reply: "Perfeito. Já tenho o briefing completo. Vou criar o projeto com base nas tuas respostas."
  };
}

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

      if (!initialIdea) {
        if (assistantOutput) {
          assistantOutput.innerHTML = "<p>Descreve primeiro a ideia inicial do projeto.</p>";
        }
        return;
      }

      const firstQuestion = startBriefingFlow(initialIdea);

      input.value = "";
      if (questionInput) questionInput.value = "";
      if (assistantOutput) {
        assistantOutput.innerHTML = `
          <p><strong>Vamos estruturar bem este projeto antes de criar o plano.</strong></p>
          <p>${firstQuestion}</p>
        `;
      }
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
        assistantOutput.innerHTML = "<p>Escreve primeiro uma pergunta.</p>";
        return;
      }

      if (briefingSession.active) {
        const result = submitBriefingAnswer(question);

        questionInput.value = "";
        assistantOutput.innerHTML = `<p>${result.reply}</p>`;

        if (result.done) {
          const plan = createPlanFromBrief(briefingSession.briefing);
          addProject(plan);
          resetBriefingSession();
          refreshUI();
          assistantOutput.innerHTML = "<p>Projeto criado com sucesso a partir do briefing.</p>";
        }

        return;
      }

      const activeProject = getActiveProject();

      if (!activeProject) {
        assistantOutput.innerHTML = "<p>Cria ou abre primeiro um projeto.</p>";
        return;
      }

      const result = answerQuestion(question, activeProject);
      addConversationEntry(activeProject, question, result.answer, result.intent);

      questionInput.value = "";
      refreshUI();
      assistantOutput.innerHTML = result.answer;
    };
  }

  document.querySelectorAll(".open-project-btn").forEach(button => {
    button.onclick = () => {
      const projectId = button.dataset.id;
      selectProject(projectId);
      resetBriefingSession();
      clearAssistantPanel();
      refreshUI();
    };
  });

  document.querySelectorAll(".delete-project-btn").forEach(button => {
    button.onclick = () => {
      const projectId = button.dataset.id;
      deleteProject(projectId);
      resetBriefingSession();
      clearAssistantPanel();
      refreshUI();
    };
  });
}

window.addEventListener("DOMContentLoaded", () => {
  refreshUI();
});