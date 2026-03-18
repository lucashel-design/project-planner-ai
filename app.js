import { createPlan } from "./js/planner.js";
import { saveState, loadState, clearState, completeCurrentTask } from "./js/state.js";
import { renderOutput } from "./js/ui.js";

function attachActionListeners() {
  const completeBtn = document.getElementById("completeTaskBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      const currentState = loadState();
      if (!currentState) return;

      const updatedState = completeCurrentTask(currentState);
      renderOutput(updatedState);
      attachActionListeners();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearState();
      document.getElementById("output").innerHTML = "";
      document.getElementById("input").value = "";
    });
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
    attachActionListeners();
  }
});