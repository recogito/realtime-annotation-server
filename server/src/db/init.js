import r from 'rethinkdb';

import CONFIG from './config';

export const exists = () =>
  r.connect(CONFIG)
    .then(conn => r.dbList().run(conn))
    .then(databases => databases.includes(CONFIG.db));

export const initDB = () =>
  r.connect(CONFIG).then(conn =>
    r.dbCreate(CONFIG.db)
      .do(() => r.tableCreate('annotation', { primaryKey: 'id' }))
      .run(conn));
