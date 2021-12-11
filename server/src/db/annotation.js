import r from 'rethinkdb';

import CONFIG from './config';

const conn = () => 
  r.connect(CONFIG).then(conn => ({ conn, table: r.table('annotation') }));

export const createAnnotation = annotation =>
  conn()
    .then(({ conn, table }) => 
      table
        .insert(annotation)
        .run(conn));

export const deleteById = annotationId =>
  conn()
    .then(({ conn, table }) =>
      table
        .get(annotationId)
        .delete()
        .run(conn));

export const findBySource = source =>
  conn()
    .then(({ conn, table }) =>
      table
        .filter({ target: { source }})
        .run(conn))
    .then(cursor => cursor.toArray());