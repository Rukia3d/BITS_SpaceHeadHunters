// includes
var electron = require("electron");
var path = require("path");
var Client = require("./client.js");
const clientEventBus = require("./event.js");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let appWindow;
let client = new Client();

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

	//appWindow.maximize();
	//appWindow.webContents.openDevTools();
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
	
	clientEventBus.emit("CHANGE_STATE", "HOTSEAT", players);

	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', client.getGameState());
	});

});


// connect to an existing hosted game via ip address
ipc.on('CONNECT', function(event, ip) {

	clientEventBus.emit("CHANGE_STATE", "CONNECT", {"ip": ip});
	
});

// begin server script for hosting a game
// output the current number of players to lobby
ipc.on('HOST', function(event, {}) {
	
	clientEventBus.emit("CHANGE_STATE", "HOST", {});
	
	appWindow.webContents.send("HOST_START", {});

});

// start a hosted game
ipc.on('HOSTSTART', function(event, players) {

	clientEventBus.emit("HOSTSTART");

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
	event.sender.send("GSO", client.getGameState());

});

// place
ipc.on("PLACE", function(event, data) {

	client.handleAction("PLACE", data);
	event.sender.send("GSO", client.getGameState());

});

// lure
ipc.on('LURE', function(event, data) {

	client.handleAction("LURE", data);
	event.sender.send("GSO", client.getGameState());

	
});

ipc.on('SHIPSFLY', function(event, data) {
	
	client.handleAction("SHIPSFLY", data);
	event.sender.send("GSO", client.getGameState());

});

ipc.on('SCORING', function(event, data) {
	
	client.handleAction("SCORING", data);
	event.sender.send("GSO", client.getGameState());

});

ipc.on('SHIPSFLEE', function(event, data) {

	client.handleAction("SHIPSFLEE", data);
	event.sender.send("GSO", client.getGameState());

});

// reset
ipc.on('RESET', function(event, data) {

	client.handleAction("RESET", data);
	event.sender.send("GSO", client.getGameState());

});

// ----------------------------------------------------------------------------
// Client Communication
// ----------------------------------------------------------------------------

clientEventBus.on("REND_TO_INDEX", () => {
	
	appWindow.loadURL("file://" + __dirname + "/index.html");

	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send("SET_PNUM", client.getPnum());
		appWindow.webContents.send('GSO', client.getGameState());
	});	

});

clientEventBus.on("REND_DO_UPDATE", () => {

	//if(socket != null)
	//	socket.emit("updateServerGSO", gso.getGameStateJSON());

});

clientEventBus.on("NEW_CONNECTION", (pCount) => {

	appWindow.webContents.send("playerUpdate", pCount);

});

clientEventBus.on("updateGameState", (event) => {

	appWindow.webContents.send("GSO", event);

});

/*
clientEventBus.on("UPDATE_GSO", (event) => {
	
	console.log("sending rec'd GSO from host to front end..")
	console.log(event);

	appWindow.loadURL("file://" + __dirname + "/index.html");
	
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', event);
	});	
	
	
});
*/