// ---------------------------------------------------------------
// State
// ---------------------------------------------------------------
const state = {
  activeCourses: new Set(COURSES.map(c => c.id)), // which courses are shown
  view: "calendar",
  monthIndex: 0, // index into MONTHS below
  selectedDate: null,
};

const MONTHS = [
  { year: 2026, month: 7 },  // Aug (0-indexed)
  { year: 2026, month: 8 },  // Sep
  { year: 2026, month: 9 },  // Oct
  { year: 2026, month: 10 }, // Nov
  { year: 2026, month: 11 }, // Dec
];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ---------------------------------------------------------------
// Edit persistence — lets you change/add/remove anything from the
// Edit tab instead of hand-editing data.js. Stored in localStorage,
// layered on top of the original data.js contents.
// ---------------------------------------------------------------
const LS_EVENT_OVERRIDES_KEY = "syllabusHub.eventOverrides"; // { [baseId]: {field: value} }
const LS_EVENT_DELETED_KEY = "syllabusHub.eventDeleted";     // [baseId, ...]
const LS_EVENT_ADDED_KEY = "syllabusHub.eventAdded";         // [{id, course, date, type, title, detail}]
const LS_COURSE_OVERRIDES_KEY = "syllabusHub.courseOverrides"; // { [courseId]: {field: value} }

function getEventOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_EVENT_OVERRIDES_KEY)) || {}; }
  catch { return {}; }
}
function saveEventOverrides(o) { localStorage.setItem(LS_EVENT_OVERRIDES_KEY, JSON.stringify(o)); }

function getDeletedEventIds() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_EVENT_DELETED_KEY)) || []); }
  catch { return new Set(); }
}
function saveDeletedEventIds(set) { localStorage.setItem(LS_EVENT_DELETED_KEY, JSON.stringify([...set])); }

function getAddedEvents() {
  try { return JSON.parse(localStorage.getItem(LS_EVENT_ADDED_KEY)) || []; }
  catch { return []; }
}
function saveAddedEvents(list) { localStorage.setItem(LS_EVENT_ADDED_KEY, JSON.stringify(list)); }

function getCourseOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_COURSE_OVERRIDES_KEY)) || {}; }
  catch { return {}; }
}
function saveCourseOverrides(o) { localStorage.setItem(LS_COURSE_OVERRIDES_KEY, JSON.stringify(o)); }

function getEffectiveCourses() {
  const overrides = getCourseOverrides();
  return COURSES.map(c => ({ ...c, ...(overrides[c.id] || {}) }));
}

function courseById(id) { return getEffectiveCourses().find(c => c.id === id); }

// Merges the original data.js EVENTS with any edits/deletions/additions
// made from the Edit tab.
function getWorkingEvents() {
  const overrides = getEventOverrides();
  const deleted = getDeletedEventIds();
  const base = EVENTS
    .map((e, i) => ({ ...e, id: `b${i}` }))
    .filter(e => !deleted.has(e.id))
    .map(e => (overrides[e.id] ? { ...e, ...overrides[e.id] } : e));
  return [...base, ...getAddedEvents()];
}

function eventsForActiveCourses() {
  return getWorkingEvents().filter(e => state.activeCourses.has(e.course))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

function eventKey(e) {
  return e.id ? `id__${e.id}` : `${e.course}__${e.date}__${e.title}`;
}

function escapeAttr(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------
// Planner persistence (localStorage — this is a static site, not
// a Claude.ai artifact, so localStorage is fine here)
// ---------------------------------------------------------------
const LS_DONE_KEY = "syllabusHub.doneTasks";
const LS_CUSTOM_KEY = "syllabusHub.customTasks";

function getDoneSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_DONE_KEY)) || []); }
  catch { return new Set(); }
}
function saveDoneSet(set) {
  localStorage.setItem(LS_DONE_KEY, JSON.stringify([...set]));
}
function getCustomTasks() {
  try { return JSON.parse(localStorage.getItem(LS_CUSTOM_KEY)) || []; }
  catch { return []; }
}
function saveCustomTasks(tasks) {
  localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(tasks));
}

