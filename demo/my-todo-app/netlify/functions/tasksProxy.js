// netlify/functions/tasksProxy.js
const { ok, bad, preflight } = require("./_cors");
const API_BASE = "https://nlyoatc1wg.execute-api.ap-northeast-2.amazonaws.com/SnapCloud";
const SAFE = (s) => String(s ?? "").trim().replace(/[`\s]/g, "");

async function send(method, url, body, extraHeaders = {}) {
  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: ["POST","PUT","PATCH","DELETE"].includes(method) && body != null
      ? (typeof body === "string" ? body : JSON.stringify(body))
      : undefined,
  });
  const raw = await resp.text();
  let payload; try { payload = raw ? JSON.parse(raw) : null; } catch { payload = { message: raw }; }
  return { ok: resp.ok, status: resp.status, url, method, body, payload };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflight(event);

    const method = event.httpMethod.toUpperCase();
    if (!["GET","POST","PUT","DELETE"].includes(method))
      return bad(event, `Method ${method} not allowed`, 405);

    // DEBUG 모드(원인파악용): /tasksProxy?debug=1&...
    const debug = event.queryStringParameters?.debug === "1";

    if (method !== "DELETE") {
      const upstream = await send(
        method,
        `${API_BASE}/tasks${event.rawQueryString ? `?${event.rawQueryString}` : ""}`,
        ["POST","PUT"].includes(method) ? event.body : null
      );
      if (!upstream.ok) return bad(event, { upstream }, upstream.status);
      return ok(event, upstream.payload);
    }

    // ---- DELETE: id 추출 & 정제 ----
    const qs = event.queryStringParameters || {};
    const bodyObj = (() => { try { return JSON.parse(event.body || "{}"); } catch { return {}; } })();
    const idRaw = qs.taskId ?? qs.id ?? bodyObj.taskId ?? bodyObj.id ?? bodyObj.task_id;
    const id = SAFE(idRaw);
    if (!id) return bad(event, "taskId is required", 400);

    // ---- 여러 형태 폴백 시도 (요구 형식 불명일 때 한 방에 해결) ----
    const attempts = [];

    // 1) DELETE /tasks?taskId=ID  + body: {taskId,id,task_id}
    attempts.push(await send("DELETE", `${API_BASE}/tasks?taskId=${encodeURIComponent(id)}`, { taskId: id, id, task_id: id }));

    // 2) DELETE /tasks?id=ID      + body 동시
    if (!attempts.at(-1).ok) attempts.push(await send("DELETE", `${API_BASE}/tasks?id=${encodeURIComponent(id)}`, { taskId: id, id, task_id: id }));

    // 3) DELETE /tasks/ID         (일부 API는 경로만 허용, 바디 없이)
    if (!attempts.at(-1).ok) attempts.push(await send("DELETE", `${API_BASE}/tasks/${encodeURIComponent(id)}`, null));

    // 4) POST /tasks/delete       + body: {taskId}
    if (!attempts.at(-1).ok) attempts.push(await send("POST", `${API_BASE}/tasks/delete`, { taskId: id }));

    const success = attempts.find(a => a.ok);
    if (success) return ok(event, success.payload);

    // 모두 실패 → 어떤 요청을 보냈는지 디버그 포함해서 에러 반환
    const last = attempts.at(-1);
    return bad(event, debug ? { attempts } : (last.payload?.error || last.payload?.message || "Delete failed"), last.status || 400);

  } catch (e) {
    return bad(event, e?.message || "Proxy error", 502);
  }
};
