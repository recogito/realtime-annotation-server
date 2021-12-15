import r from 'rethinkdb';

import CONFIG from './config';

const conn = () => 
  r.connect(CONFIG).then(conn => ({ conn, table: r.table('lock') }));

export const clearAllLocks = () => 
  conn().then(({ conn, table }) =>
    table.delete().run(conn));

export const obtainLock = (clientId, annotation) => {
  // Note that ID will be null for Selections (which is
  // fine - RethinkDB will auto-assign a temporary ID)
  const { id } = annotation;

  // The 'lock' object records annotation ID (if any),
  // annotation and ID of the locking socket connection
  const lock = {
    id, 
    lockedBy: clientId,
    action: 'locked',
    annotation
  }

  // If there's already a lock on this ID,
  // this operation will fail
  return conn().then(({ conn, table }) => table 
    .insert(lock, { conflict: 'error'})
    .run(conn)); 
}

export const releaseLocks = clientId =>
  conn().then(({ conn, table }) => table
    .filter({ lockedBy: clientId })
    .delete()
    .run(conn));

export const modifyLocked = (clientId, action, target) => target ? 
  conn().then(({ conn, table }) => table
    .filter({ lockedBy: clientId })
    .update({ action, annotation: { target } })
    .run(conn)) : 
  
  conn().then(({ conn, table }) => table
    .filter({ lockedBy: clientId })
    .update({ action })
    .run(conn));

export const followChanges = source =>
  conn().then(({ conn, table }) => table
    .filter({ annotation: { target: { source }}})
    .changes()
    .run(conn));