// netlify/functions/getTask.js

const { DynamoDB } = require('aws-sdk');
const ddb = new DynamoDB.DocumentClient();

// CORS 응답 처리 함수
function createCorsResponse() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",  // 모든 도메인 허용
      "Access-Control-Allow-Methods": "OPTIONS,GET",  // 허용 메서드
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify({})
  };
}

module.exports.handler = async (event, context) => {
  // OPTIONS 요청 처리
  if (event.httpMethod === "OPTIONS") {
    return createCorsResponse();
  }

  // GET 요청 처리 (DynamoDB에서 전체 Task 조회)
  if (event.httpMethod === "GET") {
    const params = {
      TableName: "SnapCloud"
    };

    try {
      const data = await ddb.scan(params).promise();
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(data.Items)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // GET 외의 HTTP 메서드는 405 처리
  return {
    statusCode: 405,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ message: "Method not allowed" })
  };
};
