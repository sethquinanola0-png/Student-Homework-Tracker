/* ========================================================
   STUDENT HOMEWORK TRACK - LOGIC & LOCALSTORAGE ENGINE
   ======================================================== */

// 1. Initial State seeded with your original screenshot items
const DEFAULT_ASSIGNMENTS = [
  {
    id: "asg-1",
    subject: "Empowerment Technology",
    title: "Web Proposal",
    dueDate: "2026-11-04",
    status: "In Progress",
    priority: "High",
    notes: "Draft project proposal with target audience & ICT tools."
  },
  {
    id: "asg-2",
    subject: "English",
    title: "Essay Writing",
    dueDate: "2026-11-06",
    status: "Pending",
    priority: "Medium",
    notes: "Argumentative essay on AI in high school education."
  },
  {
    id: "asg-3",
    subject: "ICT",
    title: "HTML Activity",
    dueDate: "2026-11-02",
    status: "Completed",
    priority: "Low",
    notes: "Semantic HTML5 layout with responsive form controls."
  }
];

let assignments = JSON.parse(localStorage.getItem("homework_tracker_data")) || DEFAULT_ASSIGNMENTS;
let activeStatusFilter = "All";
let searchQuery = "";
let selectedSubject = "All";

// Save to LocalStorage
function saveAssignments() {
  localStorage.setItem("homework_tracker_data", JSON.stringify(assignments));
  renderAll();
}

// 2. Synthesized Web Audio Beep (No MP3 files needed)
function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio context fallback
  }
}

// 3. Render Table
function renderTable() {
  const tbody = document.getElementById("assignmentsTableBody");
  tbody.innerHTML = "";

  const filtered = assignments.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "All" || task.subject === selectedSubject;
    let matchesStatus = true;
    if (activeStatusFilter !== "All") {
      matchesStatus = task.status === activeStatusFilter;
    }
    return matchesSearch && matchesSubject && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No assignments found matching criteria.</td></tr>`;
    return;
  }

  filtered.forEach(task => {
    const isDone = task.status === "Completed";
    const statusClass = task.status === "Completed" ? "badge-completed" : (task.status === "In Progress" ? "badge-inprogress" : "badge-pending");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align: center;">
        <button class="check-btn ${isDone ? 'checked' : ''}" onclick="toggleTaskStatus('${task.id}')">
          ${isDone ? '✓' : ''}
        </button>
      </td>
      <td><span class="badge badge-subject">${task.subject}</span></td>
      <td>
        <strong style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</strong>
        ${task.notes ? `<div style="font-size: 11px; color: var(--text-muted);">${task.notes}</div>` : ''}
      </td>
      <td style="font-family: var(--font-mono);">${task.dueDate}</td>
      <td>
        <select onchange="updateStatusDirectly('${task.id}', this.value)" class="select-dropdown" style="padding: 3px 6px;">
          <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="editTask('${task.id}')">Edit</button>
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; color: var(--danger);" onclick="deleteTask('${task.id}')">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Render Stats & Progress
function renderStats() {
  const total = assignments.length;
  const completed = assignments.filter(t => t.status === "Completed").length;
  const inProgress = assignments.filter(t => t.status === "In Progress").length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statCompleted").textContent = completed;
  document.getElementById("statProgress").textContent = inProgress;
  document.getElementById("statUpcoming").textContent = assignments.filter(t => t.status !== "Completed").length;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById("progressPct").textContent = pct + "%";
  document.getElementById("progressRatio").textContent = `${completed} of ${total} completed`;
  document.getElementById("progressBar").style.width = pct + "%";
}

// 5. Render Deadlines Card
function renderDeadlines() {
  const list = document.getElementById("deadlinesList");
  list.innerHTML = "";

  const upcoming = assignments
    .filter(t => t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  if (upcoming.length === 0) {
    list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">All caught up! No urgent assignments.</div>`;
    return;
  }

  upcoming.forEach(task => {
    const item = document.createElement("div");
    item.className = "deadline-item";
    item.innerHTML = `
      <div>
        <div class="deadline-date">${task.dueDate}</div>
        <div class="deadline-title">${task.title}</div>
        <div class="deadline-subject">${task.subject}</div>
      </div>
      <button class="btn btn-secondary" style="font-size: 11px;" onclick="toggleTaskStatus('${task.id}')">Done</button>
    `;
    list.appendChild(item);
  });
}

