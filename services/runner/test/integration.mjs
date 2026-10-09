import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { startRunnerService } from "../src/server.mjs";

const token = randomBytes(32).toString("base64url");
const production = process.env.NODE_ENV === "production";
const origin = production ? "https://cpp.example" : "http://localhost:3000";
const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  RUNNER_API_TOKEN: token,
  RUNNER_ALLOWED_ORIGINS: origin,
  RUNNER_DOCKER_RUNTIME: process.env.RUNNER_DOCKER_RUNTIME ?? "runc",
  RUNNER_SANDBOX_IMAGE: process.env.RUNNER_SANDBOX_IMAGE ?? "cpp-mastery-sandbox:ci",
  RUNNER_MAX_CONCURRENT_JOBS: "2",
  RUNNER_HOST: "127.0.0.1",
  RUNNER_PORT: "0",
};

const server = await startRunnerService(env);
const address = server.address();
assert.ok(address && typeof address === "object");
const url = `http://127.0.0.1:${address.port}`;

async function submit(job) {
  const response = await fetch(`${url}/v1/execute`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, origin, "content-type": "application/json" },
    body: JSON.stringify(job),
    signal: AbortSignal.timeout(60_000),
  });
  return { response, body: await response.json() };
}

async function grade(lessonId, source, standard = "c++17") {
  const response = await fetch(`${url}/v1/grade`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, origin, "content-type": "application/json" },
    body: JSON.stringify({ lessonId, source, standard }),
    signal: AbortSignal.timeout(60_000),
  });
  return { response, body: await response.json() };
}

try {
  const health = await fetch(`${url}/healthz`);
  assert.equal(health.status, 200);

  const hiddenGrade = await grade("w3-d1", "#include <iostream>\nint main(){int a{},b{};std::cin>>a>>b;std::cout<<\"q=\"<<a/b<<\" r=\"<<a%b;}\n");
  assert.equal(hiddenGrade.response.status, 200, JSON.stringify(hiddenGrade.body));
  assert.equal(hiddenGrade.body.status, "passed", JSON.stringify(hiddenGrade.body));
  assert.equal(hiddenGrade.body.score, 100);
  assert.equal(hiddenGrade.body.cases.length, 1, "only public case details should be returned");
  assert.equal(JSON.stringify(hiddenGrade.body).includes("19 4"), false);

  const hiddenFailure = await grade("w3-d1", "#include <iostream>\nint main(){std::cout<<\"q=3 r=2\";}\n");
  assert.equal(hiddenFailure.body.status, "failed");
  assert.ok(hiddenFailure.body.score < 100, "hidden test failures must affect the server-owned score");
  assert.equal(hiddenFailure.body.cases[0].passed, true, "the hardcoded answer should still pass the public case");
  assert.equal(JSON.stringify(hiddenFailure.body).includes("q=4 r=3"), false);

  for (const standard of ["c++17", "c++20", "c++23"]) {
    const result = await submit({
      source: "#include <iostream>\nint main(){int n=0; while(std::cin>>n) std::cout << n*2 << '\\n';}\n",
      standard,
      tests: [{ stdin: "21\n" }, { stdin: "7\n" }],
    });
    assert.equal(result.response.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.status, "ok", JSON.stringify(result.body));
    assert.deepEqual(result.body.cases.map((test) => test.stdout), ["42\n", "14\n"]);
    assert.ok(result.body.cases.every((test) => test.exitCode === 0 && !test.timedOut));
  }

  const compileError = await submit({ source: "int main( {", standard: "c++17", tests: [{ stdin: "" }] });
  assert.equal(compileError.body.status, "compile_error");
  assert.match(compileError.body.compilerOutput, /error:/);

  const timeout = await submit({ source: "int main(){for(;;){}}", standard: "c++17", tests: [{ stdin: "" }] });
  assert.equal(timeout.body.status, "ok");
  assert.equal(timeout.body.cases[0].timedOut, true);

  const outputLimit = await submit({ source: "#include <iostream>\nint main(){for(;;)std::cout<<'x';}\n", standard: "c++17", tests: [{ stdin: "" }] });
  assert.equal(outputLimit.body.status, "ok");
  assert.equal(outputLimit.body.cases[0].outputLimited, true);
  assert.ok(Buffer.byteLength(outputLimit.body.cases[0].stdout) <= 8192);

  const noNetwork = await submit({
    source: "#include <ifaddrs.h>\n#include <iostream>\n#include <string>\nint main(){ifaddrs* p=nullptr;getifaddrs(&p);bool external=false;for(auto* i=p;i;i=i->ifa_next)if(i->ifa_name&&std::string(i->ifa_name)!=\"lo\")external=true;freeifaddrs(p);std::cout<<(external?\"external\":\"loopback-only\")<<'\\n';}\n",
    standard: "c++20",
    tests: [{ stdin: "" }],
  });
  assert.equal(noNetwork.body.cases[0].stdout, "loopback-only\n");

  const restrictedUser = await submit({
    source: "#include <iostream>\n#include <unistd.h>\nint main(){std::cout<<geteuid()<<' '<<getegid()<<'\\n';}\n",
    standard: "c++17",
    tests: [{ stdin: "" }],
  });
  assert.equal(restrictedUser.body.cases[0].stdout, "65532 65532\n");

  const memoryLimit = await submit({
    source: "#include <cstdlib>\n#include <iostream>\nint main(){constexpr std::size_t n=1024ULL*1024*1024;auto* p=static_cast<volatile unsigned char*>(std::malloc(n));if(!p){std::cout<<\"memory-limited\\n\";return 0;}for(std::size_t i=0;i<n;i+=4096)p[i]=1;std::cout<<\"allocated\\n\";}\n",
    standard: "c++17",
    tests: [{ stdin: "" }],
  });
  assert.equal(memoryLimit.body.status, "ok");
  assert.ok(memoryLimit.body.cases[0].exitCode !== 0 || memoryLimit.body.cases[0].stdout === "memory-limited\n");

  const isolatedCases = await submit({
    source: "#include <fstream>\n#include <iostream>\nint main(){int n=0;std::ifstream in(\"counter.txt\");in>>n;std::ofstream out(\"counter.txt\");out<<n+1;std::cout<<n<<'\\n';}\n",
    standard: "c++17",
    tests: [{ stdin: "" }, { stdin: "" }],
  });
  assert.deepEqual(isolatedCases.body.cases.map((test) => test.stdout), ["0\n", "0\n"]);

  console.info("Docker sandbox integration checks passed (C++17/20/23, compile error, timeout, output cap, network, identity, memory, and per-case filesystem isolation).");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
