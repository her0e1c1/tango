"""Fixed, nonconfidential regression inputs for the private preparation boundary."""

import base64
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import quote, urlencode


sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("prepare_report", Path(__file__).with_name("prepare-report.py"))
privacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)


def token(audience="tango-e2e", signature=""):
    encode = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b"=").decode()
    return ".".join((encode({"alg": "none"}), encode({"aud": audience, "iss": "https://securetoken.google.com/tango-e2e"}), signature))


class ReportPrivacy(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix=".report-privacy-", dir=Path.cwd())
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.source = self.root / "raw"
        (self.source / "data").mkdir(parents=True)
        self.output = self.root / "prepared"
        self.report = self.root / "report.json"

    def fixture(self, credential=None, origin="http://auth.app.test:9099/identitytoolkit.googleapis.com/v1/accounts:signUp", extra=None, form=False, popup_email=None):
        for path in (self.source / "data").iterdir():
            path.unlink()
        credential = credential or token()
        body = {"idToken": credential, "refreshToken": "FIXED-NONCONFIDENTIAL-REFRESH"}
        request = {"url": origin, "headers": [], "cookies": []}
        response = {"headers": [], "cookies": [], "content": {"_sha1": "body.json", "mimeType": "application/json"}}
        entries = {"0.trace": privacy.json_bytes({"type": "before", "params": {"value": credential}}) + b"\n",
                   "0.network": privacy.json_bytes({"type": "resource-snapshot", "snapshot": {"request": request, "response": response}}) + b"\n",
                   "resources/body.json": privacy.json_bytes(body)}
        if form:
            entries["resources/body.json"] = urlencode({"id_token": credential, "refresh_token": body["refreshToken"]}).encode()
        if popup_email:
            assertion = quote(json.dumps({"sub": "fixture-user", "email": popup_email}))
            entries["resources/body.json"] = f'<button data-id-token="{assertion}">Fixture</button>'.encode()
        if extra:
            entries.update(extra)
        raw = privacy.pack(entries)
        source_trace = self.root / "trace.zip"
        source_trace.write_bytes(raw)
        name = "data/" + hashlib.sha1(raw).hexdigest() + ".zip"
        (self.source / name).write_bytes(raw)
        metadata = privacy.pack({"report.json": privacy.json_bytes({"files": [], "stats": {"total": 1}, "attachments": [{"path": name}]})})
        viewer = privacy.VIEWER / "htmlReport"
        static = (viewer / "index.html").read_bytes()
        static = privacy.re.sub(rb'<script type="module"[^>]*></script>', lambda _: b'<script type="module">' + (viewer / "report.js").read_bytes() + b'</script>', static)
        static = privacy.re.sub(rb'<link rel="stylesheet"[^>]*>', lambda _: b"<style type='text/css'>" + (viewer / "report.css").read_bytes() + b'</style>', static)
        (self.source / "index.html").write_bytes(static + privacy.MARKER + base64.b64encode(metadata) + b"</template>")
        self.report.write_bytes(privacy.json_bytes({"attachments": [{"name": "trace", "path": str(source_trace)}]}))
        return name, raw, credential

    def test_removes_auth_preserves_references_and_original(self):
        # Given: An actual-format trace with emulator auth in a body and action.
        name, raw, credential = self.fixture(extra={"resources/known.json": privacy.json_bytes({"Authorization": "Bearer " + token()})})
        original_html = (self.source / "index.html").read_bytes()
        # When: Prepare a separate private candidate.
        manifest = privacy.prepare(self.source, self.report, self.output)
        prepared = privacy.unpack((self.output / "html" / name).read_bytes())
        # Then: Lookup keys still resolve, credentials are gone, and evidence is unchanged.
        self.assertEqual(set(prepared), set(privacy.unpack(raw)))
        self.assertNotIn(credential.encode(), b"".join(prepared.values()))
        self.assertNotIn(b"FIXED-NONCONFIDENTIAL-REFRESH", b"".join(prepared.values()))
        self.assertEqual(json.loads(prepared["resources/body.json"])["refreshToken"], privacy.REDACTED)
        self.assertEqual(json.loads(prepared["resources/known.json"])["Authorization"], privacy.REDACTED)
        self.assertEqual((self.source / name).read_bytes(), raw)
        self.assertEqual((self.source / "index.html").read_bytes(), original_html)
        self.assertFalse(manifest["publication_approved"])
        self.assertEqual(manifest["counts"]["credential_values_removed"], 2)
        self.assertEqual(Path(json.loads((self.output / "report.json").read_bytes())["attachments"][0]["path"]).read_bytes(), (self.output / "html" / name).read_bytes())

    def test_fails_closed_for_unexpected_content(self):
        # Given: Each unexpected input must fail rather than become an approved candidate.
        cases = [
            {"credential": token(signature="signed")},
            {"credential": token(audience="production")},
            {"origin": "https://production.example.invalid/auth"},
            {"origin": "http://auth.app.test:9099/test?password=FIXED-UNKNOWN-PASSWORD"},
            {"origin": "http://auth.app.test:9099/test?%70assword=FIXED-UNKNOWN-PASSWORD"},
            {"origin": "http://auth.app.test:9099/test?flag&password=FIXED-UNKNOWN-PASSWORD"},
            {"origin": "http://auth.app.test:9099/test#access_token=FIXED-UNKNOWN-ACCESS-TOKEN"},
            {"origin": "http://fixed:FIXED-UNKNOWN-PASSWORD@auth.app.test:9099/test"},
            {"popup_email": "person@private.example"},
            {"extra": {"resources/unknown.json": b'{"refreshToken":"UNRECOGNIZED-SENSITIVE-SENTINEL"}'}},
            {"extra": {"resources/unknown.json": b'{"password":"UNRECOGNIZED-SENSITIVE-SENTINEL"}'}},
            {"extra": {"resources/unknown.json": b' \n {"password":"UNRECOGNIZED-SENSITIVE-SENTINEL"}'}},
            {"extra": {"resources/unknown.json": b'{"password":"UNRECOGNIZED-SENSITIVE-SENTINEL"'}},
            {"extra": {"resources/unknown.json": b'{"secret":"UNRECOGNIZED-SENSITIVE-SENTINEL"}'}},
            {"extra": {"resources/unknown.json": b'{"email":"person@private.example"}'}},
            {"extra": {"resources/unknown.txt": b'refresh_token=FIXED-UNKNOWN-SENTINEL&password=FIXED-PASSWORD'}},
            {"extra": {"resources/unknown.txt": b' \n refresh_token=FIXED-UNKNOWN-SENTINEL&password=FIXED-PASSWORD'}},
            {"extra": {"resources/unknown.txt": b'refresh_token=FIXED-UNKNOWN-SENTINEL&refresh_token='}},
            {"extra": {"resources/unknown.txt": b'%78%5B%5D=ok&%70assword=FIXED-UNKNOWN-PASSWORD'}},
            {"extra": {"resources/unknown.txt": b'flag&%70assword=FIXED-UNKNOWN-PASSWORD'}},
            {"extra": {"resources/unknown.json": b'{"params":[{"name":"refresh_token","value":"FIXED-UNKNOWN-SENTINEL"}]}'}},
            {"extra": {"resources/unknown.json": b'{"headers":[{"name":"Authorization","value":"Bearer FIXED-UNKNOWN-SENTINEL"}]}'}},
            {"extra": {"../escape": b"no"}},
        ]
        for case in cases:
            with self.subTest(case=list(case)):
                self.fixture(**case)
                # When: Attempt private preparation with the unexpected content.
                with self.assertRaises(ValueError):
                    privacy.prepare(self.source, self.report, self.output)
                # Then: No prepared candidate survives.
                self.assertFalse(self.output.exists())

    def test_rejects_missing_or_unbound_attachments(self):
        # Given: HTML data differs from the file selected by the same-run JSON report.
        name, _, _ = self.fixture()
        (self.source / name).write_bytes(privacy.pack({"0.trace": b"{}"}))
        # When: Prepare a report with a mismatched attachment.
        with self.assertRaises(ValueError):
            privacy.prepare(self.source, self.report, self.output)
        # Then: No candidate survives the source-binding failure.
        self.assertFalse(self.output.exists())

    def test_removes_recognized_form_credentials(self):
        # Given: An auth-emulator form body carries known fixture credentials.
        name, raw, credential = self.fixture(form=True)
        # When: Prepare it through the same public command boundary.
        privacy.prepare(self.source, self.report, self.output)
        body = privacy.unpack((self.output / "html" / name).read_bytes())["resources/body.json"]
        # Then: Both form values are redacted and the original trace remains unchanged.
        self.assertNotIn(credential.encode(), body)
        self.assertNotIn(b"FIXED-NONCONFIDENTIAL-REFRESH", body)
        self.assertEqual((self.source / name).read_bytes(), raw)

    def test_removes_auth_widget_assertions(self):
        # Given: The emulator's actual widget format carries a fixture IdP assertion.
        name, raw, _ = self.fixture(popup_email="fixture@example.test")
        # When: Prepare the separate report.
        manifest = privacy.prepare(self.source, self.report, self.output)
        body = privacy.unpack((self.output / "html" / name).read_bytes())["resources/body.json"]
        # Then: The auth attribute is redacted while resource lookup keys and source evidence remain intact.
        self.assertIn(privacy.REDACTED.encode(), body)
        self.assertNotIn(quote("fixture@example.test").encode(), body)
        self.assertEqual(manifest["counts"]["auth_attributes_removed"], 1)
        self.assertEqual((self.source / name).read_bytes(), raw)

    def test_cli_failure_does_not_echo_payload(self):
        # Given: A malformed source JSON contains a sensitive sentinel.
        self.fixture()
        self.report.write_text('{"UNRECOGNIZED-SENSITIVE-SENTINEL":')
        # When: Invoke the same command CI runs.
        result = subprocess.run([sys.executable, "scripts/prepare-report.py", str(self.source), str(self.report), str(self.output)], capture_output=True)
        # Then: It fails closed without echoing the parser payload or leaving a candidate.
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(b"UNRECOGNIZED-SENSITIVE-SENTINEL", result.stdout + result.stderr)
        self.assertFalse(self.output.exists())

    def test_rejects_executable_html_after_the_report(self):
        # Given: Otherwise pinned viewer code has an appended script payload.
        self.fixture()
        path = self.source / "index.html"
        path.write_bytes(path.read_bytes() + b'<script>throw "UNRECOGNIZED-SENSITIVE-SENTINEL"</script>')
        # When: Attempt to prepare the modified viewer.
        with self.assertRaises(privacy.PrivacyError):
            privacy.prepare(self.source, self.report, self.output)
        # Then: Executable suffixes are not copied into a candidate.
        self.assertFalse(self.output.exists())

    def test_origin_diagnostics_do_not_echo_recorded_values(self):
        # Given: Rejected origins may contain private host labels, token-like labels, or query values.
        origins = ["https://PRIVATE-SENTINEL.example.invalid/",
                   "https://" + token() + ".example.invalid/",
                   "https://apis.google.com/js/api.js?token=FIXED-PRIVATE-QUERY"]
        for origin in origins:
            self.fixture(origin=origin)
            # When: Run the same origin-only diagnostic boundary used in CI.
            result = subprocess.run([sys.executable, "scripts/prepare-report.py", str(self.source), str(self.report), str(self.output)], capture_output=True)
            # Then: Only fixed known hosts or digests appear, never query or host-label payloads.
            self.assertNotEqual(result.returncode, 0)
            for sentinel in ("PRIVATE-SENTINEL", token(), token().lower(), "FIXED-PRIVATE-QUERY"):
                self.assertNotIn(sentinel.encode(), result.stdout + result.stderr)
            self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
