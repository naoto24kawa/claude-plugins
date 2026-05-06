---
description: 指定した Web アプリ URL を探索的にテストし、バグ・UI 不具合を自動検出して GitHub Issue に登録する
argument-hint: '[https://url] ["追加指示"]'
allowed-tools: [Agent]
---

## Usage

```
/site-explorer                                        # .site-explorer.md の URL を使用
/site-explorer https://staging.example.com            # URL 上書き
/site-explorer "決済フローを重点的に確認して"              # 追加指示のみ
/site-explorer https://staging.example.com "決済フロー重点"  # URL + 追加指示
```

## Your task

Invoke the `site-explorer` agent with the following arguments:

**Arguments**: $ARGUMENTS

Spawn the agent using the Agent tool and pass all provided arguments in the prompt so the agent can parse URLs and additional instructions in Phase 0.
