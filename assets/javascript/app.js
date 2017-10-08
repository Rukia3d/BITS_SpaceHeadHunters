const {ipcRenderer} = require('electron');
const rows = 9, cols = 9;

function renderBoard(gameState){
	// create an element to draw all tiles on the board
	var element = document.getElementById('board');
	element.innerHTML = "";

	// Add all tiles to the board
	for(var x=0; x<rows; x++){
		for(var y=0; y<cols; y++){
			var cell = document.createElement('div');
			cell.className = 'cell new';
			element.appendChild(cell);
			// draw the card if it exists
			drawCard(gameState, x, y, cell);
			drawShips(gameState, x, y, cell);
		}
	}
}

function drawCard(gameState, x, y, cell){
	// Find a card in the given coordinates
	var cards = findByXY(gameState.board.tiles, x, y);

	// For cards we only need the first found item
	var card = cards[0];

	if(card){
		cell.innerHTML = card.type;
	}
}

function drawShips(gameState, x, y, cell){
	var ships = findByXY(gameState.board.ships, x, y);

	if(ships.length>0){
		cell.innerHTML += " "+ships.length;
	}
}

function findByXY(items, x, y){
	// Apply a filter to find items in given cooridnates
	var found = items.filter(function(item){
		return item.x==x && item.y==y;
	})
	return found;
}

ipcRenderer.on('GSO', (event, arg) => {
  console.log(event, arg) // prints "pong"
  renderBoard(arg);
})
