class Deck {

	constructor(deckData) {
		this.cards = new Array();
		this.usedCards = new Array();
		this.loadCards(deckData);
	}

	loadCards(deckData) {
		for(var card in deckData) {
			for(var i = 0; i < deckData[card].number; i++) {
				this.cards.push(deckData[card].type);
			}
		}
	}

	shuffle() {
		this.cards.forEach(function(card, index, array) {
			var random = Math.floor(Math.random() * index); // get a random index
			array[index] = array[random]; // put the random card at the current index
			array[random] = card; // put the current card at the random index
		});
	}

	drawCard() {
		var card = this.cards.pop(); // take from cards
		this.usedCards.push(card); // add to used cards
		return card;
	}

	// return the deck for the game state object
	getDeck() {
		return this.cards;
	}

	// reset the deck
	reset() {
		this.cards.concat(this.usedCards);
		this.usedCards.length = 0;
	}
}

module.exports = Deck;