const STORAGE_KEY = "project_state";

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function completeCurrentTask(state) {
  if (!state || !state.steps || state.currentStepIndex >= state.steps.length) {
    return state;
  }

  const currentTask = state.steps[state.currentStepIndex];

  if (!state.completed.includes(currentTask)) {
    state.completed.push(currentTask);
  }

  state.currentStepIndex += 1;

  if (state.currentStepIndex < state.steps.length) {
    state.currentTask = state.steps[state.currentStepIndex];
  } else {
    state.currentTask = "Projeto concluído";
    state.phase = "Concluído";
  }

  saveState(state);
  return state;
}

export function addConversationEntry(state, question, answer) {
  if (!state.conversationHistory) {
    state.conversationHistory = [];
  }

  state.conversationHistory.push({
    question,
    answer,
    timestamp: new Date().toISOString()
  });

  saveState(state);
  return state;
}