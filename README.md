# El Niño 2026–27 Problem Map

An open, argue-with-it inventory of the problems that stand between a very strong El Niño forecast and effective collective action, and of who is working on each one.

It is a map, not a plan. It is meant to help people with experience in facilitation, digital platforms, tools and governance see where the real obstacles are, where uncertainty is largest, and where help is most needed.

**Status: first draft, 2026-10-30.** Facts come from public sources and are not independently verified. Anything marked `VERIFY` needs a primary-source check. Scores are one author's judgement.

## What is in it

- **66 problems** in 10 layers plus cross-cutting ones, from forecast skill and trigger design to finance, delivery, data, governance, communication and political economy.
- Each problem has three labels:
  - `STRUCTURAL` or `EVENT`: does it exist regardless of this El Niño, or is it created or amplified by it?
  - `VERIFY`: does a fact in it still need checking?
  - A **constraint class**: hard, institutional or political.
- Each problem is scored on the **nature of its uncertainty** (factual, scenario, strategic, normative, structural, random), the **degree** of uncertainty (1 to 3), and its **impact** (1 to 4). Different natures of uncertainty are reduced by different tools, so the score says what kind of work helps.
- **18 organisations** and **8 open-source projects** linked to the problems they work on or could help with, plus a set of **proposed niches** for a facilitation and platform group, framed as hypotheses.
- Four views: a force-directed graph of problems and organisations, an uncertainty-by-impact matrix, a filterable table, and a coverage-and-gaps view.

## Open it

The page reads `data/problems.json`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Repository layout

```
index.html, app.js, style.css   the page (D3 force graph, no build step)
data/problems.json              all content: problems, organisations, links
docs/METHODOLOGY.md             layers, labels, scales, limits
docs/SOURCES.md                 where facts came from, and what is unchecked
CONTRIBUTING.md                 how to correct, extend or disagree
```

## How to help

Check a `VERIFY` item, add a missing organisation, argue with a score. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Origin

The structure comes from a problem inventory built for another high-uncertainty domain, organising elections under war. The layered list, the label scheme and the nature-of-uncertainty scoring transfer directly. The content here is new.

## Licence

Code: MIT, see `LICENSE`. Data and text: CC BY 4.0, see `LICENSE-DATA.md`.
