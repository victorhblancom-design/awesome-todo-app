import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIcsCalendar,
  createTask,
  formatDuration,
  getCompletionStats,
  groupTasksByDate,
  sortTasks
} from "../src/planner.js";

describe("planner helpers", () => {
  it("normalizes tasks and clamps duration", () => {
    const task = createTask({
      id: "task_1",
      title: "  Focus block  ",
      date: "2026-05-30",
      time: "07:45",
      durationMinutes: 482,
      category: "Work",
      priority: "High"
    });

    assert.equal(task.title, "Focus block");
    assert.equal(task.durationMinutes, 480);
    assert.equal(task.category, "Work");
    assert.equal(task.priority, "High");
  });

  it("sorts and groups tasks by scheduled date", () => {
    const tasks = [
      createTask({ id: "task_2", title: "B", date: "2026-05-31", time: "11:00" }),
      createTask({ id: "task_1", title: "A", date: "2026-05-30", time: "09:00" })
    ];

    assert.deepEqual(
      sortTasks(tasks).map((task) => task.id),
      ["task_1", "task_2"]
    );
    assert.equal(groupTasksByDate(tasks)["2026-05-30"].length, 1);
  });

  it("calculates completion stats", () => {
    const stats = getCompletionStats([
      createTask({ id: "task_1", title: "A", completed: true }),
      createTask({ id: "task_2", title: "B", completed: false })
    ]);

    assert.equal(stats.total, 2);
    assert.equal(stats.completed, 1);
    assert.equal(stats.percent, 50);
  });

  it("exports valid calendar text for scheduled tasks", () => {
    const ics = buildIcsCalendar([
      createTask({
        id: "task_1",
        title: "Plan, test; ship",
        date: "2026-05-30",
        time: "09:00",
        durationMinutes: 45
      })
    ]);

    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /SUMMARY:Plan\\, test\\; ship/);
    assert.match(ics, /DTSTART:20260530T090000/);
    assert.match(ics, /DTEND:20260530T094500/);
  });

  it("formats short and long durations", () => {
    assert.equal(formatDuration(45), "45 min");
    assert.equal(formatDuration(90), "1 hr 30 min");
  });
});
