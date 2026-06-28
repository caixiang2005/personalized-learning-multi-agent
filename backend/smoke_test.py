"""Quick smoke test for user-service :8001, learn-service :8002."""
import json
import sys
import urllib.error
import urllib.request

BASES = {
    "user-service": "http://127.0.0.1:8001",
    "learn-service": "http://127.0.0.1:8002",
}


def req(method: str, url: str, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", **(headers or {})}
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=8) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {"raw": str(e)}


def check(name: str, ok: bool, detail: str = ""):
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    return ok


def main() -> int:
    all_ok = True

    for svc, base in BASES.items():
        print(f"\n== {svc} ({base}) ==")
        try:
            with urllib.request.urlopen(base + "/openapi.json", timeout=5) as r:
                openapi = json.loads(r.read())
            paths = set(openapi.get("paths", {}))
            all_ok &= check("openapi", True, f"{len(paths)} routes")
        except Exception as exc:
            all_ok &= check("openapi", False, str(exc))
            continue

        if svc == "user-service":
            code, body = req("GET", base + "/api/user/getUserInfo")
            all_ok &= check("getUserInfo 401", code == 200 and body.get("code") == 401)
            code, body = req("GET", base + "/api/user/stats")
            all_ok &= check("user/stats 401", code == 200 and body.get("code") == 401)
            code, body = req("POST", base + "/api/safety/check", {"text": "hello"})
            all_ok &= check("safety via user fallback", True, "N/A (user-service has no safety)")

        if svc == "learn-service":
            code, body = req("POST", base + "/api/safety/check", {"text": "hello"})
            all_ok &= check(
                "safety/check",
                code == 200 and body.get("code") == 200 and body.get("data", {}).get("safe") is True,
            )
            code, body = req("GET", base + "/api/profile")
            all_ok &= check("profile 401", code == 200 and body.get("code") == 401)
            code, body = req("GET", base + "/api/learning-path")
            all_ok &= check("learning-path 401", code == 200 and body.get("code") == 401)
            code, body = req("GET", base + "/api/chat/sessions")
            all_ok &= check("chat/sessions 401", code == 200 and body.get("code") == 401)
            code, body = req("GET", base + "/api/analytics/activity")
            all_ok &= check("analytics/activity 401", code == 200 and body.get("code") == 401)
            code, body = req("POST", base + "/api/analytics/record", {"activity": "chat"})
            all_ok &= check("analytics/record 401", code == 200 and body.get("code") == 401)
            code, body = req("POST", base + "/api/chat/feedback", {"messageId": "1", "type": "useful"})
            all_ok &= check("chat/feedback 401", code == 200 and body.get("code") == 401)
            has_generate_stages = "/api/learning-path/generate" in paths
            all_ok &= check("learning-path/generate route", has_generate_stages)

    print("\n" + ("All checks passed." if all_ok else "Some checks failed."))
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
