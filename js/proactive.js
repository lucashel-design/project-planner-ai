function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferIntent(entry) {
  if (entry.intent) return entry.intent;

  const q = normalizeText(entry.question);

  if (
    q.includes("publico") ||
    q.includes("publico-alvo") ||
    q.includes("persona") ||
    q.includes("cliente ideal") ||
    q.includes("alvo")
  ) {
    return "publico";
  }

  if (
    q.includes("objetivo") ||
    q.includes("meta") ||
    q.includes("resultado")
  ) {
    return "objetivo";
  }

  if (
    q.includes("canal") ||
    q.includes("anuncio") ||
    q.includes("trafego") ||
    q.includes("orcamento") ||
    q.includes("custo")
  ) {
    return "canais";
  }

  if (
    q.includes("funcionalidade") ||
    q.includes("mvp") ||
    q.includes("feature")
  ) {
    return "funcionalidades";
  }

  if (
    q.includes("tecnologia") ||
    q.includes("stack") ||
    q.includes("framework")
  ) {
    return "tecnologia";
  }

  return "generic";
}

export function generateProactiveMessage(project) {
  const history = project.conversationHistory || [];
  const completed = project.completed || [];
  const currentTask = project.currentTask || "";

  if (!history.length) return null;

  let lastIntent = inferIntent(history[history.length - 1]);
  let consecutiveCount = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const intent = inferIntent(history[i]);

    if (intent === lastIntent) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  if (consecutiveCount >= 3) {
    return `
<p><strong>Nota:</strong> Estás a repetir a mesma linha de dúvida.</p>
<p>Em vez de continuar a perguntar, vamos fechar uma decisão prática agora?</p>
`;
  }

  if (history.length >= 4 && completed.length === 0) {
    return `
<p><strong>Nota:</strong> Já exploraste bastante, mas ainda não executaste.</p>
<p>Se quiseres, eu guio-te agora para fechar esta tarefa: <strong>${currentTask}</strong>.</p>
`;
  }

  if (history.length >= 6) {
    return `
<p><strong>Nota:</strong> Estás a acumular informação sem avançar.</p>
<p>Vamos simplificar e escolher o próximo passo agora?</p>
`;
  }

  return null;
}