// ---------------------------------------------------------------
// Course filter tabs
// ---------------------------------------------------------------
function renderCourseTabs() {
  const nav = document.getElementById("course-filter");
  nav.innerHTML = "";

  const allChip = document.createElement("button");
  allChip.className = "tab-chip" + (state.activeCourses.size === COURSES.length ? " active" : "");
  allChip.textContent = "All courses";
  allChip.onclick = () => {
    state.activeCourses = new Set(COURSES.map(c => c.id));
    renderAll();
  };
  nav.appendChild(allChip);

  getEffectiveCourses().forEach(c => {
    const chip = document.createElement("button");
    const isActive = state.activeCourses.has(c.id);
    chip.className = "tab-chip" + (isActive && state.activeCourses.size < COURSES.length ? " active" : "");
    chip.style.color = isActive ? c.color : "";
    chip.innerHTML = `<span class="dot" style="background:${c.color}"></span>${c.code}`;
    chip.onclick = () => {
      // toggle: if only this one active, go back to all; else isolate to this one
      if (state.activeCourses.size === 1 && state.activeCourses.has(c.id)) {
        state.activeCourses = new Set(COURSES.map(x => x.id));
      } else {
        state.activeCourses = new Set([c.id]);
      }
      renderAll();
    };
    nav.appendChild(chip);
  });
}

