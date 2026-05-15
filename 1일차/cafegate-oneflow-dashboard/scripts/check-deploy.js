#!/usr/bin/env node
/**
 * 자동 배포 검수 스크립트
 * Claude Code PostToolUse 훅에서 자동 실행됨
 * git push 포함 명령 실행 후에만 동작
 */

const https = require("https");
const { execSync } = require("child_process");

const BASE_URL = "https://first-project-ver2.vercel.app";
const PROJECT  = "first-project-ver2";
const MAX_WAIT = 180_000; // 3분
const POLL_MS  = 6_000;   // 6초마다 확인

// ─── git push 여부 확인 ─────────────────────────────────────
const toolInput = process.env.CLAUDE_TOOL_INPUT || "";
const isGitPush = toolInput.includes("git push");
if (!isGitPush) process.exit(0); // git push 없으면 무음 종료

// ─── 유틸 ───────────────────────────────────────────────────
function httpRequest(url, options = {}) {
  return new Promise((resolve) => {
    const method = options.method || "GET";
    const body   = options.body ? Buffer.from(options.body) : null;
    const urlObj = new URL(url);

    const reqOpts = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(body ? { "Content-Length": body.length } : {}),
        ...options.headers,
      },
      timeout: 12_000,
    };

    const req = https.request(reqOpts, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", (e) => resolve({ status: 0, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, error: "timeout" }); });
    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Vercel 배포 상태 대기 ───────────────────────────────────
async function waitForDeployment() {
  const start = Date.now();
  console.log("\n🔄 [자동검수] 배포 완료 대기 중...");

  while (Date.now() - start < MAX_WAIT) {
    try {
      const out = execSync(`npx vercel ls ${PROJECT} 2>&1`, { encoding: "utf8" });
      const lines = out.split("\n").filter(Boolean);

      for (const line of lines) {
        const ageMatch  = line.match(/(\d+)(s|m|h)\s/);
        const isReady   = line.includes("● Ready");
        const isError   = line.includes("● Error");
        const isBuilding = line.includes("● Building");

        if (!ageMatch) continue;

        const val  = parseInt(ageMatch[1]);
        const unit = ageMatch[2];
        const ageSeconds = unit === "s" ? val : unit === "m" ? val * 60 : val * 3600;

        // 5분 이내 배포만 확인
        if (ageSeconds > 300) break;

        if (isBuilding) {
          process.stdout.write(".");
          break;
        }
        if (isReady)  return { result: "ready",   age: ageSeconds };
        if (isError)  return { result: "error",   age: ageSeconds };
      }
    } catch (e) {
      // vercel CLI 오류 무시
    }
    await sleep(POLL_MS);
  }
  return { result: "timeout" };
}

// ─── API 테스트 스위트 ───────────────────────────────────────
async function runTests() {
  const results = [];

  // 1. 헬스체크
  const health = await httpRequest(`${BASE_URL}/api/health`);
  const healthOk = health.status === 200;
  let healthData = {};
  try { healthData = JSON.parse(health.body); } catch {}
  results.push({
    name: "헬스체크",
    pass: healthOk && healthData.status === "healthy",
    detail: healthOk
      ? `DB:${healthData.checks?.database} / JWT:${healthData.checks?.JWT_SECRET}`
      : `HTTP ${health.status} – ${health.error || health.body?.slice(0, 80)}`,
  });

  // 2. GET /api/code-requests
  const getReq = await httpRequest(`${BASE_URL}/api/code-requests`);
  results.push({
    name: "GET /api/code-requests",
    pass: getReq.status === 200,
    detail: getReq.status === 200
      ? `목록 조회 성공 (${JSON.parse(getReq.body || "[]").length}건)`
      : `HTTP ${getReq.status} – ${getReq.error || getReq.body?.slice(0, 80)}`,
  });

  // 3. POST /api/code-requests (smoke test)
  const postBody = JSON.stringify({
    productName: "__auto_check__", category: "테스트", storageType: "실온",
    supplierName: "자동검수", requestTeam: "자동검수팀", requesterName: "자동검수",
  });
  const postReq = await httpRequest(`${BASE_URL}/api/code-requests`, {
    method: "POST", body: postBody,
  });
  const postOk = postReq.status === 201;
  let createdId = null;
  try { createdId = JSON.parse(postReq.body).id; } catch {}
  results.push({
    name: "POST /api/code-requests",
    pass: postOk,
    detail: postOk
      ? `등록 성공 (id=${createdId})`
      : `HTTP ${postReq.status} – ${postReq.error || postReq.body?.slice(0, 120)}`,
  });

  // 4. 테스트 데이터 정리 (PATCH status=REJECTED)
  if (createdId) {
    await httpRequest(`${BASE_URL}/api/code-requests`, {
      method: "PATCH",
      body: JSON.stringify({ id: createdId, status: "REJECTED", note: "자동검수 테스트 데이터" }),
    });
  }

  return results;
}

// ─── 메인 ───────────────────────────────────────────────────
(async () => {
  const deploy = await waitForDeployment();

  // 타임아웃
  if (deploy.result === "timeout") {
    console.log("\n⚠️  [자동검수] 배포 상태 확인 시간 초과 (3분). 수동으로 확인이 필요합니다.");
    return;
  }

  // 빌드 오류
  if (deploy.result === "error") {
    console.log("\n❌ [자동검수] Vercel 빌드 실패!");
    try {
      const logs = execSync(`npx vercel logs ${PROJECT} 2>&1`, { encoding: "utf8" });
      console.log("빌드 로그:\n" + logs.slice(-1500));
    } catch (e) {
      console.log("빌드 로그 조회 실패:", e.message);
    }
    console.log("\n→ 위 에러를 분석하여 수정이 필요합니다.");
    return;
  }

  // 배포 성공 → API 테스트
  console.log(`\n✅ [자동검수] 배포 완료 (${deploy.age}초 전). API 테스트 시작...`);
  const results = await runTests();

  const allPass = results.every((r) => r.pass);
  console.log("\n┌─────────────────────────────────────────────┐");
  console.log("│            자동 검수 결과                     │");
  console.log("├─────────────────────────────────────────────┤");
  for (const r of results) {
    const icon = r.pass ? "✅" : "❌";
    console.log(`│ ${icon} ${r.name.padEnd(28)} ${r.detail.slice(0, 16).padEnd(16)} │`);
  }
  console.log("└─────────────────────────────────────────────┘");

  if (allPass) {
    console.log("\n🎉 모든 테스트 통과! 배포가 정상 작동 중입니다.");
  } else {
    const failed = results.filter((r) => !r.pass);
    console.log(`\n🚨 ${failed.length}개 항목 실패:`);
    for (const r of failed) {
      console.log(`  - ${r.name}: ${r.detail}`);
    }
    console.log("\n→ 위 실패 항목들을 분석하고 수정이 필요합니다.");
  }
})();
