/*	main.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

/* 	
 *	this module has two main responsibilities: 
 *		- to init the the app and get it started
 *		- act as a message/event emitter layer for the rest of the app
 *
 */

var electron = require("electron");
var path = require("path");
var Client = require("./client.js");
const clientEventBus = require("./event.js");

// electron boilerplate
var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let appWindow;
let settingsWindow;
let gameOverWindow;

let client = new Client();

// ----------------------------------------------------------------------------
// Window Creation
// ----------------------------------------------------------------------------
app.on("ready", function() {

	// electron boilerplate
	appWindow = new BrowserWindow({
		width: 950,
		height: 750,
		backgroundColor: '#006282',
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		show: false
	});

	//appWindow.maximize();
	//appWindow.webContents.openDevTools();
	appWindow.loadURL("file://" + __dirname + "/menu.html");

	// electron boilerplate
	appWindow.once("ready-to-show", function() {
		appWindow.show();
	});

});

// electron boilerplate
app.on("window-all-closed", app.quit);

// ----------------------------------------------------------------------------
// IPC BUS EVENTS
// ----------------------------------------------------------------------------

ipc.on('EXIT', function(event, {}) {
	app.quit();
});

ipc.on('GAMEOVER', function() {

	// create new display context
	gameOverWindow = new BrowserWindow({
		parent: appWindow,
		backgroundColor: '#006282',
		modal: true,
		show: false,
		frame: false,
		resizable: false,
		width: 371,
		height: 446
	});

	// tell renderer to load game over html
	gameOverWindow.loadURL("file://" + __dirname + "/gameover.html");

	// when display context is finished loading...
	gameOverWindow.once('ready-to-show', function() {
		// ...put context on screen...
		gameOverWindow.show();
		// ...fire off events
		gameOverWindow.webContents.send('INITSOUNDS', settings.sound);
		gameOverWindow.webContents.send('GAMEOVERDATA', client.getGameState());
	});

	// player has closed window
	gameOverWindow.on('window-should-close', gameOverWindow.close);
})

ipc.on('SETTINGS', function() {

	// create new display context
	settingsWindow = new BrowserWindow({
		parent: appWindow,
		backgroundColor: '#006282',
		modal: true,
		show: false,
		frame: false,
		resizable: false,
		width: 371,
		height: 446
	});

	// tell renderer to load settings window html
	settingsWindow.loadURL("file://" + __dirname + "/settings.html");
	
	// when display context is finished loading...
	settingsWindow.once('ready-to-show', function() {
		// ...put context on screen...
		settingsWindow.show();
		// ...fire off events
		settingsWindow.webContents.send('INITSOUNDS', settings.sound);
	});

	// player has closed window
	settingsWindow.on('window-should-close', settingsWindow.close);
});

// what a random spot for this variable
var settings = {
	'sound': {
		'music': true,
		'sfx': true,
		'playTime' : 0
	}
};

ipc.on('SETTINGSCLOSE', function() {
	// player has closed settings
	appWindow.webContents.send('INITSOUNDS', settings.sound);
	settingsWindow.close();
});

ipc.on('SOUNDTOGGLE', function(event, sound) {

	var status;
	switch(sound)
	{
		case 'music':
			status = settings.sound.music;
			settings.sound.music = !settings.sound.music;
			break;
		case 'sfx':
			status = settings.sound.sfx;
			settings.sound.sfx = !settings.sound.sfx;
			break;
	}
	event.sender.send('SOUNDTOGGLE', { 'sound': sound, 'status': status });
});

ipc.on('UPDATESOUND', function(event, currentPlayTime) {
	settings.sound.playTime = currentPlayTime;
})

ipc.on('PLAYSOUND', function(event, sound) {

	var status;
	switch(sound)
	{
		case 'music':
			status = settings.sound.music;
			break;
		case 'bPressed':
			status = settings.sound.sfx;
			break;
		case 'bHover':
			status = settings.sound.sfx;
			break;
	}

	if(status)
		event.sender.send('PLAYSOUND', sound);
});

ipc.on('MAINMENU', function(event, data) {

	// tell the renderer to swap to menu html
	appWindow.loadURL("file://" + __dirname + "/menu.html");

	// once it's loaded...
	appWindow.webContents.once('did-finish-load', function() {
		// ...fire event
		appWindow.webContents.send('INITSOUNDS', settings.sound);
	});

	// close anything else that is open
	if(settingsWindow) {
		settingsWindow.close();
		settingsWindow = null;
	}
	if(gameOverWindow) {
		gameOverWindow.close();
		gameOverWindow = null;
	}
});


// create a new hotseat game with the specified number of players
ipc.on('HOTSEAT', function(event, players) {
	
	clientEventBus.emit("CHANGE_STATE", "HOTSEAT", players);

	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('INITSOUNDS', settings.sound);
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

ipc.on('HOSTEND', function(event, {}) {

	// TODO Implement handling of host killing network games...
	
});

// ----------------------------------------------------------------------------
// Game Actions
// ----------------------------------------------------------------------------

ipc.on('DRAW', function(event, data) {
	client.handleAction("DRAW", data, 0);
});

ipc.on("PLACE", function(event, data) {
	client.handleAction("PLACE", data, 0);
});

ipc.on('LURE', function(event, data) {
	client.handleAction("LURE", data, 0);
});

ipc.on('SHIPSFLY', function(event, data) {
	client.handleAction("SHIPSFLY", data, 0);
});

ipc.on('SCORING', function(event, data) {
	client.handleAction("SCORING", data, 0);
});

ipc.on('SHIPSFLEE', function(event, data) {
	client.handleAction("SHIPSFLEE", data, 0);
});

// reset
ipc.on('RESET', function(event, data) {
	client.handleAction("RESET", data, 0);
});

// ----------------------------------------------------------------------------
// CLIENT BUS EVENTS
// ----------------------------------------------------------------------------

clientEventBus.on("REND_TO_INDEX", () => {
	
	// tell renderer to swap to index.html, game is starting yay
	appWindow.loadURL("file://" + __dirname + "/index.html");

	// once it's loaded...
	appWindow.webContents.once('did-finish-load', function() {
		// ...fire off events
		appWindow.webContents.send("SET_PNUM", client.getPnum());
		appWindow.webContents.send('GSO', client.getGameState());
	});	

});

clientEventBus.on("NEW_CONNECTION", (pCount) => {

	appWindow.webContents.send("playerUpdate", pCount);

});

clientEventBus.on("updateGameState", (event) => {

	appWindow.webContents.send("GSO", event);

});

clientEventBus.on("CONNECT_REND_TO_INDEX", (event, data) => {
	
	// tell renderer to swap to index.html, game is starting yay
	appWindow.loadURL("file://" + __dirname + "/index.html");
	
	// once it's loaded...
	appWindow.webContents.once('did-finish-load', function() {
		// ...fire off events
		appWindow.webContents.send("SET_PNUM", client.getPnum());
		appWindow.webContents.send('GSO', event);
	});	
	
});

clientEventBus.on("HANDLE_ACTION", (event, data, pNum) => {

	client.handleAction(event, data, pNum);	

});