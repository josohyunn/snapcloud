package com.example;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.core.exception.SdkException;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import java.util.HashMap;
import java.util.Map;

public class DeleteTaskFunction implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private static final DynamoDbClient ddb = DynamoDbClient.create();

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {

        // **OPTIONS 요청 처리 추가**
        String httpMethod = (String) input.get("httpMethod");
        if ("OPTIONS".equals(httpMethod)) {
            return createCorsResponse();  // OPTIONS 요청에 대해 CORS 응답 반환
        }

        // Proxy true: queryStringParameters 사용
        Map<String, Object> queryParamsRaw = (Map<String, Object>) input.get("queryStringParameters");
        Map<String, String> queryParams = new HashMap<>();
        if (queryParamsRaw != null) {
            queryParamsRaw.forEach((k, v) -> queryParams.put(k, v.toString()));
        }

        String taskId = queryParams.get("taskId");

        if (taskId == null || taskId.isEmpty()) {
            return createResponse(400, "{\"error\":\"taskId is required\"}");
        }

        // 삭제 요청
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("taskId", AttributeValue.builder().s(taskId).build());

        DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                .tableName("SnapCloud")
                .key(key)
                .build();

        try {
            ddb.deleteItem(deleteRequest);
            return createResponse(200, "{\"message\":\"Task deleted successfully\"}");
        } catch (SdkException e) {
            return createResponse(500, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    // **CORS 응답을 처리하는 함수** 추가
    private Map<String, Object> createCorsResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);
        response.put("headers", Map.of(
                "Access-Control-Allow-Origin", "*",  // 모든 도메인 허용
                "Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE",
                "Access-Control-Allow-Headers", "Content-Type"
        ));
        response.put("body", "{}");  // 빈 본문
        return response;
    }

    // 공통 응답 생성 함수 (CORS 헤더 포함)
    private Map<String, Object> createResponse(int statusCode, String body) {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", statusCode);
        response.put("headers", Map.of(
                "Access-Control-Allow-Origin", "*",  // 모든 도메인 허용
                "Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE",
                "Access-Control-Allow-Headers", "Content-Type"
        ));
        response.put("body", body);
        return response;
    }
}
