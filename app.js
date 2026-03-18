import { createPlan } from "./js/planner.js";
import {
  saveState,
  loadState,
  clearState,
  completeCurrentTask,
  addConversationEntry
} from "./js/state.js";
import { renderOutput } from "./js/ui.js";
import { answerQuestion } from "./js/assistant.js";

function attachActionListeners() {
  const completeBtn = document.getElementById("completeTaskBtn");
  const resetBtn = document.getElementById("resetBtn");
  const askBtn = document.getElementById("askBtn");

  if (completeBtn) {
    completeBtn.onclick = () => {
      const currentState = loadState();
      if (!currentState) return;

      const updatedState = completeCurrentTask(currentState);
      renderOutput(updatedState);
      attachActionListeners();
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      clearState();
      document.getElementById("output").innerHTML = "";
      document.getElementById("assistantOutput").innerHTML = "";
      document.getElementById("input").value = "";
      document.getElementById("questionInput").value = "";
    };
  }

  if (askBtn) {
    askBtn.onclick = () => {
      const currentState = loadState();
      const question = document.getElementById("questionInput").value.trim();

      if (!currentState) {
        document.getElementById("assistantOutput").innerHTML = "<p>Cria primeiro um projeto.</p>";
        return;
      }

      if (!question) {
        document.getElementById("assistantOutput").innerHTML = "<p>Escreve primeiro uma pergunta.</p>";
        return;
      }

      const result = answerQuestion(question, currentState);

      document.getElementById("assistantOutput").innerHTML = result.answer;

      const updatedState = addConversationEntry(currentState, question, result.answer);
      renderOutput(updatedState);
      attachActionListeners();

      document.getElementById("questionInput").value = "";
      document.getElementById("assistantOutput").innerHTML = result.answer;
    };
  }
}

function handleSubmit() {
  const input = document.getElementById("input").value.trim();
  if (!input) return;

  const plan = createPlan(input);
  saveState(plan);
  renderOutput(plan);
  attachActionListeners();
}

window.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("generateBtn");
  button.addEventListener("click", handleSubmit);

  const saved = loadState();
  if (saved) {
    renderOutput(saved);
  }

  attachActionListeners();
});