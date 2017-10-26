class network {

    constructor(clientRef) {
        
        this.socket    = null;
        this.client    = clientRef;

        this.connectedPlayers = {
            p1_id: null,
            p2_id: null,
            p3_id: null,
            p4_id: null,
            pCount: 0
        };
        
    }

   

    connect() {

        const client_io = require("socket.io-client");
        this.socket = client_io('http://localhost:3000');

        this.socket.on("updateState", (event, data) => {
            
            console.log(event);
            console.log(data);

        });

       
    }

    host() {
         
        const server = require("http").createServer();
        const io     = require("socket.io")(server);

        server.listen(3000);
        console.log("server listening?");

        // new gamestate etc..

        io.on("connection", (socket) => {
            
            console.log("Connection found: " + socket.id);
            logConnectionIds(io.sockets.connected);

            // add to this.connectedPlayers...
        
        });

        // handle disconnects...

    }

    sendAction() {
        ;
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