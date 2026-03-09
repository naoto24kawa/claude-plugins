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

  warn-updated-field:
    name: Check updated field is current
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Warn if updated field is not today
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const fs = require('fs');
            const files = execSync(
              `git diff --name-only --diff-filter=ACMR origin/${{ github.base_ref }}...HEAD -- 'docs/specs/*.md'`
            ).toString().trim().split('\n').filter(Boolean);

            if (files.length === 0) return;

            const today = new Date().toISOString().split('T')[0];
            const warnings = [];

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const match = content.match(/updated:\s*(\d{4}-\d{2}-\d{2})/);
              if (match && match[1] !== today) {
                warnings.push(`${file}: updated field is "${match[1]}", expected "${today}"`);
              }
            }

            if (warnings.length > 0) {
              core.warning('docs/specs updated field not current:\n' + warnings.join('\n'));
            }

  warn-related-links:
    name: Check related links
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Warn on broken related links
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            const specsDir = 'docs/specs';
            if (!fs.existsSync(specsDir)) return;

            const specFiles = fs.readdirSync(specsDir).filter(f => f.endsWith('.md') && f !== 'README.md');
            const warnings = [];

            for (const file of specFiles) {
              const content = fs.readFileSync(path.join(specsDir, file), 'utf8');
              const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
              if (!fmMatch) continue;

              const relatedMatch = fmMatch[1].match(/related:\s*\n((?:\s+-\s+.*\n)*)/);
              if (!relatedMatch) continue;

              const links = relatedMatch[1].match(/-\s+"?([^"\n]+)"?/g) || [];
              for (const link of links) {
                const ref = link.replace(/- \s*"?/, '').replace(/"$/, '').trim();
                if (ref.startsWith('#')) continue;
                if (!fs.existsSync(ref)) {
                  warnings.push(`${file}: broken related link "${ref}"`);
                }
              }
            }

            if (warnings.length > 0) {
              core.warning('docs/specs broken related links:\n' + warnings.join('\n'));
            }

  warn-mermaid-syntax:
    name: Check Mermaid syntax
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Warn on potential Mermaid issues
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const fs = require('fs');
            const files = execSync(
              `git diff --name-only --diff-filter=ACMR origin/${{ github.base_ref }}...HEAD -- 'docs/specs/*.md'`
            ).toString().trim().split('\n').filter(Boolean);

            if (files.length === 0) return;

            const warnings = [];

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const mermaidBlocks = content.match(/```mermaid\n([\s\S]*?)```/g) || [];
              for (const block of mermaidBlocks) {
                const inner = block.replace(/```mermaid\n/, '').replace(/```$/, '').trim();
                if (!inner) {
                  warnings.push(`${file}: empty Mermaid block`);
                }
                const validStart = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/;
                if (inner && !validStart.test(inner)) {
                  warnings.push(`${file}: Mermaid block may have invalid diagram type`);
                }
              }
            }

            if (warnings.length > 0) {
              core.warning('docs/specs Mermaid syntax issues:\n' + warnings.join('\n'));
            }

  warn-template-sections:
    name: Check template sections
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Warn on missing template sections
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const fs = require('fs');
            const files = execSync(
              `git diff --name-only --diff-filter=ACMR origin/${{ github.base_ref }}...HEAD -- 'docs/specs/*.md'`
            ).toString().trim().split('\n').filter(Boolean);

            if (files.length === 0) return;

            const typeSections = {
              feature: ['概要', '機能一覧'],
              api: ['エンドポイント一覧', '共通仕様'],
              'data-model': ['テーブル定義', 'リレーション'],
              screen: ['概要', '画面一覧'],
              batch: ['概要', 'ジョブ一覧'],
              integration: ['概要', '連携先一覧']
            };

            const warnings = [];

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const typeMatch = content.match(/type:\s*(\S+)/);
              if (!typeMatch) continue;

              const type = typeMatch[1];
              const required = typeSections[type];
              if (!required) continue;

              for (const section of required) {
                if (!content.includes(`## ${section}`)) {
                  warnings.push(`${file} (type: ${type}): missing section "## ${section}"`);
                }
              }
            }

            if (warnings.length > 0) {
              core.warning('docs/specs missing template sections:\n' + warnings.join('\n'));
            }
