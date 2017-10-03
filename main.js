// includes
var electron = require("electron");
var path = require("path");
var GameState = require("./GameState.js");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let gso = {};

app.on("ready", function() {

	// new game state with 2 players
	gso = new GameState(2);

	var appWindow = new BrowserWindow({

		width: 950,
		height: 750,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		show: false
	});

	appWindow.loadURL("file://" + __dirname + "/index.html");

	appWindow.once("ready-to-show", function() {

		appWindow.show();
		// send the initial game state
		appWindow.webContents.send("GSO", gso.getGameState());
	});

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

		// if the lure was good, and we were on the last player, we should be on SHIPSFLY
		if(gso.phase == "SHIPSFLY") {
			
			// fly the ships and go to SCORING
			gso.nextPhase();
			event.sender.send("GSO", gso.getGameState());

			// Score and go to SHIPSFLEE
			gso.nextPhase();
			event.sender.send("GSO", gso.getGameState());

			// Flee and either END, or go back to DRAW
			gso.nextPhase();
			event.sender.send("GSO", gso.getGameState());
		}
	});

	// reset
	ipc.on('RESET', function(event, {}) {

		console.log("\n\n****************************");
		console.log("***** GAME RESET STATE *****");
		console.log("****************************\n\n");

		gso = new GameState(2);
		event.sender.send("GSO", gso.getGameState());

	});

});

app.on("window-all-closed", app.quit);