# Brand assets — pending

The rebrand removed the upstream project's visual identity. It did not
create Aiuby's, because that is a design decision, not a migration step.

Everything below currently ships a **deliberate placeholder**. Each one is
neutral on purpose: no letterform, no brand colour, nothing that quietly
decides what Aiuby looks like.

| Asset | State | Notes |
|---|---|---|
| `assets/aiuby-icon.svg` | placeholder | Previously drew the upstream project's three-letter mark. Consumed as `composerIcon` by both Codex plugin manifests and by the control pane. |
| `interface.brandColor` | neutral `#111827` | Was `#E07856`, the upstream project's brand colour. |
| `assets/hero-aiuby.png` | AI-generated | Works as direction, but every word, number, and logo in it is unverifiable. Build the final hero deterministically in SVG or HTML/CSS so the catalog figures can be generated from the tree like the README table is. |
| Favicon | missing | |
| CLI icon | missing | |
| GitHub social preview | missing | |
| Open Graph image | missing | |
| Sponsor logos | missing | RemédiosJÁ and Scalegrid. See [SPONSORS.md](../../SPONSORS.md). |
| Sponsor URLs | missing | Not guessed — a wrong domain on a sponsor's own listing is worse than a blank. |

## When the real assets arrive

1. Replace `assets/aiuby-icon.svg`; the consumers above need no path change.
2. Set `interface.brandColor` in `.codex-plugin/plugin.json` and
   `plugins/aiuby/.codex-plugin/plugin.json`.
3. Add sponsor logos under `assets/images/sponsors/` and link the names in
   `SPONSORS.md`. That directory is currently empty and was removed from
   `package.json` `files`; add it back when it has content.
4. Define type, colour, spacing, and usage rules so this file can be deleted.
