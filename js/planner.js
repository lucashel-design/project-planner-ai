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

  return {
    ...basePlan,
    currentStepIndex: 0,
    completed: []
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
    phase: "Fase 1 — Definição",
    steps,
    currentTask: steps[0]
  };
}