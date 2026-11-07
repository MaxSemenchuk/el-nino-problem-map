# El Niño 2026–27 Problem Map

> **Moved.** This project now lives in [citizen-infra/senri](https://github.com/citizen-infra/senri/tree/main/el-nino), published at https://citizen-infra.github.io/senri/el-nino/. This repository is no longer updated.

The site has three pages: an **impact calendar** (home page) that shows when and where the 2026–27 El Niño hits, with a marker for today, the **problem map** described below, and a **research** reading list whose entries link to the problems they inform (each problem on the map lists the research that cites it). Link to one problem with `problems.html?p=<id>`, for example `problems.html?p=6.1`.

An open, argue-with-it inventory of the problems that stand between a very strong El Niño forecast and effective collective action, and of who is working on each one.

It is a map, not a plan. It is meant to help people with experience in facilitation, digital platforms, tools and governance see where the real obstacles are, where uncertainty is largest, and where help is most needed.

**Live demo: https://maxsemenchuk.github.io/el-nino-problem-map/**

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

## Coordination funders

`funders.html` lists who pays for coordinating the El Niño response (convening, shared data, aligned finance, local voice, learning, open tools), with each funder linked to the problems it touches. Data: `data/funders.json`. Each problem on the map also shows who could fund work on it, and `problems.html?p=3.3` opens a problem directly.

## Open it

The page reads `data/problems.json`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Repository layout

```
index.html, calendar.js, calendar.css   impact calendar (home page, no build step)
problems.html, app.js, style.css        problem map (D3 force graph, no build step)
research.html, research.js, research.css   annotated reading list
nav.css                                 shared site menu
data/impacts.json                       calendar content: phases, Niño-3.4 sketch, regional impacts
data/problems.json                      problem map content: problems, organisations, links
data/research.json                      reading list: sources, notes, key figures, linked problem ids
docs/METHODOLOGY.md                     layers, labels, scales, limits
docs/SOURCES.md                         where facts came from, and what is unchecked
CONTRIBUTING.md                         how to correct, extend or disagree
```

## How to help

Check a `VERIFY` item, add a missing organisation, argue with a score. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Origin

The structure comes from a problem inventory built for another high-uncertainty domain, organising elections under war. The layered list, the label scheme and the nature-of-uncertainty scoring transfer directly. The content here is new.

## Licence

Code: MIT, see `LICENSE`. Data and text: CC BY 4.0, see `LICENSE-DATA.md`.
