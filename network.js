const clientEventBus = require("./event.js");
const client_io      = require("socket.io-client");
const server_io      = require("http").createServer();

class network {

    constructor() {
        
        this.server = null;
        this.client = null;

        this.connectedPlayers = {
            p1_id: null,
            p2_id: null,
            p3_id: null,
            p4_id: null,
            pCount: 0
        };

        this.pNum = null;
        
    }

    connect(ip) {

        if (ip.ip === "...") {
            console.log("No IP address detected, defaulting to localhost...");
            this.client = client_io('http://localhost:3000');
        } else {
            console.log("Attempting connection to http://" + ip.ip + ":" + "3000");
            this.client = client_io("http://" + ip.ip + ":" + "3000");
        }
        // TODO if connection fails, display "no server found at ip:port"..?

        this.client.on("UPDATE", (event, data) => {
            
            console.log(`${this.client.id} recieved update`);
            console.log(event);
            clientEventBus.emit("updateGameState", event);

        });

        this.client.on("playerUpdate", (event, data) => {

            clientEventBus.emit("SET_PNUM", event);
            clientEventBus.emit("NEW_CONNECTION", event);            

        });

        this.client.on("HOSTSTART", (event, data) => {
        /*
         *  Client has recieved HOSTSTART, will attempt to change to index.html
         *  and process recieved GSO (passed in as event)
         */

            clientEventBus.emit("CONNECT_REND_TO_INDEX", event);
            
        });

    }

    host() {
         
        this.server = require("socket.io")(server_io);        
        this.server.listen(3000);
        console.log("server listening on 3000");

        this.server.on("connection", (socket) => {
                        
            console.log("Connection found: " + socket.id);
            logConnectionIds(this.server.sockets.connected);

            this.connectedPlayers.pCount++;

            if (!this.connectedPlayers.p1_id)
                this.connectedPlayers.p1_id = socket.id;
            else if (!this.connectedPlayers.p2_id)
                this.connectedPlayers.p2_id = socket.id;
            else if (!this.connectedPlayers.p3_id)
                this.connectedPlayers.p3_id = socket.id;
            else
                ;
                // TODO Disconnect client

            clientEventBus.emit("NEW_CONNECTION", this.connectedPlayers.pCount);
            this.server.emit("playerUpdate", this.connectedPlayers.pCount);

            socket.on("ACTION", (action, data, pNum) => {
                
                console.log(`SERVER: Action event ${action} recieved from player ${pNum} with data ${data}`)
                clientEventBus.emit("HANDLE_ACTION", action, data, pNum);
                
            });
                
        });

       

        // handle disconnects...

    }

    sendGSO(event, gso) {

        console.log("sending GSO...");
        console.log(event);
        console.log(gso);
        this.server.emit(event, gso);

    }

    getPlayerCount() {
        return this.connectedPlayers.pCount;
    }

    sendAction(action, data, pNum) {

        this.client.emit("ACTION", action, data, pNum);

    }

}

function logConnectionIds(clients) {
    
    console.log("*** Connected Clients ***");   
    
    for (id in clients) {
        console.log("\t" + id);
    }
    
    console.log("*************************\n");
    
}

module.exports = network;