FSRS 状態は Card.fsrs に統合し、独立 Entity・購読・結合を持たない。内容編集では状態を保ち、新規・複製は未評価にする。
評価は fsrs・updatedAt と StudyAnswer・StudySession の進捗を同じ batch で保存し、スキップは Session の進捗だけを更新する。
保存完了・失敗は Firestore 書き込みエラー方針に従う。FSRS は Card と同じ読み取り権限で公開し、書き込みは所有者に限る。
