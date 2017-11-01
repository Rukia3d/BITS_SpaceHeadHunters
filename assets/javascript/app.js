const {ipcRenderer} = require('electron');
const rows = 9, cols = 9;
var previousGameState = null;
let pNum = null;

function renderPlayers(gameState){
	// Render players individualy using the gameState data.
	// For the active player the second argument will be true
	var p1div = document.getElementById('player1');
	renderPlayer(gameState.players[0],gameState.player==0, p1div, gameState);

	var p2div = document.getElementById('player2');
	renderPlayer(gameState.players[1],gameState.player==1, p2div, gameState);

	var p3div = document.getElementById('player3');
	renderPlayer(gameState.players[2],gameState.player==2, p3div, gameState);

	var p4div = document.getElementById('player4');
	renderPlayer(gameState.players[3],gameState.player==3, p4div, gameState);
}

// Render each player on screen
function renderPlayer(player, active, element, gamestate){
	//Clear the area for drawing
	element.innerHTML = "";
	
	//Checks for player
	if (player == null){
		document.createElement("div");
		id = element;
		
	}else{
		renderPlayerName();
		renderAvatar();
		renderStatusLine()
		renderActiveScore();	
		renderActionArea(player, active, element, gamestate);
		}

	//Render players name
	function renderPlayerName(){
		var elementH = document.createElement("h3");	
		element.appendChild(elementH);
		var playerName = document.createTextNode(element.id);			
		elementH.appendChild(playerName);		
	}

	//render avatar
	function renderAvatar() {
		var avatar = document.createElement("div");
		avatar.className = "avatar";
		element.appendChild(avatar);
	}

	//render status line
	function renderStatusLine(){
		var statusLine = document.createElement("div");
		statusLine.className = "statusline";
		element.appendChild(statusLine);
	}

	//Render players score
	function renderActiveScore() {
		var activeScore = document.createElement("div");
		activeScore.className = ("scorearea");
		var score = "Score";
		var scorenumber = document.createElement("span");
		scorenumber.className = ("scorenumber");
		activeScore.innerHTML = score;
		activeScore.appendChild(scorenumber);
				
		if(element === player1){								
			scorenumber.innerHTML = gamestate.players[0].score;

		}else if(element === player2){					
			scorenumber.innerHTML = gamestate.players[1].score;
					
		}else if(element === player3){
			scorenumber.innerHTML = gamestate.players[2].score;
	
		}else if (element === player4){
			scorenumber.innerHTML = gamestate.players[3].score;
			
		}
		element.appendChild(activeScore);
			 
	}
	
}

function renderActionArea(player, active, element, gamestate){
	var activeArea = document.createElement("div");
	activeArea.className = "actionarea";
	if(active){
		switch(gamestate.phase){
			case "DRAW":
				//button get a card
				var drawButton = document.createElement("button");
				drawButton.innerHTML = "Draw a card";

				//message back to main
				drawButton.onclick = function(){ 
					sendEvent(gamestate.phase, gamestate.player);
				}

				//add the button to the area
				activeArea.appendChild(drawButton);

				break;
			case "PLACE":
				var cardName = document.createElement("div");
				cardName.innerHTML = player.currentCard;
				activeArea.append(cardName);
				//show player where he can put his card
				displayAvailableSpots(gamestate);
				break;
			case "LURE":
				//Display available spots for lure
				displayAvailableLure(gamestate);
				break;
			default:
				//ships fly
		}
	} else {
		//whaiting - watch
	}
	element.appendChild(activeArea);
}


function sendEvent(name, arg){
	console.log("Sending event ", name, arg);
	ipcRenderer.send(name, arg);
}

function renderBoard(gameState){
	// create an element to draw all tiles on the board
	var element = document.getElementById('board');
	element.innerHTML = "";

	// Add all tiles to the board
	for(var x=0; x<rows; x++){
		for(var y=0; y<cols; y++){
			var cell = document.createElement('div');
			cell.className = 'cell new';
			cell.dataset.x = x;
			cell.dataset.y = y;
			element.appendChild(cell);
			// draw the card if it exists
			drawCard(gameState, x, y, cell);
			drawShips(gameState, x, y, cell);
			drawLure(gameState, x, y, cell);
		}
	}

	// Draw available places
}

