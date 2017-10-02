var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var clients = new Array();
let gso = {};

io.on('connection', function(socket) {

	console.log('a user connected');

	socket.on("recordClient", function() {
		var client = { 
			"playerNumber" : assignPlayerNumber(),
			"socket" : socket.id
		};
		clients.push(client);
		socket.emit("playerNumber", client.playerNumber);
		socket.emit("GSO", gso);
	});

	socket.on("GSO", function(data) {
		gso = data;
		io.emit("GSO", gso);
	});

	socket.on("disconnect", function() {
		clients.forEach(function(client, index, array) {
			if(client.socket == socket.id) {
				array.splice(index, 1);
			}
		});
	});
});

http.listen(3000, function(){
	console.log('listening on port:3000');
});

function assignPlayerNumber() {
	console.log(`player ${clients.length} has arrived`);
	clients.sort(clientComparison);
	return clients.length;
}

function clientComparison(a, b) {
	return a.playerNumber - b.playerNumber;
}
