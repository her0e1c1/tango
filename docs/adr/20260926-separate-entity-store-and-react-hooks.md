Entity の model/store.ts は初期値・初期化・hydration・同期的な読み取りと更新を所有し、React hook は model/hooks.ts にまとめる。
Store 操作は状態オブジェクト外の名前付き関数にし、Entity に model/actions・model/queries は作らない。
純粋なスキーマ・ルールと api の永続化を分離し、Store の外部アクセスは永続化 middleware による保存・復元・購読だけを例外とする。