// ---------------------------------------------------------------
// Countdown strip
// ---------------------------------------------------------------
function renderCountdown() {
  const el = document.getElementById("countdown-strip");
  const today = todayISO();
  const upcoming = eventsForActiveCourses()
    .filter(e => e.type !== "note" && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    el.innerHTML = `<span class="cd-empty">No upcoming deadlines for the selected course(s).</span>`;
    return;
  }
  const next = upcoming[0];
  const days = Math.round((new Date(next.date) - new Date(today)) / 86400000);
  const course = courseById(next.course);
  el.innerHTML = `
    <span class="cd-days">T–${days}</span>
    <span>day${days === 1 ? "" : "s"} until <strong style="color:${course.color}">${course.code}</strong>: ${next.title} (${formatDate(next.date)})</span>
  `;
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------
// Calendar view
// ---------------------------------------------------------------
function renderCalendar() {
  const { year, month } = MONTHS[state.monthIndex];
  document.getElementById("month-label").textContent = `${MONTH_NAMES[month]} ${year}`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";
  WEEKDAYS.forEach(w => {
    const el = document.createElement("div");
    el.className = "cal-weekday";
    el.textContent = w;
    grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const events = eventsForActiveCourses();
  const today = todayISO();

  for (let i = 0; i < startWeekday; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    grid.appendChild(el);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = events.filter(e => e.date === iso);
    const cell = document.createElement("div");
    cell.className = "cal-day" + (iso === today ? " today" : "") + (iso === state.selectedDate ? " selected" : "");
    cell.innerHTML = `<div class="day-num">${day}</div>`;
    if (dayEvents.length) {
      const dots = document.createElement("div");
      dots.className = "cal-dots";
      dayEvents.forEach(e => {
        const dot = document.createElement("span");
        dot.className = "cal-dot";
        dot.style.background = courseById(e.course).color;
        dots.appendChild(dot);
      });
      cell.appendChild(dots);

      const titles = document.createElement("div");
      titles.className = "cal-day-titles";
      dayEvents.slice(0, 3).forEach(e => {
        const t = document.createElement("div");
        t.style.color = courseById(e.course).color;
        t.textContent = e.title;
        titles.appendChild(t);
      });
      cell.appendChild(titles);
    }
    cell.onclick = () => {
      state.selectedDate = iso;
      renderCalendar();
      renderDayDetail();
    };
    grid.appendChild(cell);
  }
}

function renderDayDetail() {
  const el = document.getElementById("day-detail");
  if (!state.selectedDate) {
    el.innerHTML = `<p class="muted">Click a date to see what's due.</p>`;
    return;
  }
  const dayEvents = eventsForActiveCourses().filter(e => e.date === state.selectedDate);
  if (dayEvents.length === 0) {
    el.innerHTML = `<h3>${formatDate(state.selectedDate)}</h3><p class="muted">Nothing on the calendar this day.</p>`;
    return;
  }
  el.innerHTML = `<h3>${formatDate(state.selectedDate)}</h3>` + dayEvents.map(e => {
    const c = courseById(e.course);
    return `
      <div class="day-event">
        <div class="bar" style="background:${c.color}"></div>
        <div>
          <div class="badge${e.type === "exam" ? " exam" : ""}">${e.type}</div>
          <div class="ev-title">${e.title}</div>
          <div class="ev-course">${c.code} — ${c.name}</div>
          ${e.detail ? `<div class="muted" style="margin-top:4px">${e.detail}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// ---------------------------------------------------------------
// List view
// ---------------------------------------------------------------
function renderList() {
  const tbody = document.querySelector("#list-table tbody");
  tbody.innerHTML = "";
  eventsForActiveCourses().forEach(e => {
    const c = courseById(e.course);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(e.date)}</td>
      <td><span class="course-pill" style="color:${c.color}"><span class="dot" style="background:${c.color}"></span>${c.code}</span></td>
      <td>
        <div style="font-weight:600">${e.title}</div>
        ${e.detail ? `<div class="muted">${e.detail}</div>` : ""}
      </td>
      <td><span class="type-badge ${e.type}">${e.type}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// Planner view
// ---------------------------------------------------------------
function renderPlanner() {
  const list = document.getElementById("planner-list");
  list.innerHTML = "";
  const done = getDoneSet();
  const today = todayISO();

  const syllabusItems = eventsForActiveCourses()
    .filter(e => PLANNER_TYPES.includes(e.type))
    .map(e => ({
      key: eventKey(e),
      title: e.title,
      date: e.date,
      courseId: e.course,
      custom: false,
    }));

  const customItems = getCustomTasks()
    .filter(t => state.activeCourses.size === COURSES.length || true) // custom tasks always shown
    .map(t => ({ key: `custom__${t.id}`, title: t.title, date: t.date, courseId: null, custom: true, id: t.id }));

  const all = [...syllabusItems, ...customItems].sort((a, b) => a.date.localeCompare(b.date));

  if (all.length === 0) {
    list.innerHTML = `<p class="muted">Nothing here yet.</p>`;
    return;
  }

  all.forEach(item => {
    const isDone = done.has(item.key);
    const li = document.createElement("li");
    li.className = "planner-item" + (isDone ? " done" : "");
    const course = item.courseId ? courseById(item.courseId) : null;
    const overdue = !isDone && item.date < today;
    li.innerHTML = `
      <input type="checkbox" ${isDone ? "checked" : ""} data-key="${item.key}">
      <div>
        <div class="p-title">${course ? `<span class="p-course-dot" style="background:${course.color}"></span>` : ""}${item.title}</div>
        <div class="p-meta ${overdue ? "overdue" : ""}">${course ? course.code + " · " : "Your task · "}${formatDate(item.date)}${overdue ? " · overdue" : ""}</div>
      </div>
    `;
    li.querySelector("input").addEventListener("change", (ev) => {
      const d = getDoneSet();
      if (ev.target.checked) d.add(item.key); else d.delete(item.key);
      saveDoneSet(d);
      renderPlanner();
    });
    list.appendChild(li);
  });
}

document.getElementById("custom-task-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const titleInput = document.getElementById("custom-task-title");
  const dateInput = document.getElementById("custom-task-date");
  const tasks = getCustomTasks();
  tasks.push({ id: Date.now().toString(36), title: titleInput.value.trim(), date: dateInput.value });
  saveCustomTasks(tasks);
  titleInput.value = "";
  dateInput.value = "";
  renderPlanner();
});

// ---------------------------------------------------------------
// View switching
// ---------------------------------------------------------------
document.querySelectorAll(".view-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    state.view = btn.dataset.view;
    document.querySelectorAll(".view-tab").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".view").forEach(v => v.hidden = true);
    document.getElementById(`view-${state.view}`).hidden = false;
    renderActiveView();
  });
});

function renderActiveView() {
  if (state.view === "calendar") { renderCalendar(); renderDayDetail(); }
  else if (state.view === "list") renderList();
  else if (state.view === "planner") renderPlanner();
  else if (state.view === "edit") renderEditView();
}

document.getElementById("month-prev").addEventListener("click", () => {
  state.monthIndex = Math.max(0, state.monthIndex - 1);
  renderCalendar();
});
document.getElementById("month-next").addEventListener("click", () => {
  state.monthIndex = Math.min(MONTHS.length - 1, state.monthIndex + 1);
  renderCalendar();
});

// ---------------------------------------------------------------
// ICS export
// ---------------------------------------------------------------
function pad(n) { return String(n).padStart(2, "0"); }

function icsDateAllDay(iso) {
  return iso.replace(/-/g, "");
}
function icsDateNextDay(iso) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
function icsDateTime(iso, time) {
  const [h, m] = time.split(":");
  return `${iso.replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
}
function escapeICS(str) {
  return String(str).replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

function buildICS(events) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Syllabus Hub//Fall 2026//EN",
    "CALSCALE:GREGORIAN",
  ];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  events.forEach(e => {
    const course = courseById(e.course);
    const uid = `${eventKey(e).replace(/[^a-zA-Z0-9]/g, "-")}@syllabus-hub`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    if (e.time) {
      lines.push(`DTSTART:${icsDateTime(e.date, e.time)}`);
      lines.push(`DTEND:${icsDateTime(e.date, e.time)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDateAllDay(e.date)}`);
      lines.push(`DTEND;VALUE=DATE:${icsDateNextDay(e.date)}`);
    }
    lines.push(`SUMMARY:${escapeICS(`[${course.code}] ${e.title}`)}`);
    const desc = [e.detail, `Course: ${course.name} (${course.code})`].filter(Boolean).join("\\n");
    lines.push(`DESCRIPTION:${escapeICS(desc)}`);
    lines.push(`CATEGORIES:${escapeICS(course.code)}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

document.getElementById("btn-export").addEventListener("click", () => {
  const ics = buildICS(getWorkingEvents()); // includes any edits/additions made in the Edit tab
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "syllabus.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ---------------------------------------------------------------
// Edit view — change/add/remove courses and events, no code editing
// ---------------------------------------------------------------
function renderEditView() {
  renderEditCourses();
  renderEditEvents();
  populateNewEventCourseSelect();
}

function renderEditCourses() {
  const wrap = document.getElementById("edit-courses");
  wrap.innerHTML = "";
  const overrides = getCourseOverrides();

  getEffectiveCourses().forEach(c => {
    const isOverridden = !!overrides[c.id];
    const card = document.createElement("div");
    card.className = "edit-course-card";
    card.innerHTML = `
      <div class="edit-course-head">
        <span class="dot" style="background:${c.color}"></span>
        <strong>${c.code}</strong>
        ${isOverridden ? `<button type="button" class="link-btn" data-revert-course="${c.id}">reset</button>` : ""}
      </div>
      <div class="edit-course-fields">
        <label>Name<input type="text" data-course="${c.id}" data-field="name" value="${escapeAttr(c.name)}"></label>
        <label>Instructor<input type="text" data-course="${c.id}" data-field="instructor" value="${escapeAttr(c.instructor)}"></label>
        <label>Meets<input type="text" data-course="${c.id}" data-field="meets" value="${escapeAttr(c.meets)}"></label>
        <label>Room<input type="text" data-course="${c.id}" data-field="room" value="${escapeAttr(c.room)}"></label>
        <label class="color-field">Color<input type="color" data-course="${c.id}" data-field="color" value="${c.color}"></label>
      </div>
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll("input[data-course]").forEach(inp => {
    inp.addEventListener("change", () => {
      const o = getCourseOverrides();
      o[inp.dataset.course] = { ...(o[inp.dataset.course] || {}), [inp.dataset.field]: inp.value };
      saveCourseOverrides(o);
      renderAll();
    });
  });
  wrap.querySelectorAll("[data-revert-course]").forEach(btn => {
    btn.addEventListener("click", () => {
      const o = getCourseOverrides();
      delete o[btn.dataset.revertCourse];
      saveCourseOverrides(o);
      renderAll();
    });
  });
}

function renderEditEvents() {
  const wrap = document.getElementById("edit-events");
  wrap.innerHTML = "";
  const overrides = getEventOverrides();
  const events = getWorkingEvents().slice().sort((a, b) => a.date.localeCompare(b.date));
  const courses = getEffectiveCourses();

  if (events.length === 0) {
    wrap.innerHTML = `<p class="muted">No events yet — add one below.</p>`;
    return;
  }

  events.forEach(e => {
    const course = courseById(e.course);
    const isBase = e.id && e.id.startsWith("b");
    const isEdited = isBase && overrides[e.id];
    const row = document.createElement("div");
    row.className = "edit-event-row";
    row.innerHTML = `
      <span class="dot" style="background:${course ? course.color : "#999"}"></span>
      <select data-id="${e.id}" data-field="course">
        ${courses.map(c => `<option value="${c.id}" ${c.id === e.course ? "selected" : ""}>${c.code}</option>`).join("")}
      </select>
      <input type="date" data-id="${e.id}" data-field="date" value="${e.date}">
      <select data-id="${e.id}" data-field="type">
        <option value="assignment" ${e.type === "assignment" ? "selected" : ""}>Assignment</option>
        <option value="exam" ${e.type === "exam" ? "selected" : ""}>Exam</option>
        <option value="reading" ${e.type === "reading" ? "selected" : ""}>Reading</option>
        <option value="note" ${e.type === "note" ? "selected" : ""}>Note</option>
      </select>
      <input type="text" data-id="${e.id}" data-field="title" value="${escapeAttr(e.title)}" placeholder="Title">
      <input type="text" data-id="${e.id}" data-field="detail" value="${escapeAttr(e.detail || "")}" placeholder="Detail">
      <span class="edit-event-actions">
        ${isEdited ? `<button type="button" class="link-btn" data-revert-event="${e.id}">reset</button>` : ""}
        <button type="button" class="link-btn danger" data-delete-event="${e.id}">delete</button>
      </span>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("[data-id]").forEach(inp => {
    inp.addEventListener("change", () => updateEvent(inp.dataset.id, inp.dataset.field, inp.value));
  });
  wrap.querySelectorAll("[data-revert-event]").forEach(btn => {
    btn.addEventListener("click", () => {
      const o = getEventOverrides();
      delete o[btn.dataset.revertEvent];
      saveEventOverrides(o);
      renderAll();
    });
  });
  wrap.querySelectorAll("[data-delete-event]").forEach(btn => {
    btn.addEventListener("click", () => deleteEvent(btn.dataset.deleteEvent));
  });
}

function updateEvent(id, field, value) {
  if (id.startsWith("b")) {
    const o = getEventOverrides();
    o[id] = { ...(o[id] || {}), [field]: value };
    saveEventOverrides(o);
  } else {
    const added = getAddedEvents();
    const idx = added.findIndex(a => a.id === id);
    if (idx > -1) {
      added[idx] = { ...added[idx], [field]: value };
      saveAddedEvents(added);
    }
  }
  renderAll();
}

function deleteEvent(id) {
  if (id.startsWith("b")) {
    const d = getDeletedEventIds();
    d.add(id);
    saveDeletedEventIds(d);
  } else {
    saveAddedEvents(getAddedEvents().filter(a => a.id !== id));
  }
  renderAll();
}

function populateNewEventCourseSelect() {
  const sel = document.getElementById("new-event-course");
  sel.innerHTML = getEffectiveCourses().map(c => `<option value="${c.id}">${c.code}</option>`).join("");
}

document.getElementById("add-event-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const course = document.getElementById("new-event-course").value;
  const date = document.getElementById("new-event-date").value;
  const type = document.getElementById("new-event-type").value;
  const title = document.getElementById("new-event-title").value.trim();
  const detail = document.getElementById("new-event-detail").value.trim();
  if (!title || !date) return;

  const added = getAddedEvents();
  added.push({ id: `c${Date.now().toString(36)}`, course, date, type, title, detail });
  saveAddedEvents(added);
  ev.target.reset();
  renderAll();
});

document.getElementById("btn-reset-edits").addEventListener("click", () => {
  if (!confirm("Reset all your edits, added events, and course changes back to the original syllabus data? This can't be undone.")) return;
  localStorage.removeItem(LS_EVENT_OVERRIDES_KEY);
  localStorage.removeItem(LS_EVENT_DELETED_KEY);
  localStorage.removeItem(LS_EVENT_ADDED_KEY);
  localStorage.removeItem(LS_COURSE_OVERRIDES_KEY);
  renderAll();
});

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
function renderAll() {
  renderCourseTabs();
  renderCountdown();
  renderActiveView();
}
renderAll();
