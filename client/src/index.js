import { io } from 'socket.io-client';

import Formatter, { lockAnnotation, releaseLock } from './formatter/Formatter';

class RethinkClientPlugin {

  constructor(instance) {
    // Annotorious or RecogitoJS
    this.instance = instance;

    // Open WebSocket
    this.socket = io();

    // Track the current selection
    this.currentSelection = null;
  }

  _setupOutboundSocket = () => {
    this.instance.on('selectAnnotation', annotation => {
      this.currentSelection = annotation;   
      this.socket.emit('selectAnnotation', annotation);
    });

    this.instance.on('createSelection', selection  => {
      this.currentSelection = selection;
      this.socket.emit('createSelection', selection);
    });

    this.instance.on('cancelSelected', annotation =>
      this.socket.emit('cancelSelected', annotation));

    this.instance.on('createAnnotation', annotation => 
      this.socket.emit('createAnnotation', annotation));

    this.instance.on('updateAnnotation', annotation =>
      this.socket.emit('updateAnnotation', annotation));

    this.instance.on('deleteAnnotation', annotation => 
      this.socket.emit('deleteAnnotation', annotation));

    this.instance.on('changeSelectionTarget', target => {
      this.currentSelection = { ...this.currentSelection, target };
      this.socket.emit('change', this.currentSelection);
    });
  }

  _setupOutputCRUD = () => {
    // Helper to create POST request
    const postData = obj => ({
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    });

    this.instance.on('createAnnotation', annotation =>
      fetch('/annotation', postData(annotation)));

    this.instance.on('updateAnnotation', annotation =>
      fetch('/annotation', postData(annotation)));

    this.instance.on('deleteAnnotation', annotation =>
      fetch(`/annotation/${annotation.id.substr(1)}`, { method: 'DELETE' }));
  }

  _setupInboundSocket = () => {
    // TODO join the session as soon as image.src is available (lazy load, OSD!)
    this.socket.on('connect', () => {
      console.log('Subscribing to live updates');
      this.socket.emit('joinSession', { source: instance._env.image?.src });
    });

    this.socket.on('obtainLockFailed', ({ annotation }) => {
      if (locked.id === annotation.id) {
        // Roll back!
        console.log('Error: could not lock annotation for editing');
        this.currentSelection = null;
        this.instance.selectAnnotation(null);
      }
    });

    this.socket.on('edit', msg => {
      console.log(msg);
      const { annotation, action } = msg;

      if (['drafted', 'updated', 'changed', 'reverted'].includes(action)) {
        if (action === 'drafted')
          addCurrentLock(annotation.id, msg.lockedBy);

        if (['updated', 'reverted'].includes(action))
          removeCurrentLock(annotation.id);

        if (action === 'reverted' && annotation.id.startsWith('selection'))
          instance.removeAnnotation(annotation);
        else
          instance.addAnnotation(annotation);
      } else if (action === 'deleted') {
        instance.removeAnnotation(annotation);
      } else if (action === 'selected') {
        console.log('remote select!', annotation.id);
        console.log('current selected', instance.getSelected()?.id);
        
        addCurrentLock(msg.id, msg.lockedBy);
        instance.addAnnotation(annotation);
      }
    });

    socket.on('create', msg => {
      const { selection_id, annotation } = msg;
      instance.removeAnnotation(selection_id);
      instance.addAnnotation(annotation);
    });

  }

    /*
    console.log('first', anno._env.image);

    viewer.addHandler('open', function() {
      console.log('load', anno._env.image);
    });
    */

//    instance
//      .loadAnnotations(`/annotation/search?source=${encodeURIComponent(instance._env.image?.src)}`);


}

export default instance => new RethinkClientPlugin(instance);