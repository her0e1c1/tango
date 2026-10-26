"""Prepare a private, review-required copy of a Playwright 1.61 HTML report.

Resource names remain opaque lookup keys: their SHA-256 before/after values are
recorded separately. This never certifies arbitrary screenshots or DOM as public.
"""

import base64
import hashlib
from html.parser import HTMLParser
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile
from urllib.parse import parse_qs, parse_qsl, quote, unquote, urlsplit
import zipfile


MARKER = b'<template id="playwrightReportBase64">data:application/zip;base64,'
REDACTED = "[REDACTED E2E AUTH]"
JWT = re.compile(rb"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")
AUTH_KEYS = {"idtoken", "refreshtoken", "accesstoken", "oauthidtoken", "oauthaccesstoken", "sessionid"}
HEADERS = {"authorization", "proxy-authorization", "cookie", "set-cookie"}
VIEWER = Path(os.environ.get("PLAYWRIGHT_PRIVACY_VIEWER_ASSETS", "node_modules/playwright-core/lib/vite"))


class PrivacyError(ValueError):
    """Messages are fixed classifications, never parser text or report values."""


class AuthAttributes(HTMLParser):
    """The pinned Auth Emulator widget stores fake IdP assertions in this attribute."""

    def __init__(self):
        super().__init__()
        self.values = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key == "data-id-token" and value:
                claims = json.loads(unquote(value))
                require(isinstance(claims.get("sub"), str) and bool(claims["sub"]), "unexpected widget assertion")
                require(not claims.get("email") or claims["email"].endswith("@example.test"),
                        "unexpected widget identity")
                self.values.extend((value.encode(), unquote(value).encode()))


