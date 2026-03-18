function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectIntent(question, projectType, currentTask) {
  const q = normalizeText(question);
  const task = normalizeText(currentTask || "");

  if (projectType === "marketing") {
    if (
      q.includes("publico") ||
      q.includes("publico-alvo") ||
      q.includes("cliente ideal") ||
      q.includes("persona") ||
      task.includes("publico")
    ) {
      return "publico";
    }

    if (
      q.includes("objetivo") ||
      q.includes("meta") ||
      q.includes("resultado") ||
      task.includes("objetivo")
    ) {
      return "objetivo";
    }

    if (
      q.includes("canal") ||
      q.includes("canais") ||
      q.includes("instagram") ||
      q.includes("trafego") ||
      q.includes("anuncio")
    ) {
      return "canais";
    }

    return "marketing_generic";
  }

  if (projectType === "app") {
    if (
      q.includes("funcionalidade") ||
      q.includes("funcionalidades") ||
      q.includes("mvp") ||
      q.includes("feature") ||
      task.includes("funcionalidades")
    ) {
      return "funcionalidades";
    }

    if (
      q.includes("tecnologia") ||
      q.includes("stack") ||
      q.includes("framework") ||
      q.includes("javascript") ||
      q.includes("backend") ||
      q.includes("frontend") ||
      task.includes("tecnologia")
    ) {
      return "tecnologia";
    }

    if (
      q.includes("problema") ||
      q.includes("dor") ||
      q.includes("necessidade")
    ) {
      return "problema";
    }

    return "app_generic";
  }

  if (
    q.includes("objetivo") ||
    q.includes("meta") ||
    q.includes("resultado")
  ) {
    return "objetivo_generic";
  }

  if (
    q.includes("prioridade") ||
    q.includes("organizar") ||
    q.includes("ordem")
  ) {
    return "prioridade_generic";
  }

  return "generic";
}

function inferIntentFromEntry(entry, projectType, currentTask) {
  if (entry.intent) return entry.intent;
  return detectIntent(entry.question || "", projectType, currentTask);
}

function getIntentCount(history, intent, projectType, currentTask) {
  if (!history || history.length === 0) return 0;

  return history.filter(entry =>
    inferIntentFromEntry(entry, projectType, currentTask) === intent
  ).length;
}

function rotateResponse(variations, count) {
  return variations[count % variations.length];
}

