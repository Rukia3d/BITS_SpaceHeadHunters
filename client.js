let GameState = require("./GameState.js");
let network = require("./network.js");
const clientEventBus = require("./event.js");

class Client {

    constructor() {

        this.gso = {};
        this.net = new network();

        this.state = "mainmenu";
        this.pNum = null;

        clientEventBus.on("CHANGE_STATE", (state, data) => {
            
            switch (state) {
                
                case "HOTSEAT":
    
                    console.log(`Starting a new hotseat game with ${data} players`);
                    this.state = state;
                    this.gso = new GameState(data);
                    clientEventBus.emit("REND_TO_INDEX");
    
                    break;
    
                case "CONNECT":
    
                    this.state = state;            
                    this.net.connect(data);
    
                    break;
    
                case "HOST":
                
                    console.log("hosting a network game, starting gamestate and server")
                    this.state = state; 
                    this.net.host();
                    break;               
            }

        });

        clientEventBus.on("HOSTSTART", () => {

            console.log(`Hosting a network game with ${this.net.getPlayerCount() + 1} players`);
            this.gso = new GameState(this.net.getPlayerCount() + 1);
            this.pNum = 0;
            clientEventBus.emit("REND_TO_INDEX", this.pNum);
            this.net.sendGSO("HOSTSTART", this.gso.getGameState());

        });

        clientEventBus.on("SET_PNUM", (pNum) => {
            
            if (this.pNum === null) {
                this.pNum = pNum;
                console.log("Client: Recieved pNum " + pNum);
            }
        
        });

    }

    handleAction(action, data) {

        console.log(this.state);

        switch (this.state) {
        
            case "HOTSEAT":
            case "HOST":

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
                        //this.updateCallBack();
                        break;

                    case "RESET":
                    
                        //TODO Transition back to main menu...
                        //menuCallBack();
                        //gso = new GameState(2);
                        break;
                        

                }

                clientEventBus.emit("updateGameState", this.gso.getGameState()); //update local renderer
                if (this.state === "HOST") {
                    this.net.sendGSO("UPDATE", this.gso.getGameState()); //update remote renderers
                }
                break;

            case "CONNECT":

                switch (action) {
                    
                    case "DRAW":
                    case "PLACE":
                    case "LURE":                
                        this.net.sendAction(action);
                        break;

                }
                break;

            default:
                console.log("PANIC: Oh noes you shouldn't be able to get here");
                break;

        }

    }

    getGameState() {

        return this.gso.getGameState();

    }

    getPnum() {

        return this.pNum;
    }

}

module.exports = Client;