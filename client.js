let GameState = require("./GameState.js");
let network = require("./network.js");

class Client {

    constructor() {

        this.gso = {};
        this.socket = null;
        this.server = null;
        this.net = new network(this);

        this.state = "mainmenu";

        this.menuCallBack = null;
        this.gameCallBack = null;
        this.updateCallBack = null;

    }

    attachMenuCallBack(menuCallBack) {
        this.menuCallBack = menuCallBack;
    }

    attachGameCallBack(gameCallBack) {
        this.gameCallBack = gameCallBack;
    }

    attachUpdateCallBack(updateCallBack) {
        this.updateCallBack = updateCallBack;
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

                this.net.connect();

                break;

            case "HOST":
            
                this.net.host();
                this.updateCallBack("HOST_START", {});
                break;               

               

        }

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

    handleHostGSO(gso) {

        console.log("I should be a gamestate object from the host");

    }

}

module.exports = Client;