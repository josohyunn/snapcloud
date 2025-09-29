import React, { useState, useEffect, useMemo } from "react";
import { getTask, addTask, updateTask, deleteTask } from "./apiTask";
import "./App.css";

/** 표시용 한글 라벨 맵 */
const PRIORITY_KO = { high: "중요", normal: "보통", low: "낮음" };
const STATUS_KO = { pending: "진행중", completed: "완료" };
const ko = (v, map) => map[String(v || "").toLowerCase()] || v;

/** 정렬: priority > (high/normal이면) dueDate ASC > createdAt ASC */
function sortByPriorityThenDueThenCreated(list) {
  const rank = (p) => {
    const v = String(p || "").trim().toLowerCase();
    if (v === "high") return 0;
    if (v === "normal") return 1;
    if (v === "low") return 2;
    return 3;
  };
  const toMs = (d, fb) => {
    if (!d) return fb;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : fb;
  };
  return [...list].sort((a, b) => {
    const pr = rank(a.priority) - rank(b.priority);
    if (pr !== 0) return pr;

    const ad = toMs(a.dueDate, Number.MAX_SAFE_INTEGER);
    const bd = toMs(b.dueDate, Number.MAX_SAFE_INTEGER);
    if (rank(a.priority) <= 1 && ad !== bd) return ad - bd;

    const ac = toMs(a.createdAt, Number.MAX_SAFE_INTEGER);
    const bc = toMs(b.createdAt, Number.MAX_SAFE_INTEGER);
    if (ac !== bc) return ac - bc;

    return String(a.taskName || "").localeCompare(String(b.taskName || ""));
  });
}

function isOverdue(due) {
  if (!due) return false;
  const t = new Date(due).getTime();
  if (!Number.isFinite(t)) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return t < today.getTime();
}

/** 개별 아이템 */
function TaskItem({ task, onDelete, onUpdate }) {
  const p = String(task.priority || "").trim().toLowerCase();
  const s = String(task.status || "").trim().toLowerCase();
  const dueClass = isOverdue(task.dueDate) ? "overdue" : task.dueDate ? "due-okay" : "";
  return (
    <li className="task-item">
      <div>
        <div style={{ fontWeight: 700 }}>
          {task.taskName || "(no title)"}{" "}
          <span className={`badge priority-${p || "normal"}`}>중요도: {ko(p, PRIORITY_KO)}</span>{" "}
          <span className={`badge status-${s || "pending"}`}>{ko(s, STATUS_KO)}</span>
        </div>
        <div className="meta">
          <span>ID: {task.taskId}</span>
          <span>|</span>
          <span className={`due ${dueClass}`}>마감: {task.dueDate || "—"}</span>
        </div>
      </div>
      <div className="item-actions">
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm("삭제하시겠습니까?")) onDelete(task.taskId);
          }}
        >
          삭제하기
        </button>
        <button className="btn btn-info" onClick={() => onUpdate(task)}>
          수정하기
        </button>
      </div>
    </li>
  );
}

/** 섹션 박스 */
function TaskSection({ title, count, children }) {
  return (
    <div className="section panel">
      <div className="label">
        {title} <span className="count-badge">{count}</span>
      </div>
      <hr className="hr" />
      {React.Children.count(children) === 0 ? (
        <div className="empty">아직 항목이 없어요.</div>
      ) : (
        <ul className="task-list">{children}</ul>
      )}
    </div>
  );
}

