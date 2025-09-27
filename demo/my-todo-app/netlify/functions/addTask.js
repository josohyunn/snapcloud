// netlify/functions/addTask.js

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();  // DynamoDB 클라이언트 생성
const uuid = require('uuid');  // taskId 생성을 위한 UUID 라이브러리

module.exports.handler = async function (event, context) {
  // OPTIONS 요청 처리 (CORS 설정)
  if (event.httpMethod === "OPTIONS") {
    return createCorsResponse();  // CORS 응답 처리
  }

  // POST 요청 처리 (task 추가)
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body);  // 요청 바디 파싱

    const { taskName, status, dueDate, priority } = body;

    // taskId는 UUID로 생성
    const taskId = uuid.v4();  // 고유한 taskId 생성

    // DynamoDB에 저장할 아이템 객체
    const item = {
      taskId: taskId,
      taskName: taskName,
      status: status || "pending",  // 기본값 "pending"
      dueDate: dueDate || "",  // 기본값 빈 문자열
      priority: priority || "normal",  // 기본값 "normal"
      createdAt: new Date().toISOString(),  // 생성 시간
      updatedAt: new Date().toISOString(),  // 수정 시간
    };

    // DynamoDB에 아이템 추가
    const params = {
      TableName: "SnapCloud",  // DynamoDB 테이블 이름
      Item: item,
    };

    try {
      // DynamoDB에 아이템 추가
      await dynamoDb.put(params).promise();
      return createResponse(200, JSON.stringify({ message: "Task added successfully", taskId: taskId }));
    } catch (error) {
      return createResponse(500, JSON.stringify({ error: "Could not add task", details: error.message }));
    }
  }

  // 다른 HTTP 메서드에 대한 처리
  return createResponse(405, JSON.stringify({ error: "Method Not Allowed" }));
};

// CORS 응답 처리 함수
function createCorsResponse() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify({}),
  };
}

// 공통 응답 처리 함수
function createResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: body,
  };
}