export function answerQuestion(question, state) {
  const currentTask = state?.currentTask || "Sem tarefa atual";
  const currentPhase = state?.phase || "Sem fase atual";
  const projectType = state?.projectType || "generic";
  const history = state?.conversationHistory || [];

  const intent = detectIntent(question, projectType, currentTask);
  const intentCount = getIntentCount(history, intent, projectType, currentTask);

  let mainAnswer = "";
  let nextStep = "";

  if (projectType === "marketing") {
    if (intent === "publico") {
      const variations = [
        `
Começa por uma pessoa específica, não por um grupo enorme.

Define:
- quem é,
- que problema tem,
- o que deseja,
- o que a trava hoje.
        `,
        `
Se ainda estás perdido com o público, faz esta pergunta:
quem teria vontade de resolver este problema agora, e não “um dia”?

Esse é o teu ponto de partida.
        `,
        `
O erro aqui é falar amplo demais.

Não digas só “mulheres” ou “empresas”.
Descreve contexto, momento de vida e necessidade concreta.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Escreve 1 perfil de cliente ideal com problema, desejo e contexto.";

    } else if (intent === "objetivo") {
      const variations = [
        `
Objetivo bom não é “crescer”.

Objetivo bom é:
resultado + número + prazo.
        `,
        `
Se não consegues medir, não consegues saber se o plano funcionou.

Por isso, define uma meta verificável.
        `,
        `
Antes de pensar em conteúdo ou anúncios, fecha isto:
o que exatamente queres que o marketing produza?
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Escreve uma meta concreta com prazo e métrica.";

    } else if (intent === "canais") {
      const variations = [
        `
Não escolhas canais por moda.

Escolhe onde o teu público já presta atenção.
        `,
        `
Melhor 1 canal bem trabalhado do que 4 abandonados.

Nesta fase, simplifica.
        `,
        `
Para decidir canais, cruza 2 coisas:
onde o público está e o que tu consegues manter com consistência.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Escolhe 1 canal principal e 1 canal de apoio.";

    } else {
      const variations = [
        `
Boa pergunta, mas mantém o foco.

Num projeto de marketing, base fraca estraga execução.
        `,
        `
Antes de abrir mais frentes, fecha bem a etapa atual.
        `,
        `
Transforma esta dúvida numa decisão prática, não numa reflexão infinita.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = `Fecha primeiro esta tarefa: ${currentTask}`;
    }
  } else if (projectType === "app") {
    if (intent === "funcionalidades") {
      const variations = [
        `
Não tentes construir tudo.

Começa pelo mínimo que já resolve o problema central.
        `,
        `
Se uma funcionalidade não for essencial para a primeira versão, ela pode esperar.
        `,
        `
Pensa assim:
sem isto, a app ainda cumpre a promessa principal?

Se não, isso é core.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Lista 3 funcionalidades essenciais e 3 que podem ficar para depois.";

    } else if (intent === "tecnologia") {
      const variations = [
        `
Escolhe a stack que te faz lançar mais rápido, não a mais impressionante.
        `,
        `
Se queres baixo custo e simplicidade, evita complexidade técnica desnecessária.
        `,
        `
Tecnologia boa para MVP é a que reduz fricção: construir, testar, corrigir e publicar.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Escolhe uma stack simples e justifica em 2 frases.";

    } else if (intent === "problema") {
      const variations = [
        `
Uma app forte nasce de um problema específico, não de uma ideia vaga.
        `,
        `
Antes de falar de funcionalidades, garante que a dor que queres resolver está clara.
        `,
        `
Se o problema não estiver bem definido, a app cresce torta desde o início.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Descreve o problema principal em uma frase simples.";

    } else {
      const variations = [
        `
Boa dúvida. Agora traz isso para o chão do produto.
        `,
        `
Em projeto de app, cada dúvida precisa virar decisão prática.
        `,
        `
Evita abstração demais. Decide o próximo passo executável.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = `Resolve isto agora: ${currentTask}`;
    }
  } else {
    if (intent === "objetivo_generic") {
      const variations = [
        `
Objetivo vago gera execução fraca.

Especifica melhor.
        `,
        `
Se o objetivo não estiver claro, as tarefas perdem sentido.
        `,
        `
Primeiro define o destino. Depois faz sentido organizar os passos.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Escreve o objetivo em uma frase clara e verificável.";

    } else if (intent === "prioridade_generic") {
      const variations = [
        `
Priorizar é decidir o que vem antes, não tentar fazer tudo ao mesmo tempo.
        `,
        `
Se tudo parece importante, falta critério de prioridade.
        `,
        `
Organiza pela lógica:
o que desbloqueia o resto vem primeiro.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = "Escolhe a próxima ação que desbloqueia mais progresso.";

    } else {
      const variations = [
        `
Essa dúvida é válida, mas não percas o fio do projeto.
        `,
        `
Boa pergunta. Agora converte isso em ação prática.
        `,
        `
Antes de aprofundar, confirma se a tarefa atual já está realmente fechada.
        `
      ];

      mainAnswer = rotateResponse(variations, intentCount);
      nextStep = `Volta à tarefa atual: ${currentTask}`;
    }
  }

  return {
    intent,
    answer: `
<h3>Resposta</h3>
<p>${mainAnswer.replace(/\n/g, "<br>")}</p>

<h3>Retomada do projeto</h3>
<p><strong>Fase atual:</strong> ${currentPhase}</p>
<p><strong>Tarefa atual:</strong> ${currentTask}</p>
<p><strong>Próximo passo:</strong> ${nextStep}</p>
`
  };
}