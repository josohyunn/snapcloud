// netlify/functions/_cors.js
function corsHeaders(event, extra = {}) {
  const h = (k) => event.headers?.[k] || event.headers?.[k.toLowerCase()];
  const origin = h("origin") || "*";
  const reqHeaders = h("access-control-request-headers") || "Content-Type";

  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": reqHeaders,
    "Content-Type": "application/json",
    ...extra,
  };
}

function ok(event, data) {
  return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify(data ?? null) };
}
function bad(event, msg, code = 400) {
  return { statusCode: code, headers: corsHeaders(event), body: JSON.stringify({ error: msg }) };
}
function preflight(event) {
  return { statusCode: 204, headers: corsHeaders(event), body: "" };
}

module.exports = { ok, bad, preflight };
