import os
import re
import pathlib
import dataclasses
import json
import click


@dataclasses.dataclass
class Card:
    frontText: str
    backText: str
    uniqueKey: str
    tags: list[str]


SEP = "### __FRONT_TEXT_END__"


def strip_front(f):
    return f.strip().strip('"""').strip()


def create_tags(filepath):
    return [s for s in filepath.split("/")[:-1] if s not in [".", "test"]]


def parse_file(filepath: str) -> Card | None:
    with open(filepath) as fp:
        s = fp.read()
    ss = s.split(SEP)
    if len(ss) != 2:
        return None
    front, back = ss
    return Card(
        frontText=strip_front(front),
        backText=back.strip(),
        uniqueKey=str(filepath),
        tags=["py"] + create_tags(str(filepath))
    )


@click.command()
@click.argument("dir")
@click.option("-o", "--output", default="output.json", type=pathlib.Path)
def main(dir: str, output: pathlib.Path) -> None:
    cards = []
    for root, _, files in os.walk(dir):
        for name in files:
            if not re.match(r"^test_.*\.py$", name):
                continue
            filepath = pathlib.Path(root) / name
            if c := parse_file(filepath):
                cards.append(dataclasses.asdict(c))

    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w") as fp:
        json.dump(cards, fp)


if __name__ == "__main__":
    main()
