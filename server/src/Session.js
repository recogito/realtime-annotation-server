import { selectAnnotation, createSelection, releaseLocks, modifyAnnotation } from "./db/lock";
import { followChanges  } from "./db/lock";

/**
 * A collaborative annotation session on one image.
 */
export default class Session {

  constructor(source) {
    this.source = source; 

    this.sockets = [];

    // Subscribe to change feed and post change 
    // messages to all connected sockets
    this.feed = followChanges(source).then(cursor =>
      cursor.each((error, row) => {        
        const { old_val, new_val } = row;

        if (new_val) {
          const { lockedBy, action } = new_val;

          // Only needed for createAnnotation, to 
          // replace Selection with Annotation.
          const toReplace = action === 'created' ? old_val?.id : null;

          this.sockets.forEach(socket => {
            if (socket.id !== lockedBy) { 
              if (toReplace) {
                socket.emit('create', { ...new_val, selection_id: toReplace });
              } else {
                socket.emit('edit', new_val)
              }
            }
          });

          // Release lock
          if (['created', 'updated', 'reverted', 'deleted'].includes(action))
            releaseLocks(lockedBy)
        }
      }));
  }

  join = socket => {
    // TODO When a new socket joins, forward current state
    // so the client can sync up with edits in progress

    const { id } = socket;

    socket.on('createSelection', selection =>
      createSelection(id, selection));

    socket.on('selectAnnotation', annotation => {
      console.log(`Client ${id} requests lock on ${annotation.type}`);

      selectAnnotation(id, annotation).then(result => {
        if (result.errors) {
          console.log('Obtain lock failed', result.first_error);
          socket.emit('obtainLockFailed', { annotation });
        }
      });
    });

    socket.on('createAnnotation', annotation =>
      modifyAnnotation(id, 'created', annotation));

    socket.on('updateAnnotation', annotation =>
      modifyAnnotation(id, 'updated', annotation));

    socket.on('cancelSelected', annotation =>
      modifyAnnotation(id, 'reverted', annotation));

    socket.on('deleteAnnotation', () => {
      modifyAnnotation(id, 'deleted');
    });

    socket.on('change', annotation =>
      modifyAnnotation(id, 'changed', annotation));

    this.sockets.push(socket);
  } 

  includes = socket =>
    this.sockets.includes(socket);

  leave = socket => {
    releaseLocks(socket.id);
    this.sockets = this.sockets.filter(s => s !== socket);
  }

  close = () =>
    this.feed.close();

}