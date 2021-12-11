import express from 'express';

import { exists, initDB } from './db/init';
import { upsertAnnotation, deleteById, findBySource } from './db/annotation';

const app = express();

app.use(express.json());

app.set('json spaces', 2);

exists().then(exists => {
  if (!exists)
    initDB();
});

app.get('/annotation/search', (req, res) => {
  findBySource(req.query.source).then(result => {
    res.json(result);
  });
})

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
app.listen(PORT);

console.log(`API running on port ${PORT}`); 