import { createPlan } from "./js/planner.js";
import { saveState, loadState } from "./js/state.js";
import { renderOutput } from "./js/ui.js";

window.handleSubmit = function () {
  const input = document.getElementById("input").value;

  const plan = createPlan(input);

  saveState(plan);
  renderOutput(plan);
};

// carregar estado ao abrir
window.onload = function () {
  const saved = loadState();
  if (saved) {
    renderOutput(saved);
  }
};
