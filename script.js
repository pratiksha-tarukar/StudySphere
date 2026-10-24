

const $ = (id) => document.getElementById(id);

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ---------- DATE ----------
function updateDate() {
    $("today-date").textContent = new Date().toLocaleDateString(
        "en-IN",
        { weekday: "short", day: "numeric", month: "short", year: "numeric" }
    );
}
updateDate();

// ---------- SAMPLE DATA ----------
let lectures = loadData("ss-lectures", [
    { id: 1, subject: "Data Structures", time: "09:00", room: "Room 201" },
    { id: 2, subject: "Java Programming", time: "11:00", room: "Lab 1" },
    { id: 3, subject: "Artificial Intelligence", time: "14:00", room: "Room 204" }
]);

let tasks = loadData("ss-tasks", [
    { id: 1, name: "Revise Java basics", period: "Daily", done: false },
    { id: 2, name: "Practice Data Structures", period: "Daily", done: false },
    { id: 3, name: "Review class notes", period: "Daily", done: false }
]);

let savedSteps = loadData("ss-steps", 0);
let focusMinutes = loadData("ss-focus-minutes", 0);

// ---------- PAGE NAVIGATION ----------
const pageNames = {
    dashboard: "Dashboard",
    timetable: "My Timetable",
    health: "Health & Diet",
    calculator: "Calculator Hub",
    tasks: "My Goals & To-Do List",
    focus: "Focus Mode"
};

function openPage(pageId) {
    if (!pageNames[pageId]) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle("active-page", page.id === pageId);
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle("active", button.dataset.page === pageId);
    });

    $("page-heading").textContent = pageNames[pageId];
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.go));
});

// ---------- TIMETABLE ----------
function renderLectures() {
    const sorted = [...lectures].sort((a, b) => a.time.localeCompare(b.time));

    const html = sorted.length
        ? sorted.map(lecture => `
            <div class="schedule-item">
                <span class="schedule-time">${escapeHTML(formatTime(lecture.time))}</span>
                <span class="schedule-dot"></span>
                <div style="flex:1">
                    <strong>${escapeHTML(lecture.subject)}</strong>
                    <small>${escapeHTML(lecture.room || "Room not specified")}</small>
                </div>
                <button class="delete-btn" data-delete-lecture="${lecture.id}"
                    aria-label="Delete ${escapeHTML(lecture.subject)}">✕</button>
            </div>
        `).join("")
        : "<p class='muted'>No lectures added yet. Add your first lecture above.</p>";

    $("timetable-list").innerHTML = html;
    $("dashboard-schedule").innerHTML = sorted.slice(0, 3).map(lecture => `
        <div class="schedule-item">
            <span class="schedule-time">${escapeHTML(formatTime(lecture.time))}</span>
            <span class="schedule-dot"></span>
            <div>
                <strong>${escapeHTML(lecture.subject)}</strong>
                <small>${escapeHTML(lecture.room || "Room not specified")}</small>
            </div>
        </div>
    `).join("") || "<p class='muted'>No lectures scheduled.</p>";

    $("lecture-count").textContent = lectures.length;
    saveData("ss-lectures", lectures);
}

$("lecture-form").addEventListener("submit", event => {
    event.preventDefault();

    lectures.push({
        id: Date.now(),
        subject: $("lecture-subject").value.trim(),
        time: $("lecture-time").value,
        room: $("lecture-room").value.trim()
    });

    saveData("ss-lectures", lectures);
    renderLectures();
    event.target.reset();
});

$("timetable-list").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-lecture]");
    if (!button) return;

    const id = Number(button.dataset.deleteLecture);
    lectures = lectures.filter(lecture => lecture.id !== id);
    renderLectures();
});

function formatTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-IN", {
        hour: "numeric", minute: "2-digit"
    });
}

