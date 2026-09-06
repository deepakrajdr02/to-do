/* ---------------------------------------------------
   Tide — to-do app logic
   "Backend" for this static build = the browser's
   localStorage, wrapped behind a small data-access
   layer (TaskStore) so it can be swapped for a real
   server API later without touching the UI code.
--------------------------------------------------- */

const STORAGE_KEY = "tide.tasks.v1";

/* ---------- Data layer (swap this for a fetch() API later) ---------- */

const TaskStore = {
  getAll(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(err){
      console.error("Could not read tasks from storage:", err);
      return [];
    }
  },

  saveAll(tasks){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }catch(err){
      console.error("Could not save tasks to storage:", err);
    }
  },

  add(text){
    const tasks = this.getAll();
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
    this.saveAll(tasks);
    return task;
  },

  remove(id){
    const tasks = this.getAll().filter(t => t.id !== id);
    this.saveAll(tasks);
  },

  update(id, changes){
    const tasks = this.getAll().map(t =>
      t.id === id ? { ...t, ...changes } : t
    );
    this.saveAll(tasks);
  },

  clearCompleted(){
    const tasks = this.getAll().filter(t => !t.completed);
    this.saveAll(tasks);
  }
};

/* ---------- UI state ---------- */

let currentFilter = "all"; // all | active | completed

/* ---------- DOM references ---------- */

const form = document.getElementById("add-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

/* ---------- Rendering ---------- */

function render(){
  const tasks = TaskStore.getAll();
  const visible = tasks.filter(t => {
    if(currentFilter === "active") return !t.completed;
    if(currentFilter === "completed") return t.completed;
    return true;
  });

  list.innerHTML = "";

  visible.forEach(task => {
    list.appendChild(buildTaskItem(task));
  });

  emptyState.hidden = visible.length !== 0;

  const remaining = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
}

function buildTaskItem(task){
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " is-completed" : "");
  li.dataset.id = task.id;

  li.innerHTML = `
    <label class="task-checkbox">
      <input type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task complete">
      <span class="box"></span>
    </label>
    <span class="task-text" tabindex="0" title="Double-click to edit">${escapeHtml(task.text)}</span>
    <div class="task-actions">
      <button class="icon-btn edit" aria-label="Edit task">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.3 1.7a1.5 1.5 0 0 1 2.1 2.1L5.5 11.7l-2.9.7.7-2.9 8-7.8Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="icon-btn delete" aria-label="Delete task">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 4h11M6 4V2.5h4V4M6.5 7.5v4M9.5 7.5v4M3.5 4l.8 8.5a1 1 0 0 0 1 .9h5.4a1 1 0 0 0 1-.9L12.5 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  return li;
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Event handling (delegated) ---------- */

form.addEventListener("submit", e => {
  e.preventDefault();
  const value = input.value.trim();
  if(!value) return;
  TaskStore.add(value);
  input.value = "";
  render();
});

list.addEventListener("click", e => {
  const item = e.target.closest(".task-item");
  if(!item) return;
  const id = item.dataset.id;

  if(e.target.closest(".icon-btn.delete")){
    TaskStore.remove(id);
    render();
    return;
  }

  if(e.target.closest(".icon-btn.edit")){
    startEditing(item, id);
    return;
  }
});

list.addEventListener("change", e => {
  if(e.target.matches('input[type="checkbox"]')){
    const item = e.target.closest(".task-item");
    const id = item.dataset.id;
    TaskStore.update(id, { completed: e.target.checked });
    render();
  }
});

// double-click the text itself to edit in place ("replace" a task)
list.addEventListener("dblclick", e => {
  const textEl = e.target.closest(".task-text");
  if(!textEl) return;
  const item = textEl.closest(".task-item");
  startEditing(item, item.dataset.id);
});

function startEditing(item, id){
  const textEl = item.querySelector(".task-text");
  if(!textEl) return; // already editing

  const currentText = textEl.textContent;
  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.className = "task-edit-input";
  inputEl.value = currentText;
  inputEl.maxLength = 200;

  textEl.replaceWith(inputEl);
  inputEl.focus();
  inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);

  const commit = () => {
    const newText = inputEl.value.trim();
    if(newText && newText !== currentText){
      TaskStore.update(id, { text: newText });
    }
    render();
  };

  inputEl.addEventListener("blur", commit);
  inputEl.addEventListener("keydown", ev => {
    if(ev.key === "Enter"){
      ev.preventDefault();
      inputEl.blur();
    }
    if(ev.key === "Escape"){
      render();
    }
  });
}

clearCompletedBtn.addEventListener("click", () => {
  TaskStore.clearCompleted();
  render();
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => {
      b.classList.remove("is-active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");
    currentFilter = btn.dataset.filter;
    render();
  });
});

/* ---------- Init ---------- */

render();
