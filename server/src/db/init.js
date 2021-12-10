import r from 'rethinkdb';

const CONFIG = {
  host: 'localhost',
  port: 28015,
  db: 'recogito'
}

export const exists = () =>
  r.connect(CONFIG)
    .then(conn => r.dbList().run(conn))
    .then(databases => databases.includes('recogito'));

export const initDB = () =>
  r.connect(CONFIG).then(conn =>
    r.dbCreate('recogito')
      .do(() => r.tableCreate('annotations'))
      .run(conn));
