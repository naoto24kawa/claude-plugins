name: 仕様書 (Specification)
description: 実装タスクの仕様を記述する
title: "<type>: "
labels: ["type:implementation"]
body:
  - type: dropdown
    id: type
    attributes:
      label: 種類
      options:
        - feat (新機能)
        - fix (バグ修正)
        - change (既存機能の変更)
        - remove (機能削除)
    validations:
      required: true

  - type: textarea
    id: summary
    attributes:
      label: 概要
      description: このタスクで何を実現するかを1-2文で
    validations:
      required: true

  - type: textarea
    id: background
    attributes:
      label: 背景・目的
      description: なぜこの変更が必要か。関連する要望への参照を含む
      placeholder: |
        refs notion-xxx
        refs #XX
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: 受け入れ条件
      description: 検証可能な条件をチェックリストで記述
      placeholder: |
        - [ ] 条件1
        - [ ] 条件2
        - [ ] 条件3
    validations:
      required: true

  - type: textarea
    id: impact
    attributes:
      label: 影響範囲
      description: 変更が影響するモジュール、画面、APIを記述
    validations:
      required: false

  - type: textarea
    id: related-files
    attributes:
      label: 関連ファイル
      description: 変更対象となるファイルパスや関連するドキュメント
      placeholder: |
        - docs/specs/xxx.md
    validations:
      required: false

  - type: textarea
    id: notes
    attributes:
      label: 備考
      description: 技術的制約、注意事項、参考情報
    validations:
      required: false
