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

export const exec = (sql: string, values: any[] = []): Promise<Result> => {
  __DEV__ && console.log('SQL', sql, values);
  return new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        sql,
        values,
        (_, result) => resolve(result),
        e => {
          console.log('ERROR', e, sql, values);
          alert('Database has some problems');
          reject();
        }
      )
    )
  );
};

// IMPORTANT: You can not insert undefined or null
// if it's a non-nullable column
// Error messages are unfriendly so keep in mind that
// you convert them to other values like empty string
const CREATE_DECK = `
create table if not exists deck (
  id integer primary key not null,
  isPublic integer default 0 not null,
  name text default '' not null,
  url text default '' not null,
  spreadsheetId text default '' not null,
  spreadsheetGid text default '' not null
);`;

const CREATE_CARD = `
create table if not exists card (
  id integer primary key not null,
  deck_id integer not null,
  mastered boolean default 0 not null,
  name text default '' not null,
  body text default '' not null,
  category text default '' not null,
  hint text default '' not null
);
`;

export const createTables = async () => {
  // PRAGMA foreign_keys = ON;
  await Promise.all([exec(CREATE_DECK), exec(CREATE_CARD)]);
};

export const dropTables = async () => {
  await exec('drop table card');
  await exec('drop table deck');
  await createTables();
};

createTables();