function drawCard(gameState, x, y, cell){
	// Find a card in the given coordinates
	var cards = findByXY(gameState.board.tiles, x, y);

	// For cards we only need the first found item
	var card = cards[0];

	if(card){
		// cell.innerHTML = card.type;
		cell.className += ' ' + card.type;
	}
}

function drawShips(gameState, x, y, cell){
	var ships = findByXY(gameState.board.ships, x, y);

	if(ships.length > 0){
		// cell.innerHTML += " "+ships.length;
		for(var i = 0; i < ships.length; ++i) {
			cell.innerHTML += ` <div class='ship-wrap'><div class='ship' id='${"ship-" + ships[i].id}'></div></div>`;	
		}
	}
}

function drawLure(gameState, x, y, cell){
	var n = checkLure(gameState, x, y);
	if(n>=0){
		cell.innerHTML += " P"+n;
	}
}

function findByXY(items, x, y){
	// Apply a filter to find items in given cooridnates
	var found = items.filter(function(item){
		return item.x==x && item.y==y;
	})
	return found;
}

function findAvailableSpots(gamestate){
	var available = [];
	//go through your cards, take 4 available spots near each
	gamestate.board.tiles.forEach(function(tile){
		var spots = [
			{ x: tile.x, y: tile.y-1},
			{ x: tile.x, y: tile.y+1},
			{ x: tile.x-1, y: tile.y},
			{ x: tile.x+1, y: tile.y},
		];

		var checkedSpots = spots.filter(function(spot){
			return checkSpot(gamestate, available, spot);
		});
		//if this spot is not in available array yet - add it
		available.push(...checkedSpots);
	});
	return available;
}

function checkLure(gameState, x, y){
	return gameState.players.findIndex(function(player, n){
		return player.lure && player.lure.x == x && player.lure.y == y;
	});
}

function findAvailableCards(gameState){
	var available = [];
	gameState.board.tiles.forEach(function(tile){
		var lured = false;
		var shiped = false;
		var trashed = false;

		// Is there a lure at this coordinates?

		if(checkLure(gameState, tile.x, tile.y)>=0){
			lured = true;
		}

		// Are there ships at this coordinates?
		if(gameState.board.ships){
			gameState.board.ships.forEach(function(ship){
				if(ship.x==tile.x && ship.y==tile.y){
					shiped = true;
				}
			});
		}

		// Is it a trash?
		if(tile.type=="pub"){
			trashed = true;
		}

		if(!lured && !shiped && !trashed){
			console.log("Tile ",tile)
			available.push(tile);
		}

	});
	return available;
}

function checkSpot(gamestate, available, spot){
	//check if this spot is on the board
	var onBoard = spot.x<rows && spot.y<cols && spot.x >= 0 && spot.y >= 0;
	//not taken by a card
	var isCard = findByXY(gamestate.board.tiles, spot.x, spot.y).length>0;
	//not in available yet
	var inAvailable = findByXY(available, spot.x, spot.y).length>0;

	return onBoard && !isCard && !inAvailable;

}

function displayAvailableSpots(gameState){
	var available = findAvailableSpots(gameState);
	available.forEach(function(spot){
		var cell = document.querySelector('[data-x="'+spot.x+'"][data-y="'+spot.y+'"]');
		cell.innerHTML = "A";
		cell.className += " card-available";
		cell.onclick = function(){
			sendEvent(gameState.phase, {
				player: gameState.player, 
				x: spot.x,
				y: spot.y,
			});
		};

	});
}

