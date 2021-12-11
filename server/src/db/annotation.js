import r from 'rethinkdb';

import CONFIG from './config';

const conn = () => 
  r.connect(CONFIG).then(conn => ({ conn, table: r.table('annotation') }));

export const upsertAnnotation = annotation =>
  conn()
    .then(({ conn, table }) => table
      .insert(annotation, { conflict: 'replace' })
      .run(conn));

export const deleteById = annotationId =>
  conn()
    .then(({ conn, table }) => table
      .get(annotationId)
      .delete()
      .run(conn));

export const findBySource = source =>
  conn()
    .then(({ conn, table }) => table
      .filter({ target: { source }})
      .run(conn))
    .then(cursor => cursor.toArray());

export const changesForSource = source => 
  conn()
    .then(({ conn, table }) => table
      .filter({ target: { source }})
      .changes()
      .run(conn));