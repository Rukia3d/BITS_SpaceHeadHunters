const server = require("http").createServer();
const io     = require("socket.io")(server);
const fs     = require("fs");

server.listen(3000);

let gState = {
    pCount: 0,
    p1_id: null,
    p2_id: null,
    p3_id: null,
    p4_id: null    
}

io.on("connection", (socket) => {

    console.log("Connection found: " + socket.id);
    printIds(io.sockets.connected);

    if (!addPlayer(gState, socket.id)) {
        console.log("Player slots full...");
        // TODO disconnect the connection
    } else {
        io.emit("updateState", "connected", gState);
    }

    socket.on("disconnect", (reason) => {
        
        removePlayer(gState, socket.id);
        console.log("Disconnection: " + socket.id + " - " + reason);
        printIds(io.sockets.connected);

        io.emit("updateState", "disconnected", gState);   

    });

    socket.on("fetchState", (event, data) => {

        console.log("fetch state...");
        socket.emit("updateState", "connected", gState);
    
    });

    socket.on("updateServerGSO", (data) => {
        console.log(`server relaying GSO`);
        socket.broadcast.emit("updateClientGSO", data);
    });

    socket.on("startGameServer", (data) => {
        console.log(`server relaying GSO and starting client`);
        console.log(data);
        socket.broadcast.emit("updateClientGSO", data);
        io.emit("startGameClient", data);
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