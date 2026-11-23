# Student Productivity Hub

A responsive, browser-based workspace for organizing student tasks, assignments, study sessions, notes, and learning progress. Built with HTML, CSS, vanilla JavaScript, Chart.js, and LocalStorage—no application server or account required.

## Features

- **Dashboard:** Daily task overview, completion stats, study hours, current streak, upcoming deadlines, schedule, and activity chart.
- **Task manager:** Add, edit, complete, filter, search, and delete tasks with due dates, categories, and priorities.
- **Assignment tracker:** Track courses, deadlines, details, and not-started, in-progress, or submitted status.
- **Study planner:** Plan and manage study sessions across a Monday-to-Sunday weekly view.
- **Notes:** Create, edit, search, and delete notes with color labels.
- **Progress analytics:** Visualize task completion and study time by subject.
- **Light and dark themes:** Theme choice is remembered in the browser.
- **Local-first data:** Your edits are saved in LocalStorage; sample data appears on first visit.
- **Responsive layout:** Sidebar navigation adapts to mobile screens, and forms work with keyboard and touch input.

## Run locally

This is a static application; no backend or build step is needed.

1. Open `index.html` in a modern browser, or serve this folder with any static file server.
2. The dashboard starts with sample student data. Add or edit items to make it your own.

For example, from the workspace root:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/student-productivity-hub/`. If you start the server from this folder instead, visit `http://localhost:8000/`. Alternatively, open this folder directly in VS Code and use a static preview extension.

## Charts and connectivity

Chart.js and the optional DM Sans / Manrope fonts are loaded from public CDNs. An internet connection is needed to load these resources; the rest of the application and its saved data work locally. If Chart.js is unavailable, the dashboard displays a helpful chart fallback instead of breaking.

## Data and privacy

Tasks, assignments, study sessions, notes, sample activity, and theme preference remain in this browser's LocalStorage. They are not sent to a server. Clearing the browser's site data will remove saved changes and restore the sample workspace on the next visit. This browser-only storage does not synchronize between devices.

## Project files

```text
student-productivity-hub/
├── index.html
├── style.css
├── script.js
└── README.md
```
## Developer

**Name:** Brindha J

**GitHub:** [@brindhajosphinj-droid](https://github.com/brindhajosphinj-droid)

**Project:** Student Productivity Hub

This project was developed as a practical demonstration of frontend development, UI/UX design, and JavaScript programming skills.

I used GitHub Copilot as a coding assistant during development and testing.
