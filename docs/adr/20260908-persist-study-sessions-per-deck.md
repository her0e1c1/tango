StudySession は Deck ごとに再開可能な Session を最大一つ持ち、開始・再開始で新しい識別子と固定した Card 順序を保存する。
現在位置と Card の解決は Entity、表示状態との接続は Page が担い、公開 API は query・action・型・純粋なルールに限る。
Deck 削除成功後に同じ Deck の Session を終了する。回答時は Card.fsrs・StudyAnswer・StudySession の進捗を独立して保存し、一部が失敗しても成功した保存は取り消さない。
