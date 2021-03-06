import r from 'rethinkdb';

import { DB_CONFIG } from '../config';

const conn = () => 
  r.connect(DB_CONFIG).then(conn => ({ conn, table: r.table('lock') }));

const affected = result =>
  Object.values(result).reduce((a, b) => a + b);

const lock = (clientId, annotation, action, identifier) => {
  // Note that ID will be null for Selections (which is
  // fine - RethinkDB will auto-assign a temporary ID)
  const id = identifier || annotation.id;

  // The 'lock' object records annotation ID (if any),
  // annotation and ID of the locking socket connection
  const lock = {
    id, 
    lockedBy: clientId,
    action,
    annotation
  }

  // If there's already a lock on this ID,
  // this operation will fail
  return conn().then(({ conn, table }) => table 
    .insert(lock, { conflict: 'error'})
    .run(conn)); 
}

export const clearAllLocks = () => 
  conn().then(({ conn, table }) =>
    table.delete().run(conn));

export const  getLocksOnSource = source =>
  conn().then(({ conn, table }) => table
    .filter({ annotation: { target: { source }}})
    .run(conn))
      .then(cursor => cursor.toArray());

export const selectAnnotation = (clientId, annotation) =>
  lock(clientId, annotation, 'selected');

export const createSelection = (clientId, selection) => {
  const id = `selection-${clientId}`;
  lock(clientId, { ...selection, id }, 'drafted', id);
}

export const releaseLocks = clientId =>
  conn().then(({ conn, table }) => table
    .filter({ lockedBy: clientId })
    .delete()
    .run(conn));

export const modifyAnnotation = (clientId, action, annotation) => {
  const update = annotation ? { action, annotation } : { action };

  return conn().then(({ conn, table }) => table
    .filter({ lockedBy: clientId })
    .update(update)
    .run(conn))
      .then(result => {
        if (affected(result) === 0) {
          console.log('wait!', annotation);
          // No lock for this annotation and client! Create new lock (or fail)
          return annotation.type === 'Annotation' ? 
            selectAnnotation(clientId, annotation) :
            createSelection(clientId, annotation);
        }
      });
}

export const followChanges = source =>
  conn().then(({ conn, table }) => table
    .filter({ annotation: { target: { source }}})
    .changes({ squash: false })
    .run(conn));