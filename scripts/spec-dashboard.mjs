import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";

const port = Number(process.argv[2] ?? process.env.SPEC_DASHBOARD_PORT ?? 3216);
const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function has(relPath, pattern) {
  return exists(relPath) && pattern.test(read(relPath));
}

function buildModel() {
  const todo = read("todo.md")
    .split("\n")
    .filter((line) => line.trim().startsWith("- [ ]"))
    .map((line) => line.replace(/^- \[ \]\s*/, "").trim());

  const checks = [
    {
      label: "일반 모드 기본 진입",
      done:
        has("src/store/kiosk.ts", /step:\s*"order-type"/) &&
        has("src/store/kiosk.ts", /state\.step === "menu"/),
      detail: "기본 진입은 order-type, 도움 제안은 menu 단계에서만",
    },
    {
      label: "디버그 점수 + 카메라 라이브",
      done:
        has("src/features/debug/components/DebugPanel.tsx", /data-testid="debug-panel"/) &&
        has("src/features/difficulty/components/DifficultyDetector.tsx", /camera preview/),
      detail: "디버그 패널과 카메라 프리뷰 노출",
    },
    {
      label: "캘리브레이션 디버그 페이지",
      done: exists("src/app/debug/page.tsx"),
      detail: "/debug 페이지 존재",
    },
    {
      label: "GenUI trace / skeleton",
      done:
        has("src/features/barrier-free/components/GenUIScreen.tsx", /Adaptive trace/) &&
        has("src/features/barrier-free/components/GenUIScreen.tsx", /loading/i),
      detail: "Adaptive trace + loading 가시화",
    },
    {
      label: "고정 floating 진행 pill 제거",
      done: !has("src/app/page.tsx", /LiveProgressPill/),
      detail: "메인 페이지에서 floating pill 제거",
    },
    {
      label: "100개 시나리오 매트릭스",
      done: has("e2e/scenario-matrix.spec.ts", /\[demo-voice]/) && has("e2e/scenario-matrix.spec.ts", /\[user]/),
      detail: "user 50 + demo 50",
    },
    {
      label: "SPEC 동기화 메모",
      done: has("prompts/SPEC.md", /2026-03-29 구현 동기화 메모/),
      detail: "SPEC 구현 동기화 메모 존재",
    },
  ];

  const completed = checks.filter((check) => check.done).length;
  const score = Math.round((completed / checks.length) * 100);

  return { todo, checks, completed, score };
}

function renderHtml(model) {
  const { todo, checks, completed, score } = model;
  const cards = checks
    .map(
      (check) => `
        <div class="card ${check.done ? "done" : "todo"}">
          <div class="row">
            <strong>${check.label}</strong>
            <span>${check.done ? "DONE" : "TODO"}</span>
          </div>
          <p>${check.detail}</p>
        </div>`,
    )
    .join("");

  const todoItems = todo.map((item) => `<li>${item}</li>`).join("");

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spec Dashboard</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;background:#111;color:#f5f5f5;margin:0;padding:24px}
      .wrap{max-width:1200px;margin:0 auto;display:grid;gap:20px}
      .hero,.panel{background:#1b1b1b;border:1px solid #333;border-radius:20px;padding:20px}
      .hero h1{margin:0 0 8px;font-size:32px}
      .muted{color:#aaa}
      .meter{height:12px;background:#2a2a2a;border-radius:999px;overflow:hidden;margin-top:10px}
      .meter > div{height:100%;background:linear-gradient(90deg,#ffbc0d,#da291c);width:${score}%}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
      .card{border-radius:16px;padding:16px;border:1px solid #333;background:#141414}
      .card.done{border-color:#3e7b43;background:#122315}
      .card.todo{border-color:#7b5c2a;background:#251d12}
      .row{display:flex;justify-content:space-between;gap:12px;align-items:center}
      a{color:#ffcf54;text-decoration:none}
      ul{margin:0;padding-left:20px;display:grid;gap:8px}
    </style>
    <meta http-equiv="refresh" content="5" />
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <div class="row">
          <div>
            <h1>Spec 대비 구현 대시보드</h1>
            <div class="muted">todo.md + 구현 파일 기준 실시간 로컬 상태</div>
          </div>
          <div><a href="http://127.0.0.1:3105">앱 열기</a> · <a href="http://127.0.0.1:3105/debug">/debug</a></div>
        </div>
        <p>${completed}/${checks.length} 완료 · ${score}%</p>
        <div class="meter"><div></div></div>
      </section>
      <section class="panel">
        <h2>핵심 체크</h2>
        <div class="grid">${cards}</div>
      </section>
      <section class="panel">
        <h2>todo.md 남은 항목</h2>
        <ul>${todoItems}</ul>
      </section>
    </div>
  </body>
</html>`;
}

const server = createServer((_, res) => {
  const html = renderHtml(buildModel());
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Spec dashboard listening on http://127.0.0.1:${port}`);
});
