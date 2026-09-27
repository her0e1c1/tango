FSRS 状態は Card.fsrs に統合し、独立 Entity・購読・結合を持たない。内容編集では状態を保ち、新規・複製は未評価にする。
評価は fsrs・updatedAt と StudyAnswer・StudySession の進捗を同じ batch で保存し、スキップは Session の進捗だけを更新する。
学習進行はサーバー応答を待たず、Card.fsrs は確定後に Card replica へ反映する。同じ権限・差分同期で扱えるため専用 document に分離せず、書き込みは所有者に限る。
