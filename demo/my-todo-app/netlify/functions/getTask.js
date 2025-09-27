const { DynamoDB } = require('aws-sdk');
const ddb = new DynamoDB.DocumentClient();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({})
    };
  }

  if (event.httpMethod === "GET") {
    const params = { TableName: "SnapCloud" };
    try {
      const data = await ddb.scan(params).promise();
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(data.Items)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS, // 꼭 있어야 함!
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS, // 이것도 꼭!
    body: JSON.stringify({ message: "Method not allowed" })
  };
};
