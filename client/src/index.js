import { io } from 'socket.io-client';

class RethinkClientPlugin {
  
  constructor(instance, config) {

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

    const source = encodeURIComponent(instance._env.image.src);

    instance
      .loadAnnotations(`/annotation/search?source=${source}`);


    const socket = io();

    socket.on('connect', function(data) {
      console.log('Subscribing to live updates');

      fetch(`/annotation/subscribe?source=${source}`);
    });

    socket.on('annotation', a => instance.addAnnotation(a));
  }

}

export default (instance, config) =>
  new RethinkClientPlugin(instance, config);