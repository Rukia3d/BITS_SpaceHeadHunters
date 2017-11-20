/*	client.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

let GameState = require("./GameState.js");
let network = require("./network.js");
const clientEventBus = require("./event.js");

class Client {
/*  Object representing the backend of the app, encapsulating the current mode
 *  (including the game state) and the network layer.
 *  
 *  Communicates with other parts of the program using event emitters.
 */

    constructor() {

        this.gso = {};
        this.net = new network();

        this.state = "mainmenu";
        this.pNum = null;

        clientEventBus.on("CHANGE_STATE", (state, data) => {
        // recieve and handle change state event from main menu
            
            switch (state) {
                
                case "HOTSEAT":
                //  Don't need the network layer, just start a new GSO and 
                //  tell renderer to change mode

                    console.log(`Starting a new hotseat game with ${data} players`);
                    this.state = state;
                    this.gso = new GameState(data);
                    clientEventBus.emit("REND_TO_INDEX");
    
                    break;
    
                case "CONNECT":
                //  Don't need a GSO, just start a new network connection

                    this.state = state;            
                    this.net.connect(data);
    
                    break;
    
                case "HOST":
                // Init all the things!
                
                    console.log("hosting a network game, starting gamestate and server")
                    this.state = state; 
                    this.net.host();
                    break;               
            }

        });

        clientEventBus.on("HOSTSTART", () => {
        // hosting player has clicked the "Host Start" button after players 
        // connected. start a new gamestate, tell connected clients to change
        // modes and send them to the connected clients to render

            console.log(`Hosting a network game with ${this.net.getPlayerCount() + 1} players`);
            this.gso = new GameState(this.net.getPlayerCount() + 1);
            this.pNum = 0;
            clientEventBus.emit("REND_TO_INDEX", this.pNum);
            this.net.sendGSO("HOSTSTART", this.gso.getGameState());

        });

        clientEventBus.on("SET_PNUM", (pNum) => {
        // this instance is a client, and has recieved a player number from 
        // the host, passed in as pNum
            
            if (this.pNum === null) {
                this.pNum = pNum;
                console.log("Client: Recieved pNum " + pNum);
            }
        
        });

    }

    handleAction(action, data, pNum) {
    /*  Upon reciept of an action event, figure out what to do based on the
     *  mode we are in
     */

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
                        this.net.sendAction(action, data, this.pNum);
                        break;

                }
                break;

            default:
                console.log("PANIC: Oh noes you shouldn't be able to get here");
                break;

        }

    }

    getGameState() {
    // getter method

        return this.gso.getGameState();

    }

    getPnum() {
    // getter method

        return this.pNum;
        
    }

}

module.exports = Client;