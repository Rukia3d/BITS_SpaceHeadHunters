// includes
var electron = require("electron");
var path = require("path");
var GameState = require("./GameState.js");
var io = require("socket.io-client");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let gso = {};

// app window required to send some messages
var appWindow;
const SERVER = "http://localhost:3000";
var socket = new io(SERVER);
var networked = false;
var playerNumber = null;

socket.on("connection", function() {
	console.log(`Connected to ${SERVER}`);
});

socket.on("disconnect", function() {
	console.log(`Disconnected from ${SERVER}`);
});

socket.on("playerNumber", function(data) {

	playerNumber = data;
	console.log(`I am player ${data}`);
	gso = new GameState(2, networked, playerNumber);

	if(playerNumber == 0) {
		socket.emit("GSO", gso.getGameState());
	}
});

socket.on("GSO", function(data) {
	gso.setGameState(data);
	appWindow.webContents.send("GSO", gso);
})

app.on("ready", function() {

	// new game state with 2 players
	//gso = new GameState(2);
	ipc.on("NETWORK_MODE", function(event, data) {
		networked = data;

		if(data) {
			console.log(`starting new network game: ${networked}`);
			socket.emit("recordClient");
		}
		else {
			console.log(`starting new hotseat game`);
			gso = new GameState(2, networked, playerNumber);
		}
		appWindow.loadURL("file://" + __dirname + "/index.html");		
	});

	ipc.on("ready-for-game", function() {
		appWindow.webContents.send("GSO", gso);
		appWindow.webContents.send("playerNum", playerNumber);
	});

	appWindow = new BrowserWindow({
		width: 950,
		height: 750,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		show: false
	});

	appWindow.loadURL("file://" + __dirname + "/menu.html");

	appWindow.once("ready-to-show", function() {

		appWindow.show();
		// send the initial game state
	});

	// draw
	ipc.on('DRAW', function(event, data) {

		// if the draw was good
		if(gso.drawCard(data)) {
			// go to place
			gso.nextPhase();
			socket.emit("GSO", gso.getGameState());
			event.sender.send("GSO", gso.getGameState());
		}
	});

	// place
	ipc.on('PLACE', function(event, data) {

		// if the place was good
		if(gso.placeCard(data.player, data.x, data.y)) {
			
			// go to lure
			gso.nextPhase();
			socket.emit("GSO", gso.getGameState());
			event.sender.send("GSO", gso.getGameState());
		}
	});

	// lure
	ipc.on('LURE', function(event, data) {

		// if the lure was good
		if(gso.placeLure(data.player, data.x, data.y)) {

			// go to shipsfly, or back to draw for next player
			gso.nextPhase();
			socket.emit("GSO", gso.getGameState());
			event.sender.send("GSO", gso.getGameState());
		}
		
		// if the lure was good, and we were on the last player, we should be on SHIPSFLY
		if(gso.phase == "SHIPSFLY") {
			
			// fly the ships and go to SCORING
			gso.nextPhase();
			socket.emit("GSO", gso.getGameState());
			event.sender.send("GSO", gso.getGameState());

			// Score and go to SHIPSFLEE
			gso.nextPhase();
			socket.emit("GSO", gso.getGameState());
			event.sender.send("GSO", gso.getGameState());

			// Flee and either END, or go back to DRAW
			gso.nextPhase();
			socket.emit("GSO", gso.getGameState());
			event.sender.send("GSO", gso.getGameState());
		}
	});

	// reset
	ipc.on('RESET', function(event, {}) {

		console.log("\n\n****************************");
		console.log("***** GAME RESET STATE *****");
		console.log("****************************\n\n");

		gso = new GameState(2, networked, playerNum);
		socket.emit("GSO", gso.getGameState());
		event.sender.send("GSO", gso.getGameState());
	});

});

app.on("window-all-closed", function() {
	socket.close();
	app.quit();
});