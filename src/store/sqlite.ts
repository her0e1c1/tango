import * as Expo from 'expo';

export const db = Expo.SQLite.openDatabase('db6.db');

db.transaction((tx: any) => {
  // PRAGMA foreign_keys = ON;
  tx.executeSql(
    `create table if not exists deck (
        id integer primary key not null,
        name text,
        isPublic integer,
        url text
    );`
  );
  tx.executeSql(
    `create table if not exists card (
        id integer primary key not null,
        mastered boolean default 0 not null,
        deck_id integer,
        name text,
        body text,
        category text,
        hint text
    );`
  );
});
