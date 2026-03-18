const PROJECTS_KEY = "projects_state";
const ACTIVE_PROJECT_KEY = "active_project_id";

export function loadProjects() {
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getActiveProjectId() {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(projectId) {
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
}

export function clearActiveProjectId() {
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function addProject(project) {
  const projects = loadProjects();
  projects.unshift(project);
  saveProjects(projects);
  setActiveProjectId(project.id);
  return projects;
}

export function getActiveProject() {
  const projects = loadProjects();
  const activeId = getActiveProjectId();

  if (!activeId) return null;

  return projects.find(project => project.id === activeId) || null;
}

export function updateProject(updatedProject) {
  const projects = loadProjects().map(project =>
    project.id === updatedProject.id
      ? { ...updatedProject, updatedAt: new Date().toISOString() }
      : project
  );

  saveProjects(projects);
  return projects;
}

export function deleteProject(projectId) {
  const projects = loadProjects().filter(project => project.id !== projectId);
  saveProjects(projects);

  const activeId = getActiveProjectId();

  if (activeId === projectId) {
    if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
    } else {
      clearActiveProjectId();
    }
  }

  return projects;
}

export function selectProject(projectId) {
  setActiveProjectId(projectId);
  return getActiveProject();
}

export function completeCurrentTask(project) {
  if (!project || !project.steps || project.currentStepIndex >= project.steps.length) {
    return project;
  }

  const currentTask = project.steps[project.currentStepIndex];

  if (!project.completed.includes(currentTask)) {
    project.completed.push(currentTask);
  }

  project.currentStepIndex += 1;

  if (project.currentStepIndex < project.steps.length) {
    project.currentTask = project.steps[project.currentStepIndex];
  } else {
    project.currentTask = "Projeto concluído";
    project.phase = "Concluído";
  }

  updateProject(project);
  return project;
}

export function addConversationEntry(project, question, answer, intent = "generic") {
  if (!project.conversationHistory) {
    project.conversationHistory = [];
  }

  project.conversationHistory.push({
    question,
    answer,
    intent,
    timestamp: new Date().toISOString()
  });

  updateProject(project);
  return project;
}

export function clearAllProjects() {
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
}