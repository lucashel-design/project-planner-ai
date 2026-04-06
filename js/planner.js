function generateId() {
  return `proj_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function generateTitle(input) {
  const trimmed = input.trim();
  if (trimmed.length <= 50) return trimmed;
  return `${trimmed.slice(0, 50)}...`;
}

export function createPlanFromBrief(briefing) {
  const initialIdea = briefing.initialIdea;
  const projectType = briefing.projectType;
  const answers = briefing.answers;

  let steps = [];
  let phase = "";
  let currentTask = "";

  if (projectType === "marketing") {
    steps = [
      "Definir objetivo da campanha",
      "Definir cliente ideal",
      "Escolher canal principal",
      "Clarificar oferta",
      "Criar plano de conteúdo",
      "Executar campanhas",
      "Analisar resultados"
    ];
    phase = "Fase 1 — Estratégia de Marketing";
  } else if (projectType === "app") {
    steps = [
      "Definir problema",
      "Definir utilizador",
      "Definir funcionalidade principal",
      "Escolher tecnologia",
      "Criar estrutura base",
      "Implementar MVP",
      "Testar"
    ];
    phase = "Fase 1 — Planeamento do Produto";
  } else {
    steps = [
      "Definir objetivo",
      "Quebrar em tarefas",
      "Organizar prioridades",
      "Executar",
      "Revisar"
    ];
    phase = "Fase 1 — Estruturação";
  }

  currentTask = steps[0];

  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: generateTitle(initialIdea),
    createdAt: now,
    updatedAt: now,
    project: initialIdea,
    projectType,
    phase,
    steps,
    currentTask,
    currentStepIndex: 0,
    completed: [],
    conversationHistory: [],
    briefing
  };
}