import { 
  createSelection,
  followChanges,
  getLocksOnSource,
  modifyAnnotation, 
  releaseLocks,
  selectAnnotation
} from '../db/Lock';

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

          // When a new annotation was created, clients need to
          // replace the existing floating selection
          const toReplace = action === 'created' ? old_val.id : null;

          this.sockets.forEach(socket => {
            if (socket.id !== lockedBy) { 
              if (toReplace)
                socket.emit('edit', { ...new_val, selectionId: toReplace });
              else
                socket.emit('edit', new_val)
            }
          });

          // Release lock
          if (['created', 'updated', 'reverted', 'deleted'].includes(action))
            releaseLocks(lockedBy)
        }
      }));
  }

  join = socket => {
    const { id } = socket;

    socket.on('createSelection', selection =>
      createSelection(id, selection));

    socket.on('selectAnnotation', annotation => {
      console.log(`Client ${id} requests lock on ${annotation.type}`);

      selectAnnotation(id, annotation).then(result => {
        if (result.errors) {
          console.log('lock rejected', result.first_error);
          socket.emit('lockRejected', annotation);
        }
      });
    });

    socket.on('createAnnotation', annotation =>
      modifyAnnotation(id, 'created', annotation));

    socket.on('updateAnnotation', annotation =>
      modifyAnnotation(id, 'updated', annotation));

    socket.on('cancelSelected', annotation =>
      modifyAnnotation(id, 'reverted', annotation));

    socket.on('deleteAnnotation', () =>
      modifyAnnotation(id, 'deleted'));

    socket.on('changeAnnotation', annotation =>
      modifyAnnotation(id, 'changed', annotation));

    // Set up initial state
    getLocksOnSource(this.source).then(locks => locks.forEach(lock =>
      socket.emit('edit', lock)));

    this.sockets.push(socket);
  } 

  includes = socket =>
    this.sockets.includes(socket);

  leave = socket => {
    const { id } = socket;
    releaseLocks(id);

    this.sockets = this.sockets.filter(s => s !== socket);

    this.sockets.forEach(socket => {
      socket.emit('leave', { id });
    });
  }

  close = () =>
    this.feed.close();

}