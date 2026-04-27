function generateId() {
  return `proj_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function generateTitle(input) {
  const trimmed = input.trim();
  if (trimmed.length <= 50) return trimmed;
  return `${trimmed.slice(0, 50)}...`;
}

function buildSummary(briefing) {
  const answers = briefing.answers || {};

  return {
    initialIdea: briefing.initialIdea,
    projectType: briefing.projectType,
    complexity: briefing.complexity || "medium",
    keyAnswers: answers
  };
}

function addContextSteps(steps, answers) {
  const contextualSteps = [];

  if (answers.resourceGap) {
    contextualSteps.push("Resolver primero la falta principal de recursos");
  }

  if (answers.deadlinePressure) {
    contextualSteps.push("Ajustar el plan a un plazo mínimo realista");
  }

  if (answers.techSupport) {
    contextualSteps.push("Definir si avanzarás aprendiendo o con apoyo externo");
  }

  if (answers.constraintDetail) {
    contextualSteps.push("Convertir la limitación principal en una decisión concreta");
  }

  return [...contextualSteps, ...steps];
}

export function createPlanFromBrief(briefing) {
  const initialIdea = briefing.initialIdea || "Nuevo proyecto";
  const projectType = briefing.projectType || "generic";
  const complexity = briefing.complexity || "medium";
  const answers = briefing.answers || {};

  let steps = [];
  let phase = "";

  if (projectType === "marketing") {
    steps = [
      `Definir objetivo de campaña: ${answers.result || "objetivo pendiente"}`,
      `Perfilar cliente ideal: ${answers.customer || "cliente pendiente"}`,
      `Elegir canal principal: ${answers.channel || "canal pendiente"}`,
      `Clarificar oferta: ${answers.offer || "oferta pendiente"}`,
      `Resolver bloqueo principal: ${answers.difficulty || "bloqueo pendiente"}`,
      "Crear plan de contenido inicial",
      "Ejecutar primeras acciones",
      "Analizar resultados y ajustar"
    ];

    phase = "Fase 1 — Estrategia de Marketing";
  } else if (projectType === "app") {
    steps = [
      `Definir problema principal: ${answers.problem || "problema pendiente"}`,
      `Definir usuario principal: ${answers.user || "usuario pendiente"}`,
      `Definir funcionalidad principal del MVP: ${answers.mainFeature || "funcionalidad pendiente"}`,
      `Elegir enfoque técnico: ${answers.techPreference || "tecnología pendiente"}`,
      `Resolver limitación principal: ${answers.constraint || "limitación pendiente"}`,
      "Crear estructura base del producto",
      "Implementar MVP",
      "Probar con un caso real"
    ];

    phase = "Fase 1 — Planeamiento del Producto";
  } else {
    steps = [
      `Definir objetivo principal: ${answers.goal || "objetivo pendiente"}`,
      `Definir destinatario o impacto: ${answers.target || "destinatario pendiente"}`,
      `Ajustar al plazo: ${answers.deadline || "plazo pendiente"}`,
      `Mapear recursos disponibles: ${answers.resources || "recursos pendientes"}`,
      `Resolver restricción principal: ${answers.constraint || "restricción pendiente"}`,
      "Organizar prioridades",
      "Ejecutar primera versión",
      "Revisar y mejorar"
    ];

    phase = "Fase 1 — Estructuración";
  }

  steps = addContextSteps(steps, answers);

  if (complexity === "simple") {
    steps = steps.slice(0, 5);
  }

  if (complexity === "complex") {
    steps.push("Documentar decisiones clave del proyecto");
    steps.push("Definir siguiente versión después del MVP");
  }

  const currentTask = steps[0];
  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: generateTitle(initialIdea),
    createdAt: now,
    updatedAt: now,
    project: initialIdea,
    projectType,
    complexity,
    phase,
    steps,
    currentTask,
    currentStepIndex: 0,
    completed: [],
    conversationHistory: [],
    briefing,
    summary: buildSummary(briefing)
  };
}