def require(condition, reason):
    if not condition:
        raise PrivacyError(reason)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def unpack(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        require(len(set(names)) == len(names), "duplicate ZIP entries")
        require(all(not n.startswith("/") and ".." not in PurePosixPath(n).parts
                    and "\\" not in n for n in names), "unsafe ZIP path")
        require(archive.testzip() is None, "ZIP CRC failure")
        return {name: archive.read(name) for name in names if not name.endswith("/")}


def pack(files):
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return output.getvalue()


def walk(value):
    yield value
    if isinstance(value, dict):
        for item in value.values():
            yield from walk(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk(item)


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()


def structured(data):
    strict = isinstance(data, bytes)
    text = data.decode() if isinstance(data, bytes) else data
    text = text.lstrip("\ufeff \t\r\n")
    if text == REDACTED:
        return None
    if text.startswith(("{", "[")):
        try:
            return json.loads(text)
        except ValueError:
            if strict:
                raise PrivacyError("malformed structured resource") from None
            return None
    is_url = text.startswith(("http://", "https://"))
    if is_url:
        url = urlsplit(text)
        require(not url.username and not url.password, "unexpected URL credentials")
        text = "&".join(part for part in (url.query, url.fragment.removeprefix("?")) if part)
    # URL query names and valid form field names can be percent-encoded or empty.
    if is_url or re.match(r"^[^\s=]*=", text):
        return [{"name": key, "value": value}
                for key, value in parse_qsl(text, keep_blank_values=True)]
    return None


def emulator_jwt(token):
    header, payload, signature = token.decode().split(".")
    decode = lambda part: json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
    require(not signature and decode(header).get("alg") == "none", "unexpected signed token")
    claims = decode(payload)
    require(claims.get("aud") == "tango-e2e"
            and claims.get("iss") == "https://securetoken.google.com/tango-e2e",
            "unexpected token project or issuer")
    require(not claims.get("email") or claims["email"].endswith("@example.test"), "unexpected token identity")


def prepare(source, source_json, destination):
    source, source_json, destination = source.resolve(), source_json.resolve(), destination.resolve()
    require(not destination.exists() and source not in destination.parents
            and destination not in source.parents, "output must be a separate new directory")
    files = {}
    for path in source.rglob("*"):
        require(not path.is_symlink(), "symlink in report")
        if path.is_file():
            files[path.relative_to(source).as_posix()] = path.read_bytes()
    original = {name: digest(data) for name, data in files.items()}
    report_bytes = source_json.read_bytes()
    report = json.loads(report_bytes)
    html = files["index.html"]
    require(html.count(MARKER) == 1, "unsupported HTML report format")
    prefix, embedded = html.split(MARKER)
    encoded, suffix = embedded.split(b"</template>", 1)
    require(not suffix, "unexpected trailing HTML")
    metadata = unpack(base64.b64decode(encoded, validate=True))
    require("report.json" in metadata and all(n.endswith(".json") for n in metadata),
            "unsupported report metadata")
    # Reject extra files and modified viewer code instead of copying arbitrary payloads.
    referenced = {item["path"] for data in metadata.values() for item in walk(json.loads(data))
                  if isinstance(item, dict) and isinstance(item.get("path"), str)
                  and item["path"].startswith("data/")}
    require(referenced == {n for n in files if n.startswith("data/")}, "unbound report data")
    require(all(re.fullmatch(r"data/[a-f0-9]{40}\.(zip|png|md)", name) for name in referenced),
            "unsupported report attachment")
    viewer = VIEWER
    static = (viewer / "htmlReport/index.html").read_bytes()
    static = re.sub(rb'<script type="module"[^>]*></script>',
                    lambda _: b'<script type="module">' + (viewer / "htmlReport/report.js").read_bytes() + b'</script>', static)
    static = re.sub(rb'<link rel="stylesheet"[^>]*>',
                    lambda _: b"<style type='text/css'>" + (viewer / "htmlReport/report.css").read_bytes() + b'</style>', static)
    require(prefix == static, "unexpected HTML viewer code")
    for name, data in files.items():
        if name.startswith("trace/"):
            asset = viewer / "traceViewer" / name.removeprefix("trace/")
            require(asset.is_file() and asset.read_bytes() == data, "unexpected trace viewer asset")
        else:
            require(name == "index.html" or name in referenced, "unexpected report file")
    traces = {name: unpack(data) for name, data in files.items()
              if name.startswith("data/") and name.endswith(".zip")}
    tokens = set()
    auth_bodies = set()
    network_count = snapshots = images = auth_attributes = 0
    for name, entries in traces.items():
        require(any(n.endswith(".trace") for n in entries), "attachment is not a trace")
        for key, data in entries.items():
            require(key.startswith("resources/") or key.endswith((".trace", ".network", ".stacks")),
                    "unexpected trace entry")
            if key.endswith(".trace"):
                snapshots += sum(json.loads(line).get("type") == "frame-snapshot"
                                 for line in data.splitlines() if line)
            if data.startswith((b"\x89PNG", b"\xff\xd8\xff")):
                images += 1
            if not key.endswith(".network"):
                continue
            for line in data.splitlines():
                event = json.loads(line)
                require(event.get("type") == "resource-snapshot", "unexpected network event")
                resource = event["snapshot"]
                network_count += 1
                url = urlsplit(resource["request"]["url"])
                require(not url.username and not url.password, "unexpected URL credentials")
                local = (url.scheme, url.hostname, url.port) in {
                    ("http", "app.test", 4173), ("http", "auth.app.test", 9099),
                    ("http", "db", 8080), ("http", "127.0.0.1", 4173),
                }
                mocked_auth = url.hostname in {"identitytoolkit.googleapis.com", "securetoken.googleapis.com"}
                empty_decoration = url.hostname in {"unpkg.com", "fonts.googleapis.com"}
                if not (local or mocked_auth or empty_decoration):
                    # Fixed public SDK/test hosts only; arbitrary DNS labels can themselves contain private values.
                    known = {"app.test", "auth.app.test", "app", "auth", "db", "localhost", "127.0.0.1",
                             "tango-e2e.firebaseapp.com", "apis.google.com", "www.googleapis.com", "www.gstatic.com",
                             "accounts.google.com", "www.google.com", "fonts.gstatic.com"}
                    host = url.hostname if url.hostname in known else "other-" + digest((url.hostname or "").encode())[:12]
                    scheme = url.scheme if url.scheme in {"http", "https", "data", "blob", "about"} else "other"
                    port = url.port or {"http": 80, "https": 443}.get(scheme, 0)
                    raise PrivacyError(f"unexpected network origin ({scheme}://{host}:{port})")
                if mocked_auth:
                    require(parse_qs(url.query).get("key") == ["e2e-api-key"], "unexpected API key")
                auth = url.hostname == "auth.app.test" or mocked_auth
                if auth:
                    for field, values in parse_qs(url.query).items():
                        if field.replace("_", "").lower() in AUTH_KEYS:
                            tokens.update(value.encode() for value in values if value)
                for side, body in ((resource["request"], "postData"), (resource["response"], "content")):
                    reference = side.get(body, {}).get("_sha1")
                    if reference:
                        require("resources/" + reference in entries, "missing network body")
                        if auth:
                            auth_bodies.add((name, "resources/" + reference))
                if empty_decoration:
                    reference = resource["response"].get("content", {}).get("_sha1")
                    require(not reference or not entries["resources/" + reference],
                            "unexpected external response body")
                for side in (resource["request"], resource["response"]):
                    require(not side.get("cookies"), "unexpected session cookies")
                    for header in side.get("headers", []):
                        if header["name"].lower() in HEADERS:
                            value = header["value"]
                            require(not value or value == "Bearer owner" or JWT.fullmatch(value.removeprefix("Bearer ").encode()),
                                    "unexpected credential header")
                            if value:
                                tokens.add(value.encode())
    for name, key in auth_bodies:
        data = traces[name][key]
        try:
            body = structured(data)
        except UnicodeDecodeError:
            # Auth emulator also serves its static popup. Its text is scanned below.
            continue
        if body is None and data.lstrip().startswith(b"<"):
            parser = AuthAttributes()
            parser.feed(data.decode())
            tokens.update(parser.values)
            auth_attributes += len(parser.values) // 2
        for item in walk(body):
            if isinstance(item, dict):
                fields = [(item["name"], item["value"])] if isinstance(item.get("name"), str) and "value" in item else item.items()
                for key, value in fields:
                    if key.replace("_", "").lower() in AUTH_KEYS and value:
                        require(isinstance(value, str) and len(value) >= 12, "unexpected auth field")
                        tokens.add(value.encode())
    payloads = [report_bytes, *metadata.values(), *files.values()]
    payloads += [data for entries in traces.values() for data in entries.values()]
    for data in payloads:
        for token in JWT.findall(data):
            emulator_jwt(token)
            tokens.add(token)
    # Validate tokens collected through headers/bodies too, before replacing them.
    for token in tokens:
        for jwt in JWT.findall(token):
            emulator_jwt(jwt)
    # Auth headers can also be serialized into WebChannel query/body JSON.
    replacement_values = tokens | {b"Bearer " + token for token in tokens if JWT.fullmatch(token)}
    replacements = {variant for token in replacement_values for variant in (
        token, quote(token.decode(), safe="").encode(),
        quote(quote(token.decode(), safe=""), safe="").encode(),
        json.dumps(token.decode())[1:-1].encode())}

    def redact(data):
        for token in sorted(replacements, key=len, reverse=True):
            data = data.replace(token, REDACTED.encode())
        require(not JWT.search(data), "unredacted token")
        return data

    def check_fields(value):
        for item in walk(value):
            if isinstance(item, dict):
                if isinstance(item.get("name"), str) and "value" in item:
                    check_fields({item["name"]: item["value"]})
                for key, field in item.items():
                    if key.replace("_", "").lower() in AUTH_KEYS:
                        require(not field or field == REDACTED, "unrecognized auth field")
                    if key.replace("_", "").lower() in {"password", "clientsecret", "privatekey", "sessioncookie", "secret", "token"}:
                        require(not field, "unexpected secret field")
                    if key.lower() == "email" and field:
                        require(isinstance(field, str) and field.endswith("@example.test"), "unexpected email identity")
                    if key.replace("_", "").lower() == "apikey":
                        require(field in (None, "", "e2e-api-key", REDACTED), "unexpected API key")
                    if key.lower() in HEADERS:
                        require(not field or field == REDACTED, "unrecognized credential header")
                    if key.lower() == "cookies":
                        require(not field, "unexpected session cookies")
            elif isinstance(item, str):
                try:
                    nested = structured(item)
                except UnicodeDecodeError:
                    continue
                if nested is not None:
                    check_fields(nested)

    for name, entries in traces.items():
        for key, data in entries.items():
            data = redact(data)
            if key.endswith((".network", ".trace")):
                for line in data.splitlines():
                    check_fields(json.loads(line))
            else:
                try:
                    check_fields(structured(data))
                except UnicodeDecodeError:
                    pass
            entries[key] = data
        files[name] = pack(entries)
    for name, data in files.items():
        if name not in traces and name != "index.html":
            files[name] = redact(data)
    for name, data in metadata.items():
        data = redact(data)
        check_fields(json.loads(data))
        metadata[name] = data
    files["index.html"] = redact(prefix) + MARKER + base64.b64encode(pack(metadata)) + b"</template>" + redact(suffix)
    # Bind every file-backed JSON attachment to its original standard HTML copy.
    report = json.loads(redact(report_bytes))
    for item in walk(report):
        if not isinstance(item, dict) or "attachments" not in item:
            continue
        for attachment in item["attachments"]:
            if attachment.get("path"):
                path = Path(attachment["path"]).resolve()
                if Path.cwd().resolve() not in path.parents:
                    require(str(path).startswith("/workspace/test-results/"), "unsupported runner path")
                    path = Path.cwd() / path.relative_to("/workspace")
                require(not path.is_symlink() and Path.cwd().resolve() in path.parents, "unsafe source attachment")
                raw = path.read_bytes()
                name = "data/" + hashlib.sha1(raw).hexdigest() + path.suffix
                require(name in original and original[name] == digest(raw), "source attachment mismatch")
                attachment["path"] = str(destination.relative_to(Path.cwd().resolve()) / "html" / name)
            if attachment.get("body"):
                body = redact(base64.b64decode(attachment["body"], validate=True))
                try:
                    check_fields(structured(body))
                except UnicodeDecodeError:
                    pass
                attachment["body"] = base64.b64encode(body).decode()
    check_fields(report)
    html_total = json.loads(metadata["report.json"])["stats"]["total"]
    if "stats" in report:
        require(html_total == sum(report["stats"][key] for key in ("expected", "unexpected", "flaky", "skipped")),
                "report count mismatch")
    manifest = {
        "schema": 1, "publication_approved": False,
        "source": {"run_id": os.environ.get("GITHUB_RUN_ID"), "attempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
                   "commit": os.environ.get("GITHUB_SHA"), "head_commit": os.environ.get("E2E_SOURCE_HEAD_SHA"),
                   "json_sha256": digest(report_bytes)},
        "counts": {"traces": len(traces), "network_records": network_count,
                   "tests": html_total, "credential_values_removed": len(tokens),
                   "jwt_values_removed": sum(bool(JWT.fullmatch(token)) for token in tokens),
                   "auth_attributes_removed": auth_attributes, "dom_snapshots": snapshots, "trace_images": images},
        "html_bytes": sum(len(data) for data in files.values()),
        "review_required": ["screenshots and arbitrary DOM text", "fixture-only provenance", "publication destination and scope"],
        "files": [{"path": name, "bytes": len(data), "source_sha256": original[name], "prepared_sha256": digest(data)}
                  for name, data in sorted(files.items())],
    }
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix="report-preparation-", dir=destination.parent))
    try:
        for name, data in files.items():
            path = temporary / "html" / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        (temporary / "report.json").write_bytes(json_bytes(report))
        (temporary / "manifest.json").write_bytes(json_bytes(manifest))
        require(all(digest((source / name).read_bytes()) == value for name, value in original.items())
                and digest(source_json.read_bytes()) == digest(report_bytes), "source evidence changed")
        temporary.rename(destination)
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)
    return manifest


if __name__ == "__main__":
    try:
        result = prepare(*(Path(arg) for arg in sys.argv[1:]))
        print("Private report preparation passed: " + json.dumps(result["counts"]) + "; publication remains disabled.")
        print("Prepared payload bytes=" + str(result["html_bytes"]) + "; manifest SHA-256=" + digest(json_bytes(result)))
        # Paths are pinned viewer assets or opaque attachment hashes; no recorded values are included.
        print("Private preparation manifest: " + json_bytes(result).decode())
    except Exception as error:
        # Parser and filesystem exceptions may contain payloads/paths. Never log their messages.
        reason = str(error) if isinstance(error, PrivacyError) else type(error).__name__
        print("Private report preparation failed: " + reason + "; no candidate approved.", file=sys.stderr)
        sys.exit(1)
