package com.example;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.core.exception.SdkException;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;

public class AddTaskFunction implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private static final DynamoDbClient ddb = DynamoDbClient.create();
    private static final Gson gson = new Gson();

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {

        // **옵션 요청 처리 추가**: CORS를 위한 OPTIONS 메서드 처리
        String httpMethod = (String) input.get("httpMethod");
        if ("OPTIONS".equals(httpMethod)) {
            return createCorsResponse(); // OPTIONS 요청에 대해 CORS 응답 반환
        }

        Object rawBody = input.get("body");
        String body = rawBody != null ? rawBody.toString().trim() : null;

        if (body == null || body.isEmpty()) {
            return createResponse(400, "{\"error\":\"Request body is required\"}");
        }

        Map<String, String> task = gson.fromJson(body, Map.class);
        String taskId = task.get("taskId");
        String taskName = task.get("taskName");
        String status = task.get("status");
        String dueDate = task.get("dueDate");
        String priority = task.get("priority");

        if (taskId == null || taskId.isEmpty() || taskName == null || taskName.isEmpty()) {
            return createResponse(400, "{\"error\":\"taskId and taskName are required\"}");
        }

        // 기본값 설정
        if (status == null || status.isEmpty())
            status = "pending";
        if (priority == null || priority.isEmpty())
            priority = "normal";

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("taskId", AttributeValue.builder().s(taskId).build());
        item.put("taskName", AttributeValue.builder().s(taskName).build());

        // status, dueDate, priority는 있을 때만 넣기
        item.put("status", AttributeValue.builder().s(status).build());
        if (dueDate != null && !dueDate.isEmpty()) {
            item.put("dueDate", AttributeValue.builder().s(dueDate).build());
        }
        item.put("priority", AttributeValue.builder().s(priority).build());

        // 생성/수정 시각
        String now = java.time.Instant.now().toString();
        item.put("createdAt", AttributeValue.builder().s(now).build());
        item.put("updatedAt", AttributeValue.builder().s(now).build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName("SnapCloud")
                .item(item)
                .conditionExpression("attribute_not_exists(taskId)") // 중복 방지
                .build();

        try {
            ddb.putItem(request);
            return createResponse(200, "{\"message\":\"Task added successfully\"}");
        } catch (ConditionalCheckFailedException e) {
            // taskId 중복 시
            return createResponse(400, "{\"error\":\"taskId already exists\"}");
        } catch (SdkException e) {
            return createResponse(500, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // **CORS 응답을 처리하는 함수** 추가
    private Map<String, Object> createCorsResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);
        response.put("headers", Map.of(
                "Access-Control-Allow-Origin", "*", // 모든 도메인 허용
                "Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE",
                "Access-Control-Allow-Headers", "Content-Type"));
        response.put("body", "{}"); // 빈 본문
        return response;
    }

    // 공통 응답 생성 함수 (CORS 헤더 포함)
    private Map<String, Object> createResponse(int statusCode, String body) {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", statusCode);
        response.put("headers", Map.of(
                "Access-Control-Allow-Origin", "*",
                "Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE",
                "Access-Control-Allow-Headers", "Content-Type"));
        response.put("body", body);
        return response;
    }
}
