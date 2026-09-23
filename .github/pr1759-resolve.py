from pathlib import Path
from collections import Counter
import re
import subprocess
import sys

OLD = 'c818053c11059851118e530dd080af157eca6b88'
BASE = '3a9ddf297e89d8afbc6c6393f96bc16f20915594'
NEW = 'docs/test/e2e/card-filter.md'
PATTERN = re.compile(r'^### ([A-Z]+(?:-[A-Z]+)*-\d{2,})[^\n]*\n', re.M)

def git(*args):
    return subprocess.check_output(['git', *args], text=True)

def cases(text):
    headings = list(PATTERN.finditer(text))
    result = {}
    for i, heading in enumerate(headings):
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        label = re.search(r'^区分: (.+)$', text[heading.end():end], re.M)
        if label:
            result[heading[1]] = label[1]
    return result

labels = {}
for name in git('ls-tree', '-r', '--name-only', OLD, 'docs/test').splitlines():
    if name.endswith('.md') and Path(name).name not in ('AGENTS.md', 'README.md'):
        labels.update(cases(git('show', f'{OLD}:{name}')))
assert len(labels) == 442, len(labels)
for n in range(1, 12):
    labels[f'CARD-FILTER-{n:02d}'] = '正常系'

def classify(text):
    current = None
    table = False
    output = []
    for line in text.splitlines(keepends=True):
        heading = PATTERN.match(line)
        if heading:
            current = labels[heading[1]]
        if line.startswith('| ID | カテゴリ |'):
            table = True
            line = line.replace('| カテゴリ |', '| カテゴリ | 区分 |', 1)
        elif table and line.startswith('|'):
            cells = line.rstrip('\n').split('|')[1:-1]
            key = cells[0].strip()
            label = '---' if re.fullmatch(r':?-+:?', key) else labels[key]
            cells.insert(2, f' {label} ')
            line = '|' + '|'.join(cells) + '|\n'
        else:
            table = False
        output.append(line)
        if line.startswith('カテゴリ:'):
            assert current
            output.append(f'\n区分: {current}\n')
    return ''.join(output)

if sys.argv[1] == 'resolve':
    conflicts = git('diff', '--name-only', '--diff-filter=U').splitlines()
    allowed = {'docs/test/e2e/deck-navigation.md', 'docs/test/e2e/study-session.md'}
    assert set(conflicts) <= allowed, conflicts
    Path('/tmp/pr1759-conflicts.txt').write_text('\n'.join(conflicts) + '\n')
    for name in conflicts:
        Path(name).write_text(classify(git('show', f'{BASE}:{name}')))
        subprocess.run(['git', 'add', name], check=True)
elif sys.argv[1] == 'extend':
    Path(NEW).write_text(classify(git('show', f'{BASE}:{NEW}')))
    subprocess.run(['git', 'add', NEW], check=True)
elif sys.argv[1] == 'validate':
    total = Counter()
    found = {}
    index_rows = 0
    for path in sorted(Path('docs/test').rglob('*.md')):
        text = path.read_text()
        assert not re.search(r'^(<<<<<<< |=======|>>>>>>> )', text, re.M), path
        if path.name == 'AGENTS.md':
            assert text == git('show', f'{OLD}:{path}'), path
            continue
        found.update(cases(text))
        scenario_labels = re.findall(r'^区分: (.+)$', text, re.M)
        assert len(re.findall(r'^カテゴリ:', text, re.M)) == len(scenario_labels), path
        total.update(scenario_labels)
        text = re.sub(r'\n区分: (?:正常系 / 異常系|正常系|異常系)\n', '', text)
        output = []
        column = None
        for line in text.splitlines(keepends=True):
            if line.startswith('|'):
                cells = line.rstrip('\n').split('|')[1:-1]
                values = [c.strip() for c in cells]
                if '区分' in values:
                    column = values.index('区分')
                elif column is not None and values[0] in labels:
                    assert values[column] == labels[values[0]], (path, values)
                    index_rows += 1
                elif column is not None and values[column] in ('正常系', '異常系', '正常系 / 異常系'):
                    index_rows += 1
                if column is not None:
                    cells.pop(column)
                    line = '|' + '|'.join(cells) + '|\n'
            else:
                column = None
            output.append(line)
        assert ''.join(output) == git('show', f'{BASE}:{path}'), path
    assert found == labels, (found.keys() ^ labels.keys())
    assert total == Counter({'正常系': 354, '異常系': 94, '正常系 / 異常系': 15}), total
    assert index_rows == 601, index_rows
    changed = git('diff', '--name-only', BASE, 'HEAD').splitlines()
    assert len(changed) == 56, len(changed)
    assert all(p.startswith('docs/test/') and p.endswith('.md') for p in changed), changed
    assert git('rev-list', '--count', f'{BASE}..HEAD').strip() == '1'
    assert git('rev-parse', 'HEAD^').strip() == BASE
    print('463 classified scenarios; 601 matching index rows; 56 Markdown files; one commit.')
    print('354 normal; 94 abnormal; 15 mixed. All base behavior, categories, fixtures and TODO markers preserved.')
