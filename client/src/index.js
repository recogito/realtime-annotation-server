import { io } from 'socket.io-client';

// HACK!
let locked = null;

class RethinkClientPlugin {

  constructor(instance, config) {

    const socket = io();

    instance.on('selectAnnotation', annotation => {
      console.log('obtaining lock on annotation', annotation);
      
      // Hack
      locked = annotation;

      socket.emit('selectAnnotation', annotation);
    });

    instance.on('createSelection', selection  => {
      // Hack
      locked = selection;

      socket.emit('createSelection', selection);
    });

    // We really should add a editorClose event (maybe needs a different
    // name that's also headless-compatible)
    instance.on('cancelSelected', annotation =>
      socket.emit('cancelSelected', annotation));

    instance.on('createAnnotation', annotation => 
      socket.emit('createAnnotation', annotation));

    instance.on('updateAnnotation', annotation =>
      socket.emit('updateAnnotation', annotation));

    instance.on('deleteAnnotation', annotation => 
      socket.emit('deleteAnnotation', annotation));

    instance.on('changeSelectionTarget', target => {
      const annotation = { ...locked, target };
      socket.emit('change', annotation);
    });

    instance.on('createAnnotation', annotation =>
      fetch('/annotation', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(annotation)
      }));

    instance.on('updateAnnotation', annotation =>
      fetch('/annotation', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(annotation)
      }));

    instance.on('deleteAnnotation', annotation =>
      fetch('/annotation/' + annotation.id.substr(1), {
        method: 'DELETE'
      }));  

    const source = instance._env.image.src;

    instance
      .loadAnnotations(`/annotation/search?source=${encodeURIComponent(source)}`);

    socket.on('connect', () => {
      console.log('Subscribing to live updates');
      socket.emit('joinSession', { source });
    });

    socket.on('obtainLockFailed', ({ annotation }) => {
      if (locked.id === annotation.id) {
        // Roll back!
        console.log('Error: could not lock annotation for editing');
        this.locked = null;
        instance.selectAnnotation(null);
      }
    });

    socket.on('edit', msg => {
      const { annotation, action } = msg;

      if (['drafted', 'updated', 'changed', 'reverted'].includes(action)) {
        if (action === 'drafted')
          window.currentLocks[annotation.id] = msg.lockedBy;

        if (['updated', 'reverted'].includes(action))
          delete window.currentLocks[annotation.id];

        if (action === 'reverted' && annotation.id.startsWith('selection'))
          instance.removeAnnotation(annotation);
        else
          instance.addAnnotation(annotation);
      } else if (action === 'deleted') {
        instance.removeAnnotation(annotation);
      } else if (action === 'selected') {
        console.log('remote select!', annotation.id);
        console.log('current selected', instance.getSelected()?.id);
        
        window.currentLocks[msg.id] = msg.lockedBy;
        instance.addAnnotation(annotation);
      }
    });

    socket.on('create', msg => {
      const { selection_id, annotation } = msg;
      instance.removeAnnotation(selection_id);
      instance.addAnnotation(annotation);
    });
  }

}

export default (instance, config) =>
  new RethinkClientPlugin(instance, config);