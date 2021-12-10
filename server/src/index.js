import express from 'express';

import { exists, initDB } from './db/init';

const app = express();

app.use(express.json());

app.set('json spaces', 2);

exists().then(exists => {
  if (!exists)
    initDB();
});

app.get('/annotation/:annotationId', (req, res) => {
  const { annotationId } = req.params;

  // TODO retrieve annotation with given ID

});

app.post('/annotation', (req, res) => {

  // TODO create/update annotation

});

app.delete('/annotation/:annotationId', (req, res) => {
  const { annotationId } = req.params;

  // TODO delete annotation with given ID

});

app.get('/search', (req, res) => {
  const { source } = req.query;

  // TODO return annotations for source

});

const PORT = 8080;
app.listen(PORT);

console.log(`API running on port ${PORT}`);