// 6. Actions: Toggle, Update, Edit, Delete
function toggleTaskStatus(id) {
  const task = assignments.find(t => t.id === id);
  if (!task) return;
  const wasCompleted = task.status === "Completed";
  task.status = wasCompleted ? "Pending" : "Completed";
  if (!wasCompleted) playSuccessBeep();
  saveAssignments();
}

function updateStatusDirectly(id, newStatus) {
  const task = assignments.find(t => t.id === id);
  if (task) {
    task.status = newStatus;
    if (newStatus === "Completed") playSuccessBeep();
    saveAssignments();
  }
}

function deleteTask(id) {
  if (confirm("Delete this assignment?")) {
    assignments = assignments.filter(t => t.id !== id);
    saveAssignments();
  }
}

function editTask(id) {
  const task = assignments.find(t => t.id === id);
  if (!task) return;
  document.getElementById("editAssignmentId").value = task.id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskSubject").value = task.subject;
  document.getElementById("taskDueDate").value = task.dueDate;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskNotes").value = task.notes || "";
  document.getElementById("modalTitle").textContent = "Edit Assignment";
  document.getElementById("assignmentModal").classList.add("open");
}

// 7. Modal Handlers
const modal = document.getElementById("assignmentModal");
document.getElementById("openAddModalBtn").onclick = () => openAddModal();
document.getElementById("heroAddBtn").onclick = () => openAddModal();

function openAddModal() {
  document.getElementById("assignmentForm").reset();
  document.getElementById("editAssignmentId").value = "";
  document.getElementById("modalTitle").textContent = "Add New Assignment";
  
  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("taskDueDate").value = tomorrow.toISOString().split("T")[0];

  modal.classList.add("open");
}

document.getElementById("closeModalBtn").onclick = () => modal.classList.remove("open");
document.getElementById("cancelModalBtn").onclick = () => modal.classList.remove("open");

document.getElementById("assignmentForm").onsubmit = (e) => {
  e.preventDefault();
  const id = document.getElementById("editAssignmentId").value;
  const title = document.getElementById("taskTitle").value;
  const subject = document.getElementById("taskSubject").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const status = document.getElementById("taskStatus").value;
  const priority = document.getElementById("taskPriority").value;
  const notes = document.getElementById("taskNotes").value;

  if (id) {
    const task = assignments.find(t => t.id === id);
    if (task) Object.assign(task, { title, subject, dueDate, status, priority, notes });
  } else {
    assignments.unshift({
      id: "asg-" + Date.now(),
      title,
      subject,
      dueDate,
      status,
      priority,
      notes
    });
  }

  saveAssignments();
  modal.classList.remove("open");
};

// 8. Filters & Search Handlers
document.getElementById("searchInput").oninput = (e) => {
  searchQuery = e.target.value;
  renderTable();
};

document.getElementById("subjectFilter").onchange = (e) => {
  selectedSubject = e.target.value;
  renderTable();
};

document.querySelectorAll(".status-tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".status-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeStatusFilter = tab.getAttribute("data-status");
    renderTable();
  };
});

// 9. Tab Switching (Dashboard, Accomplished, Calendar)
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.getAttribute("data-tab");

    document.querySelectorAll(".view-section").forEach(s => s.classList.remove("active"));
    if (tab === "dashboard") document.getElementById("viewDashboard").classList.add("active");
    if (tab === "accomplished") {
      document.getElementById("viewAccomplished").classList.add("active");
      renderAccomplished();
    }
    if (tab === "calendar") {
      document.getElementById("viewCalendar").classList.add("active");
      renderCalendar();
    }
  };
});

