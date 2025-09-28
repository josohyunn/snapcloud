const BASE = `${window.location.origin}/.netlify/functions`;

function normalizeOne(t) {
  if (!t || typeof t !== "object") return null;
  const taskId = String(t.taskId ?? "").trim();        // ← 공백/백틱 제거 대비
  const taskName = (t.taskName ?? t.title ?? "").toString();
  const status = (t.status ?? "todo").toString();
  const priority = (t.priority ?? "normal").toString();
  const dueDate = t.dueDate ?? null;
  const createdAt = t.createdAt ?? null;
  const updatedAt = t.updatedAt ?? null;
  return { taskId, taskName, status, priority, dueDate, createdAt, updatedAt };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  if (!res.ok) {
    try { const j = text ? JSON.parse(text) : {}; throw new Error(j.error || j.message || `HTTP ${res.status}`); }
    catch { throw new Error(text || `HTTP ${res.status}`); }
  }
  if (!text) return null;
  const data = JSON.parse(text);
  // 배열/단건 모두 정규화
  if (Array.isArray(data)) return data.map(normalizeOne).filter(Boolean);
  if (data?.task) return { ...data, task: normalizeOne(data.task) };
  return normalizeOne(data) ?? data;
}

/** 조회 */
export function getTask(taskId) {
  const qs = taskId ? `?taskId=${encodeURIComponent(String(taskId).trim())}` : "";
  return request(`/tasksProxy${qs}`, { method: "GET" });
}

/** 등록(POST) — 서버가 title만 받더라도 호환되게 같이 보냄 */
export function addTask(task) {
  const body = {
    ...task,
    taskName: task.taskName ?? task.title,     // 둘 다 채워보냄
    title: task.title ?? task.taskName,
  };
  return request(`/tasksProxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** 수정(PUT) */
export function updateTask(task) {
  const body = {
    ...task,
    taskId: String(task.taskId).trim(),        // ← 공백/백틱 방지
    taskName: task.taskName ?? task.title,
    title: task.title ?? task.taskName,
  };
  return request(`/tasksProxy`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** 삭제(DELETE) */
export function deleteTask(taskId) {
  const id = String(taskId ?? "").trim();   // ← "6742367 " 같은 공백 제거
  return fetch(`${window.location.origin}/.netlify/functions/tasksProxy?taskId=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then(r => r.json());
}

