#!/usr/bin/env python3
"""One-shot compiler/executor. Runs inside a disposable, networkless container."""

from __future__ import annotations

import json
import os
import resource
import selectors
import signal
import subprocess
import sys
import time

MAX_REQUEST_BYTES = 768 * 1024
MAX_SOURCE_BYTES = 32_000
MAX_STDIN_BYTES = 8_192
MAX_CASES = 12
MAX_STREAM_BYTES = 8_192
MAX_COMPILER_BYTES = 32_000
COMPILE_TIMEOUT_SECONDS = 12
CASE_TIMEOUT_SECONDS = 2
WORK_DIR = "/work"
STANDARD_FLAGS = {"c++17": "c++17", "c++20": "c++20", "c++23": "c++23"}


def emit(result: dict[str, object]) -> None:
    sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    sys.stdout.flush()


def input_request() -> dict[str, object]:
    raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
    if len(raw) > MAX_REQUEST_BYTES:
        raise ValueError("request too large")
    value = json.loads(raw)
    if not isinstance(value, dict) or set(value) != {"source", "standard", "tests"}:
        raise ValueError("invalid request shape")
    source = value["source"]
    standard = value["standard"]
    tests = value["tests"]
    if not isinstance(source, str) or len(source.encode("utf-8")) > MAX_SOURCE_BYTES:
        raise ValueError("invalid source")
    if standard not in STANDARD_FLAGS:
        raise ValueError("unsupported C++ standard")
    if not isinstance(tests, list) or not 1 <= len(tests) <= MAX_CASES:
        raise ValueError("invalid test list")
    for case in tests:
        if not isinstance(case, dict) or set(case) != {"stdin"}:
            raise ValueError("invalid test case")
        if not isinstance(case["stdin"], str) or len(case["stdin"].encode("utf-8")) > MAX_STDIN_BYTES:
            raise ValueError("invalid test input")
    return value


def _limits(cpu_seconds: int, address_space_bytes: int) -> None:
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    resource.setrlimit(resource.RLIMIT_FSIZE, (48 * 1024 * 1024, 48 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
    resource.setrlimit(resource.RLIMIT_AS, (address_space_bytes, address_space_bytes))


def _kill_group(process: subprocess.Popen[bytes]) -> None:
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    except PermissionError:
        process.kill()


def run_bounded(
    args: list[str],
    stdin: bytes,
    wall_seconds: float,
    output_limit: int,
    cpu_seconds: int,
    address_space_bytes: int,
) -> dict[str, object]:
    started = time.monotonic()
    environment = {
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "HOME": WORK_DIR,
        "TMPDIR": WORK_DIR,
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "ASAN_OPTIONS": "detect_leaks=0:allocator_may_return_null=1:abort_on_error=1:symbolize=0",
        "UBSAN_OPTIONS": "halt_on_error=1:print_stacktrace=0",
    }
    process = subprocess.Popen(
        args,
        cwd=WORK_DIR,
        env=environment,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        close_fds=True,
        start_new_session=True,
        preexec_fn=lambda: _limits(cpu_seconds, address_space_bytes),
    )
    assert process.stdin is not None
    assert process.stdout is not None
    assert process.stderr is not None
    try:
        process.stdin.write(stdin)
    except BrokenPipeError:
        pass
    finally:
        try:
            process.stdin.close()
        except BrokenPipeError:
            pass

    captured = {"stdout": bytearray(), "stderr": bytearray()}
    selector = selectors.DefaultSelector()
    selector.register(process.stdout, selectors.EVENT_READ, "stdout")
    selector.register(process.stderr, selectors.EVENT_READ, "stderr")
    deadline = started + wall_seconds
    timed_out = False
    output_limited = False

    while selector.get_map():
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            timed_out = True
            _kill_group(process)
            break

        for key, _ in selector.select(min(0.1, remaining)):
            data = os.read(key.fileobj.fileno(), min(4096, output_limit + 1))
            if not data:
                selector.unregister(key.fileobj)
                continue
            current = captured[key.data]
            room = output_limit - len(current)
            if len(data) > room:
                if room > 0:
                    current.extend(data[:room])
                output_limited = True
                _kill_group(process)
                break
            current.extend(data)

        if output_limited:
            break
        if process.poll() is not None:
            # Do not leave detached children running after their parent exits.
            _kill_group(process)

    if timed_out or output_limited:
        _kill_group(process)
    try:
        process.wait(timeout=1)
    except subprocess.TimeoutExpired:
        _kill_group(process)
        process.wait(timeout=1)

    selector.close()
    process.stdout.close()
    process.stderr.close()
    duration = round((time.monotonic() - started) * 1000)
    return {
        "stdout": captured["stdout"].decode("utf-8", errors="replace"),
        "stderr": captured["stderr"].decode("utf-8", errors="replace"),
        "exitCode": process.returncode,
        "durationMs": duration,
        "timedOut": timed_out,
        "outputLimited": output_limited,
    }


def main() -> int:
    try:
        request = input_request()
    except Exception:
        emit({"status": "runner_error", "compilerOutput": "実行リクエストの形式が不正です。", "cases": []})
        return 0

    source_path = os.path.join(WORK_DIR, "main.cpp")
    binary_path = os.path.join(WORK_DIR, "program")
    with open(source_path, "x", encoding="utf-8", newline="") as source_file:
        source_file.write(request["source"])

    compile_result = run_bounded(
        [
            "g++",
            f"-std={STANDARD_FLAGS[request['standard']]}",
            "-O0",
            "-Wall",
            "-Wextra",
            "-Wpedantic",
            "-fno-diagnostics-color",
            "-fno-sanitize-recover=all",
            "-fno-omit-frame-pointer",
            "-D_GLIBCXX_ASSERTIONS",
            "-fsanitize=undefined",
            source_path,
            "-o",
            binary_path,
        ],
        b"",
        COMPILE_TIMEOUT_SECONDS,
        MAX_COMPILER_BYTES,
        COMPILE_TIMEOUT_SECONDS + 1,
        448 * 1024 * 1024,
    )
    compiler_output = compile_result["stderr"] + compile_result["stdout"]
    if compile_result["timedOut"] or compile_result["outputLimited"] or compile_result["exitCode"] is None or compile_result["exitCode"] < 0 or "virtual memory exhausted" in compiler_output:
        emit({
            "status": "runner_error",
            "compilerOutput": "コンパイルが実行時間または出力上限を超えました。",
            "cases": [],
        })
        return 0
    if compile_result["exitCode"] != 0:
        emit({"status": "compile_error", "compilerOutput": compiler_output, "cases": []})
        return 0

    cases = []
    for test in request["tests"]:
        case = run_bounded(
            [binary_path],
            test["stdin"].encode("utf-8"),
            CASE_TIMEOUT_SECONDS,
            MAX_STREAM_BYTES,
            CASE_TIMEOUT_SECONDS + 1,
            384 * 1024 * 1024,
        )
        cases.append(case)

    emit({"status": "ok", "compilerOutput": compiler_output, "cases": cases})
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"C++ worker internal error ({type(error).__name__})", file=sys.stderr, flush=True)
        emit({"status": "runner_error", "compilerOutput": "実行ワーカーで内部エラーが発生しました。", "cases": []})
        raise SystemExit(0)
