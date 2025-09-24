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

  if (event.httpMethod === 'POST') {
    const { task } = JSON.parse(event.body);

    // 여기에 작업을 추가하는 로직을 넣어주세요 (예: DB에 저장)

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "",  // 모든 출처에서 요청 허용
        "Access-Control-Allow-Headers": "Content-Type",  // 요청 헤더 허용
        "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, OPTIONS"  // 허용된 HTTP 메소드
      },
      body: JSON.stringify({ message: `Task added successfully: ${task}` }),
    };
  }

  return {
    statusCode: 405,  // Method Not Allowed
    body: JSON.stringify({ message: "Method not allowed" }),
  };
};