/*	GameState.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

var deckData = require("./deck.json"); // deck json
var Deck = require("./Deck.js"); // deck class
let Board = require("./Board.js") // board class

// network vars
var networked = false;
var playerIndex = null;

class GameState {
/*  Object representing game state, encapsulating the deck and board objects
 *  as well as tracking players and current game phase. Contains methods that
 *  control the game actions.
 */

	constructor(numPlayers) {

		this.deck     = new Deck(deckData);
		this.deck.shuffle();
		this.board    = new Board(this.deck);
		this.players  = new Array();
		this.phase    = "DRAW";
		this.player   = 0;
		this.tail     = 0;
		this.addPlayers(numPlayers);
		
	}

	//-------------------------------------------------------------------------
    // PUBLIC INTERFACES
	//-------------------------------------------------------------------------
	getGameState() {
	// getter method

		return {
		"deck":    this.deck.getDeck(), 
		"board":   this.board,  
		"players": this.players, 
		"phase":   this.phase,
		"player":  this.player
		};

	}

	setPlayerIndex(index) {
	// setter method

		this.playerIndex = index;
	}

	setNetworked(bool) {
	// setter method
		
		this.networked = bool;
	}

	drawCard(player) {
	// gives the player a card. true on success, false otherwise.

		// network game constraint
		if(this.networked && this.playerIndex != this.player)
			return false;

		// check if this player should be drawing a card...
		if (this.players[player].currentCard || this.phase != "DRAW")
			return false;
		else {
			this.players[player].currentCard = this.deck.drawCard().type;
			return true;
		}

	}

	placeCard(player, x, y) {
	// places a card at tile returns true on success.

		// network game constraint
		if(this.networked && this.playerIndex != this.player)
			return false;
		
		// check if we should be placing now
		if (this.phase === "PLACE") 
			if (this.board.placeCard(this.players[player].currentCard, x, y)) {
			// keep trying until placeCard() is successful, then we kill the 
			// card in the players hand
				this.players[player].currentCard = null;
				return true;

			}

		return false;

	}

	placeLure(player, x, y) {
	// attempt by player to place lure at x + y coord, return false on fail

		// network game constraint
		if(this.networked && this.playerIndex != this.player)
			return false;

		let currPlayer = this.players[player];

		// is it the right time to be doing lure stuff?
		if (this.phase !== "LURE")
			return false;

		// did the lure place successfully?
		if (this.board.placeLure(currPlayer, x, y))
			return true;

		return false;
		
	}

	nextPhase() {
	// pushes game into the next phase, depending on current phase
	// and if everyone has placed cards + lures etc.
		
		switch (this.phase) {
			case "DRAW":
				this.phase = "PLACE";
				break;
			case "PLACE":
				this.phase = "LURE";
				break;
			case "LURE":
				// if the current player is the last to place card and lure...
				if (this.player == this.tail) { 
					// ..go to next phase...
					this.phase = "SHIPSFLY";
					// ..increment the tail circular index to point at the next last player...
					this.tail = (this.tail + 1) % this.players.length;
					// ..and increment the player circular index to point at the next player to have their turn.
					this.player = (this.tail + 1) % this.players.length;
				}		
				else {
					// otherwise, go back to draw phase
					this.phase = "DRAW";
					// increment circ index to point at next player
					this.player = (this.player + 1) % this.players.length;
				}
				break;
			case "SHIPSFLY":
				// FLY MY PRETTIES! FLY!
				this.board.shipsFly(this.players);
				this.phase = "SCORING";
				break;
			case "SCORING":
				this.score();
				this.phase = "SHIPSFLEE";
				break;
			case "SHIPSFLEE":
				// are there too many ships on a tile? better fix that...
				this.board.scatter();
				// also, gimme dem lures back
				this.resetLures();

				if(this.isGameOver()) 
					this.phase = "END"
				else
					this.phase = "DRAW";
				break;
		
			case "END":
				// do some end stuff
				break;

		}

	}

	//-------------------------------------------------------------------------
    // PRIVATE METHODS
	//-------------------------------------------------------------------------
	addPlayers(numPlayers) {
	// helper for initialising gamestate, given a number of players, create and 
	// add that many to the players array

		for(var i = 0; i < numPlayers; ++i)
			this.players.push({ "currentCard" : null, "lure" : null, "score" : 0 });

		this.tail = numPlayers - 1;
		
	}

	resetLures() {	
	// iterate through all the players array and set their lures to null

		for(var i = 0; i < this.players.length; ++i)
			this.players[i].lure = null;

	}

	isGameOver() {
	// game is over when the deck is depleted

		if(this.deck.cards.length == 0) 
			return true;

		return false;
		
	}
	
	score() {
	// after ships have flown, this method is called to calculate everyones 
	// score

		this.players.forEach(function(i) {
			
			let ships = this.board.numShipsOnTile(i.lure.x, i.lure.y);

			if (this.board.getTile(i.lure.x, i.lure.y).type === "lair") 
				i.score += (ships * 2);
			else
				i.score += ships;

		}, this);

	}

}

module.exports = GameState;