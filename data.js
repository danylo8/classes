// Fall 2026 — Binghamton University course data, extracted from uploaded syllabi.
// All dates are ISO (YYYY-MM-DD). Times are 24h "HH:MM" or null for all-day/unspecified.

const COURSES = [
  {
    id: "futures",
    code: "ENG 180J",
    name: "Futures Past",
    instructor: "Prof. Glovinsky / Hannah Licht",
    meets: "Tue/Thu 9:45–11:15am",
    room: "Classroom Wing 109",
    color: "#c17d2c",
  },
  {
    id: "aaas",
    code: "AAAS 280B",
    name: "Asian American Digital Culture",
    instructor: "Prof. Muhammad Waqar Azeem",
    meets: "Wed/Fri 9:45–11:15am",
    room: "Rockefeller Center 259",
    color: "#2c8c86",
  },
  {
    id: "plsc",
    code: "PLSC 113",
    name: "Intro to Comparative Politics",
    instructor: "Prof. Robin E. Best",
    meets: "Tue/Thu 11:45am–1:15pm",
    room: "Lecture Hall 1",
    color: "#8c3b3b",
  },
  {
    id: "psyc",
    code: "PSYC 223",
    name: "Behavior Disorders",
    instructor: "Prof. Richard E. Mattson",
    meets: "Mon/Wed/Fri 2:45–3:45pm",
    room: "LH 014",
    color: "#5b4b8a",
  },
];

