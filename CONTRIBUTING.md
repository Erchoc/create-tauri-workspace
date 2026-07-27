# Contributing

Keep the creator dependency-free unless a dependency provides a clear,
measurable benefit that cannot be implemented safely with Node.js built-ins.

Before opening a pull request:

`bash
bun install
bun run check
`

Changes to the bundled template must also be tested by generating a project and
running `bun run check` inside it.
