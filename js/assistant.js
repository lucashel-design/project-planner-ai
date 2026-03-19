function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ------------------------
// DETECT INTENT
// ------------------------
function detectIntent(question, projectType, currentTask) {
  const q = normalizeText(question);
  const task = normalizeText(currentTask || "");

  if (projectType === "marketing") {
    if (q.includes("publico") || q.includes("persona") || task.includes("publico")) return "publico";
    if (q.includes("objetivo") || q.includes("meta")) return "objetivo";
    if (q.includes("canal") || q.includes("anuncio") || q.includes("trafego")) return "canais";
    if (q.includes("preco") || q.includes("custo") || q.includes("orcamento")) return "custo";
    return "marketing_generic";
  }

  if (projectType === "app") {
    if (q.includes("funcionalidade") || q.includes("mvp")) return "funcionalidades";
    if (q.includes("tecnologia") || q.includes("stack")) return "tecnologia";
    return "app_generic";
  }

  return "generic";
}

// ------------------------
// ALIGNMENT DETECTION
// ------------------------
function isAligned(intent, currentTask) {
  const task = normalizeText(currentTask);

  if (task.includes("publico") && intent === "publico") return true;
  if (task.includes("objetivo") && intent === "objetivo") return true;
  if (task.includes("canal") && intent === "canais") return true;

  return false;
}

// ------------------------
// COUNT HISTORY
// ------------------------
function getIntentCount(history, intent) {
  if (!history) return 0;

  return history.filter(entry => entry.intent === intent).length;
}

function getStage(count) {
  if (count === 0) return "explore";
  if (count === 1) return "clarify";
  if (count === 2) return "direct";
  return "force";
}

// ------------------------
// MAIN
// ------------------------
export function answerQuestion(question, state) {
  const currentTask = state?.currentTask || "";
  const currentPhase = state?.phase || "";
  const projectType = state?.projectType || "generic";
  const history = state?.conversationHistory || [];

  const intent = detectIntent(question, projectType, currentTask);
  const count = getIntentCount(history, intent);
  const stage = getStage(count);

  const aligned = isAligned(intent, currentTask);

  let mainAnswer = "";
  let nextStep = "";

  // =========================
  // ALIGNED → COACH NORMAL
  // =========================
  if (aligned && intent === "publico") {
    if (stage === "explore") {
      mainAnswer = "Começa por uma pessoa real com problema claro.";
      nextStep = "Descreve essa pessoa.";
    } else if (stage === "clarify") {
      mainAnswer = "Agora define se ela já quer resolver o problema.";
      nextStep = "Define nível de consciência.";
    } else if (stage === "direct") {
      mainAnswer = "Já tens suficiente. Decide.";
      nextStep = "Escreve a persona.";
    } else {
      mainAnswer = "Estás a sobrepensar.";
      nextStep = "Escolhe e avança.";
    }
  }

  // =========================
  // OFF-TRACK → HÍBRIDO
  // =========================
  else {
    // resposta direta simples
    if (intent === "custo") {
      mainAnswer = `
O custo depende muito do canal.

Podes começar com 5–10€/dia para testar.
      `;
    } else {
      mainAnswer = `
Boa pergunta — faz sentido dentro do projeto.
      `;
    }

    // redirecionamento suave
    nextStep = `
Ainda assim, estás nesta fase:
"${currentTask}"

Se saltares isso agora, vais perder eficiência depois.

👉 Fecha primeiro este passo.
    `;
  }

  return {
    intent,
    answer: `
<h3>Resposta</h3>
<p>${mainAnswer.replace(/\n/g, "<br>")}</p>

<h3>Retomada do projeto</h3>
<p><strong>Fase:</strong> ${currentPhase}</p>
<p><strong>Tarefa:</strong> ${currentTask}</p>
<p>${nextStep}</p>
`
  };
}