let GameState = require("./GameState.js");
let network = require("./network.js");

class Client {

    constructor() {

        this.gso = {};
        this.socket = null;
        this.server = null;
        this.net = new network();

        this.state = "mainmenu";

        this.menuCallBack = null;
        this.gameCallBack = null;

    }

    attachMenuCallBack(menuCallBack) {
        this.menuCallBack = menuCallBack;
    }

    attachGameCallBack(gameCallBack) {
        this.gameCallBack = gameCallBack;
    }

    changeState(newState, data) {

        switch (newState) {
            
            case "HOTSEAT":

                console.log(`Starting a new hotseat game with ${data.players} players`);
                this.state = newState;
                this.gso = new GameState(data.players);
                this.gameCallBack();

                break;

            case "CONNECT":
                /*
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
                
                
                });
                */

                break;

            case "HOST":
                /*
                console.log(`Hosting a new game`);
            
                const server = require("http").createServer();
                const io     = require(socket.io)(server);
            
                const io_client = require("socket.io-client");
                io_client.connect('http://localhost:3000');

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
            
                    // updates the lobby section in menu.html via main-menu.js
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
                */
                
                break;

        }

    }

    handleAction(action, data) {

        //console.log(action);

        switch (action) {

            case "DRAW":
                // if the draw was good
                if(this.gso.drawCard(data)) {
                    // go to place
                    this.gso.nextPhase();
                }
                break;

            case "PLACE":
                // if the place was good
                if(this.gso.placeCard(data.player, data.x, data.y)) {
                    // go to lure
                    this.gso.nextPhase();
                }
                break;

            case "LURE":
                // if the lure was good
                if(this.gso.placeLure(data.player, data.x, data.y)) {                    
                    // go to shipsfly, or back to draw for next player
                    this.gso.nextPhase();
                }
                break;

            case "SHIPSFLY":
            case "SCORING":
            case "SHIPSFLEE":
                this.gso.nextPhase();
                break;

            case "RESET":
            
                //TODO Transition back to main menu...
                //menuCallBack();
                //gso = new GameState(2);
                break;
                

        }

    }

    requestGameState() {
        return this.gso.getGameState();
    }

}

module.exports = Client;