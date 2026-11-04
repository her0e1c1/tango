"""Read one approved report as data; emit only fixed auth-field classifications."""

import base64
from collections import Counter
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
from urllib.parse import parse_qsl, urlsplit
import zipfile


FIELDS = {"idtoken", "refreshtoken", "accesstoken", "oauthidtoken", "oauthaccesstoken", "sessionid"}
DIGEST = "28fbc21c2e0d8e6c31649bf451f6c2746fe1b12bc4da75fc9c4a15a6c6332782"
MARKER = b'<template id="playwrightReportBase64">data:application/zip;base64,'
LIMIT = 128 * 1024 * 1024


def require(condition):
    if not condition:
        raise ValueError()


def unpack(data, budget):
    # Never extract names, import code, render HTML, or follow resource URLs.
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        require(len(entries) <= 10000 and len({e.filename for e in entries}) == len(entries))
        budget[0] -= sum(e.file_size for e in entries)
        require(budget[0] >= 0)
        for entry in entries:
            path = PurePosixPath(entry.filename)
            require(not path.is_absolute() and ".." not in path.parts and "\\" not in entry.filename)
            require(not stat.S_ISLNK(entry.external_attr >> 16) and not entry.flag_bits & 1)
        return {e.filename: archive.read(e) for e in entries if not e.is_dir()}


def structured(text):
    text = text.lstrip("\ufeff \t\r\n")
    if text.startswith(("{", "[")):
        return json.loads(text)
    if text.startswith(("http://", "https://")):
        url = urlsplit(text)
        text = "&".join(p for p in (url.query, url.fragment.removeprefix("?")) if p)
        return [{"name": k, "value": v} for k, v in parse_qsl(text, keep_blank_values=True)]
    if re.match(r"^[^\s=]*=", text):
        return [{"name": k, "value": v} for k, v in parse_qsl(text, keep_blank_values=True)]
    return None


def classify(archive_bytes):
    budget = [LIMIT]
    report = unpack(archive_bytes, budget)
    html = report["index.html"]
    require(html.count(MARKER) == 1)
    encoded, suffix = html.split(MARKER)[1].split(b"</template>", 1)
    require(not suffix)
    metadata = unpack(base64.b64decode(encoded, validate=True), budget)
    counts = Counter()

    def visit(value, location, provenance, study_fields=False, depth=0):
        require(depth < 100)
        if isinstance(value, dict):
            document = value.get("name")
            study_document = isinstance(document, str) and bool(re.fullmatch(
                r"projects/tango-e2e/databases/\(default\)/documents/studyAnswer/[^/]+", document))
            if isinstance(value.get("name"), str) and "value" in value:
                visit({value["name"]: value["value"]}, location, provenance, depth=depth + 1)
            for key, field in value.items():
                canonical = key.replace("_", "").lower()
                if canonical in FIELDS:
                    shape = ("null" if field is None else "boolean" if isinstance(field, bool)
                             else "string" if isinstance(field, str) else "array" if isinstance(field, list)
                             else "object" if isinstance(field, dict) else "number")
                    if isinstance(field, dict) and set(field) == {"stringValue"}:
                        shape = "firestore-string" if isinstance(field["stringValue"], str) else "invalid-firestore-string"
                    scope = "study-answer-fields" if study_fields else "other-structure"
                    counts[(canonical, shape, scope, location, provenance)] += 1
                visit(field, location, provenance, bool(study_document and key == "fields"), depth + 1)
        elif isinstance(value, list):
            for item in value:
                visit(item, location, provenance, depth=depth + 1)
        elif isinstance(value, str):
            # A malformed JSON-looking string is not necessarily a structured payload (e.g. test expressions).
            try:
                nested = structured(value)
            except ValueError:
                return
            if nested is not None:
                visit(nested, location, provenance, depth=depth + 1)

    for data in metadata.values():
        visit(json.loads(data), "report-metadata", "not-auth-body")
    traces = [data for name, data in report.items() if re.fullmatch(r"data/[a-f0-9]{40}\.zip", name)]
    require(bool(traces))
    for trace in traces:
        entries = unpack(trace, budget)
        auth_resources = set()
        for name, data in entries.items():
            if not name.endswith(".network"):
                continue
            for line in data.splitlines():
                event = json.loads(line)
                require(event.get("type") == "resource-snapshot")
                record = event["snapshot"]
                host = urlsplit(record["request"]["url"]).hostname
                if host in {"auth.app.test", "identitytoolkit.googleapis.com", "securetoken.googleapis.com"}:
                    for side, body in (("request", "postData"), ("response", "content")):
                        reference = record[side].get(body, {}).get("_sha1")
                        if reference:
                            require("resources/" + reference in entries)
                            auth_resources.add("resources/" + reference)
        for name, data in entries.items():
            provenance = "auth-body" if name in auth_resources else "not-auth-body"
            if name.endswith((".network", ".trace")):
                location = "network-event" if name.endswith(".network") else "trace-event"
                for line in data.splitlines():
                    visit(json.loads(line), location, provenance)
            elif name.startswith("resources/"):
                try:
                    text = data.decode()
                except UnicodeDecodeError:
                    continue
                value = structured(text)
                if value is not None:
                    visit(value, "resource", provenance)
    require(bool(counts))
    return counts


if __name__ == "__main__":
    try:
        files = list(Path(os.environ["DIAGNOSTIC_ARCHIVE_DIR"]).iterdir())
        require(len(files) == 1 and files[0].is_file() and not files[0].is_symlink())
        require(files[0].stat().st_size == 3817242)
        archive = files[0].read_bytes()
        require(hashlib.sha256(archive).hexdigest() == DIGEST)
        result = classify(archive)
    except Exception:
        print("Retained report classification stopped; no payload output.", file=sys.stderr)
        sys.exit(1)
    for (field, shape, scope, location, provenance), count in sorted(result.items()):
        print(f"field={field} type={shape} structure={scope} location={location} provenance={provenance} count={count}")
