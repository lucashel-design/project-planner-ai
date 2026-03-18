function generateId() {
  return `proj_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function generateTitle(input) {
  const trimmed = input.trim();
  if (trimmed.length <= 50) return trimmed;
  return `${trimmed.slice(0, 50)}...`;
}

export function createPlan(input) {
  const lowerInput = input.toLowerCase();

  let basePlan;

  if (lowerInput.includes("marketing")) {
    basePlan = createMarketingPlan(input);
  } else if (lowerInput.includes("app") || lowerInput.includes("aplicação")) {
    basePlan = createAppPlan(input);
  } else {
    basePlan = createGenericPlan(input);
  }

  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: generateTitle(input),
    createdAt: now,
    updatedAt: now,
    ...basePlan,
    currentStepIndex: 0,
    completed: [],
    conversationHistory: []
  };
}

function createMarketingPlan(input) {
  const steps = [
    "Definir objetivo",
    "Definir público-alvo",
    "Definir proposta de valor",
    "Escolher canais",
    "Criar plano de conteúdo",
    "Executar campanhas",
    "Analisar resultados"
  ];

  return {
    project: input,
    projectType: "marketing",
    phase: "Fase 1 — Base Estratégica",
    steps,
    currentTask: steps[0]
  };
}

function createAppPlan(input) {
  const steps = [
    "Definir problema",
    "Definir funcionalidades",
    "Escolher tecnologia",
    "Criar UI básica",
    "Implementar lógica",
    "Testar",
    "Publicar"
  ];

  return {
    project: input,
    projectType: "app",
    phase: "Fase 1 — Planeamento",
    steps,
    currentTask: steps[0]
  };
}

function createGenericPlan(input) {
  const steps = [
    "Definir objetivo",
    "Quebrar em tarefas",
    "Organizar prioridades",
    "Executar",
    "Revisar"
  ];

  return {
    project: input,
    projectType: "generic",
    phase: "Fase 1 — Definição",
    steps,
    currentTask: steps[0]
  };
}