import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  buildIcsCalendar,
  createTask,
  formatDuration,
  getCompletionStats,
  getDailyRoutine,
  groupTasksByDate,
  sortTasks
} from "./planner.js";
import "./styles.css";

const STORAGE_KEY = "awesome-todo-app.tasks";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCalendarFile(tasks) {
  const blob = new Blob([buildIcsCalendar(tasks)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "awesome-todo-plan.ics";
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState({
    title: "",
    date: today(),
    time: "09:00",
    durationMinutes: 30,
    category: "Personal",
    priority: "Medium"
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const selectedTasks = sortTasks(tasksByDate[selectedDate] ?? []);
  const stats = getCompletionStats(selectedTasks);
  const routine = getDailyRoutine(selectedDate);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function addTask(event) {
    event.preventDefault();
    const nextTask = createTask({
      ...form,
      durationMinutes: Number(form.durationMinutes)
    });

    if (!nextTask.title) {
      return;
    }

    setTasks((current) => sortTasks([...current, nextTask]));
    setSelectedDate(nextTask.date);
    setForm((current) => ({ ...current, title: "" }));
  }

  function toggleTask(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Daily planner</p>
          <h1>Awesome Todo App</h1>
          <p className="summary">
            Plan a day, track the work, and export the routine to your calendar.
          </p>
        </div>
        <div className="status-panel" aria-label="Selected day progress">
          <span>
            {selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"}
          </span>
          <strong>{stats.percent}% done</strong>
        </div>
      </section>

      <section className="workspace" aria-label="Todo planner">
        <form className="task-form" onSubmit={addTask}>
          <label>
            Task
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="Draft project brief"
              maxLength="90"
              required
            />
          </label>

          <div className="form-grid">
            <label>
              Date
              <input name="date" type="date" value={form.date} onChange={updateField} />
            </label>
            <label>
              Time
              <input name="time" type="time" value={form.time} onChange={updateField} />
            </label>
            <label>
              Minutes
              <input
                name="durationMinutes"
                type="number"
                min="5"
                max="480"
                step="5"
                value={form.durationMinutes}
                onChange={updateField}
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Category
              <select name="category" value={form.category} onChange={updateField}>
                <option>Personal</option>
                <option>Work</option>
                <option>Errand</option>
                <option>Health</option>
              </select>
            </label>
            <label>
              Priority
              <select name="priority" value={form.priority} onChange={updateField}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
          </div>

          <button className="primary-button" type="submit">
            Add task
          </button>
        </form>

        <section className="day-panel" aria-label="Selected date tasks">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Selected day</p>
              <h2>{selectedDate}</h2>
            </div>
            <div className="actions">
              <input
                aria-label="Select day"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
              <button type="button" onClick={() => saveCalendarFile(tasks)}>
                Export .ics
              </button>
            </div>
          </div>

          <div className="progress-track" aria-label={`${stats.percent}% complete`}>
            <span style={{ width: `${stats.percent}%` }} />
          </div>

          <div className="task-list">
            {selectedTasks.length === 0 ? (
              <p className="empty-state">No tasks scheduled for this date.</p>
            ) : (
              selectedTasks.map((task) => (
                <article className="task-item" key={task.id}>
                  <button
                    className={task.completed ? "check done" : "check"}
                    type="button"
                    aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                    onClick={() => toggleTask(task.id)}
                  />
                  <div>
                    <h3>{task.title}</h3>
                    <p>
                      {task.time} · {formatDuration(task.durationMinutes)} · {task.category} ·{" "}
                      {task.priority}
                    </p>
                  </div>
                  <button type="button" className="delete-button" onClick={() => deleteTask(task.id)}>
                    Delete
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="routine-panel" aria-label="Daily routine blocks">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Routine guide</p>
            <h2>Suggested blocks</h2>
          </div>
        </div>
        <div className="routine-grid">
          {routine.map((block) => (
            <article key={`${block.time}-${block.label}`} className="routine-block">
              <strong>{block.time}</strong>
              <span>{block.label}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
