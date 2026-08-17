import json
import subprocess
import sys
from pathlib import Path


def test_generates_cards_from_marked_test_files(tmp_path: Path):
    source_dir = tmp_path / "test" / "binarysearch"
    source_dir.mkdir(parents=True)
    (source_dir / "test_example.py").write_text(
        '''"""
What is the answer?
"""

### __FRONT_TEXT_END__
answer = 42
'''
    )
    (source_dir / "test_without_marker.py").write_text("answer = 0\n")
    (source_dir / "helper.py").write_text(
        '"""Ignored"""\n### __FRONT_TEXT_END__\nanswer = 1\n'
    )
    generator = Path(__file__).parents[1] / "generate.py"
    result = subprocess.run(
        [sys.executable, str(generator), "test", "--output", "build/output.json"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert json.loads((tmp_path / "build/output.json").read_text()) == [
        {
            "frontText": "What is the answer?",
            "backText": "answer = 42",
            "uniqueKey": "test/binarysearch/test_example.py",
            "tags": ["py", "binarysearch"],
        }
    ]
