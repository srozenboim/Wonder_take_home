var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];
var rooms = {0: {status: 'open', usernames: []}};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
  	('a user disconnected')
    if (!socket.nickname) return;
    users.splice(users.indexOf(socket.nickname), 1);
    removeFromChatroom(socket.nickname);
  });

  socket.on('chat message', function(msg, roomId){
  	if (msg.startsWith('/delay')) {
  		var array = msg.split(' ');
  		var timeout = array[1];
  		var message = array[2];
  		setTimeout(function(){ 
  			io.to(roomId).emit('chat message', message); 
  		}, timeout);
  	} else if (msg.startsWith('/hop')) {
  		removeFromChatroom(socket.nickname);
  		createChatrooms(socket.nickname);
  	} else {
    	io.to(roomId).emit('chat message', msg);
  	}
  });

  socket.on('send-nickname', function(data, callback) {
  	if (users.indexOf(data) !== -1) {
  		callback(false); //nickname already exists, no need to remove from users array
  	} else {
  		callback(true);
	    socket.nickname = data;
	    users.push(socket.nickname);
	    createChatrooms(socket.nickname);  		
  	}
	});

	function removeFromChatroom(user) {
		Object.keys(rooms).forEach(function(roomId) {
			if (rooms[roomId].usernames.includes(user)) {
				var usernames = rooms[roomId].usernames;
				var userIndex = usernames.indexOf(user);
				usernames.splice(userIndex);
				socket.leave(roomId);
				io.to(roomId).emit('usernames', usernames);
				rooms[roomId].status = 'open';
			}
		})
	}

	function createChatrooms(newUser) {
		// take array of users and split them into chatrooms of 2 users per room
			Object.keys(rooms).forEach(function(roomId) {
				if (rooms[roomId].status === 'open') {
					if (rooms[roomId].usernames.length < 2) {
						var usernames = rooms[roomId].usernames;
						usernames.push(newUser);
						socket.join(roomId);
						io.to(roomId).emit('usernames', usernames);
						io.to(roomId).emit('roomId', roomId)
					} else {
						var newRoomId = Number(roomId) + 1;
						rooms[roomId].status = 'closed'
						rooms[newRoomId] = {status: 'open', usernames: [newUser]}
						socket.join(newRoomId);
						io.to(newRoomId).emit('usernames', rooms[newRoomId].usernames);
						io.to(newRoomId).emit('roomId', newRoomId)
					}
				}				
			})
	}
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});