// ---------- TO-DO LIST ----------
function renderTasks() {
    const completed = tasks.filter(task => task.done).length;
    const total = tasks.length;
    const percent = total ? Math.round(completed / total * 100) : 0;

    $("task-progress").style.width = percent + "%";
    $("task-progress-text").textContent =
        `${percent}% completed (${completed} of ${total} tasks)`;
    $("completed-count").textContent = `${completed} / ${total}`;

    const html = tasks.length
        ? tasks.map(task => `
            <div class="task-item">
                <input type="checkbox" data-toggle-task="${task.id}"
                    ${task.done ? "checked" : ""}
                    aria-label="Mark ${escapeHTML(task.name)} complete">
                <div class="task-copy ${task.done ? "done" : ""}">
                    <strong>${escapeHTML(task.name)}</strong>
                    <small>${escapeHTML(task.period)} goal</small>
                </div>
                <button class="delete-btn" data-delete-task="${task.id}"
                    aria-label="Delete task">✕</button>
            </div>
        `).join("")
        : "<p class='muted'>No tasks yet. Add a goal to get started!</p>";

    $("task-list").innerHTML = html;

    $("dashboard-tasks").innerHTML = tasks.length
        ? tasks.slice(0, 4).map(task => `
            <div class="task-item">
                <input type="checkbox" data-toggle-task="${task.id}"
                    ${task.done ? "checked" : ""}
                    aria-label="Mark ${escapeHTML(task.name)} complete">
                <div class="task-copy ${task.done ? "done" : ""}">
                    <strong>${escapeHTML(task.name)}</strong>
                    <small>${escapeHTML(task.period)} goal</small>
                </div>
            </div>
        `).join("")
        : "<p class='muted'>Your tasks will appear here.</p>";

    saveData("ss-tasks", tasks);
}

$("task-form").addEventListener("submit", event => {
    event.preventDefault();

    tasks.push({
        id: Date.now(),
        name: $("task-name").value.trim(),
        period: $("task-period").value,
        done: false
    });

    renderTasks();
    event.target.reset();
});

document.addEventListener("change", event => {
    if (event.target.matches("[data-toggle-task]")) {
        const id = Number(event.target.dataset.toggleTask);
        const task = tasks.find(item => item.id === id);

        if (task) task.done = event.target.checked;
        renderTasks();
    }
});

document.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-task]");
    if (!button) return;

    const id = Number(button.dataset.deleteTask);
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
});

// ---------- HEALTH TRACKER ----------
$("steps-input").value = savedSteps;
$("steps-result").textContent = `${savedSteps.toLocaleString()} steps recorded`;

$("save-steps").addEventListener("click", () => {
    const value = Number($("steps-input").value);

    if (!Number.isSafeInteger(value) || value < 0) {
        $("steps-result").textContent = "Please enter a valid step count.";
        return;
    }

    savedSteps = value;
    saveData("ss-steps", savedSteps);
    $("steps-result").textContent =
        `${savedSteps.toLocaleString()} steps recorded`;
});

// ---------- CALCULATOR ----------
const display = $("calc-display");
let calculationFinished = false;

document.querySelector(".calc-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-calc]");
    if (!button) return;

    const value = button.dataset.calc;
    $("calc-message").textContent = "";

    if (value === "clear") {
        display.value = "";
        calculationFinished = false;
        return;
    }

    if (value === "=") {
        try {
            const result = calculateExpression(display.value);
            if (!Number.isFinite(result)) throw new Error("Invalid result");

            display.value = String(Number(result.toPrecision(12)));
            calculationFinished = true;
        } catch {
            $("calc-message").textContent =
                "Invalid calculation. Please check your expression.";
            calculationFinished = true;
        }
        return;
    }

    if (value === "sqrt") {
        try {
            const result = calculateExpression(display.value);
            if (result < 0) throw new Error("Negative square root");

            display.value = String(Number(Math.sqrt(result).toPrecision(12)));
            calculationFinished = true;
        } catch {
            $("calc-message").textContent =
                "Enter a valid non-negative number first.";
        }
        return;
    }

    if (calculationFinished) {
        if (/^[0-9.(]$/.test(value)) {
            display.value = value;
        } else {
            display.value += value;
        }
        calculationFinished = false;
    } else {
        display.value += value;
    }
});

function calculateExpression(expression) {
    const cleaned = expression.replace(/\s+/g, "");

    if (!cleaned || !/^[0-9+\-*/().^]+$/.test(cleaned)) {
        throw new Error("Invalid characters");
    }

    // Allow only mathematical characters before evaluating the expression.
    const jsExpression = cleaned.replace(/\^/g, "**");
    return Function('"use strict"; return (' + jsExpression + ')')();
}

// ---------- MATHEMATICAL TABLES ----------
const mathTable = $("math-table");

