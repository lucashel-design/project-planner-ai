export function answerQuestion(question, state) {
  const lowerQuestion = question.toLowerCase();
  const currentTask = state?.currentTask || "Sem tarefa atual";
  const currentPhase = state?.phase || "Sem fase atual";
  const projectType = state?.projectType || "generic";

  let mainAnswer = "";
  let nextStepHint = "";

  if (projectType === "marketing") {
    if (currentTask.includes("público")) {
      mainAnswer = `
Estás na etapa certa para definir para quem vais comunicar.

Para construir o público-alvo, responde:
1. Quem é a pessoa?
2. Qual problema ela tem?
3. O que ela deseja alcançar?
4. O que a impede hoje?
5. Onde ela já procura soluções?

Em marketing, quanto mais específico fores, melhor.
`;
      nextStepHint = "Escreve um perfil simples do cliente ideal em 4 a 6 linhas.";
    } else if (currentTask.includes("objetivo")) {
      mainAnswer = `
Nesta etapa, o teu foco não é criar conteúdo ainda. É definir o resultado que queres gerar.

Um objetivo bom em marketing costuma responder:
- quanto queres alcançar;
- em quanto tempo;
- com que métrica.

Exemplo:
“Quero gerar 20 leads em 30 dias através de conteúdo no Instagram”.
`;
      nextStepHint = "Escreve uma frase com resultado, prazo e métrica.";
    } else {
      mainAnswer = `
A tua pergunta foi lida dentro de um projeto de marketing.

Antes de avançar, garante que esta tarefa atual está realmente fechada. Isso evita construir campanha em cima de base fraca.
`;
      nextStepHint = `Fecha primeiro esta tarefa: ${currentTask}.`;
    }
  } else if (projectType === "app") {
    if (currentTask.includes("funcionalidades")) {
      mainAnswer = `
Nesta fase, não tentes definir tudo. Começa pelo essencial.

Pergunta:
- qual é a funcionalidade principal?
- sem o que a app não faz sentido?
- o que pode ficar para depois?

Pensa em MVP: a versão mínima que já resolve o problema.
`;
      nextStepHint = "Faz uma lista com 3 funcionalidades essenciais e 3 opcionais.";
    } else if (currentTask.includes("tecnologia")) {
      mainAnswer = `
Para escolher tecnologia, decide com base em:
1. rapidez para construir;
2. simplicidade para manter;
3. curva de aprendizagem;
4. custo.

Como queres algo barato e simples, normalmente compensa usar stack leve e sem backend no início.
`;
      nextStepHint = "Escolhe uma stack simples para MVP e justifica em 2 frases.";
    } else {
      mainAnswer = `
A tua pergunta foi lida dentro de um projeto de app.

Tenta sempre transformar a dúvida numa decisão prática de produto ou execução.
`;
      nextStepHint = `Resolve esta tarefa antes de avançar: ${currentTask}.`;
    }
  } else {
    if (lowerQuestion.includes("objetivo")) {
      mainAnswer = `
Um objetivo útil é claro, específico e verificável.

Evita frases vagas. Define:
- o que queres alcançar;
- até quando;
- como vais saber que foi feito.
`;
      nextStepHint = "Escreve o objetivo em uma frase simples e mensurável.";
    } else {
      mainAnswer = `
A tua pergunta foi interpretada dentro do contexto do projeto atual.

O mais importante agora é não perder o fluxo: responder à dúvida e voltar à tarefa em aberto.
`;
      nextStepHint = `Volta à tarefa atual: ${currentTask}.`;
    }
  }

  return {
    answer: `
<h3>Resposta</h3>
<p>${mainAnswer.replace(/\n/g, "<br>")}</p>

<h3>Retomada do projeto</h3>
<p><strong>Fase atual:</strong> ${currentPhase}</p>
<p><strong>Tarefa atual:</strong> ${currentTask}</p>
<p><strong>Próximo passo:</strong> ${nextStepHint}</p>
`
  };
}