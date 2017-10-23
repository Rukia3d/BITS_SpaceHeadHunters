// includes
var electron = require("electron");
var path = require("path");
var GameState = require("./GameState.js");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

let gso = {};
let appWindow;

// server
const server = require("http").createServer();
const io_server = require("socket.io")(server);
const io_client = require("socket.io-client");
const fs = require("fs");

let socket = io_client("http://");

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
	socket = io_client("http://localhost:3000");
});

// begin server script for hosting a game
// output the current number of players to lobby
ipc.on('HOST', function(event, {}) {
	console.log(`Hosting a new game`);
	server.listen(3000);
	socket = io_client("http://localhost:3000");
});

// start a hosted game
ipc.on('HOSTSTART', function(event, players) {
	gso = new GameState(players);

	appWindow.loadURL("file://" + __dirname + "/index.html");
	
	// send the GSO once the window is ready
	appWindow.webContents.once('did-finish-load', function() {
		appWindow.webContents.send('GSO', gso.getGameState());
	});
});

// end the server script for a hosted game
ipc.on('HOSTEND', function(event, {}) {
	console.log(`Cancelling new hosted game`);
	server.close();
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

// ----------------------------------------------------------------------------
// Client
// ----------------------------------------------------------------------------
socket.on("updateState", (event, data) => {
	
    console.log(event);
    console.log(data);

});

// ----------------------------------------------------------------------------
// Server
// ----------------------------------------------------------------------------

io_server.on("connection", (socket) => {

    console.log("Connection found: " + socket.id);
    printIds(io_server.sockets.connected);

    if (!addPlayer(gState, socket.id)) {
        console.log("Player slots full...");
        // TODO disconnect the connection
    } else {
        io_server.emit("updateState", "connected", gState);
    }

    socket.on("disconnect", (reason) => {
        
        removePlayer(gState, socket.id);
        console.log("Disconnection: " + socket.id + " - " + reason);
        printIds(io_server.sockets.connected);

        io_server.emit("updateState", "disconnected", gState);   

    });

    socket.on("fetchState", (event, data) => {
        
        console.log("fetch state...");
        socket.emit("updateState", "connected", gState);
    
    });

});

function printIds(clients) {
    
        console.log("*** Connected Clients ***")    
        
        for (id in clients) {
            console.log("\t" + id);
        }
        
        console.log("*************************\n")
        
    }
    
function addPlayer(gState, id) {

    if (gState.pCount <= 3) {
        
        gState.pCount++;

        if (gState.p1_id === null) {
            gState.p1_id = id;
            return true;
        }

        if (gState.p2_id === null) {
            gState.p2_id = id;
            return true;
        }

        if (gState.p3_id === null) {
            gState.p3_id = id;
            return true;
        }

        if (gState.p4_id === null) {
            gState.p4_id = id;
            return true;
        }

    }
    
    return false;

}

function removePlayer(gState, id) {

    if (gState.pCount > 0) {
        
        gState.pCount--;

        if (gState.p1_id === id) {
            gState.p1_id = null;
            return;
        }

        if (gState.p2_id === id) {
            gState.p2_id = null;
            return;
        }

        if (gState.p3_id === id) {
            gState.p3_id = null;
            return;
        }

        if (gState.p4_id === id) {
            gState.p4_id = null;
            return;
        }
    }
}