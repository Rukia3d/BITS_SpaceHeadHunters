// includes
var electron = require("electron");
var path = require("path");
var GameState = require("./GameState.js");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let gso = {};
let appWindow;
var socket = null;
var server = null;

let gState = {
    pCount: 0,
    p1_id: null,
    p2_id: null,
    p3_id: null,
    p4_id: null    
};

// ----------------------------------------------------------------------------
// Window Creation
// ----------------------------------------------------------------------------
app.on("ready", function() {

	appWindow = new BrowserWindow({

		width: 950,
		height: 750,
		backgroundColor: '#006282',
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		show: false
	});

	appWindow.loadURL("file://" + __dirname + "/menu.html");

	appWindow.once("ready-to-show", function() {
		appWindow.show();
	});
});

app.on("window-all-closed", app.quit);

// ----------------------------------------------------------------------------
// Main Menu
// ----------------------------------------------------------------------------

// Exit the app
ipc.on('EXIT', function(event, {}) {
	app.quit();
});


// create a new hotseat game with the specified number of players
ipc.on('HOTSEAT', function(event, players) {
	
	console.log(`Starting a new hotseat game with ${players} players`);
	
	gso = new GameState(players);

	appWindow.loadURL("file://" + __dirname + "/index.html");
	
	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', gso.getGameState());
	});
});


// connect to an existing hosted game via ip address
ipc.on('CONNECT', function(event, ip) {
	console.log(`Connecting to ${ip}`);
	const io_client = require("socket.io-client");
	socket = io_client.connect('http://localhost:3000');
	gso = new GameState(2);

	socket.on("updateState", (event, data) => {
	
	    console.log(event);
	    console.log(data);
	    appWindow.webContents.send("playerUpdate", data.pCount);
	});

	socket.on("updateClientGSO", (data) => {
		console.log(`Updating client GSO ${data}`);
		gso.setGameStateJSON(data);
		appWindow.webContents.send("GSO", gso.getGameState());
	});

	socket.on("startGameClient", (data) => {
		console.log(`Starting client game`);
		appWindow.loadURL("file://" + __dirname + "/index.html");
	
		// send the GSO once the window is ready
		appWindow.webContents.once('did-finish-load', function() {
			appWindow.webContents.send('GSO', gso.getGameState());
		});
	});
});

// begin server script for hosting a game
// output the current number of players to lobby
ipc.on('HOST', function(event, {}) {
	console.log(`Hosting a new game`);

	// server
	const io_client = require("socket.io-client");
	spawn = require('child_process').spawn;
	server = spawn('node', ['server.js'], { detached : true });

	// client
	socket = io_client.connect('http://localhost:3000');

	socket.on("updateState", (event, data) => {
	
	    console.log(event);
	    console.log(data);
	    console.log(data.pCount);
		appWindow.webContents.send("playerUpdate", data.pCount);
	});

	socket.on("updateClientGSO", (data) => {
		console.log(`Updating client GSO`);
		gso.setGameStateJSON(data);
		appWindow.webContents.send("GSO", gso.getGameState());
	});

	socket.on("startGameClient", (data) => {
		console.log(`Starting client game`);
		appWindow.loadURL("file://" + __dirname + "/index.html");
	
		// send the GSO once the window is ready
		appWindow.webContents.once('did-finish-load', function() {
			appWindow.webContents.send('GSO', gso.getGameState());
		});
	});
});

// start a hosted game
ipc.on('HOSTSTART', function(event, players) {
	gso = new GameState(players);

	if(socket != null) 
	{
		var data = gso.getGameStateJSON();
		console.log(data);
		socket.emit("startGameServer", data);
	}
});

// end the server script for a hosted game
ipc.on('HOSTEND', function(event, {}) {
	console.log(`Cancelling new hosted game`);
	socket.disconnect();

	// TODO KILL the MotherF&#%er child process.
});

// ----------------------------------------------------------------------------
// Game Actions
// ----------------------------------------------------------------------------

// draw
ipc.on('DRAW', function(event, data) {

	// if the draw was good
	if(gso.drawCard(data)) {

		// go to place
		gso.nextPhase();
	}

	event.sender.send("GSO", gso.getGameState());
	if(socket != null)
		socket.emit("updateServerGSO", gso.getGameStateJSON());
});

// place
ipc.on("PLACE", function(event, data) {

	// if the place was good
	if(gso.placeCard(data.player, data.x, data.y)) {
		
		// go to lure
		gso.nextPhase();
		
	}
	event.sender.send("GSO", gso.getGameState());
	if(socket != null)
		socket.emit("updateServerGSO", gso.getGameStateJSON());
});

// lure
ipc.on('LURE', function(event, data) {

	// if the lure was good
	if(gso.placeLure(data.player, data.x, data.y)) {

		// go to shipsfly, or back to draw for next player
		gso.nextPhase();
	}

	event.sender.send("GSO", gso.getGameState());
	if(socket != null)
		socket.emit("updateServerGSO", gso.getGameStateJSON());
});

ipc.on('SHIPSFLY', function(event, data) {
	// fly the ships, and set's the phase to SCORING
	gso.nextPhase();

	// let front end know the current phase
	event.sender.send("GSO", gso.getGameState());
});

ipc.on('SCORING', function(event, data) {
	// score, and set phase to SHIPSFLEE
	gso.nextPhase();

	// let front end know the current phase
	event.sender.send("GSO", gso.getGameState());
});

ipc.on('SHIPSFLEE', function(event, data) {
	// flee, and set phase to DRAW or END
	gso.nextPhase();

	// let front end know the current phase
	event.sender.send("GSO", gso.getGameState());
});

// reset
ipc.on('RESET', function(event, {}) {

	console.log("\n\n****************************");
	console.log("***** GAME RESET STATE *****");
	console.log("****************************\n\n");

	gso = new GameState(2);
	event.sender.send("GSO", gso.getGameState());

});