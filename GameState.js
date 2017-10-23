var deckData = require("./deck.json"); // deck json
var Deck = require("./Deck.js"); // deck class
let Board = require("./Board.js") // board class

// network vars
var networked = false;
var playerIndex = null;

class GameState {

	constructor(numPlayers) {

		this.deck = new Deck(deckData);
		this.deck.shuffle();
		this.board = new Board(this.deck);
		this.players = new Array();
		this.phase = "DRAW";
		this.player = 0;
		this.addPlayers(numPlayers);
		
	}

	/* PUBLIC INTERFACE */
	getGameState() {

		return {
		"deck":    this.deck.getDeck(), 
		"board":   this.board,  
		"players": this.players, 
		"phase":   this.phase,
		"player":  this.player
		};

	}

	setGameState(gso) {

		this.deck = gso.deck;
		this.board = gso.board;
		this.players = gso.players;
		this.phase = gso.phase;
		this.player = gso.player;
	}

	setPlayerIndex(index) {

		this.playerIndex = index;
	}

	setNetworked(bool) {
		
		this.networked = bool;
	}

	// gives the player a card returns true on succes, false otherwise.
	drawCard(player) {

		// network game constraint
		if(this.networked && this.playerIndex != this.player)
			return false;

		if (this.players[player].currentCard || this.phase != "DRAW")
			return false;
		else
			this.players[player].currentCard = this.deck.drawCard().type;
			return true;

	}

	// places a card at tile returns true on success.
	placeCard(player, x, y) {

		// network game constraint
		if(this.networked && this.playerIndex != this.player)
			return false;
		
		if (this.phase === "PLACE") 
			if (this.board.placeCard(this.players[player].currentCard, x, y)) {
				
				this.players[player].currentCard = null;
				return true;

			}

		return false;

	}

	// returns true on success
	placeLure(player, x, y) {

		// network game constraint
		if(this.networked && this.playerIndex != this.player)
			return false;

		let currPlayer = this.players[player];

		if (this.phase !== "LURE")
			return false;

		if (this.board.placeLure(currPlayer, x, y))
			return true;

		return false;
		
	}

	// goes to the next phase.
	nextPhase() {
		
		switch (this.phase) {

			case "DRAW":
				this.phase = "PLACE";
				break;
			case "PLACE":
				this.phase = "LURE";
				break;
			case "LURE":
				if(this.player == this.players.length - 1)
					this.phase = "SHIPSFLY";
				else {
					this.phase = "DRAW";
					this.player++;
				}
				break;
			case "SHIPSFLY":
				this.board.shipsFly(this.players);
				this.phase = "SCORING";
				break;
			case "SCORING":
				this.score();
				this.phase = "SHIPSFLEE";
				break;
			case "SHIPSFLEE":
				this.board.scatter();
				this.resetLures();

				if(this.isGameOver())
					this.phase = "END"
				else {
					this.phase = "DRAW";
					this.player = 0;
				}

				break;
		
			case "END":
				// do some end stuff
				break;

		}

	}

	/* PRIVATE MEMBERS*/

	// add however many players
	addPlayers(numPlayers) {
		
		for(var i = 0; i < numPlayers; ++i)
			this.players.push({ "currentCard" : null, "lure" : null, "score" : 0 });
		
	}

	// takes lures off the board
	resetLures() {	

		for(var i = 0; i < this.players.length; ++i)
			this.players[i].lure = null;

	}

	// game is over when the deck is depleted
	isGameOver() {

		if(this.deck.length == 0) 
			return true;

		return false;
		
	}
	
	score() {
		
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