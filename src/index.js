import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import responseHelper from './middleware/responseHelper.js';
import userRoutes from './user/routes/index.js';
import gmsRoutes from './gms/index.js'; 


const app = express();

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(responseHelper);

app.get('/', (req, res) => {
  res.send("Hello World!!").status(404);
}
);

app.get('/api/data', (req, res) => {
  res.sendSuccess({ value: 42 }, 'Data fetched successfully');
});

app.get('/api/error', (req, res) => {
  res.sendError('Something went wrong', 422, [{ field: 'email', message: 'Invalid' }]);
});

//routes
app.use('/api/v1/', userRoutes);
app.use('/api/v1/', gmsRoutes);



app.use((req, res) => {
  return res.sendError('Route not found', 404);
});
export default app; 