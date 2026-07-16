# Structure ロール（import グラフ構造解析）

> 旧 parallel-review-cycle specialist-roles.md の #7 Structure を watch-sprawl 専用に自己完結化したもの。正本はこのファイル。

**前提**: `~/projects/mizchi/sprawlens/packages/cli/dist/index.js` が存在すること（ビルド済み）。無ければ `git clone https://github.com/mizchi/sprawlens ~/projects/mizchi/sprawlens && cd ~/projects/mizchi/sprawlens && pnpm install && pnpm build` で用意する。

**フォーカスエリア:**
- 循環依存の増加（`cycleCount`）
- ハブのファンイン急伸（`maxFanIn`）
- エッジ密度上昇（`importEdgeCount / fileCount`）
- 最大連結成分比率の拡大（`largestComponentSize / fileCount`）

**実行手順:**

```bash
# 1. BASE/HEAD の SHA を確定する（呼び出し元から受け取るか git で解決）
# 2. sprawlens collect
DEPTH=$(git rev-list --count "${BASE_SHA}..HEAD" 2>/dev/null || echo 20)
node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js collect . --commits $((DEPTH + 5))
node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js analyze .

# 3. スナップショットの存在確認
BASE_SNAP=$(ls .codesprawl/snapshots/${BASE_SHA}*.json 2>/dev/null | head -1)
HEAD_SNAP=$(ls .codesprawl/snapshots/${HEAD_SHA}*.json 2>/dev/null | head -1)
# どちらかが空の場合: --commits 50 で再 collect/analyze してから再確認

# 4. 差分計算（Python スクリプト）
python3 - "${BASE_SHA}" "${HEAD_SHA}" << 'EOF'
import json, glob, sys, re

base_sha = sys.argv[1]
head_sha = sys.argv[2]

def load(sha):
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        return None
    files = glob.glob(f'.codesprawl/snapshots/{sha}*.json')
    if not files:
        return None
    m = json.load(open(files[0]))['metrics']
    defaults = {'loc':0,'fileCount':1,'importEdgeCount':0,'cycleCount':0,
                'maxFanIn':0,'maxFanOut':0,'largestComponentSize':0}
    return {k: m.get(k, defaults[k]) for k in defaults}

base = load(base_sha)
head = load(head_sha)
if not base or not head:
    print(json.dumps({"error": "snapshot missing"}))
    sys.exit(0)

density_base = base['importEdgeCount'] / max(base['fileCount'], 1)
density_head = head['importEdgeCount'] / max(head['fileCount'], 1)
comp_ratio_base = base['largestComponentSize'] / max(base['fileCount'], 1)
comp_ratio_head = head['largestComponentSize'] / max(head['fileCount'], 1)

result = {
    "base": base, "head": head,
    "density_base": round(density_base, 3),
    "density_head": round(density_head, 3),
    "diff": {
        "loc":                    head['loc']                 - base['loc'],
        "fileCount":              head['fileCount']           - base['fileCount'],
        "importEdgeCount":        head['importEdgeCount']     - base['importEdgeCount'],
        "cycleCount":             head['cycleCount']          - base['cycleCount'],
        "maxFanIn":               head['maxFanIn']            - base['maxFanIn'],
        "maxFanOut":              head['maxFanOut']           - base['maxFanOut'],
        "largestComponentSize":   head['largestComponentSize']- base['largestComponentSize'],
        "density":                round(density_head - density_base, 3),
        "largestCompRatio":       round(comp_ratio_head - comp_ratio_base, 3),
    }
}
print(json.dumps(result))
EOF
```

**判定基準:**

| 指標 | Warning 条件 | Blocking 条件（= [ISSUE] として報告） |
|---|---|---|
| cycleCount | 増加 | 2 以上増加 |
| maxFanIn | 10 以上増加 | 20 以上増加 |
| importEdgeCount / fileCount (密度) | 0.1 以上増加 | 0.2 以上増加 |
| largestComponentSize / fileCount | 5% 以上増加 | なし |

**注意**: 判定は必ず**差分（diff）**で行う。絶対値では判定しない。

**プロンプトテンプレート:**
```
あなたは {project} の**構造（sprawl）専門**レビュアーです。

sprawlens CLI を使ってリポジトリの import グラフ構造を解析し、構造劣化を検出してください。
実行手順はこのファイル（watch-sprawl スキルの `references/structure-role.md`）の「実行手順」セクションを参照してください。

BASE_SHA: {base_sha}
HEAD_SHA: {head_sha}

## 修正済み事項（重複報告不要）
{fixed_items}

## 既知の偽陽性
{fp_registry_contents}

## 報告フォーマット
Blocking 条件に該当する指標がある場合:
[ISSUE] 構造劣化: {指標名}
確信度: 95%
問題: base={X}, head={Y}, 差分={Z}（Blocking 閾値 {T} 超過）
修正案: {循環依存を解消する / ハブモジュールを分割する 等}

Warning のみまたは変化なし: 「LGTM」と一言。Warning は補足として情報提供する（修正は要求しない）。
```
