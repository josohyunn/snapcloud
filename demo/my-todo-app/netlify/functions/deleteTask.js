const { DynamoDB } = require('aws-sdk');
const ddb = new DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
  // OPTIONS 요청 처리 (CORS 설정)
  if (event.httpMethod === "OPTIONS") {
    return createCorsResponse();  // CORS 응답 처리
  }

  if (event.httpMethod === "DELETE") {
    const taskId = event.queryStringParameters?.taskId;

    if (!taskId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "taskId is required" }),
      };
    }

    // DynamoDB에서 taskId에 해당하는 데이터 삭제
    const params = {
      TableName: "SnapCloud",
      Key: {
        taskId,  // taskId로 데이터 삭제
      },
    };

    try {
      await ddb.delete(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Task with taskId ${taskId} deleted successfully` }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Error deleting task: ${error.message}` }),
      };
    }
  }

  // DELETE 외의 HTTP 메서드는 405 Method Not Allowed
  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};

// CORS 응답 처리 함수
function createCorsResponse() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // 모든 도메인 허용
      "Access-Control-Allow-Methods": "OPTIONS,DELETE", // 허용하는 메서드
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify({}),
  };
}
