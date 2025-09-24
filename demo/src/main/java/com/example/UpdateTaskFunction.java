package com.example;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.core.exception.SdkException;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;

public class UpdateTaskFunction implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private static final DynamoDbClient ddb = DynamoDbClient.create();
    private static final Gson gson = new Gson();

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {

        // Proxy true: body는 JSON 문자열로 전달됨
        Object rawBody = input.get("body");
        String body = rawBody != null ? rawBody.toString().trim() : null;

        if (body == null || body.isEmpty()) {
            return createResponse(400, "{\"error\":\"Request body is required\"}");
        }

        Map<String, String> task = gson.fromJson(body, Map.class);

        String taskId = task.get("taskId");
        if (taskId == null || taskId.isEmpty()) {
            return createResponse(400, "{\"error\":\"taskId is required\"}");
        }

        Map<String, AttributeValueUpdate> updates = new HashMap<>();

        if (task.get("taskName") != null)
            updates.put("taskName", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().s(task.get("taskName")).build())
                    .action(AttributeAction.PUT)
                    .build());
        if (task.get("status") != null)
            updates.put("status", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().s(task.get("status")).build())
                    .action(AttributeAction.PUT)
                    .build());
        if (task.get("dueDate") != null)
            updates.put("dueDate", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().s(task.get("dueDate")).build())
                    .action(AttributeAction.PUT)
                    .build());
        if (task.get("priority") != null)
            updates.put("priority", AttributeValueUpdate.builder()
                    .value(AttributeValue.builder().s(task.get("priority")).build())
                    .action(AttributeAction.PUT)
                    .build());

        // updatedAt 갱신
        updates.put("updatedAt", AttributeValueUpdate.builder()
                .value(AttributeValue.builder().s(java.time.Instant.now().toString()).build())
                .action(AttributeAction.PUT)
                .build());

        UpdateItemRequest updateRequest = UpdateItemRequest.builder()
                .tableName("SnapCloud")
                .key(Map.of("taskId", AttributeValue.builder().s(taskId).build()))
                .attributeUpdates(updates)
                .build();

        try {
            ddb.updateItem(updateRequest);
            return createResponse(200, "{\"message\":\"Task updated successfully\"}");
        } catch (SdkException e) {
            return createResponse(500, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // CORS 헤더 포함 공통 응답 생성 함수
    private Map<String, Object> createResponse(int statusCode, String body) {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", statusCode);
        response.put("headers", Map.of(
                "Access-Control-Allow-Origin", "*",
                "Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE",
                "Access-Control-Allow-Headers", "Content-Type"
        ));
        response.put("body", body);
        return response;
    }
}
