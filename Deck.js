/*	Deck.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

var Card = require("./Card.js");

class Deck {
/*  Object representing a deck of card objects
 */

	constructor(deckData) {
		this.cards = new Array();
		this.usedCards = new Array();
		this.loadCards(deckData);
	}

	loadCards(deckData) {
	// init deck

		for(var card in deckData) {
			for(var i = 0; i < deckData[card].number; i++) {
				this.cards.push(new Card(deckData[card].type));
			}
		}

	}

	shuffle() {
	// whats the opposite of sorting?

		this.cards.forEach(function(card, index, array) {
			var random = Math.floor(Math.random() * index); // get a random index
			array[index] = array[random]; // put the random card at the current index
			array[random] = card; // put the current card at the random index
		});
	}

	drawCard() {
	// pop a card from the deck and return it.

		var card = this.cards.pop(); // take from cards
		this.usedCards.push(card); // add to used cards
		return card;

	}

	getDeck() {
	// getter method, returns the deck for the game state object

		var ret = new Array(); 
		this.cards.forEach(function(card, index, array) {
			ret.push(card.type);
		});
		return ret;

	}

	reset() {
	//	put cards back in the deck

		this.cards.concat(this.usedCards);
		this.usedCards.length = 0;
	}
}

module.exports = Deck;