function renderAccomplished() {
  const container = document.getElementById("accomplishedList");
  const completed = assignments.filter(t => t.status === "Completed");
  if (completed.length === 0) {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No completed tasks yet. Mark tasks as done to see them here!</div>`;
    return;
  }
  container.innerHTML = completed.map(t => `
    <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span class="badge badge-subject">${t.subject}</span>
        <strong style="margin-left: 8px;">${t.title}</strong>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Completed · Due was ${t.dueDate}</div>
      </div>
      <button class="btn btn-secondary" onclick="toggleTaskStatus('${t.id}')">Move to Active</button>
    </div>
  `).join("");
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
  // 30 days of month representation
  for (let d = 1; d <= 30; d++) {
    const dayStr = `2026-11-${String(d).padStart(2, '0')}`;
    const tasksOnDay = assignments.filter(t => t.dueDate === dayStr);
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.innerHTML = `
      <strong>${d}</strong>
      ${tasksOnDay.map(t => `<div class="calendar-task-dot">${t.title}</div>`).join("")}
    `;
    grid.appendChild(dayCell);
  }
}

// 10. Dark Mode Toggle
const themeBtn = document.getElementById("themeToggleBtn");
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("homework_theme", isDark ? "dark" : "light");
};
if (localStorage.getItem("homework_theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}

// 11. Pomodoro Timer
let timerSeconds = 25 * 60;
let timerInterval = null;
const timerModal = document.getElementById("timerModal");
const timerDisplay = document.getElementById("timerDisplay");

document.getElementById("openTimerBtn").onclick = () => timerModal.classList.add("open");
document.getElementById("closeTimerBtn").onclick = () => timerModal.classList.remove("open");

document.getElementById("startTimerBtn").onclick = function() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    this.textContent = "Start";
  } else {
    this.textContent = "Pause";
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
        const s = String(timerSeconds % 60).padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
      } else {
        clearInterval(timerInterval);
        playSuccessBeep();
        alert("Study sprint complete! Take a break.");
      }
    }, 1000);
  }
};

document.getElementById("resetTimerBtn").onclick = () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 25 * 60;
  timerDisplay.textContent = "25:00";
  document.getElementById("startTimerBtn").textContent = "Start";
};

// Initial Render
function renderAll() {
  renderTable();
  renderStats();
  renderDeadlines();
}
renderAll();
// Step 1: Ask the user for permission to send notifications
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      sendNotification("🔔 Notifications Enabled!", "You will now receive homework reminders.");
    }
  });
}

// Step 2: Trigger a notification with sound and phone vibration
function sendNotification(title, message) {
  // 1. Play audio chime (Web Audio API)
  playChime();

  // 2. Vibrate mobile phone (if on Cellphone)
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]); // buzz-pause-buzz
  }

  // 3. Send OS/Browser System Notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "mikasa-ackerman.png", // Path to your app's icon
    });
  }
}

// Step 3: Audio synthesizer (Zero MP3 files needed)
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 pitch
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 pitch
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio fallback
  }
}
function checkUpcomingDeadlines() {
  const today = new Date().toISOString().split("T")[0];

  assignments.forEach((task) => {
    if (task.dueDate === today && task.status !== "Completed") {
      sendNotification(
        "🚨 Due Today!",
        `"${task.title}" for ${task.subject} is due today!`
      );
    }
  });
}

// Check every hour
setInterval(checkUpcomingDeadlines, 60 * 60 * 1000);
function onTimerComplete() {
  sendNotification(
    "⏱️ Study Sprint Complete!",
    "Great work! Take a 5-minute break and stretch."
  );
}
sendNotification(
  "📌 Assignment Added",
  `Added "${title}" for ${subject} due on ${dueDate}.`
);
// Automatically detect if user is on PC, CP, or Tablet
function detectDevice() {
  const badge = document.getElementById("deviceBadge");
  const width = window.innerWidth;

  if (width <= 640) {
    badge.textContent = "📲 Viewing on Cellphone (CP) — " + width + "px";
  } else if (width <= 1024) {
    badge.textContent = "📱 Viewing on Tablet (Tab) — " + width + "px";
  } else {
    badge.textContent = "💻 Viewing on PC / Laptop — " + width + "px";
  }
}

window.addEventListener("resize", detectDevice);
document.addEventListener("DOMContentLoaded", detectDevice);