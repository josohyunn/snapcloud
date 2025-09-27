import React, { useState, useEffect } from "react";
import { getTask, addTask, updateTask, deleteTask } from "./apiTask";

function App() {
  // -------------------- State 정의 --------------------
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    taskId: "",
    taskName: "",
    status: "pending",
    dueDate: "",
    priority: "normal",
  });
  const [updateForm, setUpdateForm] = useState({
    taskId: "",
    taskName: "",
    status: "pending",
    dueDate: "",
    priority: "normal",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // -------------------- 스타일 정의 --------------------
  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
    width: "300px",
  };
  const buttonStyle = {
    padding: "8px",
    marginTop: "5px",
    cursor: "pointer",
  };
  const deleteButtonStyle = { ...buttonStyle, backgroundColor: "red", color: "white" };
  const updateButtonStyle = { ...buttonStyle, backgroundColor: "blue", color: "white" };

  // -------------------- 함수 정의 --------------------
  // 전체 Task 조회
  const fetchTasks = async () => {
    try {
      const res = await getTask();
      setTasks(Array.isArray(res) ? res : [res]);
    } catch (e) {
      setStatusMsg("Error fetching tasks: " + e.message);
    }
  };

  // 초기 Task 로드
  useEffect(() => {
    fetchTasks();
  }, []);

  // Task 추가
  const handleAdd = async () => {
    if (!form.taskId || form.taskName) {
      setStatusMsg("taskId and tastName are required");
      return;
    }
    try {
      const res = await addTask(form);
      setStatusMsg(res.message || "Task added!");
      await fetchTasks(); // 추가 후 전체 조회
      setForm({
        taskId: "",
        taskName: "",
        status: "pending",
        dueDate: "",
        priority: "normal",
      });
    } catch (e) {
      setStatusMsg("Error adding task: " + e.message);
    }
  };

  // Task 수정 준비
  const startUpdate = (task) => {
    setUpdateForm({ ...task });
    setIsUpdating(true);
  };

  // Task 수정
  const handleUpdate = async () => {
    try {
      await updateTask(updateForm);
      setStatusMsg("Task updated!");
      setIsUpdating(false);
      await fetchTasks();
    } catch (e) {
      setStatusMsg("Error updating task: " + e.message);
    }
  };

  // Task 삭제
  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      setStatusMsg("Task deleted!");
      await fetchTasks();
    } catch (e) {
      setStatusMsg("Error deleting task: " + e.message);
    }
  };

  // -------------------- 렌더링 --------------------
  return (
    <div style={{ padding: "20px" }}>
      <h1>My To-Do App</h1>

      {/* 상태 메시지 */}
      {statusMsg && (
        <p style={{ color: statusMsg.includes("Error") ? "red" : "green" }}>{statusMsg}</p>
      )}

      {/* Add Task Form */}
      <div style={formStyle}>
        <h3>Add Task</h3>
        <input
          placeholder="Task ID"
          value={form.taskId}
          onChange={(e) => setForm({ ...form, taskId: e.target.value })}
        />
        <input
          placeholder="Task Name"
          value={form.taskName}
          onChange={(e) => setForm({ ...form, taskName: e.target.value })}
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="pending">pending</option>
          <option value="completed">completed</option>
        </select>
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <button style={buttonStyle} onClick={handleAdd}>Add Task</button>
      </div>

      {/* Task List */}
      {/* Task List */}
      <ul>
        {Array.isArray(tasks) &&
          tasks.map((task) => (
            <li key={task.taskId}>
              <strong>ID:</strong> {task.taskId} | <strong>Name:</strong> {task.taskName} |{" "}
              <strong>Status:</strong> {task.status} | <strong>Priority:</strong> {task.priority} |{" "}
              <strong>Due:</strong> {task.dueDate}
              <button style={deleteButtonStyle} onClick={() => handleDelete(task.taskId)}>
                Delete
              </button>
              <button style={updateButtonStyle} onClick={() => startUpdate(task)}>
                Update
              </button>
            </li>
          ))}
      </ul>


      {/* Update Task Form */}
      {isUpdating && (
        <div style={formStyle}>
          <h3>Update Task</h3>
          <input placeholder="Task ID" value={updateForm.taskId} readOnly />
          <input
            placeholder="Task Name"
            value={updateForm.taskName}
            onChange={(e) => setUpdateForm({ ...updateForm, taskName: e.target.value })}
          />
          <select
            value={updateForm.status}
            onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
          >
            <option value="pending">pending</option>
            <option value="completed">completed</option>
          </select>
          <select
            value={updateForm.priority}
            onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}
          >
            <option value="normal">normal</option>
            <option value="high">high</option>
          </select>
          <input
            type="date"
            value={updateForm.dueDate}
            onChange={(e) => setUpdateForm({ ...updateForm, dueDate: e.target.value })}
          />
          <button style={buttonStyle} onClick={handleUpdate}>Update Task</button>
          <button style={buttonStyle} onClick={() => setIsUpdating(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default App;