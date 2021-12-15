import { modifyLocked, obtainLock, releaseLocks } from "./db/lock";
import { followChanges  } from "./db/lock";

/**
 * A collaborative annotation session on one image.
 */
export default class Session {

  constructor(source) {
    this.source = source; 

    this.sockets = [];

    // TODO don't create change feed for a single-user session!

    // Subscribe to change feed and post change 
    // messages to all connected sockets
    this.feed = followChanges(source).then(cursor =>
      cursor.each((error, row) => {        
        const { new_val } = row;

        if (new_val) {
          const { lockedBy, action } = new_val;

          this.sockets.forEach(socket => {
            if (socket.id !== lockedBy) 
              socket.emit('edit', new_val)
          });

          // Release lock
          if (['revert', 'commit', 'delete'].includes(action))
            releaseLocks(lockedBy)
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

    socket.on('change', msg => {
      const { target } = msg;
      modifyLocked(id, 'change', target);
    })

    socket.on('revert', msg => {
      const { target } = msg;
      modifyLocked(id, 'revert', target);
    });

    socket.on('commit', msg => {
      modifyLocked(id, 'commit');
    });

    socket.on('delete', msg => {
      modifyLocked(id, 'delete');
    });

    this.sockets.push(socket);
  } 

  includes = socket =>
    this.sockets.includes(socket);

  leave = socket => {
    releaseLocks(socket.id);
    this.sockets = this.sockets.filter(s => s !== socket);
  }

  close = () => {
    this.feed.close();
    this.annotationChanges.close();
  }

}