"use strict";

const STORAGE_KEY = "student-productivity-hub-v1";
const THEME_KEY = "student-productivity-hub-theme";
const COLORS = ["purple", "blue", "orange", "green", "pink"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const state = {
  data: null,
  activeView: "dashboard",
  taskFilter: "all",
  charts: {},
  dialogType: "",
  editingId: null,
  chartRange: "week",
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const makeId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const dateOnly = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateOffset = (days, base = new Date()) => {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  date.setDate(date.getDate() + days);
  return dateOnly(date);
};
const today = dateOnly(new Date());
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const formatDate = (value, options = { month: "short", day: "numeric" }) => {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "No date" : new Intl.DateTimeFormat(undefined, options).format(date);
};
const formatTime = (value) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hours, minutes));
};
const escapeAttr = escapeHTML;

function seedData() {
  return {
    tasks: [
      { id: makeId(), title: "Review lecture notes — Data Structures", category: "Data Structures", dueDate: today, priority: "high", completed: false, createdAt: new Date().toISOString() },
      { id: makeId(), title: "Read chapter 4: Human-Computer Interaction", category: "HCI", dueDate: today, priority: "medium", completed: false, createdAt: new Date().toISOString() },
      { id: makeId(), title: "Submit weekly reflection", category: "Personal", dueDate: today, priority: "low", completed: true, createdAt: new Date().toISOString() },
      { id: makeId(), title: "Practice binary tree problems", category: "Data Structures", dueDate: dateOffset(1), priority: "high", completed: false, createdAt: new Date().toISOString() },
      { id: makeId(), title: "Review calculus problem set", category: "Calculus II", dueDate: dateOffset(-1), priority: "medium", completed: false, createdAt: new Date().toISOString() },
      { id: makeId(), title: "Watch research methods lecture", category: "Research Methods", dueDate: dateOffset(2), priority: "low", completed: false, createdAt: new Date().toISOString() },
    ],
    assignments: [
      { id: makeId(), title: "Data Structures — Binary Trees", course: "Data Structures", dueDate: dateOffset(2), status: "in-progress", description: "Implement and analyze binary tree traversal methods." },
      { id: makeId(), title: "HCI Research Proposal", course: "Human-Computer Interaction", dueDate: dateOffset(4), status: "not-started", description: "Prepare a short proposal for the semester research project." },
      { id: makeId(), title: "Calculus II Problem Set 6", course: "Calculus II", dueDate: dateOffset(6), status: "in-progress", description: "Complete the integration and series problems." },
      { id: makeId(), title: "Weekly Learning Reflection", course: "Personal Development", dueDate: dateOffset(-1), status: "submitted", description: "A reflection on the week's learning." },
    ],
    sessions: [
      { id: makeId(), title: "Data Structures", day: new Date().getDay(), start: "09:00", end: "10:30", color: "purple" },
      { id: makeId(), title: "Human-Computer Interaction", day: new Date().getDay(), start: "13:00", end: "14:00", color: "blue" },
      { id: makeId(), title: "Calculus II practice", day: (new Date().getDay() + 1) % 7, start: "10:00", end: "11:30", color: "orange" },
      { id: makeId(), title: "Research reading", day: (new Date().getDay() + 2) % 7, start: "15:00", end: "16:00", color: "green" },
      { id: makeId(), title: "Project work", day: (new Date().getDay() + 4) % 7, start: "11:00", end: "12:30", color: "pink" },
    ],
    notes: [
      { id: makeId(), title: "Binary tree traversal", content: "In-order: left → root → right (sorted output for a BST). Pre-order: root → left → right. Post-order: left → right → root. Remember to consider the empty tree base case.", color: "purple", updatedAt: new Date().toISOString() },
      { id: makeId(), title: "HCI research ideas", content: "Explore how small changes in notification timing affect a student's ability to stay focused during a study session. Possible method: short diary study + follow-up interview.", color: "blue", updatedAt: new Date().toISOString() },
      { id: makeId(), title: "Calculus: integration by parts", content: "∫ u dv = uv − ∫ v du. Choose u using LIATE: logarithmic, inverse trig, algebraic, trigonometric, exponential.", color: "orange", updatedAt: new Date().toISOString() },
    ],
    studyLog: [
      { date: dateOffset(-6), subject: "Data Structures", hours: 1.5 },
      { date: dateOffset(-5), subject: "Calculus II", hours: 1 },
      { date: dateOffset(-4), subject: "Human-Computer Interaction", hours: 2 },
      { date: dateOffset(-3), subject: "Data Structures", hours: 1.5 },
      { date: dateOffset(-2), subject: "Research Methods", hours: 1 },
      { date: dateOffset(-1), subject: "Calculus II", hours: 1.5 },
      { date: today, subject: "Data Structures", hours: 1 },
    ],
    activity: [
      { date: dateOffset(-6), count: 2 }, { date: dateOffset(-5), count: 3 },
      { date: dateOffset(-4), count: 1 }, { date: dateOffset(-3), count: 4 },
      { date: dateOffset(-2), count: 2 }, { date: dateOffset(-1), count: 3 },
      { date: today, count: 2 },
    ],
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return seedData();
    const parsed = JSON.parse(saved);
    const initial = seedData();
    return {
      ...initial,
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : initial.tasks,
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : initial.assignments,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : initial.sessions,
      notes: Array.isArray(parsed.notes) ? parsed.notes : initial.notes,
      studyLog: Array.isArray(parsed.studyLog) ? parsed.studyLog : initial.studyLog,
      activity: Array.isArray(parsed.activity) ? parsed.activity : initial.activity,
    };
  } catch (error) {
    console.error("Could not read saved Studyflow data.", error);
    showToast("Saved data could not be read. A fresh workspace was loaded.");
    return seedData();
  }
}

