import { modifyLocked, obtainLock, releaseLocks } from "./db/lock";
import { followChanges as followLockChanges } from "./db/lock";
import { followChanges as followAnnotationChanges } from "./db/annotation";

/**
 * A collaborative annotation session on one image.
 */
export default class Session {

  constructor(source) {
    this.source = source; 

    this.sockets = [];

    // Subscribe to change feed and post change 
    // messages to all connected sockets
    this.lockChanges = followLockChanges(source).then(cursor =>
      cursor.each((error, row) => {        
        const { old_val, new_val } = row;

        // Note: when a new lock is created, old_val will be null,
        // when a lock is released, new_val will be null
        const originId = old_val?.lockedBy || new_val.lockedBy;

        if (new_val) {
          this.sockets.forEach(socket => {
            if (socket.id !== originId)
              socket.emit('edit', new_val)
          });
        } else {
          // No new val means the change is persisted (OK or cancel)
          
          // TODO emit annotation from DB, to make sure we get the right state
          // (updated or reverted)

          // Possible cases:
          // - Cancel no Selection -> clients should delete
          // - Cancel on existing annotaiton -> clients should rever
          // - OK on Selection -> clients need to load new annotation
          // - OK on existing annotation -> clients should update
          // - Delete on existing -> client should remove
        }
      }));

    this.annotationChanges = followAnnotationChanges(source).then(cursor =>
      cursor.each((error, row) => {
        const { old_val, new_val } = row;

        if (new_val) {
          this.sockets.forEach(socket => {
            socket.emit('upsert', new_val)
          });
        }
      }));
  }

  join = socket => {
    const { id } = socket;

    socket.on('obtainLock', msg => {
      const { annotation } = msg;

      console.log(`Client ${id} requests lock on ${annotation.type}`);

      obtainLock(id, annotation).then(result => {
        if (result.errors) {
          console.log('Obtain lock failed', result.first_error);
          socket.emit('obtainLockFailed', { annotation });
        }
      });
    });

    socket.on('releaseLocks', () => {
      console.log(`Client ${id} releases all locks`);
      releaseLocks(id);
    });

    socket.on('modify', msg => {
      const { target } = msg;
      modifyLocked(id, target);
    });

    this.sockets.push(socket);
  } 

  includes = socket =>
    this.sockets.includes(socket);

  leave = socket => 
    this.sockets = this.sockets.filter(s => s !== socket);

  close = () => {
    this.lockChanges.close();
    this.annotationChanges.close();
  }

}