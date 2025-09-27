const API_URL = "https://68d4180403c9bb0612f191d7--snapcloudpj.netlify.app/.netlify/functions/getTask";


/**
 * 전체 조회 또는 단일 Task 조회
 * @param {string} taskId - 조회할 taskId (옵션)
 * @returns {Array} Task 배열
 */
export async function getTask(taskId) {
  let url = API_URL;
  if (taskId) url += `?taskId=${taskId}`;  // taskId가 있으면 쿼리 파라미터로 추가

  const res = await fetch(url, { method: 'GET' });  // GET 메소드로 요청
  const data = await res.json();
  
  return Array.isArray(data) ? data : [data];  // 응답이 배열이면 그대로 반환
}

/**
 * Task 추가
 * @param {Object} task - {taskId, taskName, status, dueDate, priority}
 * @returns {Object} 추가 결과
 */
// api.js
export async function addTask(task) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',  // GET이 아닌 POST로 요청 보내기
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })  // 요청 본문에 task 데이터를 포함
    });

    if (!response.ok) {
      throw new Error('Failed to add task');
    }

    const result = await response.json();
    console.log('Task added successfully:', result);
    return result;

  } catch (error) {
    console.error('Error adding task:', error);
    return { error: error.message };  // 에러 처리
  }
}



/**
 * Task 수정
 * @param {Object} task - {taskId, taskName, status, dueDate, priority}
 * @returns {Object} 수정 결과
 */
export async function updateTask(task) {
    const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });
    const result = await res.json();

    // body가 있으면 JSON.parse, 없으면 result 그대로 반환
    if (result.body) {
        return JSON.parse(result.body);
    }
    return result; // body가 없는 경우 바로 반환
}

/**
 * Task 삭제
 * @param {string} taskId
 * @returns {Object} 삭제 결과
 */
export async function deleteTask(taskId) {
    const res = await fetch(`${API_URL}?taskId=${taskId}`, {
        method: 'DELETE',
        headers: { "Content-Type": "application/json" }
    });

    // JSON이 아니면 그냥 메시지 반환
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text || "Task deleted" };
    }
}