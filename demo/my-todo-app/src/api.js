const API_URL = "https://aesthetic-kashata-05eda9.netlify.app/.netlify/functions";

/**
 * 전체 조회 또는 단일 Task 조회
 * @param {string} taskId - 조회할 taskId (옵션)
 * @returns {Array} Task 배열
 */
export async function getTask(taskId) {
    let url = `${API_URL}/getTask`;  // getTask 함수의 URL
    if (taskId) url += `?taskId=${taskId}`;

    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    return Array.isArray(data) ? data : [data];
}

/**
 * Task 추가
 * @param {Object} task - {taskId, taskName, status, dueDate, priority}
 * @returns {Object} 추가 결과
 */
export async function addTask(task) {
  const res = await fetch(`${API_URL}/addTask`, {  // addTask 함수의 URL
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

  const result = await res.json();
  const parsedBody = result.body ? JSON.parse(result.body) : {};

  if (!res.ok || result.statusCode >= 400) {
    throw new Error(parsedBody.error || "taskId already exists!");
  }

  return parsedBody;
}

/**
 * Task 수정
 * @param {Object} task - {taskId, taskName, status, dueDate, priority}
 * @returns {Object} 수정 결과
 */
export async function updateTask(task) {
    const res = await fetch(`${API_URL}/updateTask`, {  // updateTask 함수의 URL
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });
    const result = await res.json();
    if (result.body) {
        return JSON.parse(result.body);
    }
    return result;
}

/**
 * Task 삭제
 * @param {string} taskId
 * @returns {Object} 삭제 결과
 */
export async function deleteTask(taskId) {
    const res = await fetch(`${API_URL}/deleteTask?taskId=${taskId}`, {  // deleteTask 함수의 URL
        method: 'DELETE',
        headers: { "Content-Type": "application/json" }
    });

    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text || "Task deleted" };
    }
}
