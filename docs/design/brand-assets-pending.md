# Brand assets — pending

The rebrand removed the upstream project's visual identity. It did not
create Aiuby's, because that is a design decision, not a migration step.

`assets/hero-aiuby.png` is final — confirmed by the maintainer.

The delivered rows below are final. The remaining ones are either derivable
from what was delivered, or still need a design decision.

| Asset | State | Notes |
|---|---|---|
| `assets/aiuby-icon.png` | placeholder | Previously drew the upstream project's three-letter mark. Consumed as `composerIcon` by both Codex plugin manifests and by the control pane. |
| `interface.brandColor` | neutral `#111827` | Was `#E07856`, the upstream project's brand colour. |
| Favicon | derivable | Export from `assets/aiuby-icon.png`. |
| CLI icon | derivable | Same source. |
| GitHub social preview | missing | |
| Open Graph image | missing | |
| Sponsor URLs | missing | Not guessed — a wrong domain on a sponsor's own listing is worse than a blank. |

## When the real assets arrive

1. Replace `assets/aiuby-icon.png`; the consumers above need no path change.
2. Set `interface.brandColor` in `.codex-plugin/plugin.json` and
   `plugins/aiuby/.codex-plugin/plugin.json`.
3. Add sponsor logos under `assets/images/sponsors/` and link the names in
   `SPONSORS.md`. That directory is currently empty and was removed from
   `package.json` `files`; add it back when it has content.
4. Define type, colour, spacing, and usage rules so this file can be deleted.
