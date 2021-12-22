import { io } from 'socket.io-client';

import Formatter, { lockAnnotation, releaseLock } from './formatter/Formatter';

class RethinkClientPlugin {

  constructor(instance, viewer) {
    // Annotorious or RecogitoJS
    this.instance = instance;

    // Open WebSocket
    this.socket = io();

    // Track the current selection
    this.currentSelection = null;

    // Set up outbound live channel...
    this._setupOutboundSocket();
    this._setupOutputCRUD();

    // ...load annotations...
    this._initialLoad()  
      // ...and then set inbound live channel
      .then(source => this._setupInboundSocket(source));

    // TODO the inbound live channel might change some of the
    // initially loaded annotations, leading to jumps in the UI.
    // We should defer rendering for a nicer user experience later.
  }

  _setupOutboundSocket = () => {
    // Shorthand
    const selectAnd = (annotation, fn) => {
      this.currentSelection = annotation;
      fn();
    }

    const deselectAnd = fn => {
      this.currentSelection = null;
      fn();
    }

    this.instance.on('selectAnnotation', annotation => 
      selectAnd(annotation, () => this.socket.emit('selectAnnotation', annotation)));

    this.instance.on('createSelection', selection  =>
      selectAnd(selection, () => this.socket.emit('createSelection', selection)));

    this.instance.on('cancelSelected', annotation =>
      deselectAnd(() => this.socket.emit('cancelSelected', annotation)));

    this.instance.on('createAnnotation', annotation =>
      deselectAnd(() => this.socket.emit('createAnnotation', annotation)));

    this.instance.on('updateAnnotation', annotation =>
      deselectAnd(() => this.socket.emit('updateAnnotation', annotation)));

    this.instance.on('deleteAnnotation', annotation => 
      deselectAnd(() => this.socket.emit('deleteAnnotation', annotation)));

    this.instance.on('changeSelectionTarget', target => {
      this.currentSelection = { ...this.currentSelection, target };
      this.socket.emit('changeAnnotation', this.currentSelection);
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

  _initialLoad = () => {
    const base = '/annotation/search?source=';
    const source = this.instance._env.image.src;

    // Lazy loading or OSD
    if (!source) {
      return new Promise(resolve => {
        this.instance.on('load', () => {
          const { src } = this.instance._env.image;
          this.instance.loadAnnotations(base + encodeURIComponent(src)).then(() => {
            resolve(src);
          });
        })
      });
    } else {
      return this.instance.loadAnnotations(base + encodeURIComponent(source)).then(() => source);
    }
  }

  _setupInboundSocket = source => {
    this.socket.on('connect', () => {
      console.log(`Joining session for ${source}`);
      this.socket.emit('joinSession', { source });
    });

    this.socket.on('lockRejected', annotation => {
      if (annotation.id === this.currentSelection?.id) {
        console.log('Error: could not lock annotation for editing');
        this.currentSelection = null;
        this.instance.selectAnnotation(null);
      }
    });

    this.socket.on('edit', msg => {
      const { annotation, action, lockedBy } = msg;

      if (action === 'drafted' || action === 'selected') {
        lockAnnotation(annotation.id, lockedBy);
        this.instance.addAnnotation(annotation);
      } else if (action === 'changed') {
        this.instance.addAnnotation(annotation);
      } else if (action === 'created') {
        // Means a Selection was promoted to Annotation
        this.instance.removeAnnotation(msg.selectionId);
        this.instance.addAnnotation(annotation);
      } else if (action === 'deleted') {
        releaseLock(annotation.id);
        this.instance.removeAnnotation(annotation);
      } else if (action === 'updated') {
        releaseLock(annotation.id);
        this.instance.addAnnotation(annotation);
      } else if (action === 'reverted') {
        releaseLock(annotation.id);

        // Revert means: draft selection is removed,
        // existing selected annotation is returned to 
        // original state
        if (annotation.type === 'Selection')
          this.instance.removeAnnotation(annotation);
        else
          this.instance.addAnnotation(annotation);
      }
    });
  }

}

export default instance => new RethinkClientPlugin(instance);