export function answerQuestion(question, state) {
  const lowerQuestion = question.toLowerCase();
  const currentTask = state?.currentTask || "Sem tarefa atual";
  const currentPhase = state?.phase || "Sem fase atual";

  let mainAnswer = "";

  if (lowerQuestion.includes("público")) {
    mainAnswer = `
Para definires o público-alvo, começa por responder a 4 coisas:
1. Quem tem este problema?
2. O que essa pessoa quer alcançar?
3. O que a impede hoje?
4. Onde ela já procura soluções?

Não tentes definir “toda a gente”. Escolhe um grupo específico.
`;
  } else if (lowerQuestion.includes("objetivo")) {
    mainAnswer = `
Um bom objetivo precisa de ser concreto.
Em vez de “quero crescer”, escreve algo como:
“Quero gerar 20 leads em 30 dias”
ou
“Quero publicar 3 conteúdos por semana durante 1 mês”.
`;
  } else if (lowerQuestion.includes("tecnologia")) {
    mainAnswer = `
Para escolher tecnologia, pensa em 3 critérios:
1. o que consegues construir mais rápido;
2. o que custa menos manter;
3. o que já sabes usar ou consegues aprender sem travar o projeto.
`;
  } else {
    mainAnswer = `
A tua pergunta foi interpretada dentro do contexto do projeto atual.
Posso ajudar-te a destrinçar este ponto, mas o mais importante é não perder o fluxo.

Pega nesta dúvida e transforma-a em algo executável agora.
Pergunta-te:
- o que preciso decidir?
- o que preciso escrever?
- o que preciso testar?
`;
  }

  return {
    answer: `
<h3>Resposta</h3>
<p>${mainAnswer.replace(/\n/g, "<br>")}</p>

<h3>Retomada do projeto</h3>
<p><strong>Fase atual:</strong> ${currentPhase}</p>
<p><strong>Tarefa atual:</strong> ${currentTask}</p>
<p><strong>Próximo passo:</strong> trabalha nesta tarefa antes de avançar para a seguinte.</p>
`
  };
}