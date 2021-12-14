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

      socket.emit('obtainLock', { annotation });
    });

    const unlock = () => {
      if (locked) {
        console.log('releasing lock');
        socket.emit('releaseLocks');
      }
    }

    // We really should add a editorClose event (maybe needs a different
    // name that's also headless-compatible)
    instance.on('cancelSelected', unlock);
    instance.on('createAnnotation', unlock);
    instance.on('updateAnnotation', unlock);
    instance.on('deleteAnnotation', unlock);

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

    instance.on('changeSelectionTarget', target => {
      socket.emit('modify', { target });
    });

    socket.on('modified', msg => {
      if (!instance.getSelected()) {
        console.log(msg);
        const { annotation } = msg;
        if (annotation)
          instance.addAnnotation(annotation);
      }
    });
  }

}

export default (instance, config) =>
  new RethinkClientPlugin(instance, config);