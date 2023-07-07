import express from 'express';
import path from 'path';
import indexRouter from '@routes/index.route';

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Settings for Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', {title: 'ZonaYummy'});
});
app.use('/', indexRouter);

app.listen(port, () => console.log('Server is running on port 3000'));
