const path = require('path');
const express = require('express');
const dotenv  = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xssclean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

const bootcamps = require('./routes/bootcamp');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

//load env vars
dotenv.config({path : './config/config.env'});

connectDB();

const app = express();

// Body Parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

// DEV logging middleware
if(process.env.NODE_ENV === 'development'){
  app.use(morgan('dev'));
}

app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// add security headers
app.use(helmet());

// Prevent xss attacks
app.use(xssclean());

// Rate limiting
const limiter = rateLimit({
  windowMs : 10*60*1000,
  max : 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname,'public')));


//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`server running in ${process.env.NODE_ENV} on port ${process.env.PORT}`.yellow.bold);
});

//handle promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error : ${err.message}`.red);
  server.close(()=>process.exit(1));
})