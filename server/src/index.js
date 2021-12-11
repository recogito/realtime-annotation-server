import http from 'http';
import express from 'express';
import { exists, initDB } from './db/init';
import { 
  changesForSource, 
  deleteById, 
  findBySource, 
  upsertAnnotation 
} from './db/annotation';

const app = express();

const server = http.createServer(app);

const io = require('socket.io')(server);

app.use(express.json());

app.set('json spaces', 2);

exists().then(exists => {
  if (!exists)
    initDB();
});

io.on('connection', socket => {
  // TODO
});

app.get('/annotation/search', (req, res) => {
  findBySource(req.query.source).then(result => {
    res.json(result);
  });
});

app.get('/annotation/subscribe', (req, res) => {
  console.log('subscribing');

  changesForSource(req.query.source).then(cursor => {
    res.json({ result: 'success' });
    
    cursor.each((err, row) => {
      console.log('emitting');

      if (row.new_val) {
        io.emit('annotation', row.new_val);
      }
    });
  });
});

app.post('/annotation', (req, res) => {
  upsertAnnotation(req.body).then(() => {
    res.json({ result: 'success' });
  });
});

app.delete('/annotation/:annotationId', (req, res) => {
  deleteById(`#${req.params.annotationId}`).then(() => {
    res.json({ result: 'success' });
  });
});



const PORT = 8080;

server.listen(PORT);

console.log(`API running on port ${PORT}`); 