var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/signup.html');
// });

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on('send-nickname', function(data, callback) {
  	if (users.indexOf(data) !== -1) {
  		callback(false); //nickname already exists
  	} else {
  		callback(true);
	    socket.nickname = data;
	    users.push(socket.nickname);
	    io.sockets.emit('usernames', users);
	    console.log(users);
  		
  	}
	});

	// socket.on('get-users', function() {
	// 	return users;
	// })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});