var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var serveIndex = require('serve-index')
var socketIo = require('socket.io');
const { listen } = require('engine.io');

var log4js = require('log4js')
log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: 'app.log',
      layout: {
        type: 'pattern',
        pattern: '%r %p - %m'
      }
    }
  },
  categories: {
    default: {
      appenders: ['file'],
      level: 'debug'
    }
  }
})
var logger = log4js.getLogger();
var app = express();
app.use(serveIndex('./public'))
app.use(express.static('./public'))
var http_server = http.createServer(app);
http_server.listen(80, '0.0.0.0');

var options = {
  key: fs.readFileSync('./cert1/server.key'),
  cert: fs.readFileSync('./cert1/server.crt')
}
var https_server = https.createServer(options, app)
logger.log(socketIo)
var io = socketIo.listen(https_server)

io.sockets.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room)
    var myRoom = io.sockets.adapter.rooms[room]
    var users = Object.keys(myRoom.sockets).length
    logger.log('the number of user in room is : ' + users)
    // socket.emit('joined', room, socket.id)
    // socket.to(room).emit('joined', room, socket.id)
    // io.in(room).emit('joined', room, socket.id)
    socket.broadcast.emit('joined', room, socket.id)
  })
  socket.on('leave', (room) => {
    var myRoom = io.sockets.adapter.rooms[room]
    var users = Object.keys(myRoom.sockets).length
    logger.log('the number of user in room is : ' + users - 1)
    socket.leave(room)
    // socket.emit('joined', room, socket.id)
    // socket.to(room).emit('joined', room, socket.id)
    // io.in(room).emit('joined', room, socket.id)
    socket.broadcast.emit('joined', room, socket.id)
  })
})
https_server.listen(443, '0.0.0.0')

// var app = https.createServer(options, function(req, res){
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World \n');
// }).listen(8888, '0.0.0.0')