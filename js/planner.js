export function createPlan(input) {
  return {
    project: input,
    phase: "Fase 1 — Definição",
    currentTask: "Definir objetivo principal",
    steps: [
      "Definir objetivo",
      "Definir público",
      "Definir estratégia",
      "Executar",
    ],
    completed: []
  };
}
