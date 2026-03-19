export function generateProactiveMessage(project) {
  const history = project.conversationHistory || [];
  const completed = project.completed || [];
  const currentTask = project.currentTask || "";

  if (!history.length) return null;

  // -------------------------
  // DETECTAR REPETIÇÃO
  // -------------------------
  const lastIntent = history[history.length - 1]?.intent;
  const sameIntentCount = history.filter(h => h.intent === lastIntent).length;

  if (sameIntentCount >= 3) {
    return `
<p><strong>Nota:</strong> Já estás a voltar várias vezes ao mesmo ponto.</p>
<p>Queres que eu te ajude a fechar isto agora em vez de continuar a analisar?</p>
`;
  }

  // -------------------------
  // DETECTAR FALTA DE AÇÃO
  // -------------------------
  if (history.length >= 3 && completed.length === 0) {
    return `
<p><strong>Nota:</strong> Já exploraste bastante, mas ainda não executaste.</p>
<p>Se quiseres, eu posso guiar-te passo a passo para fechar esta tarefa.</p>
`;
  }

  // -------------------------
  // DETECTAR POSSÍVEL BLOQUEIO
  // -------------------------
  if (history.length >= 5) {
    return `
<p><strong>Nota:</strong> Parece que estás a acumular informação.</p>
<p>Vamos simplificar e decidir o próximo passo juntos?</p>
`;
  }

  return null;
}