function persist(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Could not save Studyflow data.", error);
    showToast("Changes could not be saved. Check your browser storage settings.");
    return false;
  }
}

function showToast(message) {
  const region = $("#toastRegion");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3000);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  $("#themeLabel").textContent = dark ? "Light mode" : "Dark mode";
  $(".theme-icon").textContent = dark ? "☀" : "☾";
  $("#themeToggle").setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error("Could not save theme preference.", error);
    showToast("Theme changed, but this preference could not be saved.");
  }
  updateCharts();
}

function setView(name) {
  if (!$(`#view-${name}`)) return;
  state.activeView = name;
  $$(".view-panel").forEach((panel) => {
    const active = panel.id === `view-${name}`;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  $$(".nav-link[data-view]").forEach((link) => link.classList.toggle("active", link.dataset.view === name));
  $("#breadcrumbCurrent").textContent = ({ dashboard: "Overview", tasks: "My tasks", assignments: "Assignments", planner: "Study planner", notes: "My notes", analytics: "Analytics" })[name];
  $("#sidebar").classList.remove("open");
  $("#sidebarScrim").classList.remove("open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
  renderView(name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderView(name) {
  if (name === "dashboard") renderDashboard();
  if (name === "tasks") renderTasks();
  if (name === "assignments") renderAssignments();
  if (name === "planner") renderPlanner();
  if (name === "notes") renderNotes();
  if (name === "analytics") renderAnalytics();
}

function taskCounts() {
  const completed = state.data.tasks.filter((task) => task.completed).length;
  return { total: state.data.tasks.length, completed, active: state.data.tasks.length - completed };
}

function renderDashboard() {
  const counts = taskCounts();
  const rate = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  $("#completedStat").innerHTML = `${counts.completed}<span class="stat-total"> / ${counts.total}</span>`;
  $("#completionRate").textContent = `${rate}%`;
  const hours = recentStudyLog().reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  $("#studyHours").textContent = Number(hours.toFixed(1));
  const weekEnd = dateOffset(6);
  const due = state.data.assignments.filter((item) => item.status !== "submitted" && item.dueDate >= today && item.dueDate <= weekEnd).length;
  $("#dueStat").textContent = String(due);
  $("#streakStat").textContent = String(calculateStreak());
  $("#navTaskCount").textContent = String(counts.active);
  $("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  $("#welcomeDate").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
  $("#streakDots").innerHTML = Array.from({ length: 7 }, () => "<i></i>").join("");
  renderUpcoming();
  renderDashboardTasks();
  renderDashboardSchedule();
  renderActivityChart();
}

function recentStudyLog() {
  const weekStart = dateOffset(-6);
  return state.data.studyLog.filter((entry) => entry.date >= weekStart && entry.date <= today);
}

function calculateStreak() {
  let streak = 0;
  const activeDates = new Set(state.data.activity.filter((item) => item.count > 0).map((item) => item.date));
  for (let offset = 0; offset < 365; offset += 1) {
    const candidate = dateOffset(-offset);
    if (activeDates.has(candidate)) streak += 1;
    else if (offset > 0) break;
  }
  return streak;
}

function renderDashboardTasks() {
  const entries = state.data.tasks.filter((task) => task.dueDate === today).slice(0, 4);
  $("#dashboardTasks").innerHTML = entries.length ? entries.map((task) => `
    <div class="preview-task">
      <button class="check-button ${task.completed ? "checked" : ""}" type="button" data-toggle-task="${escapeAttr(task.id)}" aria-label="${task.completed ? "Mark incomplete" : "Complete"} ${escapeAttr(task.title)}">${task.completed ? "✓" : ""}</button>
      <div class="task-preview-copy ${task.completed ? "is-done" : ""}"><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.category || "General")}</span></div>
      <span class="priority-mark ${escapeAttr(task.priority)}" title="${escapeAttr(task.priority)} priority"></span>
    </div>`).join("") : emptyState("Nothing scheduled for today", "Add a task whenever you’re ready.");
}

function renderUpcoming() {
  const upcoming = state.data.assignments.filter((item) => item.status !== "submitted" && item.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
  $("#upcomingList").innerHTML = upcoming.length ? upcoming.map((item) => {
    const date = new Date(`${item.dueDate}T12:00:00`);
    const color = item.status === "in-progress" ? "blue" : "orange";
    return `<div class="upcoming-item"><div class="date-tile"><span>${escapeHTML(new Intl.DateTimeFormat(undefined, { month: "short" }).format(date))}</span><span>${date.getDate()}</span></div><div class="upcoming-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.course)}</span></div><span class="badge ${color}">${item.status === "in-progress" ? "In progress" : "Not started"}</span></div>`;
  }).join("") : emptyState("No upcoming deadlines", "You’re all caught up.");
}

function renderDashboardSchedule() {
  const sessions = state.data.sessions.filter((session) => Number(session.day) === new Date().getDay()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4);
  $("#dashboardSchedule").innerHTML = sessions.length ? sessions.map((session) => `<div class="schedule-item"><span class="subject-dot ${escapeAttr(session.color)}"></span><div class="schedule-copy"><strong>${escapeHTML(session.title)}</strong><span>${escapeHTML(formatTime(session.start))} – ${escapeHTML(formatTime(session.end))}</span></div><span class="time-rail">${escapeHTML(formatTime(session.start))}</span></div>`).join("") : emptyState("A clear day ahead", "Add a study session to your planner.");
}

function emptyState(title, message) {
  return `<div class="empty-state"><strong>${escapeHTML(title)}</strong>${escapeHTML(message)}</div>`;
}

function renderTasks() {
  const search = $("#taskSearch").value.trim().toLowerCase();
  const all = state.data.tasks;
  const list = all.filter((task) => {
    const matchesFilter = state.taskFilter === "all" || (state.taskFilter === "active" ? !task.completed : task.completed);
    const matchesSearch = `${task.title} ${task.category}`.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  }).sort((a, b) => Number(a.completed) - Number(b.completed) || (a.dueDate || "").localeCompare(b.dueDate || ""));
  $("#allTaskCount").textContent = String(all.length);
  $("#activeTaskCount").textContent = String(all.filter((task) => !task.completed).length);
  $("#doneTaskCount").textContent = String(all.filter((task) => task.completed).length);
  $("#navTaskCount").textContent = String(all.filter((task) => !task.completed).length);
  $("#taskList").innerHTML = list.length ? list.map((task) => `
    <div class="managed-item">
      <button class="check-button ${task.completed ? "checked" : ""}" type="button" data-toggle-task="${escapeAttr(task.id)}" aria-label="${task.completed ? "Mark incomplete" : "Complete"} ${escapeAttr(task.title)}">${task.completed ? "✓" : ""}</button>
      <span class="priority-mark ${escapeAttr(task.priority)}" title="${escapeAttr(task.priority)} priority"></span>
      <div class="managed-copy ${task.completed ? "is-done" : ""}"><strong>${escapeHTML(task.title)}</strong><p>${escapeHTML(task.category || "General")} · ${task.dueDate ? `Due ${escapeHTML(formatDate(task.dueDate, { month: "short", day: "numeric", year: "numeric" }))}` : "No due date"}</p></div>
      <span class="item-meta">${task.completed ? "Completed" : task.dueDate === today ? "Today" : task.dueDate && task.dueDate < today ? "Overdue" : "To do"}</span>
      <div class="item-actions"><button class="icon-button" type="button" data-edit="task" data-id="${escapeAttr(task.id)}" aria-label="Edit task">✎</button><button class="icon-button danger" type="button" data-delete="task" data-id="${escapeAttr(task.id)}" aria-label="Delete task">×</button></div>
    </div>`).join("") : emptyState(search ? "No matching tasks" : "No tasks in this view", search ? "Try a different search." : "Create a task to get started.");
}

function statusLabel(status) {
  return ({ "not-started": "Not started", "in-progress": "In progress", submitted: "Submitted" })[status] || status;
}

function renderAssignments() {
  const filter = $("#assignmentFilter").value;
  const list = state.data.assignments.filter((item) => filter === "all" || (filter === "upcoming" ? item.status !== "submitted" : item.status === "submitted")).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const active = state.data.assignments.filter((item) => item.status !== "submitted");
  const overdue = active.filter((item) => item.dueDate && item.dueDate < today).length;
  const submitted = state.data.assignments.filter((item) => item.status === "submitted").length;
  $("#assignmentSummary").innerHTML = `
    <article class="assignment-summary-card"><span class="summary-icon">▤</span><div><strong>${active.length}</strong><span>In progress</span></div></article>
    <article class="assignment-summary-card"><span class="summary-icon orange">◷</span><div><strong>${overdue}</strong><span>Past due</span></div></article>
    <article class="assignment-summary-card"><span class="summary-icon green">✓</span><div><strong>${submitted}</strong><span>Submitted</span></div></article>`;
  $("#assignmentList").innerHTML = list.length ? list.map((item) => {
    const overdueItem = item.status !== "submitted" && item.dueDate && item.dueDate < today;
    const badge = item.status === "submitted" ? "green" : item.status === "in-progress" ? "blue" : "orange";
    return `<div class="managed-item"><span class="stat-icon ${badge === "green" ? "purple" : badge}" aria-hidden="true">${item.status === "submitted" ? "✓" : "▤"}</span><div class="managed-copy"><div class="assignment-title-line"><strong>${escapeHTML(item.title)}</strong></div><p>${escapeHTML(item.course)} · ${escapeHTML(item.description || "No description")}</p></div><span class="badge ${badge}">${escapeHTML(statusLabel(item.status))}</span><span class="item-meta">${overdueItem ? "Overdue · " : ""}${escapeHTML(formatDate(item.dueDate))}</span><div class="item-actions"><button class="icon-button" type="button" data-edit="assignment" data-id="${escapeAttr(item.id)}" aria-label="Edit assignment">✎</button><button class="icon-button danger" type="button" data-delete="assignment" data-id="${escapeAttr(item.id)}" aria-label="Delete assignment">×</button></div></div>`;
  }).join("") : emptyState("No assignments here", "Add an assignment to track its deadline.");
}

function renderPlanner() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  $("#weekLabel").textContent = `${formatDate(dateOnly(monday), { month: "short", day: "numeric" })} – ${formatDate(dateOnly(sunday), { month: "short", day: "numeric" })}`;
  $("#plannerDays").innerHTML = Array.from({ length: 7 }, (_, index) => {
    const day = (index + 1) % 7;
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    const sessions = state.data.sessions.filter((session) => Number(session.day) === day).sort((a, b) => a.start.localeCompare(b.start));
    return `<article class="planner-day ${dateOnly(date) === today ? "is-today" : ""}"><div class="day-heading"><span>${DAY_NAMES[day].slice(0, 3)}</span><strong>${date.getDate()}</strong></div><div class="day-sessions">${sessions.length ? sessions.map((session) => `<div class="session-card ${escapeAttr(session.color)}"><strong>${escapeHTML(session.title)}</strong><span>${escapeHTML(formatTime(session.start))} – ${escapeHTML(formatTime(session.end))}</span><div class="session-actions"><button class="icon-button" type="button" data-edit="session" data-id="${escapeAttr(session.id)}" aria-label="Edit study session">✎</button><button class="icon-button danger" type="button" data-delete="session" data-id="${escapeAttr(session.id)}" aria-label="Delete study session">×</button></div></div>`).join("") : '<span class="muted-copy" style="text-align:center;padding-top:5px;font-size:8px">Open</span>'}</div></article>`;
  }).join("");
}

function renderNotes() {
  const search = $("#noteSearch").value.trim().toLowerCase();
  const notes = state.data.notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(search)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  $("#noteCount").textContent = `${state.data.notes.length} ${state.data.notes.length === 1 ? "note" : "notes"}`;
  $("#notesGrid").innerHTML = notes.length ? notes.map((note) => `<article class="note-card note-${escapeAttr(note.color || "purple")}"><div class="note-card-top"><span class="badge">${escapeHTML(formatDate(note.updatedAt.slice(0, 10)))}</span><div class="note-actions"><button class="icon-button" type="button" data-edit="note" data-id="${escapeAttr(note.id)}" aria-label="Edit note">✎</button><button class="icon-button danger" type="button" data-delete="note" data-id="${escapeAttr(note.id)}" aria-label="Delete note">×</button></div></div><h3>${escapeHTML(note.title)}</h3><p>${escapeHTML(note.content)}</p><div class="note-card-footer"><span>Updated ${escapeHTML(formatDate(note.updatedAt.slice(0, 10)))}</span><span class="subject-dot ${escapeAttr(note.color || "purple")}"></span></div></article>`).join("") : emptyState("No notes found", search ? "Try another search phrase." : "Create a note to collect your ideas.");
}

function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--muted").trim(),
    line: styles.getPropertyValue("--line").trim(),
    purple: styles.getPropertyValue("--purple").trim(),
    blue: styles.getPropertyValue("--blue").trim(),
    purpleSoft: styles.getPropertyValue("--purple-soft").trim(),
  };
}

function chartOptions(colors) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#25243a", padding: 10, titleFont: { family: "DM Sans" }, bodyFont: { family: "DM Sans" } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.text, font: { family: "DM Sans", size: 9 } } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: colors.line, drawTicks: false }, ticks: { color: colors.text, precision: 0, padding: 8, font: { family: "DM Sans", size: 9 } } },
    },
  };
}

function destroyChart(name) {
  if (state.charts[name]) {
    state.charts[name].destroy();
    delete state.charts[name];
  }
}

function renderActivityChart() {
  const canvas = $("#activityChart");
  const fallback = $("#activityChartFallback");
  if (!window.Chart) {
    canvas.hidden = true;
    fallback.hidden = false;
    return;
  }
  canvas.hidden = false;
  fallback.hidden = true;
  destroyChart("activity");
  const colors = themeColors();
  let days;
  if (state.chartRange === "month") {
    const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    days = Array.from({ length: currentMonthDays }, (_, index) => dateOnly(new Date(new Date().getFullYear(), new Date().getMonth(), index + 1)));
  } else {
    days = Array.from({ length: 7 }, (_, index) => dateOffset(index - 6));
  }
  const data = days.map((date) => state.data.activity.filter((entry) => entry.date === date).reduce((sum, entry) => sum + Number(entry.count || 0), 0));
  const labels = days.map((date) => new Intl.DateTimeFormat(undefined, { month: "short", day: state.chartRange === "month" ? undefined : "numeric", weekday: state.chartRange === "week" ? "short" : undefined }).format(new Date(`${date}T12:00:00`)));
  state.charts.activity = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ label: "Tasks completed", data, borderRadius: 5, maxBarThickness: state.chartRange === "month" ? 9 : 23, backgroundColor: data.map((_, index) => index === data.length - 1 ? colors.purple : colors.purpleSoft) }] },
    options: { ...chartOptions(colors), scales: { ...chartOptions(colors).scales, x: { ...chartOptions(colors).scales.x, ticks: { ...chartOptions(colors).scales.x.ticks, maxRotation: 0, autoSkip: true, maxTicksLimit: state.chartRange === "month" ? 10 : 7 } } } },
  });
}