function displayAvailableLure(gameState){
	var available = findAvailableCards(gameState);
	available.forEach(function(card){
		var cell = document.querySelector('[data-x="'+card.x+'"][data-y="'+card.y+'"]');
		cell.innerHTML += " "+"L";
		cell.className += " lure-available";
		cell.onclick = function(){
			sendEvent(gameState.phase, {
				player: gameState.player, 
				x: card.x,
				y: card.y,
			});
		};
	});
}


ipcRenderer.on("GSO", (event, arg) => {
	console.log(event, arg) // helper, prints objects to use
	console.log(pNum);

  	// animate, then render the final state
  	if(arg.phase === "SCORING") {
		moveShips(arg);
	}
	

  renderBoard(arg); // render the board from gamestate
  renderPlayers(arg); // render both players from gamestate

  previousGameState = arg;

  switch (arg.phase) {
		  case "SHIPSFLY":
		  case "SCORING":
		  case "SHIPSFLEE":
			  	sendEvent(arg.phase, arg);
			  	break;
	}
  
});

// ============================================================================
// ANIMATION STUFF
// ============================================================================

function moveShips(gameState) {
	/*
	// make sure we're using proper data
	if(previousGameState) {

		for(var i = 0; i < previousGameState.board.ships.length; ++i)
		{

			var oldShip = previousGameState.board.ships[i];
			var newShip = findShipById(gameState, oldShip.id);


			if(oldShip.x != newShip.x || oldShip.y != newShip.y) {

				console.log(`Ship #${oldShip.id} moving from (${oldShip.x}, ${oldShip.y}) to (${newShip.x}, ${newShip.y})`);
				
				// get the old ship element positions
				var startPosition = document.querySelector('[data-x="'+oldShip.x+'"][data-y="'+oldShip.y+'"]');
				var startRect = startPosition.getBoundingClientRect();

				// get the new ship element positions.
				var endPosition = document.querySelector('[data-x="'+newShip.x+'"][data-y="'+newShip.y+'"]');
				var endRect = endPosition.getBoundingClientRect();

				// the actual element to move
				var element = document.getElementById('ship-'+oldShip.id);

				// vertical animation first
				if(startRect.top != endRect.top) {

					var start = startRect.top;
					var end = endRect.top;

					// if we're increasing position
					if(startRect.top < endRect.top) {
						function animateDown() {
							if(start <= end) {
								element.style.top = end + 'px';
							}
							else {
								console.log(start);
								start--;
								element.style.top = start + 'px';
								requestAnimationFrame(animateDown(element, start, end));
							}
						}
						requestAnimationFrame(animateDown);
					}

					// if we're decreasing
					else {
						function animateUp() {

							if(start >= end) {
								element.style.top = end + 'px';
							}
							else {
								console.log(start);
								start++;
								element.style.top = start + 'px';
								requestAnimationFrame(animateUp(element, start, end));
							}
						}
						requestAnimationFrame(animateUp);

					}
				}

				// then horizontal animation
				if(startRect.left != endRect.left) {

					var start = startRect.left;
					var end = endRect.left;

					// if we're increasing position
					if(startRect.left > endRect.left) {
						function animateLeft() {
							if(start <= end) {
								element.style.top = end + 'px';
							}
							else {
								console.log(start);
								start--;
								element.style.top = start + 'px';
								requestAnimationFrame(animateLeft);
							}
						}
						requestAnimationFrame(animateLeft);
					}

					// if we're decreasing
					else {
						function animateRight() {
							if(start >= end) {
								element.style.top = end + 'px';
							}
							else {
								console.log(start);
								start++;
								element.style.top = start + 'px';
								requestAnimationFrame(animateRight);
							}
						}
						requestAnimationFrame(animateRight(element, start, end));
					}
				}
			}
		}
	}
	*/
}


function findShipById(gameState, id) {
	for(var i = 0; i < gameState.board.ships.length; ++i)
	{
		if(gameState.board.ships[i].id == id)
		{
			return gameState.board.ships[i];
		}
	}
	return null;
}
	
ipcRenderer.on("SET_PNUM", (event, arg) => {

	console.log("setting pNum to " + arg);
	this.pNum = event;

});