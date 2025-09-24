const { DynamoDB } = require('aws-sdk');
const ddb = new DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    if (event.httpMethod === "PUT") {
        const data = JSON.parse(event.body);  // 요청 본문에서 데이터 받기

        const { taskId, taskName, status, dueDate, priority } = data;

        // 필수 필드 확인
        if (!taskId || !taskName || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "taskId, taskName, and status are required" }),
            };
        }

        // 기본값 설정
        if (!priority) priority = "normal";  // 기본 우선순위
        if (!dueDate) dueDate = "";  // 기본 마감일

        // DynamoDB에서 데이터 업데이트
        const params = {
            TableName: "SnapCloud",
            Key: {
                taskId,  // taskId로 데이터 조회
            },
            UpdateExpression: "set taskName = :taskName, status = :status, dueDate = :dueDate, priority = :priority, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
                ":taskName": taskName,
                ":status": status,
                ":dueDate": dueDate,
                ":priority": priority,
                ":updatedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",  // 업데이트된 데이터 반환
        };

        try {
            const result = await ddb.update(params).promise();
            return {
                statusCode: 200,
                body: JSON.stringify({ message: `Task with taskId ${taskId} updated successfully`, task: result.Attributes }),
            };
        } catch (error) {
            console.error(error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `Error updating task: ${error.message}` }),
            };
        }
    }

    // PUT 외의 HTTP 메서드는 405 Method Not Allowed
    return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
    };
};
