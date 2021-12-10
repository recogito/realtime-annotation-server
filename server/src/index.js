import express from 'express';

const app = express();

app.use(express.json());

app.set('json spaces', 2);

app.get('/', (req, res) => {
  res.send('Hello world\n');
});

const PORT = 8080;
app.listen(PORT);

console.log(`API running on port ${PORT}`);