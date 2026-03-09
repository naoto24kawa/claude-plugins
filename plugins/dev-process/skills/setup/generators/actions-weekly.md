name: Weekly Process Check

on:
  schedule:
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  weekly-check:
    name: Weekly process health check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check draft specs age
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            const specsDir = 'docs/specs';
            if (!fs.existsSync(specsDir)) {
              console.log('No docs/specs directory found.');
              return;
            }

            const files = fs.readdirSync(specsDir).filter(f => f.endsWith('.md') && f !== 'README.md');
            const warnings = [];
            const now = new Date();

            for (const file of files) {
              const content = fs.readFileSync(path.join(specsDir, file), 'utf8');
              const match = content.match(/doc_status:\s*draft/);
              if (!match) continue;

              const updatedMatch = content.match(/updated:\s*(\d{4}-\d{2}-\d{2})/);
              if (!updatedMatch) continue;

              const updated = new Date(updatedMatch[1]);
              const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
              if (days > 30) {
                warnings.push(`${file}: draft for ${days} days (last updated: ${updatedMatch[1]})`);
              }
            }

            if (warnings.length > 0) {
              core.warning('Long-standing draft specs:\n' + warnings.join('\n'));
            }

      - name: Check stale issues
        uses: actions/github-script@v7
        with:
          script: |
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              sort: 'updated',
              direction: 'asc',
              per_page: 50
            });

            const now = new Date();
            const stale = issues.data.filter(issue => {
              const updated = new Date(issue.updated_at);
              const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
              return days > 30;
            });

            if (stale.length > 0) {
              const list = stale.map(i => `  #${i.number}: ${i.title} (${Math.floor((now - new Date(i.updated_at)) / 86400000)}d)`);
              core.warning('Stale issues (30+ days):\n' + list.join('\n'));
            }
