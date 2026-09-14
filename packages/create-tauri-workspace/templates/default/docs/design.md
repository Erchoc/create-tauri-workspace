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

## Language

The interface ships in English and Simplified Chinese, and follows the
operating system unless the user picks one.

| File | Holds |
| --- | --- |
| `apps/desktop/src/locales/en.ts` | The source language, and the key list |
| `apps/desktop/src/locales/zh-CN.ts` | The translation, typed against `en` |
| `apps/desktop/src/lib/i18n.ts` | Locale matching and `t()` |

Rules:

- **Never write a user-visible string in a component.** Add a key to `en.ts`
  and use `t("your.key")`.
- **Every locale is typed against `en`**, so a missing or misspelled key fails
  the type check rather than showing a raw key to a user.
- **Interpolate with `{name}` placeholders**, never string concatenation:
  word order differs between languages.

To add a language, copy `zh-CN.ts`, translate the values, and add one entry to
`LOCALES` and `LOCALE_NAMES` in `i18n.ts`. Matching falls back by base tag, so
`zh-Hant` reaches `zh-CN` until a Traditional file exists.

### CJK typography

Letter spacing and negative tracking are Latin devices — a Chinese glyph is
already a full em, so they pull characters apart or crush them. `base.css`
switches them off under `:root:lang(zh)`, which works because `useSettings`
keeps `<html lang>` on the resolved locale.

The font stack in `tokens.css` lists CJK families after the Latin ones so
Chinese text picks a real face rather than a system fallback.

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
