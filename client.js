let GameState = require("./GameState.js");
let network = require("./network.js");
const clientEventBus = require("./event.js");

class Client {

    constructor() {

        this.gso = {};
        this.net = new network();

        this.state = "mainmenu";

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
                    this.gso = new GameState(data);           
                    this.net.host();
                    break;               
            }

        });

        clientEventBus.on("HOSTSTART", () => {

            clientEventBus.emit("REND_TO_INDEX");
            this.net.sendGSO("hostStart", this.gso.getGameState());            

        });

    }

    handleAction(action, data) {

        if (this.state === "HOTSEAT") {
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
        }

        if (this.state === "CONNECT") {
            switch (action) {
                
                case "DRAW":
                case "PLACE":
                case "LURE":                
                    net.sendAction(action);
                    break;

            }
        }

    }

    requestGameState() {

        return this.gso.getGameState();

    }

}

module.exports = Client;