// type: "assignment" | "exam" | "note" (schedule quirk / break / no-class)
const EVENTS = [
  // ---------------- Futures Past (ENG 180J) ----------------
  { course: "futures", date: "2026-08-20", type: "assignment", title: "Start-of-Semester Survey due", detail: "Source Project survey, due before class." },
  { course: "futures", date: "2026-09-08", type: "note", title: "Monday classes meet (not Tuesday)", detail: "Schedule quirk — attend as a Monday." },
  { course: "futures", date: "2026-09-13", type: "assignment", title: "Paper 1 due", detail: "5 pages incl. MLA bibliography. Due by 11:59pm." },
  { course: "futures", date: "2026-10-04", type: "assignment", title: "Rewrite of Paper 1 due", detail: "Thorough rewrite based on professor feedback." },
  { course: "futures", date: "2026-10-08", type: "exam", title: "Passage Identification Midterm Exam", detail: "In class." },
  { course: "futures", date: "2026-10-13", type: "note", title: "Fall Break — no class", detail: "" },
  { course: "futures", date: "2026-10-15", type: "note", title: "Fall Break — no class", detail: "" },
  { course: "futures", date: "2026-10-22", type: "note", title: "Library Instructional Session (Matthew Harrick)", detail: "" },
  { course: "futures", date: "2026-10-27", type: "note", title: "Special Collections Visit / Campus Tour (grouped)", detail: "Group 1: Special Collections. Group 2: Self-guided tour." },
  { course: "futures", date: "2026-10-29", type: "note", title: "Special Collections Visit / Campus Tour (grouped)", detail: "Group 1: Self-guided tour. Group 2: Special Collections." },
  { course: "futures", date: "2026-10-30", type: "assignment", title: "Paper 2 due", time: "17:00", detail: "6 pages incl. MLA bibliography. Due 5:00pm." },
  { course: "futures", date: "2026-11-24", type: "note", title: "Friday classes meet", detail: "Schedule quirk." },
  { course: "futures", date: "2026-11-26", type: "note", title: "No class — Thanksgiving", detail: "" },
  { course: "futures", date: "2026-12-11", type: "assignment", title: "Exploratory Paper & Annotated Bibliography due", detail: "9 pages. MLA or Chicago bibliography." },
  { course: "futures", date: "2026-12-15", type: "exam", title: "Final Exam (date TBA — placeholder)", detail: "Prof. will announce exact date; update once known." },

  // ---------------- Asian American Digital Culture (AAAS 280B) ----------------
  { course: "aaas", date: "2026-09-11", type: "note", title: "No class — Rosh Hashanah", detail: "" },
  { course: "aaas", date: "2026-09-18", type: "exam", title: "Quiz", detail: "In class." },
  { course: "aaas", date: "2026-10-07", type: "assignment", title: "Short Midterm Paper due", detail: "4–5 pages, analyzing a component of Asian American digital culture." },
  { course: "aaas", date: "2026-10-10", type: "note", title: "Fall Break — no classes (through 10/18)", detail: "" },
  { course: "aaas", date: "2026-11-06", type: "assignment", title: "Digital Content Creation due", detail: "Turn midterm paper into a digital project (podcast, webpage, etc.)." },
  { course: "aaas", date: "2026-11-11", type: "note", title: "Student Presentations", detail: "" },
  { course: "aaas", date: "2026-11-13", type: "note", title: "Student Presentations", detail: "" },
  { course: "aaas", date: "2026-11-18", type: "note", title: "Student Presentations", detail: "" },
  { course: "aaas", date: "2026-11-20", type: "note", title: "Student Presentations", detail: "" },
  { course: "aaas", date: "2026-11-25", type: "note", title: "Thanksgiving Break — no classes (through 11/29)", detail: "" },
  { course: "aaas", date: "2026-12-04", type: "note", title: "Last class — Final Paper Draft Review", detail: "" },
  { course: "aaas", date: "2026-12-10", type: "assignment", title: "Final Paper due", detail: "8–10 pages, incl. literature review of 4 academic resources." },

  // ---------------- PLSC 113 — Intro to Comparative Politics ----------------
  { course: "plsc", date: "2026-09-08", type: "note", title: "Monday classes meet (not Tuesday)", detail: "" },
  { course: "plsc", date: "2026-09-17", type: "exam", title: "Exam I", detail: "Multiple choice + short answer, non-cumulative." },
  { course: "plsc", date: "2026-10-13", type: "note", title: "Fall Break — no class", detail: "" },
  { course: "plsc", date: "2026-10-15", type: "note", title: "Fall Break — no class", detail: "" },
  { course: "plsc", date: "2026-10-29", type: "exam", title: "Exam 2", detail: "Multiple choice + short answer, non-cumulative." },
  { course: "plsc", date: "2026-11-24", type: "note", title: "No class — Friday classes meet instead", detail: "" },
  { course: "plsc", date: "2026-11-26", type: "note", title: "No class — Thanksgiving Break", detail: "" },
  { course: "plsc", date: "2026-12-08", type: "note", title: "Review day", detail: "" },
  { course: "plsc", date: "2026-12-15", type: "exam", title: "Exam #3 (date TBA — placeholder)", detail: "Held during scheduled final-exam period; update once announced." },

  // ---------------- PSYC 223 — Behavior Disorders ----------------
  { course: "psyc", date: "2026-09-08", type: "note", title: "Class meets (Labor Day makeup)", detail: "Class #9." },
  { course: "psyc", date: "2026-09-25", type: "exam", title: "Exam 1", detail: "Class #15. 25% of final grade." },
  { course: "psyc", date: "2026-10-30", type: "exam", title: "Exam 2", detail: "Class #27. 25% of final grade." },
  { course: "psyc", date: "2026-11-20", type: "exam", title: "Exam 3", detail: "Class #36. 25% of final grade." },
  { course: "psyc", date: "2026-11-24", type: "note", title: "Class meets (Thanksgiving makeup)", detail: "Class #38." },
  { course: "psyc", date: "2026-12-13", type: "exam", title: "Final Exam — Finals Week (exact date TBA)", detail: "Held sometime Dec 10–16; update once the Registrar publishes the schedule." },
];

// Which events count toward the "planner" (actionable to-dos) by default
const PLANNER_TYPES = ["assignment", "exam"];
