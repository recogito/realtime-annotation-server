import { io } from 'socket.io-client';

import Formatter, { lockAnnotation, releaseLock, releaseLocksBy } from './formatter/Formatter';

import './formatter/Formatter.css';

class RealtimeClientPlugin {

  constructor(anno, config) {
    // Annotorious or RecogitoJS
    this.anno = anno;
    this.anno.formatters = [...this.anno.formatters, Formatter ];

    this.config = config || {};

    // Track the current selection
    this.currentSelection = null;

    // Open WebSocket
    this.socket = io(this.config.server);

    // Connect (takes a while...)
    const afterConnect = new Promise(resolve =>
      this.socket.on('connect', () => resolve()));

    // Initial load (takes a while...)
    const afterLoad = this._initialLoad();
    
    // Set up outbound live channel...
    this._setupOutboundSocket();
    this._setupOutputCRUD();

    // Set up inbound socket after load & connect
    Promise.all([ afterConnect, afterLoad ]).then(([, source]) =>
      this._setupInboundSocket(source));

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

    this.anno.on('selectAnnotation', annotation => 
      selectAnd(annotation, () => this.socket.emit('selectAnnotation', annotation)));

    this.anno.on('createSelection', selection  =>
      selectAnd(selection, () => this.socket.emit('createSelection', selection)));

    this.anno.on('cancelSelected', annotation =>
      deselectAnd(() => this.socket.emit('cancelSelected', annotation)));

    this.anno.on('createAnnotation', annotation =>
      deselectAnd(() => this.socket.emit('createAnnotation', annotation)));

    this.anno.on('updateAnnotation', annotation =>
      deselectAnd(() => this.socket.emit('updateAnnotation', annotation)));

    this.anno.on('deleteAnnotation', annotation => 
      deselectAnd(() => this.socket.emit('deleteAnnotation', annotation)));

    this.anno.on('changeSelectionTarget', target => {
      this.currentSelection = { ...this.currentSelection, target };
      this.socket.emit('changeAnnotation', this.currentSelection);
    });
  }

  _setupOutputCRUD = () => {
    const base = this.config.server || '';

    // Helper to create POST request
    const postData = obj => ({
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj)
    });

    this.anno.on('createAnnotation', annotation =>
      fetch(`${base}/annotation`, postData(annotation)));

    this.anno.on('updateAnnotation', annotation =>
      fetch(`${base}/annotation`, postData(annotation)));

    this.anno.on('deleteAnnotation', annotation =>
      fetch(`${base}/annotation/${annotation.id.substr(1)}`, { method: 'DELETE' }));
  }

  _initialLoad = () => {
    const base = `${this.config.server || ''}/annotation/search?source=`;
    const source = this.anno._env.image?.src;

    // Lazy loading or OSD
    if (!source) {
      return new Promise(resolve => {
        this.anno.on('load', () => {
          const { src } = this.anno._env.image;
          this.anno.loadAnnotations(base + encodeURIComponent(src)).then(() => {
            resolve(src);
          });
        })
      });
    } else {
      return this.anno.loadAnnotations(base + encodeURIComponent(source)).then(() => source);
    }
  }

  _setupInboundSocket = source => {
    this.socket.emit('joinSession', { source });

    this.socket.on('lockRejected', annotation => {
      if (annotation.id === this.currentSelection?.id) {
        console.log('Error: could not lock annotation for editing');
        this.currentSelection = null;
        this.anno.selectAnnotation(null);
      }
    });

    // TODO join

    this.socket.on('leave', ({ id }) => {
      const locked = releaseLocksBy(id);
      if (locked)
        this.anno.addAnnotation(this.anno.getAnnotationById(locked));
    });

    this.socket.on('edit', msg => {
      console.log('message', msg);
      
      const { annotation, action, lockedBy } = msg;

      if (action === 'drafted' || action === 'selected') {
        lockAnnotation(annotation.id, lockedBy);
        this.anno.addAnnotation(annotation);
      } else if (action === 'changed') {
        this.anno.addAnnotation(annotation);
      } else if (action === 'created') {
        // Means a Selection was promoted to Annotation
        this.anno.removeAnnotation(msg.selectionId);
        this.anno.addAnnotation(annotation);
      } else if (action === 'deleted') {
        releaseLock(annotation.id);
        this.anno.removeAnnotation(annotation);
      } else if (action === 'updated') {
        releaseLock(annotation.id);
        this.anno.addAnnotation(annotation);
      } else if (action === 'reverted') {
        releaseLock(annotation.id);

        // Revert means: draft selection is removed,
        // existing selected annotation is returned to 
        // original state
        if (annotation.type === 'Selection')
          this.anno.removeAnnotation(annotation);
        else
          this.anno.addAnnotation(annotation);
      }
    });
  }

}

export default (anno, config) =>
  new RealtimeClientPlugin(anno, config);