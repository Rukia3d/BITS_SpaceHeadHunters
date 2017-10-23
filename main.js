// includes
var electron = require("electron");
var path = require("path");
var GameState = require("./GameState.js");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let gso = {};
let appWindow;

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

ipc.on('EXIT', function(event, {}) {
	app.quit();
});

ipc.on('HOTSEAT', function(event, {}) {
	
	console.log(`Starting a new hotseat game`);
	
	gso = new GameState(2);

	appWindow.loadURL("file://" + __dirname + "/index.html");
	
	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', gso.getGameState());
	});
});

ipc.on('CONNECT', function(event, arg) {
	console.log(`Connecting to ${arg}`);
	appWindow.loadURL("file://" + __dirname + "/index.html");
});

ipc.on('HOST', function(event, {}) {
	console.log(`Hosting a new game`);
});

ipc.on('HOSTSTART', function(event, players) {
	gso = new GameState(players);

	appWindow.loadURL("file://" + __dirname + "/index.html");
	
	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', gso.getGameState());
	});
});

ipc.on('HOSTEND', function(event, {}) {
	console.log(`Cancelling new hosted game`);
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
});

// place
ipc.on("PLACE", function(event, data) {

	// if the place was good
	if(gso.placeCard(data.player, data.x, data.y)) {
		
		// go to lure
		gso.nextPhase();
		
	}
	event.sender.send("GSO", gso.getGameState());
});

// lure
ipc.on('LURE', function(event, data) {

	// if the lure was good
	if(gso.placeLure(data.player, data.x, data.y)) {

		// go to shipsfly, or back to draw for next player
		gso.nextPhase();
	}

	event.sender.send("GSO", gso.getGameState());
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