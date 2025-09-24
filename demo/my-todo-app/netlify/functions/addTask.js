// netlify/functions/addTask.js

module.exports.handler = async (event, context) => {
  // OPTIONS 요청 처리 (CORS 허용)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "",  // 모든 출처에서 요청 허용
        "Access-Control-Allow-Headers": "Content-Type",  // 요청 헤더 허용
        "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS"  // 허용된 HTTP 메소드
      },
      body: "",
    };
  }

  // POST 요청 처리 (작업 추가)
  if (event.httpMethod === 'POST') {
    const { task } = JSON.parse(event.body);  // 요청 본문에서 task 데이터 받기
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "",  // 모든 출처에서 요청 허용
        "Access-Control-Allow-Headers": "Content-Type",  // 요청 헤더 허용
        "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS"  // 허용된 HTTP 메소드
      },
      body: JSON.stringify({ message: `Task added successfully: ${task} `}),
    };
  }

  // GET 요청 처리 (작업 조회) - 이 부분 추가
  if (event.httpMethod === 'GET') {
    const tasks = [
      { id: 1, task: "Task 1" },
      { id: 2, task: "Task 2" }
    ];
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS"
      },
      body: JSON.stringify({ tasks })
    };
  }

  return {
    statusCode: 405,  // Method Not Allowed
    body: JSON.stringify({ message: "Method not allowed" }),
  };
};