export function saveState(state) {
  localStorage.setItem("project_state", JSON.stringify(state));
}

export function loadState() {
  const data = localStorage.getItem("project_state");
  return data ? JSON.parse(data) : null;
}
