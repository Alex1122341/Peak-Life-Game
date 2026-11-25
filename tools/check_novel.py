#!/usr/bin/env python3
"""Validate a novel work lock, chapter/manifest identity, drift terms and rewrite scope.

No dependencies. Run at repository root; optionally compare to a Git base ref.
A passing result is not proof of semantic continuity; review each chapter separately.
"""
import argparse
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

HEADING = re.compile(r'^\u7b2c(\d+)\u8282[\uff1a:]([^\r\n]*)$', re.M)
HAN = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\U00020000-\U000323af]')


def normalized(text):
    return re.sub(r'[\s\-_.!\uff01\u300a\u300b\u00b7]+', '', unicodedata.normalize('NFKC', text).casefold())


def read(path):
    return path.read_bytes().decode('utf-8-sig')


def checked_path(root, rel):
    p = root / rel
    if Path(rel).is_absolute() or '..' in Path(rel).parts or not p.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'Path escapes novel directory: {rel}')
    return p


def load_work(root, profile, read_text):
    manifest = json.loads(read_text(profile['manifest']))
    if manifest['title'] != profile['manifest_title']:
        raise ValueError(f"Wrong novel: {manifest['title']!r}")
    chapters = {}
    for i, batch in enumerate(manifest['batches']):
        path = batch['path']
        if not re.fullmatch(profile['batch_pattern'], path):
            raise ValueError(f'Unexpected manuscript path: {path}')
        raw = read_text(path)
        markers = list(HEADING.finditer(raw))
        numbers = [int(m[1]) for m in markers]
        expected = list(range(batch['start'], batch['end'] + 1))
        if numbers != expected:
            raise ValueError(f'Chapter range/order mismatch in {path}: {numbers}')
        preamble = raw[:markers[0].start()]
        if path == profile['opening_batch'] and not preamble.startswith(profile['opening_prefix']):
            raise ValueError('Opening manuscript belongs to the wrong work')
        for j, m in enumerate(markers):
            number = int(m[1])
            key = f"{batch['volume']}-{number}"
            if key in chapters:
                raise ValueError(f'Duplicate chapter: {key}')
            body = raw[m.end():markers[j+1].start() if j+1 < len(markers) else len(raw)]
            chapters[key] = (m[2], body, i)
    meta = {}
    for c in manifest['chapters']:
        key = f"{c['volume']}-{c['number']}"
        if c['id'] != key or key in meta:
            raise ValueError(f'Invalid/duplicate manifest ID: {key}')
        meta[key] = c
    if list(chapters) != list(meta) or manifest['publishedCount'] != len(meta):
        raise ValueError('Manifest chapter list/count differs from manuscript')
    for key, (title, body, batch) in chapters.items():
        if title != meta[key]['title'] or batch != meta[key]['batch']:
            raise ValueError(f'Wrong title or batch: {key}')
        if not body.strip():
            raise ValueError(f'Empty chapter: {key}')
    return chapters, meta


def scan(body, profile):
    canon = normalized(body)
    return [term for term in profile['blocked_terms'] if normalized(term) in canon]


