#!/usr/bin/env python3
"""Regenerates the WOFF2 font files under src/fonts/ from the original TTF
sources (never modified/deleted) and the character ranges defined in
scripts/font-charsets/.

Run with: npm run fonts:build  (equivalent to: python scripts/build-fonts.py)

What it does, for each font in FONT_JOBS below:
  1. Reads the font's charset ("big-union" = the union of every *.txt file
     in scripts/font-charsets/, except db-snapshot.txt's role is explained
     in that directory's README; "logo" = just whatever
     scripts/get-logo-text.mjs currently prints, so the logo font never
     carries more glyphs than its own fixed string needs).
  2. Subsets the source TTF to exactly that character set with fontTools'
     pyftsubset, converts to WOFF2, and writes it to the SAME directory as
     the source TTF (which is left untouched — it's the thing this script
     re-subsets from every time it's run, and the only way to recover a
     fuller character set later if the ranges here ever need to grow).
  3. Preserves the font's name table in full (--name-IDs=* --name-legacy),
     so the embedded copyright/license strings required by the SIL Open
     Font License survive subsetting unchanged.

Also writes scripts/font-charsets/covered-chars.txt — the exact "big-union"
character set actually baked into the subset fonts, sorted. This is the
manifest scripts/check-fonts.mjs diffs new content against; regenerate it by
re-running this script, never hand-edit it.

Requires: Python 3 with fonttools installed (`pip install fonttools`) and
Node (for scripts/get-logo-text.mjs). This is a local developer tool, not
part of the Vercel build — its *output* (the .woff2 files) is what actually
ships, committed to the repo like any other source file.
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHARSETS_DIR = ROOT / "scripts" / "font-charsets"
FONTS_DIR = ROOT / "src" / "fonts"

# (source TTF relative to src/fonts/, output WOFF2 relative to src/fonts/, charset mode)
FONT_JOBS = [
    ("zen-old-mincho/ZenOldMincho-Regular.ttf", "zen-old-mincho/ZenOldMincho-Regular.woff2", "big-union"),
    ("zen-kaku-gothic-new/ZenKakuGothicNew-Regular.ttf", "zen-kaku-gothic-new/ZenKakuGothicNew-Regular.woff2", "big-union"),
    ("zen-kaku-gothic-new/ZenKakuGothicNew-Medium.ttf", "zen-kaku-gothic-new/ZenKakuGothicNew-Medium.woff2", "big-union"),
    ("hina-mincho/HinaMincho-Regular.ttf", "hina-mincho/HinaMincho-Regular.woff2", "big-union"),
    ("nothing-you-could-do/NothingYouCouldDo-Regular.ttf", "nothing-you-could-do/NothingYouCouldDo-Regular.woff2", "logo"),
]


def load_big_union() -> str:
    chars = set()
    txt_files = sorted(CHARSETS_DIR.glob("*.txt"))
    if not txt_files:
        sys.exit(f"No *.txt charset files found in {CHARSETS_DIR}")
    for f in txt_files:
        chars.update(f.read_text(encoding="utf-8"))
    return "".join(sorted(chars))


def load_logo_text() -> str:
    result = subprocess.run(
        ["node", str(ROOT / "scripts" / "get-logo-text.mjs")],
        capture_output=True, text=True, check=True, encoding="utf-8",
    )
    return result.stdout


def subset_one(src_ttf: Path, dst_woff2: Path, text: str) -> None:
    text_file = dst_woff2.with_suffix(".subset-input.txt")
    text_file.write_text(text, encoding="utf-8")
    try:
        subprocess.run(
            [
                sys.executable, "-m", "fontTools.subset",
                str(src_ttf),
                f"--text-file={text_file}",
                "--flavor=woff2",
                f"--output-file={dst_woff2}",
                "--layout-features=*",
                "--name-IDs=*",
                "--name-legacy",
                "--glyph-names",
                "--notdef-glyph",
                "--notdef-outline",
                "--recommended-glyphs",
            ],
            check=True,
        )
    finally:
        text_file.unlink(missing_ok=True)


def main() -> None:
    big_union = load_big_union()
    print(f"big-union charset: {len(big_union)} characters")
    (CHARSETS_DIR / "covered-chars.txt").write_text(big_union, encoding="utf-8")

    logo_text = load_logo_text()
    print(f"logo charset (from src/lib/siteBranding.ts): {logo_text!r} ({len(logo_text)} characters)")

    for src_rel, dst_rel, mode in FONT_JOBS:
        src = FONTS_DIR / src_rel
        dst = FONTS_DIR / dst_rel
        if not src.exists():
            sys.exit(f"Missing source TTF: {src}")
        text = big_union if mode == "big-union" else logo_text
        subset_one(src, dst, text)
        before = src.stat().st_size
        after = dst.stat().st_size
        print(f"  {src_rel}: {before/1024:.0f}KB -> {dst_rel}: {after/1024:.0f}KB ({100*after/before:.1f}%)")

    print("\nDone. Review the .woff2 diffs under src/fonts/ before committing.")


if __name__ == "__main__":
    main()
