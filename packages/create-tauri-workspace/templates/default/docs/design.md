# Design system

The interface is built from design tokens rather than literal values, so a new
screen inherits the existing look without copying colours around.

## Where things live

| File | Holds |
| --- | --- |
| `apps/desktop/src/styles/tokens.css` | Every colour, size, radius and duration |
| `apps/desktop/src/styles/base.css` | Element defaults and the focus ring |
| `apps/desktop/src/styles/components.css` | Reusable classes: `.button`, `.card`, `.input`, `.badge`, `.banner`, `.segmented` |
| `apps/desktop/src/styles/app.css` | Page layout only |

## Rules

- **Never write a literal colour, radius or spacing value outside
  `tokens.css`.** If a value is missing, add a token instead of inlining it.
- **Add a class to `components.css` before styling a one-off element.** The
  second use of a pattern is the moment to name it.
- **Every token is declared on bare `:root` first.** The dark blocks re-declare
  only what changes, so a new token can never be undefined in one theme.
- **Both themes must be checked.** The theme control in the header switches
  between automatic, light and dark without restarting.

## Colour

`tokens.css` defines a light palette on `:root`, then overrides it twice:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* system dark */ }
}
:root[data-theme="dark"] { /* explicit choice */ }
```

The `data-theme` attribute comes from the user's saved setting. `system`
removes the attribute so the media query takes over again.

Semantic names describe a role, not an appearance: `--color-surface` stays
correct in both themes, `--color-white` would not.

## Layout

The window itself never scrolls. `.shell` fills the height, `.shell-header`
stays fixed, and only `.shell-content` scrolls. Adding a section to a page
therefore cannot push controls out of reach.

Grids use `repeat(auto-fit, minmax(min(20rem, 100%), 1fr))` so cards reflow
instead of overflowing. Check every change at the window's 760px minimum width.

## Desktop conventions

- Body text is not selectable by default, matching native applications. Real
  content — paragraphs, code, inputs — opts back in, and `data-selectable`
  marks anything else that should be.
- Focus rings are visible for keyboard users through `:focus-visible`.
- Animation respects `prefers-reduced-motion`.

## Accessibility

- Controls that toggle state use `aria-pressed`; groups use `role="group"` with
  a label.
- Status messages use `role="status"`; failures use `role="alert"`.
- Never rely on colour alone. The update banner pairs its tone with text.