def verify(root, profile, base_ref=None, scope=None):
    def current(rel):
        return read(checked_path(root, rel))
    chapters, meta = load_work(root, profile, current)
    old = old_meta = None
    if base_ref:
        repo_root = Path(subprocess.check_output(['git', '-C', str(root), 'rev-parse', '--show-toplevel'], text=True).strip())
        prefix = root.resolve().relative_to(repo_root.resolve())
        def at_ref(ref):
            def read_at_ref(rel):
                checked_path(root, rel)
                path = (prefix / rel).as_posix()
                return subprocess.check_output(['git', '-C', str(repo_root), 'show', f'{ref}:{path}']).decode('utf-8-sig')
            return read_at_ref
        old, old_meta = load_work(root, profile, at_ref(base_ref))
        missing = set(old) - set(chapters)
        if missing:
            raise ValueError(f'Deleted chapter IDs: {sorted(missing)}')
    rewritten, changed, metadata_corrected = [], [], []
    duplicates = {}
    for key, (title, body, _) in chapters.items():
        hits = scan(title + '\n' + body, profile)
        if hits:
            raise ValueError(f'Foreign-work/meta term in {key}: {hits}')
        info = meta[key]
        n = len(HAN.findall(body))
        is_changed = old is not None and (key not in old or body != old[key][1])
        metadata_correction = False
        if old is not None and key in old:
            title_changed = title != old[key][0]
            marker_changed = info.get('rewriteVersion') != old_meta[key].get('rewriteVersion')
            if title_changed or (marker_changed and not is_changed):
                # Only accept an explicit, chapter-specific correction backed by a
                # previously merged, genuinely different rewrite in Git history.
                correction = profile.get('approved_metadata_corrections', {}).get(key, {})
                expected = (not is_changed and correction.get('from_title') == old[key][0]
                            and correction.get('to_title') == title
                            and not old_meta[key].get('rewriteVersion')
                            and info.get('rewriteVersion') == correction.get('rewrite_version') == 1
                            and info.get('rewriteHan') == correction.get('han') == n
                            and {k: v for k, v in info.items() if k not in ('title', 'rewriteVersion', 'rewriteHan')}
                            == {k: v for k, v in old_meta[key].items() if k not in ('title', 'rewriteVersion', 'rewriteHan')})
                if expected:
                    original_ref, rewrite_ref = correction['original_commit'], correction['rewrite_commit']
                    if not all(re.fullmatch(r'[0-9a-f]{40}', ref) for ref in (original_ref, rewrite_ref)):
                        raise ValueError(f'Invalid historical correction refs: {key}')
                    subprocess.run(['git', '-C', str(repo_root), 'merge-base', '--is-ancestor', original_ref, rewrite_ref], check=True)
                    subprocess.run(['git', '-C', str(repo_root), 'merge-base', '--is-ancestor', rewrite_ref, base_ref], check=True)
                    original, _ = load_work(root, profile, at_ref(original_ref))
                    prior, _ = load_work(root, profile, at_ref(rewrite_ref))
                    metadata_correction = (key in original and key in prior
                                           and original[key][0] == prior[key][0] == old[key][0]
                                           and original[key][1] != prior[key][1] == body)
                if not metadata_correction:
                    raise ValueError(f'Unauthorized title or rewrite marker correction: {key}')
                if scope and (info['volume'] != scope[0] or not scope[1] <= info['number'] <= scope[2]):
                    raise ValueError(f'Out-of-scope metadata correction: {key}')
                metadata_corrected.append(key)
        if is_changed:
            changed.append(key)
            if scope and (info['volume'] != scope[0] or not scope[1] <= info['number'] <= scope[2]):
                raise ValueError(f'Out-of-scope chapter changed: {key}')
            if n < profile['min_han']:
                raise ValueError(f'Chapter too short: {key} ({n})')
            if key in old and not info.get('rewriteVersion'):
                raise ValueError(f'Changed old chapter lacks rewrite marker: {key}')
            if key in old and old_meta[key].get('rewriteVersion', 0) >= info.get('rewriteVersion', 0):
                raise ValueError(f'Rewrite version not incremented: {key}')
        if info.get('rewriteVersion'):
            if not isinstance(info['rewriteVersion'], int) or info['rewriteVersion'] < 1:
                raise ValueError(f'Invalid rewrite version: {key}')
            if info.get('rewriteHan') != n or n < profile['min_han']:
                raise ValueError(f'Incorrect rewrite length or marker: {key} ({n})')
            if old is not None and key in old and not is_changed and not metadata_correction and info.get('rewriteVersion') != old_meta[key].get('rewriteVersion'):
                raise ValueError(f'False rewrite marker on unchanged chapter: {key}')
            rewritten.append({'id': key, 'han': n})
        if info.get('rewriteVersion') or is_changed:
            for para in re.split(r'\n\s*\n', body.strip()):
                clean = ''.join(HAN.findall(para))
                if len(clean) >= 35:
                    if clean in duplicates:
                        raise ValueError(f'Duplicate long paragraph: {duplicates[clean]} / {key}')
                    duplicates[clean] = key
    if scope and old is None:
        raise ValueError('--scope requires --base-ref')
    return {'work': profile['work_id'], 'chapters_checked': len(chapters), 'changed': changed,
            'rewritten': rewritten, 'metadata_corrected': metadata_corrected, 'semantic_review_required': True}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', type=Path, required=True)
    p.add_argument('--profile', type=Path, required=True)
    p.add_argument('--work', required=True)
    p.add_argument('--base-ref')
    p.add_argument('--scope', type=int, nargs=3, metavar=('VOLUME', 'START', 'END'))
    args = p.parse_args()
    try:
        profile = json.loads(read(args.profile))
        if args.work != profile['work_id']:
            raise ValueError('Task work ID does not match locked profile')
        if args.scope and args.scope[1] > args.scope[2]:
            raise ValueError('Invalid scope')
        print(json.dumps(verify(args.root, profile, args.base_ref, args.scope), ensure_ascii=False, indent=2))
        return 0
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
