export function createPlan(input) {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("marketing")) {
    return createMarketingPlan(input);
  }

  if (lowerInput.includes("app") || lowerInput.includes("aplicação")) {
    return createAppPlan(input);
  }

  return createGenericPlan(input);
}

// 📈 Marketing
function createMarketingPlan(input) {
  return {
    project: input,
    phase: "Fase 1 — Base Estratégica",
    currentTask: "Definir objetivo principal",
    steps: [
      "Definir objetivo",
      "Definir público-alvo",
      "Definir proposta de valor",
      "Escolher canais",
      "Criar plano de conteúdo",
      "Executar campanhas",
      "Analisar resultados"
    ],
    completed: []
  };
}

// 💻 App
function createAppPlan(input) {
  return {
    project: input,
    phase: "Fase 1 — Planeamento",
    currentTask: "Definir funcionalidade principal",
    steps: [
      "Definir problema",
      "Definir funcionalidades",
      "Escolher tecnologia",
      "Criar UI básica",
      "Implementar lógica",
      "Testar",
      "Publicar"
    ],
    completed: []
  };
}

// 🧩 Genérico
function createGenericPlan(input) {
  return {
    project: input,
    phase: "Fase 1 — Definição",
    currentTask: "Definir objetivo principal",
    steps: [
      "Definir objetivo",
      "Quebrar em tarefas",
      "Organizar prioridades",
      "Executar",
      "Revisar"
    ],
    completed: []
  };
}