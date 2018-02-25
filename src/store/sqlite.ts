import * as Expo from 'expo';

export const db = Expo.SQLite.openDatabase('db6.db');

interface Result {
  insertId: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: () => any;
    _array: any[];
  };
}

export const exec = (sql: string, values: any[] = []): Promise<Result> =>
  new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        sql,
        values,
        (_, result) => resolve(result),
        e => {
          alert(JSON.stringify(e));
          reject();
        }
      )
    )
  );

const CREATE_DECK = `
create table if not exists deck (
  id integer primary key not null,
  fkid text,
  type text,
  name text,
  isPublic integer,
  url text
);`;

const CREATE_CARD = `
create table if not exists card (
  id integer primary key not null,
  mastered boolean default 0 not null,
  deck_id integer,
  name text,
  body text,
  category text,
  hint text
);
`;

export const createTables = async () => {
  // PRAGMA foreign_keys = ON;
  await Promise.all([exec(CREATE_DECK), exec(CREATE_CARD)]);
};

export const dropTables = async () => {
  await exec('drop table deck; drop table card;');
  await createTables();
};

createTables();
