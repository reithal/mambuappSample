const dotenv = require ('dotenv');
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const mainRoutes = require('./routes/index');
// const indexRouter = require('./routes/index');
const sampleRouter = require('./routes/sample');
const mambuxmlRouter = require('./routes/mambuxml');

const app = express()
// Use process.env.PORT, defaulting to 3000 if not set in .env or environment
const port = process.env.PORT || 3000;


// --- Express Configuration ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// --- Route Handling ---
app.use('/', mainRoutes);
app.use('/sample', sampleRouter);
app.use('/mambuapp', mambuxmlRouter);
app.use('/sampleapp', mambuxmlRouter);

// --- Static Files Serving (for your React app's build) ---
// Will be uncommented and configured when React is integrated
// app.use('/static', express.static(path.join(__dirname, 'client-app/build/static')));
// app.get('/iframe-content', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client-app/build', 'index.html'));
// });

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Access the server at: http://localhost:${port}`);
  // You can even log some non-sensitive env vars to confirm they loaded
  console.log(`API URL (from env): ${process.env.MAMBU_API_URL}`);
});

 
//
// TODO: CLEAN UP OLD SETUP REMOVING THESE LINES
// --- The next lines are the old setup ---
// const http = require('http');
// const createError = require('http-errors');
// const app = require('./app');
// const debug = require('debug')('backend:server');
/**
* Get port from environment and store in Express.
*/
// dotenv.config();
// const port = normalizePort(process.env['App_PORT'] || '3000');
// const env = process.env['APP_ENV'] || 'dev'

// app.set('env', env);
// app.set('port', port);

// /**
//  * Normalize a port into a number, string, or false.
//  */
// function normalizePort (val) {
//   const port = parseInt(val, 10);

//   if (isNaN(port)) {
//     return val;
//   }
//   if (port >= 0) {
//     return port;
//   }
//   return false;
// };


// /**
//  * Create HTTP server.
//  */

// const server = http.createServer(app);
// /**
//  * Listen on provided port, on all network interfaces.
//  */

// server.listen(port, () => {
//   console.info(`Server started on port ${port}`);
// });
// server.on('error', errorHandler);
// server.on('listening', onListening);



// /**
//  * Event listener for HTTP server "error" event.
//  */
// function errorHandler (error){
//   if (error.syscall !== 'listen') {
//     throw error;
//   }
//   const address = server.address();
//   const bind = typeof address === 'string' 
//     ? 'pipe ' + address 
//     : 'port: ' + port;
//   // handle specific listen errors with friendly messages
//   switch (error.code) {
//     case 'EACCES':
//       console.error(bind + ' requires elevated privileges.');
//       process.exit(1);
//       break;
//     case 'EADDRINUSE':
//       console.error(bind + ' is already in use.');
//       process.exit(1);
//       break;
//     default:
//       throw error;
//   }
// };

// /**
//  * Event listener for HTTP server "listening" event.
//  */

// function onListening() {
//   const address = server.address();
//   const bind = typeof address === 'string' 
//     ? 'pipe ' + address 
//     : 'port ' + port;
//   debug('Listening on ' + bind);

// };

