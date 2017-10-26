const client_io = require("socket.io-client");

class network {

    constructor() {
        
        this.server_io = null;
        this.client_io = null;
        this.socket    = null;
        
    }

    startClient(host) {

        //this.socket = client_io(host);

        console.log(`Connecting to ${host}`);
        socket = client.io.connect(host);

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

    }

}

module.exports = network;