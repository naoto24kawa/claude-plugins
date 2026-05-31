# elchika-tools

Local MCP server for Claude Code that exposes 34 Elchika Tools utilities as a single `run` tool. All processing happens locally — no data leaves your machine.

## Tools

| Category | Tool names |
|----------|-----------|
| Text     | upper-case, lower-case, title-case, sentence-case, camel-case, pascal-case, snake-case, kebab-case, reverse-chars, reverse-words, reverse-lines, slugify, sort-lines, to-katakana, to-hiragana |
| Encode   | base64-encode, base64-decode, html-entity-encode, html-entity-decode, uuencode, uudecode |
| Format   | json-format, json-minify, xml-format, html-format, html-minify, yaml-to-json, json-to-yaml, xml-to-json, toml-to-json |
| Crypto   | atbash, caesar-encrypt |
| Generate | uuid-v4, ulid |

## Usage

```
run({ tool: "json-format", input: '{"a":1}' })
// → '{\n  "a": 1\n}'

run({ tool: "caesar-encrypt", input: '{"text":"hello","shift":3}' })
// → "khoor"
```

## Setup

Installed automatically via Claude Code plugin system. On first use, `npm install` runs once in the `mcp-server/` directory.
