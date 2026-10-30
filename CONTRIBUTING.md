# Contributing

This map is meant to be argued with. The most useful contributions are corrections and missing pieces.

## What to send

- **A fact check.** Pick a problem or organisation marked `VERIFY`, check it against a primary source, and send a change that removes the flag and adds the source to `docs/SOURCES.md`.
- **A missing organisation or link.** Add it to `partners` and `links` in `data/problems.json`. Link kinds are `active` (documented work on the problem), `partial`, or `planned` (a proposed niche). Mark a link `"v": true` if you could not verify it.
- **A missing problem.** Add it with a new id inside its layer. Say in the pull request why it is a separate problem and not a part of an existing one.
- **A disagreement with a score.** Open an issue naming the problem id, the score you would change and why. Scores for nature of uncertainty, degree and impact are judgement calls, so reasons matter more than the number.
- **A new region or sector view.** Open an issue first.

## Rules

- Keep all text in English, plain and short.
- Do not add a fact without a source. If you are unsure, label the problem `VERIFY`.
- Do not change the meaning of a label or scale without discussing it in an issue; see `docs/METHODOLOGY.md`.
- `data/problems.json` is the source of truth. The page only reads it.

## Running it locally

The page loads `data/problems.json` with `fetch`, so serve the folder instead of opening the file directly:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
