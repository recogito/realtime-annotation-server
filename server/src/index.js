import http from 'http';
import express from 'express';

import SessionPool from './SessionPool';
import { exists, initDB } from './db/init';
import { deleteById, findBySource, upsertAnnotation } from './db/annotation';

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// The realtime session pool
SessionPool.init(io);

app.use(express.json());

app.set('json spaces', 2);

/**
 * DB init, if needed
 */
exists().then(exists => {
  if (!exists)
    initDB();
});

/**
 * Annotation CRUD
 */
app.get('/annotation/search', (req, res) => {
  findBySource(req.query.source).then(result => {
    res.json(result);
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