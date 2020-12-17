var fs = require('fs')
var url = require('url')
var options = {
  key: fs.readFileSync('./cert1/server.key'),
  cert: fs.readFileSync('./cert1/server.crt')
}
var handler = function(req, res){fs.readFile('index.html',function(err, data){
    if(err){
      res.writeHead(500)
      return res.end('error loading index.html')
    }
    res.writeHead(200)
    res.end(data)
  })
}
var app = require('https').createServer(options)
var USERCOUNT = 3
app.on('request', function(req, res){
  var urls = url.parse(req.url, true)
  if (urls.pathname == '/' || urls.pathname == '/index.html') {
    fs.readFile('index.html',function(err, data){
      if(err){
        res.writeHead(500)
        return res.end('error loading index.html')
      }
      res.writeHead(200)
      res.end(data)
    })
  } else {
    fs.readFile('.' + req.url, function (err, data) { 
      if (!err) {
        // console.log(data)
        res.end(data)
      } else {
        console.log('err')
      }
    })
  }
})
var io = require('socket.io')(app)
app.listen(443, '0.0.0.0')

// io.emit('news', message)
// socket.emit('joined', room, socket.id) // 发给自己
// socket.broadcast.emit('message', room, data) // 发给除自己之外的这个节点上的所有人,多个房间
// io.in(room).emit('joined', room, socket.id) // 发给房间内的所有人
// socket.to(room).emit('bye', room, socket.id) // 发送给同在 'game' 房间的所有客户端，除了发送者

io.sockets.on('connection', function(socket){
  socket.on('message', function(room, data){
    if (data.msg) {
      io.in(room).emit('message', room, data) 
    } else {
      socket.to(room).emit('message', room, data)
    }
  })
  socket.on('join', (room) => {
    socket.join(room)
    var myRoom = io.sockets.adapter.rooms[room]
    var users = myRoom ? Object.keys(myRoom.sockets).length : 0
    // console.log(io.sockets.adapter.rooms)
    if (users < USERCOUNT) {
      socket.emit('joined', room, socket.id)
      if (users > 1) {
        socket.to(room).emit('otherjoin', room, socket.id)
      }
    } else {
      socket.leave(room)
      socket.emit('full', room, socket.id)
    } 
  })
  socket.on('leave', (room) => {
    var myRoom = io.sockets.adapter.rooms[room]
    var users = (myRoom) ? Object.keys(myRoom.sockets).length : 0
    socket.to(room).emit('bye', room, socket.id)
    socket.emit('leaved', room, socket.id)
  })

})

// io.on('connection', function(socket){
//   socket.join('Test');
//   socket.join('Test1');
//   console.log(io.sockets.adapter.rooms);
// });