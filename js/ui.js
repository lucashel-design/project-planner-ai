export function renderOutput(plan) {
  const output = document.getElementById("output");

  output.innerHTML = `
    <h3>Projeto:</h3>
    <p>${plan.project}</p>

    <h3>Fase atual:</h3>
    <p>${plan.phase}</p>

    <h3>Tarefa atual:</h3>
    <p>${plan.currentTask}</p>

    <h3>Próximos passos:</h3>
    <ul>
      ${plan.steps.map(step => `<li>${step}</li>`).join("")}
    </ul>
  `;
}
