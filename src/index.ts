import express from 'express';

import indexRouter from '@routes/index.route';

const app = express();

app.get('/', (req, res) => {
    res.json({ message: 'Hello World' });
});
app.use('/', indexRouter);

app.listen(3000, () => console.log('Server is running on port 3000'));
