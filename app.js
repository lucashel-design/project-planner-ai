import { createPlan } from "./js/planner.js";
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
  const generateBtn = document.getElementById("generateBtn");
  const completeBtn = document.getElementById("completeTaskBtn");
  const askBtn = document.getElementById("askBtn");

  if (generateBtn) {
    generateBtn.onclick = () => {
      const input = document.getElementById("input").value.trim();
      if (!input) return;

      const plan = createPlan(input);
      addProject(plan);

      document.getElementById("input").value = "";
      clearAssistantPanel();
      refreshUI();
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
      const activeProject = getActiveProject();
      const question = document.getElementById("questionInput").value.trim();

      if (!activeProject) {
        document.getElementById("assistantOutput").innerHTML = "<p>Cria ou abre primeiro um projeto.</p>";
        return;
      }

      if (!question) {
        document.getElementById("assistantOutput").innerHTML = "<p>Escreve primeiro uma pergunta.</p>";
        return;
      }

      const result = answerQuestion(question, activeProject);
      addConversationEntry(activeProject, question, result.answer);

      document.getElementById("questionInput").value = "";
      refreshUI();
      document.getElementById("assistantOutput").innerHTML = result.answer;
    };
  }

  document.querySelectorAll(".open-project-btn").forEach(button => {
    button.onclick = () => {
      const projectId = button.dataset.id;
      selectProject(projectId);
      clearAssistantPanel();
      refreshUI();
    };
  });

  document.querySelectorAll(".delete-project-btn").forEach(button => {
    button.onclick = () => {
      const projectId = button.dataset.id;
      deleteProject(projectId);
      clearAssistantPanel();
      refreshUI();
    };
  });
}

window.addEventListener("DOMContentLoaded", () => {
  refreshUI();
});