function App() {
  // -------------------- State --------------------
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    taskId: "",
    taskName: "",
    status: "pending",
    dueDate: "",
    priority: "normal",
  });
  const [statusMsg, setStatusMsg] = useState("");
  const [updateForm, setUpdateForm] = useState({
    taskId: "",
    taskName: "",
    status: "pending",
    dueDate: "",
    priority: "normal",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // 항상 정렬된 배열 사용
  const sortedTasks = useMemo(
    () => sortByPriorityThenDueThenCreated(tasks),
    [tasks]
  );

  // 분류된 리스트
  const pendingTasks = useMemo(
    () => sortedTasks.filter(t => String(t.status || "").toLowerCase() !== "completed"),
    [sortedTasks]
  );
  const completedTasks = useMemo(
    () => sortedTasks.filter(t => String(t.status || "").toLowerCase() === "completed"),
    [sortedTasks]
  );

  // -------------------- Functions --------------------
  const fetchTasks = async () => {
    try {
      const res = await getTask();
      setTasks(Array.isArray(res) ? res : [res]);
    } catch (e) {
      setStatusMsg("할 일 불러오기 오류: " + e.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAdd = async () => {
    if (!form.taskId || !form.taskName) {
      setStatusMsg("아이디와 할 일이 필요합니다.");
      return;
    }
    try {
      const res = await addTask(form);
      setStatusMsg(res?.message || "할 일 추가 성공!");
      await fetchTasks();
      setForm({
        taskId: "",
        taskName: "",
        status: "pending",
        dueDate: "",
        priority: "normal",
      });
    } catch (e) {
      setStatusMsg("할 일 추가 오류: " + e.message);
    }
  };

  const startUpdate = (task) => {
    setUpdateForm({
      taskId: task.taskId ?? "",
      taskName: task.taskName ?? "",
      status: String(task.status || "pending"),
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      priority: String(task.priority || "normal"),
    });
    setIsUpdating(true);
  };

  const handleUpdate = async () => {
    try {
      await updateTask(updateForm);
      setStatusMsg("할 일 수정 완료!");
      setIsUpdating(false);
      await fetchTasks();
    } catch (e) {
      setStatusMsg("할 일 수정 오류: " + e.message);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      setStatusMsg("할 일 삭제 완료!");
      await fetchTasks();
    } catch (e) {
      setStatusMsg("할 일 삭제 오류: " + e.message);
    }
  };

  // -------------------- Render --------------------
  const statusOk = statusMsg && !statusMsg.toLowerCase().includes("error");

  return (
    <div className="app theme-zen">
      <div className="container">
        <div className="header">
          <h1>📋오늘 뭐하지?📋</h1>
          <span className="sub"></span>
        </div>

        {statusMsg && (
          <div className={`status ${statusOk ? "ok" : "err"} panel`}>
            {statusMsg}
          </div>
        )}

        {/* 입력 & 업데이트 폼 */}
        <div className="grid-2">
          {/* Add Form */}
          <div className="section panel form">
            <h3>오늘의 할일</h3>
            <div className="row">
              <div className="field">
                <label className="field-label" htmlFor="add-id">아이디</label>
                <input
                  id="add-id"
                  className="input"
                  placeholder="아이디"
                  value={form.taskId}
                  onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="add-name">할 일</label>
                <input
                  id="add-name"
                  className="input"
                  placeholder="할 일"
                  value={form.taskName}
                  onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="field-label" htmlFor="add-status">진행상황</label>
                <select
                  id="add-status"
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="pending">진행중</option>
                  <option value="completed">완료</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="add-priority">중요도</label>
                <select
                  id="add-priority"
                  className="select"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="high">중요</option>
                  <option value="normal">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="add-due">마감일</label>
                <input
                  id="add-due"
                  className="input"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <br />
            <button className="btn btn-primary" onClick={handleAdd}>할일 추가</button>
          </div>

          {/* Update Form */}
          {isUpdating && (
            <div className="section panel form">
              <h3>할일 수정</h3>
              <div className="row">
                <div className="field">
                  <label className="field-label" htmlFor="upd-id">아이디</label>
                  <input id="upd-id" className="input" value={updateForm.taskId} readOnly />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="upd-name">할 일</label>
                  <input
                    id="upd-name"
                    className="input"
                    value={updateForm.taskName}
                    onChange={(e) => setUpdateForm({ ...updateForm, taskName: e.target.value })}
                  />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label className="field-label" htmlFor="upd-status">진행상황</label>
                  <select
                    id="upd-status"
                    className="select"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  >
                    <option value="pending">진행중</option>
                    <option value="completed">완료</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="upd-priority">중요도</label>
                  <select
                    id="upd-priority"
                    className="select"
                    value={updateForm.priority}
                    onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}
                  >
                    <option value="high">중요</option>
                    <option value="normal">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="upd-due">마감일</label>
                  <input
                    id="upd-due"
                    className="input"
                    type="date"
                    value={updateForm.dueDate}
                    onChange={(e) => setUpdateForm({ ...updateForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="row">
                <button className="btn btn-info" onClick={handleUpdate}>할일 수정</button>
                <button className="btn" onClick={() => setIsUpdating(false)}>취소</button>
              </div>
            </div>
          )}
        </div>

        {/* ✅ 분류된 Task Lists */}
        <div className="lists-grid grid-2">
          <TaskSection title="⏳ 진행중" count={pendingTasks.length}>
            {pendingTasks.map(task => (
              <TaskItem
                key={task.taskId}
                task={task}
                onDelete={handleDelete}
                onUpdate={startUpdate}
              />
            ))}
          </TaskSection>

          <TaskSection title="✅ 완료" count={completedTasks.length}>
            {completedTasks.map(task => (
              <TaskItem
                key={task.taskId}
                task={task}
                onDelete={handleDelete}
                onUpdate={startUpdate}
              />
            ))}
          </TaskSection>
        </div>
      </div>
    </div>
  );
}

export default App;
