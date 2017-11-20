/*	network.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

const clientEventBus = require("./event.js");
const client_io      = require("socket.io-client");
const server_io      = require("http").createServer();

class network {
/*  Object representing the network layer, responsible for starting and 
 *  maintaining websocket connections, and ensuring data and events are
 *  passed back and forth.
 */

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
    /*  this method is used by game instances in client mode to handle
     *  the connection to a host
     */

        // if no IP is entered, connect to local host (makes debugging easier)
        if (ip.ip === "...") {
            this.client = client_io('http://localhost:3000');
        } else {
        // otherwise, attempt connection to entered IP
            console.log("Attempting connection to http://" + ip.ip + ":" + "3000");
            this.client = client_io("http://" + ip.ip + ":" + "3000");
        }
        // TODO if connection fails, display "no server found at ip:port"..?

        //---------------------------------------------------------------------
        // EVENT HANDLING
        //---------------------------------------------------------------------
        this.client.on("UPDATE", (event, data) => {
            
            console.log(`${this.client.id} recieved update`);
            console.log(event);

            // host sent a fresh GSO, get it on screen
            clientEventBus.emit("updateGameState", event);

        });

        this.client.on("playerUpdate", (event, data) => {
        // recieve this event from host, immediatly after successful connection
        // to host, to get the player number

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
    /*  this method is used by game instances in host mode to handle
     *  connections from clients and message passing etc..
     */

        // start server
        this.server = require("socket.io")(server_io);        
        this.server.listen(3000);
        console.log("server listening on 3000");

        // for each new connection...
        this.server.on("connection", (socket) => {
            
            console.log("Connection found: " + socket.id);
            logConnectionIds(this.server.sockets.connected);

            // register connection..
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

            // fire off event to new connection
            clientEventBus.emit("NEW_CONNECTION", this.connectedPlayers.pCount);
            // fire off event to all connections
            this.server.emit("playerUpdate", this.connectedPlayers.pCount);

            //---------------------------------------------------------------------
            // EVENT HANDLING
            //---------------------------------------------------------------------
            socket.on("ACTION", (action, data, pNum) => {
                
                //  messages recieved from client
                console.log(`SERVER: Action event ${action} recieved from player ${pNum} with data ${data}`)
                clientEventBus.emit("HANDLE_ACTION", action, data, pNum);
                
            });
                
        });

        // TODO handle disconnects...

    }

    sendGSO(event, gso) {
    // helper method to send fresh GSO to every connection
        console.log("sending GSO...");
        console.log(event);
        console.log(gso);
        this.server.emit(event, gso);

    }

    getPlayerCount() {
    // getter method
        return this.connectedPlayers.pCount;
    }

    sendAction(action, data, pNum) {
    // helper method to send event to host

        this.client.emit("ACTION", action, data, pNum);

    }

}

function logConnectionIds(clients) {
/*
 *  Displays currently connected clients in a nice format
 *  useful for dubugging
 */
    
    console.log("*** Connected Clients ***");   
    
    for (id in clients) {
        console.log("\t" + id);
    }
    
    console.log("*************************\n");
    
}

module.exports = network;