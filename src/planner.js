const DEFAULT_CATEGORIES = new Set(["Personal", "Work", "Errand", "Health"]);
const DEFAULT_PRIORITIES = new Set(["Low", "Medium", "High"]);

export function createTask(input) {
  const title = String(input.title ?? "").trim();
  const date = normalizeDate(input.date);
  const time = normalizeTime(input.time);
  const durationMinutes = clampDuration(input.durationMinutes);
  const category = DEFAULT_CATEGORIES.has(input.category) ? input.category : "Personal";
  const priority = DEFAULT_PRIORITIES.has(input.priority) ? input.priority : "Medium";

  return {
    id: input.id ?? `task_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title,
    date,
    time,
    durationMinutes,
    category,
    priority,
    completed: Boolean(input.completed)
  };
}

export function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const leftKey = `${left.date} ${left.time}`;
    const rightKey = `${right.date} ${right.time}`;
    return leftKey.localeCompare(rightKey) || left.title.localeCompare(right.title);
  });
}

export function groupTasksByDate(tasks) {
  return tasks.reduce((groups, task) => {
    const date = normalizeDate(task.date);
    groups[date] = groups[date] ?? [];
    groups[date].push(task);
    return groups;
  }, {});
}

export function getCompletionStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;

  return {
    total,
    completed,
    remaining: total - completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}

export function getDailyRoutine(date) {
  return [
    { date, time: "08:30", label: "Review priorities" },
    { date, time: "10:00", label: "Deep work block" },
    { date, time: "13:00", label: "Reset and lunch" },
    { date, time: "15:00", label: "Admin and errands" },
    { date, time: "17:30", label: "Wrap up" }
  ];
}

export function formatDuration(minutes) {
  const safeMinutes = clampDuration(minutes);
  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

export function buildIcsCalendar(tasks) {
  const events = sortTasks(tasks).map((task) => {
    const start = toIcsDateTime(task.date, task.time);
    const end = toIcsDateTime(task.date, addMinutes(task.time, task.durationMinutes));

    return [
      "BEGIN:VEVENT",
      `UID:${escapeIcs(task.id)}@awesome-todo-app`,
      `DTSTAMP:${toIcsDateTime(new Date().toISOString().slice(0, 10), "00:00")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcs(task.title)}`,
      `DESCRIPTION:${escapeIcs(`${task.category} priority: ${task.priority}`)}`,
      "END:VEVENT"
    ].join("\r\n");
  });

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Awesome Todo App//EN", ...events, "END:VCALENDAR"].join(
    "\r\n"
  );
}

function normalizeDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return new Date().toISOString().slice(0, 10);
}

function normalizeTime(value) {
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return "09:00";
}

function clampDuration(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) {
    return 30;
  }
  return Math.min(480, Math.max(5, Math.round(minutes / 5) * 5));
}

function addMinutes(time, minutes) {
  const [hours, mins] = normalizeTime(time).split(":").map(Number);
  const total = hours * 60 + mins + clampDuration(minutes);
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function toIcsDateTime(date, time) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function escapeIcs(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}