function renderAnalytics() {
  const counts = taskCounts();
  const studyEntries = recentStudyLog();
  const totalHours = studyEntries.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const submitted = state.data.assignments.filter((item) => item.status === "submitted").length;
  $("#analyticsStats").innerHTML = `<article class="analytics-stat"><span>Task completion</span><strong>${counts.total ? Math.round(counts.completed / counts.total * 100) : 0}%</strong></article><article class="analytics-stat"><span>Study hours, past 7 days</span><strong>${Number(totalHours.toFixed(1))} hrs</strong></article><article class="analytics-stat"><span>Assignments submitted</span><strong>${submitted}</strong></article>`;
  if (!window.Chart) {
    ["completionChart", "studyChart"].forEach((id) => { $(`#${id}`).hidden = true; $(`#${id}Fallback`).hidden = false; });
    return;
  }
  ["completionChart", "studyChart"].forEach((id) => { $(`#${id}`).hidden = false; $(`#${id}Fallback`).hidden = true; });
  destroyChart("completion");
  destroyChart("study");
  const colors = themeColors();
  state.charts.completion = new Chart($("#completionChart"), {
    type: "doughnut",
    data: { labels: ["Completed", "Remaining"], datasets: [{ data: [counts.completed, Math.max(counts.total - counts.completed, 0)], backgroundColor: [colors.purple, colors.purpleSoft], borderWidth: 0, hoverOffset: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "74%", plugins: { legend: { position: "bottom", labels: { color: colors.text, usePointStyle: true, pointStyle: "circle", padding: 18, font: { family: "DM Sans", size: 10 } } } } },
  });
  const subjects = [...new Set(studyEntries.map((item) => item.subject))];
  const data = subjects.map((subject) => studyEntries.filter((item) => item.subject === subject).reduce((sum, item) => sum + Number(item.hours || 0), 0));
  const palette = [colors.purple, colors.blue, "#e9a344", "#39a985", "#e57fa0"];
  state.charts.study = new Chart($("#studyChart"), {
    type: "bar",
    data: { labels: subjects, datasets: [{ label: "Hours", data, borderRadius: 5, maxBarThickness: 30, backgroundColor: subjects.map((_, index) => palette[index % palette.length]) }] },
    options: { ...chartOptions(colors), indexAxis: "y", scales: { x: { beginAtZero: true, border: { display: false }, grid: { color: colors.line }, ticks: { color: colors.text, font: { family: "DM Sans", size: 9 } } }, y: { border: { display: false }, grid: { display: false }, ticks: { color: colors.text, font: { family: "DM Sans", size: 9 } } } } },
  });
}

function updateCharts() {
  if (state.activeView === "dashboard") renderActivityChart();
  if (state.activeView === "analytics") renderAnalytics();
}

const field = (name, label, type, value = "", options = {}) => {
  const id = `field-${name}`;
  if (type === "select") {
    const choices = options.choices.map(([optionValue, optionLabel]) => `<option value="${escapeAttr(optionValue)}" ${value === optionValue ? "selected" : ""}>${escapeHTML(optionLabel)}</option>`).join("");
    return `<div class="form-field"><label for="${id}">${escapeHTML(label)}</label><select id="${id}" name="${name}" ${options.required ? "required" : ""}>${choices}</select></div>`;
  }
  const input = type === "textarea"
    ? `<textarea id="${id}" name="${name}" placeholder="${escapeAttr(options.placeholder || "")}" ${options.required ? "required" : ""}>${escapeHTML(value)}</textarea>`
    : `<input id="${id}" name="${name}" type="${type}" value="${escapeAttr(value)}" placeholder="${escapeAttr(options.placeholder || "")}" ${options.required ? "required" : ""} ${options.min !== undefined ? `min="${options.min}"` : ""} ${options.max !== undefined ? `max="${options.max}"` : ""} ${options.step ? `step="${options.step}"` : ""} />`;
  return `<div class="form-field"><label for="${id}">${escapeHTML(label)}</label>${input}</div>`;
};

function formFields(type, item = {}) {
  if (type === "task") return [
    field("title", "Task name", "text", item.title || "", { required: true, placeholder: "e.g. Review lecture notes" }),
    `<div class="form-row">${field("category", "Course or category", "text", item.category || "", { placeholder: "e.g. Data Structures" })}${field("dueDate", "Due date", "date", item.dueDate ?? today)}</div>`,
    field("priority", "Priority", "select", item.priority || "medium", { choices: [["low", "Low"], ["medium", "Medium"], ["high", "High"]] }),
    `<div class="form-field"><label><input name="completed" type="checkbox" ${item.completed ? "checked" : ""} /> Mark as completed</label></div>`,
  ].join("");
  if (type === "assignment") return [
    field("title", "Assignment name", "text", item.title || "", { required: true, placeholder: "e.g. Research proposal" }),
    field("course", "Course", "text", item.course || "", { required: true, placeholder: "e.g. Human-Computer Interaction" }),
    `<div class="form-row">${field("dueDate", "Due date", "date", item.dueDate || today, { required: true })}${field("status", "Status", "select", item.status || "not-started", { choices: [["not-started", "Not started"], ["in-progress", "In progress"], ["submitted", "Submitted"]] })}</div>`,
    field("description", "Details", "textarea", item.description || "", { placeholder: "Add a few helpful details…" }),
  ].join("");
  if (type === "session") return [
    field("title", "Study topic", "text", item.title || "", { required: true, placeholder: "e.g. Calculus practice" }),
    `<div class="form-row">${field("day", "Day", "select", String(item.day ?? new Date().getDay()), { choices: DAY_NAMES.map((day, index) => [String(index), day]) })}${field("color", "Color", "select", item.color || "purple", { choices: COLORS.map((color) => [color, color[0].toUpperCase() + color.slice(1)]) })}</div>`,
    `<div class="form-row">${field("start", "Start time", "time", item.start || "09:00", { required: true })}${field("end", "End time", "time", item.end || "10:00", { required: true })}</div>`,
  ].join("");
  return [
    field("title", "Note title", "text", item.title || "", { required: true, placeholder: "Give this note a title" }),
    field("content", "Your note", "textarea", item.content || "", { required: true, placeholder: "Write down an idea, reminder, or something you learned…" }),
    field("color", "Card color", "select", item.color || "purple", { choices: COLORS.map((color) => [color, color[0].toUpperCase() + color.slice(1)]) }),
  ].join("");
}

function openEditor(type, id = null) {
  const collection = type === "session" ? "sessions" : `${type}s`;
  const item = id ? state.data[collection].find((entry) => entry.id === id) : null;
  if (id && !item) return;
  state.dialogType = type;
  state.editingId = id;
  const label = ({ task: "TASK", assignment: "ASSIGNMENT", session: "STUDY PLAN", note: "NOTE" })[type];
  $("#dialogEyebrow").textContent = id ? `EDIT ${label}` : `NEW ${label}`;
  $("#dialogTitle").textContent = `${id ? "Edit" : "Add"} ${type === "session" ? "study session" : type}`;
  $("#saveItemButton").textContent = id ? "Save changes" : `Add ${type === "session" ? "session" : type}`;
  $("#dialogFields").innerHTML = formFields(type, item || {});
  $("#formError").hidden = true;
  $("#itemDialog").showModal();
  window.setTimeout(() => $("#dialogFields input:not([type=checkbox]), #dialogFields textarea")?.focus(), 0);
}

function saveEditor(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const type = state.dialogType;
  const collection = type === "session" ? "sessions" : `${type}s`;
  const current = state.editingId ? state.data[collection].find((item) => item.id === state.editingId) : null;
  const item = { ...(current || {}), ...values, id: state.editingId || makeId() };

  if (type === "task") {
    item.title = values.title.trim();
    if (!item.title) {
      showFormError("Enter a task name.");
      return;
    }
    item.completed = form.elements.completed.checked;
    item.category = values.category.trim() || "General";
    item.createdAt = current?.createdAt || new Date().toISOString();
  }
  if (type === "assignment") {
    item.title = values.title.trim();
    item.course = values.course.trim();
    item.description = values.description.trim();
    if (!item.title || !item.course) {
      showFormError("Enter an assignment name and course.");
      return;
    }
  }
  if (type === "session") {
    item.title = values.title.trim();
    if (!item.title) {
      showFormError("Enter a study topic.");
      return;
    }
    item.day = Number(values.day);
    if (values.end <= values.start) {
      showFormError("The end time must be later than the start time.");
      return;
    }
  }
  if (type === "note") {
    item.title = values.title.trim();
    item.content = values.content.trim();
    if (!item.title || !item.content) {
      showFormError("Enter a note title and some note content.");
      return;
    }
    item.updatedAt = new Date().toISOString();
  }
  commitItem(collection, item);
}

function showFormError(message) {
  $("#formError").textContent = message;
  $("#formError").hidden = false;
}

function commitItem(collection, item) {
  const entries = state.data[collection];
  const existingIndex = entries.findIndex((entry) => entry.id === item.id);
  const updatedEntries = existingIndex >= 0
    ? entries.map((entry, index) => index === existingIndex ? item : entry)
    : [...entries, item];
  const nextData = { ...state.data, [collection]: updatedEntries };
  if (!persist(nextData)) return;
  state.data = nextData;
  $("#itemDialog").close();
  renderAll();
  showToast(`${state.dialogType === "session" ? "Study session" : state.dialogType[0].toUpperCase() + state.dialogType.slice(1)} ${state.editingId ? "updated" : "added"}.`);
  state.editingId = null;
}

function deleteItem(type, id) {
  const collection = type === "session" ? "sessions" : `${type}s`;
  const item = state.data[collection].find((entry) => entry.id === id);
  if (!item) return;
  const names = { task: "task", assignment: "assignment", session: "study session", note: "note" };
  if (!window.confirm(`Delete "${item.title}" ${names[type]}? This cannot be undone.`)) return;
  const nextData = {
    ...state.data,
    [collection]: state.data[collection].filter((entry) => entry.id !== id),
  };
  if (!persist(nextData)) return;
  state.data = nextData;
  renderAll();
  showToast(`${names[type][0].toUpperCase()}${names[type].slice(1)} deleted.`);
}

function toggleTask(id) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;
  const completed = !task.completed;
  const activity = state.data.activity.map((item) => ({ ...item }));
  if (completed) {
    const todayActivity = activity.find((item) => item.date === today);
    if (todayActivity) todayActivity.count += 1;
    else activity.push({ date: today, count: 1 });
  }
  const nextData = {
    ...state.data,
    tasks: state.data.tasks.map((item) => item.id === id ? { ...item, completed } : item),
    activity,
  };
  if (!persist(nextData)) return;
  state.data = nextData;
  renderAll();
}

function renderAll() {
  renderDashboard();
  if (state.activeView !== "dashboard") renderView(state.activeView);
}

function initialize() {
  state.data = loadData();
  const savedTheme = (() => {
    try { return localStorage.getItem(THEME_KEY); } catch (error) { console.error("Could not read theme preference.", error); return null; }
  })();
  setTheme(savedTheme === "dark" ? "dark" : "light");
  $(".brand").addEventListener("click", (event) => {
    event.preventDefault();
    setView("dashboard");
  });
  $("#itemForm").addEventListener("submit", saveEditor);
  $$(".nav-link[data-view]").forEach((link) => link.addEventListener("click", () => setView(link.dataset.view)));
  $$("[data-view-link]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.viewLink)));
  $("#menuToggle").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("open");
    $("#sidebarScrim").classList.toggle("open", open);
    $("#menuToggle").setAttribute("aria-expanded", String(open));
  });
  $("#sidebarScrim").addEventListener("click", () => {
    $("#sidebar").classList.remove("open");
    $("#sidebarScrim").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  });
  $("#themeToggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#activityRange").addEventListener("change", (event) => {
    state.chartRange = event.target.value;
    renderActivityChart();
  });
  $("#taskSearch").addEventListener("input", renderTasks);
  $("#noteSearch").addEventListener("input", renderNotes);
  $("#assignmentFilter").addEventListener("change", renderAssignments);
  $$("[data-task-filter]").forEach((button) => button.addEventListener("click", () => {
    state.taskFilter = button.dataset.taskFilter;
    $$("[data-task-filter]").forEach((tab) => tab.classList.toggle("active", tab === button));
    renderTasks();
  }));
  $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => $("#itemDialog").close()));
  $("#itemDialog").addEventListener("click", (event) => {
    if (event.target === $("#itemDialog")) $("#itemDialog").close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      $("#sidebar").classList.remove("open");
      $("#sidebarScrim").classList.remove("open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action) {
      const type = ({ "add-task": "task", "add-assignment": "assignment", "add-session": "session", "add-note": "note" })[action.dataset.action];
      if (type) openEditor(type);
    }
    const edit = event.target.closest("[data-edit]");
    if (edit) openEditor(edit.dataset.edit, edit.dataset.id);
    const remove = event.target.closest("[data-delete]");
    if (remove) deleteItem(remove.dataset.delete, remove.dataset.id);
    const toggle = event.target.closest("[data-toggle-task]");
    if (toggle) toggleTask(toggle.dataset.toggleTask);
  });
  $("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  renderAll();
}

initialize();
