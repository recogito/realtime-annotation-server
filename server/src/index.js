import http from 'http';
import express from 'express';

import Config from './config';
import SessionPool from './realtime/SessionPool';
import { exists, initDB } from './db';
import { clearAllLocks } from './db/Lock';
import { deleteById, findBySource, upsertAnnotation } from './db/Annotation';

const app = express();

app.use(express.json());
app.set('json spaces', 2);

const server = http.createServer(app);

/** The realtime session pool **/
SessionPool.init(server);

/**
 * DB init, if needed
 */
exists().then(exists => {
  if (exists) {
    clearAllLocks();
  } else {
    initDB();
  }
});

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

app.get('/version', (req, res) => {
  res.json({ version: '0.0.1' });
});

server.listen(Config.SERVER_PORT, () => 
  console.log(`API running on port ${Config.SERVER_PORT}`));

