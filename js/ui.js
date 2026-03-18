export function renderOutput(plan) {
  const output = document.getElementById("output");

  const pendingSteps = plan.steps
    .map((step, index) => {
      const isCompleted = plan.completed.includes(step);
      const isCurrent = index === plan.currentStepIndex && plan.currentStepIndex < plan.steps.length;

      let label = step;
      if (isCompleted) label = `✅ ${step}`;
      else if (isCurrent) label = `➡️ ${step}`;

      return `<li>${label}</li>`;
    })
    .join("");

  const completedList = plan.completed.length
    ? `<ul>${plan.completed.map(step => `<li>✅ ${step}</li>`).join("")}</ul>`
    : `<p>Nada concluído ainda.</p>`;

  const progressPercent = Math.round((plan.completed.length / plan.steps.length) * 100);

  output.innerHTML = `
    <h3>Projeto:</h3>
    <p>${plan.project}</p>

    <h3>Fase atual:</h3>
    <p>${plan.phase}</p>

    <h3>Tarefa atual:</h3>
    <p>${plan.currentTask}</p>

    <h3>Progresso:</h3>
    <p>${progressPercent}% concluído</p>

    <h3>Todas as tarefas:</h3>
    <ul>
      ${pendingSteps}
    </ul>

    <h3>Concluído até agora:</h3>
    ${completedList}

    <div class="actions">
      <button id="completeTaskBtn">Concluir tarefa atual</button>
      <button id="resetBtn">Reiniciar projeto</button>
    </div>
  `;
}