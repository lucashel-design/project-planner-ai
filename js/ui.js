import { generateProactiveMessage } from "./proactive.js";
export function renderProjectsList(projects, activeProjectId) {
  const projectsList = document.getElementById("projectsList");

  if (!projects.length) {
    projectsList.innerHTML = "<p>Ainda não há projetos.</p>";
    return;
  }

  projectsList.innerHTML = projects.map(project => {
    const isActive = project.id === activeProjectId;
    const progressPercent = Math.round((project.completed.length / project.steps.length) * 100);

    return `
      <div class="project-card ${isActive ? "active" : ""}">
        <h3>${project.title}</h3>
        <p><strong>Fase:</strong> ${project.phase}</p>
        <p><strong>Tarefa:</strong> ${project.currentTask}</p>
        <p><strong>Progresso:</strong> ${progressPercent}%</p>
        <div class="card-actions">
          <button class="open-project-btn" data-id="${project.id}">Abrir</button>
          <button class="delete-project-btn" data-id="${project.id}">Apagar</button>
        </div>
      </div>
    `;
  }).join("");
}

export function renderOutput(project) {
  const output = document.getElementById("output");

  const proactiveMessage = generateProactiveMessage(project);

  const proactiveHtml = proactiveMessage
    ? `<div class="proactive-box">${proactiveMessage}</div>`
    : "";

  if (!project) {
    output.innerHTML = "<p>Cria ou abre um projeto para começar.</p>";
    return;
  }

  const pendingSteps = project.steps
    .map((step, index) => {
      const isCompleted = project.completed.includes(step);
      const isCurrent = index === project.currentStepIndex && project.currentStepIndex < project.steps.length;

      let label = step;
      if (isCompleted) label = `✅ ${step}`;
      else if (isCurrent) label = `➡️ ${step}`;

      return `<li>${label}</li>`;
    })
    .join("");

  const completedList = project.completed.length
    ? `<ul>${project.completed.map(step => `<li>✅ ${step}</li>`).join("")}</ul>`
    : `<p>Nada concluído ainda.</p>`;

  const progressPercent = Math.round((project.completed.length / project.steps.length) * 100);

  const historyHtml = project.conversationHistory && project.conversationHistory.length
    ? `
      <div class="history">
        <h3>Histórico da conversa</h3>
        ${project.conversationHistory.map(item => `
          <div class="history-item">
            <p><strong>Pergunta:</strong> ${item.question}</p>
            <p><strong>Resposta:</strong></p>
            <div>${item.answer}</div>
          </div>
        `).join("")}
      </div>
    `
    : `
      <div class="history">
        <h3>Histórico da conversa</h3>
        <p>Ainda não há perguntas registadas.</p>
      </div>
    `;

  output.innerHTML = `
    ${proactiveHtml}

    <h3>Projeto:</h3>
    <p>${project.project}</p>

    <h3>Fase atual:</h3>
    <p>${project.phase}</p>

    <h3>Tarefa atual:</h3>
    <p>${project.currentTask}</p>

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
    </div>

    ${historyHtml}
  `;
}