// includes
var electron = require("electron");
var path = require("path");
var Client = require("./client.js");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let appWindow;
let client = new Client();

function menuCallBack() {
	appWindow.loadURL("file://" + __dirname + "/menu.html");	
}

function gameCallBack() {
	appWindow.loadURL("file://" + __dirname + "/index.html");	
}

function sendGameState() {
	appWindow.webContents.send("GSO", client.requestGameState());
}

// ----------------------------------------------------------------------------
// Window Creation
// ----------------------------------------------------------------------------
app.on("ready", function() {

	appWindow = new BrowserWindow({
		x: -1000,
		y: 0,
		width: 950,
		height: 750,
		backgroundColor: '#006282',
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		show: false
	});

	appWindow.maximize();
	appWindow.webContents.openDevTools();
	appWindow.loadURL("file://" + __dirname + "/menu.html");
	client.attachGameCallBack(gameCallBack);
	client.attachMenuCallBack(menuCallBack);
	//client.attachUpdateCallBack(sendGameState);

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
	
	client.changeState("HOTSEAT", {"players": players});

	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', client.requestGameState());
	});

});


// connect to an existing hosted game via ip address
ipc.on('CONNECT', function(event, ip) {

	client.changeState("CONNECT", {"ip": ip});
	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', client.requestGameState());
	});
	
});

// begin server script for hosting a game
// output the current number of players to lobby
ipc.on('HOST', function(event, {}) {
	
	client.changeState("CONNECT", {});
	
	// send the GSO once the window is ready
	//appWindow.webContents.once('did-finish-load', function() {
	//	appWindow.webContents.send('GSO', gso.getGameState());
	//});

});

// start a hosted game
ipc.on('HOSTSTART', function(event, players) {

	/*
	gso = new GameState(players);

	if(socket != null) 
	{
		var data = gso.getGameStateJSON();
		console.log(data);
		socket.emit("startGameServer", data);
	}
	*/

});

// end the server script for a hosted game
ipc.on('HOSTEND', function(event, {}) {

	/*
	console.log(`Cancelling new hosted game`);
	socket.disconnect();

	// TODO KILL the MotherF&#%er child process because server is still running if the host hits the back button
	*/
});

// ----------------------------------------------------------------------------
// Game Actions
// ----------------------------------------------------------------------------

// draw
ipc.on('DRAW', function(event, data) {

	client.handleAction("DRAW", data);
	event.sender.send("GSO", client.requestGameState());

	//if(socket != null)
		//socket.emit("updateServerGSO", gso.getGameStateJSON());

});

// place
ipc.on("PLACE", function(event, data) {

	client.handleAction("PLACE", data);
	event.sender.send("GSO", client.requestGameState());

	//if(socket != null)
	//	socket.emit("updateServerGSO", gso.getGameStateJSON());
});

// lure
ipc.on('LURE', function(event, data) {

	client.handleAction("LURE", data);
	event.sender.send("GSO", client.requestGameState());

	//if(socket != null)
	//	socket.emit("updateServerGSO", gso.getGameStateJSON());
});

ipc.on('SHIPSFLY', function(event, data) {
	
	client.handleAction("SHIPSFLY", data);
	event.sender.send("GSO", client.requestGameState());

});

ipc.on('SCORING', function(event, data) {
	
	client.handleAction("SCORING", data);
	event.sender.send("GSO", client.requestGameState());

});

ipc.on('SHIPSFLEE', function(event, data) {

	client.handleAction("SHIPSFLEE", data);
	event.sender.send("GSO", client.requestGameState());

});

// reset
ipc.on('RESET', function(event, data) {

	client.handleAction("RESET", data);
	event.sender.send("GSO", client.requestGameState());

});