document.querySelectorAll("[data-table]").forEach(button => {
    button.addEventListener("click", () => {
        const type = button.dataset.table;
        let headings = [];
        let rows = [];

        if (type === "log") {
            headings = ["Number", "log₁₀(number)"];
            rows = Array.from({ length: 10 }, (_, i) => {
                const n = i + 1;
                return [n, Math.log10(n).toFixed(4)];
            });
        } else if (type === "trig") {
            headings = ["Angle", "sin", "cos", "tan"];
            rows = [0, 30, 45, 60, 90].map(degrees => {
                const radians = degrees * Math.PI / 180;
                const tanValue = Math.tan(radians);
                return [
                    degrees + "°",
                    cleanTrig(Math.sin(radians)),
                    cleanTrig(Math.cos(radians)),
                    degrees === 90 ? "Undefined" : cleanTrig(tanValue)
                ];
            });
        } else {
            headings = ["Number", "Square"];
            rows = Array.from({ length: 20 }, (_, i) => {
                const n = i + 1;
                return [n, n * n];
            });
        }

        mathTable.innerHTML = `
            <table>
                <thead><tr>${headings.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                <tbody>${rows.map(row =>
                    `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
                ).join("")}</tbody>
            </table>`;
    });
});

function cleanTrig(value) {
    if (Math.abs(value) < 1e-10) return "0";
    if (Math.abs(value - 1) < 1e-10) return "1";
    return value.toFixed(4);
}

// ---------- FOCUS TIMER ----------
let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;
let timerId = null;
let sessionSeconds = 0;

function renderTimer() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    $("timer-display").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}

function startTimer() {
    if (timerId !== null) {
        stopTimer();
        $("timer-start").textContent = "▶ Resume";
        $("timer-status").textContent = "Timer paused.";
        return;
    }

    if (remainingSeconds <= 0) {
        $("timer-status").textContent = "Choose a session length to begin again.";
        return;
    }

    $("timer-start").textContent = "Ⅱ Pause";
    $("timer-status").textContent = "Focus time — you've got this!";

    timerId = setInterval(() => {
        remainingSeconds--;
        sessionSeconds++;
        renderTimer();

        if (sessionSeconds >= 60) {
            const wholeMinutes = Math.floor(sessionSeconds / 60);
            focusMinutes += wholeMinutes;
            sessionSeconds -= wholeMinutes * 60;
            saveData("ss-focus-minutes", focusMinutes);
            $("focus-total").textContent = `${focusMinutes} min`;
        }

        if (remainingSeconds <= 0) {
            stopTimer();

            if (sessionSeconds > 0) {
                focusMinutes += sessionSeconds / 60;
                sessionSeconds = 0;
                saveData("ss-focus-minutes", focusMinutes);
            }

            $("focus-total").textContent =
                `${Math.floor(focusMinutes)} min`;
            $("timer-start").textContent = "▶ Start";
            $("timer-status").textContent =
                "Session complete! Take a short break.";
            alert("Focus session complete! Time for a break.");
        }
    }, 1000);
}

$("timer-start").addEventListener("click", startTimer);

$("timer-reset").addEventListener("click", () => {
    stopTimer();
    sessionSeconds = 0;
    remainingSeconds = selectedMinutes * 60;
    renderTimer();
    $("timer-start").textContent = "▶ Start";
    $("timer-status").textContent = "Timer reset. Ready when you are.";
});

document.querySelectorAll("[data-minutes]").forEach(button => {
    button.addEventListener("click", () => {
        stopTimer();
        selectedMinutes = Number(button.dataset.minutes);
        remainingSeconds = selectedMinutes * 60;
        sessionSeconds = 0;
        renderTimer();
        $("timer-start").textContent = "▶ Start";
        $("timer-status").textContent = `${selectedMinutes}-minute session selected.`;
    });
});

// ---------- SIMPLE FOCUS TONE ----------
let audioContext = null;
let oscillator = null;
let gainNode = null;

$("sound-start").addEventListener("click", async () => {
    try {
        if (oscillator) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error("Audio unavailable");

        audioContext = audioContext || new AudioContextClass();
        await audioContext.resume();

        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 220;
        gainNode.gain.value = 0.025;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();

        $("sound-start").textContent = "♫ Tone playing";
    } catch {
        $("timer-status").textContent =
            "Audio could not start. Check your browser settings.";
    }
});

$("sound-stop").addEventListener("click", () => {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
    }

    if (gainNode) {
        gainNode.disconnect();
        gainNode = null;
    }

    $("sound-start").textContent = "♫ Play focus tone";
});

// ---------- HELPERS ----------
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ---------- INITIAL DISPLAY ----------
renderLectures();
renderTasks();
renderTimer();
$("focus-total").textContent = `${Math.floor(focusMinutes)} min`;

// Display the logarithm table by default.
document.querySelector('[data-table="log"]').click();
