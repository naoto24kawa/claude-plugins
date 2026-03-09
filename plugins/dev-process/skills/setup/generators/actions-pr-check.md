name: PR Quality Gate

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-closes-reference:
    name: Check closes reference
    runs-on: ubuntu-latest
    steps:
      - name: Check PR body for closes reference
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';
            const hasCloses = /closes?\s+#\d+/i.test(body);
            if (!hasCloses) {
              core.setFailed('PR body must contain "closes #XX" to link to an Issue.');
            }

  commit-lint:
    name: Commit message lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check commit messages
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const base = context.payload.pull_request.base.sha;
            const head = context.payload.pull_request.head.sha;
            const log = execSync(`git log --format=%s ${base}..${head}`).toString().trim();
            const commits = log.split('\n').filter(Boolean);
            const pattern = /^(feat|fix|docs|refactor|test|chore)(\(.+\))?: .+/;
            const failures = commits.filter(msg => !pattern.test(msg));
            if (failures.length > 0) {
              core.setFailed(
                'Commit messages must follow Conventional Commits:\n' +
                failures.map(f => `  - "${f}"`).join('\n')
              );
            }

  frontmatter-check:
    name: Check docs/specs frontmatter
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check changed spec files
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const files = execSync(
              `git diff --name-only --diff-filter=ACMR origin/${{ github.base_ref }}...HEAD -- 'docs/specs/*.md'`
            ).toString().trim().split('\n').filter(Boolean);

            if (files.length === 0) {
              console.log('No docs/specs files changed.');
              return;
            }

            const fs = require('fs');
            const required = ['type', 'title', 'area', 'tags', 'doc_status', 'created', 'updated'];
            const errors = [];

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const match = content.match(/^---\n([\s\S]*?)\n---/);
              if (!match) {
                errors.push(`${file}: frontmatter not found`);
                continue;
              }
              for (const field of required) {
                if (!match[1].includes(`${field}:`)) {
                  errors.push(`${file}: missing required field "${field}"`);
                }
              }
            }

            if (errors.length > 0) {
              core.setFailed('docs/specs frontmatter errors:\n' + errors.join('\n'));
            }
