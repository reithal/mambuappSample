const http = require('http');
const createError = require('http-errors');
const app = require('./app');
const debug = require('debug')('backend:server');
const dotenv = require ('dotenv');
/**
 * Get port from environment and store in Express.
 */
dotenv.config();
const port = normalizePort(process.env['App_PORT'] || '3000');
const env = process.env['APP_ENV'] || 'dev'

app.set('env', env);
app.set('port', port);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort (val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};


/**
 * Create HTTP server.
 */

const server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.info(`Server started on port ${port}`);
});
server.on('error', errorHandler);
server.on('listening', onListening);



/**
 * Event listener for HTTP server "error" event.
 */
function errorHandler (error){
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' 
    ? 'pipe ' + address 
    : 'port: ' + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const address = server.address();
  const bind = typeof address === 'string' 
    ? 'pipe ' + address 
    : 'port ' + port;
  debug('Listening on ' + bind);

};

