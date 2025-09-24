package com.example;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.core.exception.SdkException; // 수정된 부분
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import java.util.stream.Collectors;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GetTaskFunction implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private static final DynamoDbClient ddb = DynamoDbClient.create();
    private static final Gson gson = new Gson();

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {

        // OPTIONS 요청 처리
        String httpMethod = (String) input.get("httpMethod");
        if ("OPTIONS".equals(httpMethod)) {
            return createCorsResponse();  // OPTIONS 요청에 대해 CORS 응답 반환
        }

        // 기존 GET 요청 처리 로직
        Map<String, Object> queryParamsRaw = (Map<String, Object>) input.get("queryStringParameters");
        Map<String, String> queryParams = new HashMap<>();
        if (queryParamsRaw != null) {
            queryParamsRaw.forEach((k, v) -> queryParams.put(k, v.toString()));
        }

        String taskId = queryParams.get("taskId");

        try {
            // taskId가 없으면 전체 조회
            if (taskId == null || taskId.isEmpty()) {
                ScanRequest scanRequest = ScanRequest.builder()
                        .tableName("SnapCloud")
                        .build();
                List<Map<String, AttributeValue>> items = ddb.scan(scanRequest).items();

                List<Map<String, String>> resultList = items.stream()
                        .map(item -> {
                            Map<String, String> m = new HashMap<>();
                            item.forEach((k, v) -> m.put(k, v.s()));
                            return m;
                        })
                        .collect(Collectors.toList());

                return createResponse(200, gson.toJson(resultList));
            }

            // taskId가 있으면 단일 조회
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("taskId", AttributeValue.builder().s(taskId).build());

            GetItemRequest request = GetItemRequest.builder()
                    .tableName("SnapCloud")
                    .key(key)
                    .build();

            GetItemResponse result = ddb.getItem(request);

            if (!result.hasItem() || result.item().isEmpty()) {
                return createResponse(404, gson.toJson(new Map[] {}));
            } else {
                Map<String, String> itemMap = new HashMap<>();
                result.item().forEach((k, v) -> itemMap.put(k, v.s()));
                // 단일 조회도 배열 안에 넣어 반환
                return createResponse(200, gson.toJson(new Map[] { itemMap }));
            }

        } catch (SdkException e) {  // AWS SDK v2 예외 처리
            return createResponse(500, "{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return createResponse(500, "{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private Map<String, Object> createCorsResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 200);
        response.put("headers", Map.of(
                "Access-Control-Allow-Origin", "*", 
                "Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE",
                "Access-Control-Allow-Headers", "Content-Type"
        ));
        response.put("body", "{}");
        return response;
    }

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
