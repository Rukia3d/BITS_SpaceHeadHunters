const {ipcRenderer} = require('electron');
const rows = 9, cols = 9;

// the previous game state to compare ship positions to current game state.
var previousGameState = null;

// to track how many ships have been moved to a tile during animation.
// allows us to offset the ship's position based on how many ships are
// on the tile (so they're not displayed one on top of another).
var shipsMovedToTile = new Array();

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
	for(var y=0; y<rows; y++){
		for(var x=0; x<cols; x++){
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
	
	// the wrapper for the ships on the tile
	var shipWrap = document.createElement('div');
	shipWrap.className = 'ship-wrap';
	shipWrap.dataset.shipx = x; // required for animation destination
	shipWrap.dataset.shipy = y; // required for animation destination

	if(ships.length > 0) 
	{
		for(var i = 0; i < ships.length; ++i) 
		{
			// create the ship element
			var ship = document.createElement('div');

			// to track start position in animation
			ship.id = "ship-" + ships[i].id;

			// for css styles
			ship.className = "ship";

			// required to offset the element when it's position is changed to fixed during animation
			ship.dataset.tilepos = i + 1; 

			// append the ship
			shipWrap.appendChild(ship);
		}		
	}
	// append the wrapper for all ships
	cell.appendChild(shipWrap);
}

function drawLure(gameState, x, y, cell){
	var n = checkLure(gameState, x, y);
	if(n>=0){
		var style = cell.currentStyle || window.getComputedStyle(cell, false);
		var bg = style.backgroundImage.slice(4, -1);

		cell.style.background = `url('assets/images/lure${n + 1}.png'), url(${bg})`;
		cell.style.backgroundSize = '100% 100%';
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
		// cell.innerHTML = "A";
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
		// cell.innerHTML += " "+"L";
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


ipcRenderer.on('GSO', (event, arg) => {

	console.log(event, arg) // helper, prints objects to use

	// animate the stages that require animation
	if(previousGameState && (previousGameState.phase == "SHIPSFLY" || previousGameState.phase == "SHIPSFLEE")) 
	{
		// alter the ships position property to fixed and apply offsets so they're not overlayed.
		makeShipsReady(arg);
		// animate the ships.
		shipAnimation(arg, 0);
	}
	else {
		renderBoard(arg); // render the board from gamestate
		renderPlayers(arg); // render both players from gamestate
		previousGameState = arg;
	}

	switch (arg.phase) {
		case "SHIPSFLY":
		case "SHIPSFLEE":
			sendEvent(arg.phase, arg);
			break;
	}

});

// ============================================================================
// ANIMATION STUFF
// ============================================================================
// Animating by comparing the previous gamestate with the current one.
function moveShipToEnd(gameState, element, startTop, endTop, startLeft, endLeft, i) {

	var animate;	

	// Up Left
	if(startTop > endTop && startLeft > endLeft) 
	{
		console.log("up-left");
		animate = setInterval(function() {
			if(startTop <= endTop && startLeft <= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else
			{
				var targetX = endLeft - startLeft;
				var targetY = endTop - startTop;
				var distance = Math.sqrt(targetX * targetX + targetY * targetY);

				startLeft += (targetX / distance);
				startTop += (targetY / distance);

				element.style.top= parseInt(startTop) + "px";
				element.style.left = parseInt(startLeft) + "px";
			}
		}, 7);
	}

	// Up Right
	else if(startTop > endTop && startLeft < endLeft) 
	{
		console.log("up-right");
		animate = setInterval(function() {
			if(startTop <= endTop && startLeft >= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else
			{
				var targetX = endLeft - startLeft;
				var targetY = endTop - startTop;
				var distance = Math.sqrt(targetX * targetX + targetY * targetY);

				startLeft += (targetX / distance);
				startTop += (targetY / distance);
				
				element.style.top= parseInt(startTop) + "px";
				element.style.left = parseInt(startLeft) + "px";
			}
		}, 7);
	}

	// Down Left
	else if(startTop < endTop && startLeft > endLeft)
	{
		console.log("down-left");
		animate = setInterval(function() {
			if(startTop >= endTop && startLeft <= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else
			{
				var targetX = endLeft - startLeft;
				var targetY = endTop - startTop;
				var distance = Math.sqrt(targetX * targetX + targetY * targetY);

				startLeft += (targetX / distance);
				startTop += (targetY / distance);
				
				element.style.top= parseInt(startTop) + "px";
				element.style.left = parseInt(startLeft) + "px";
			}
		}, 7);
	}

	// Down Right
	else if(startTop < endTop && startLeft < endLeft)
	{
		console.log("down-right");
		animate = setInterval(function() {
			if(startTop >= endTop && startLeft >= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else
			{
				var targetX = endLeft - startLeft;
				var targetY = endTop - startTop;
				var distance = Math.sqrt(targetX * targetX + targetY * targetY);

				startLeft += (targetX / distance);
				startTop += (targetY / distance);
				
				element.style.top= parseInt(startTop) + "px";
				element.style.left = parseInt(startLeft) + "px";

			}
		}, 7);
	}

	// Left
	else if(startLeft > endLeft)
	{
		console.log("left");
		animate = setInterval(function() {
			if(startLeft <= endLeft)
			{
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else 
			{
				startLeft--;
				element.style.left = parseInt(startLeft) + "px";
			}
		}, 7);
	}

	// Right
	else if(startLeft < endLeft)
	{
		console.log("right");
		animate = setInterval(function() {
			if(startLeft >= endLeft)
			{
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else 
			{
				startLeft++;
				element.style.left = parseInt(startLeft) + "px";
			}
		}, 7);
	}

	// Down
	else if(startTop < endTop)
	{
		console.log("down");
		animate = setInterval(function() {
			if(startTop >= endTop)
			{
				element.style.top = endTop + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else 
			{
				startTop++;
				element.style.top = parseInt(startTop) + "px";
			}
		}, 7);
	}

	// Up
	else if(startTop > endTop)
	{
		console.log("up");
		animate = setInterval(function() {
			if(startTop <= endTop)
			{
				element.style.top = endTop + "px";
				clearInterval(animate);
				i++;
				shipAnimation(gameState, i);
			}
			else 
			{
				startTop--;
				element.style.top = parseInt(startTop) + "px";
			}
		}, 7);
	}
	else
	{
		i++;
		shipAnimation(gameState, i);
	}
}

function shipAnimation(gameState, i) {

	// animate the ships in turn start at 0, and increment i once animation is complete.
	// async programming required us to use callbacks rather than more simple loops.
	if(i < previousGameState.board.ships.length) 
	{
		// the ship objects with x, y, and ID
		var oldShip = previousGameState.board.ships[i];
		var newShip = findShipById(gameState, oldShip.id);

		if(newShip)
		{
			// the ships on the destination tile
			// this var is used to determine the last scattering ship
			var destShips = findByXY(gameState.board.ships, newShip.x, newShip.y);	
		}
		

		// case when we're moving the ship to a new tile
		if(newShip && (oldShip.x != newShip.x || oldShip.y != newShip.y)) 
		{
			// ships on the destination tile previously (for scatter phase)
			var ships = findByXY(previousGameState.board.ships, newShip.x, newShip.y);

			// accumulate ships on the tile previously.
			if(ships.length > 0)
			{
				for(var j = 0; j < ships.length; ++j) 
				{
					// this will accumulate all the ships already there
					shipsMovedToTile.push({ "x" : newShip.x, "y" : newShip.y });
				}
			}

			// add the current ship we'll be moving there
			shipsMovedToTile.push({ "x" : newShip.x, "y" : newShip.y });

			
			var currentNewTileShips = 0;

			// find the number of ships on the new tile including this one.
			if(shipsMovedToTile.length != 0)
			{
				for(var k = 0; k < shipsMovedToTile.length; ++k) 
				{
					if(shipsMovedToTile[k].x == newShip.x && shipsMovedToTile[k].y == newShip.y)
					{
						currentNewTileShips++;
					}
				}
			}

			// offset for ship's position on the destination tile.
			var offsetX = 0;
			var offsetY = 0;

			// X offsets
			// using modulo 5 because we're doing rows of 5 ships.
			if(currentNewTileShips % 5 == 2) 
			{
				// position 2, 7, 12, 17...
				offsetX = 12;
			}
			else if(currentNewTileShips % 5 == 3) 
			{
				// position 3, 8, 13, 18...
				offsetX = 24;
			}
			else if(currentNewTileShips % 5 == 4) 
			{
				// position 4, 9, 14, 19...
				offsetX = 36;
			}
			else if(currentNewTileShips % 5 == 0) 
			{
				// position 5, 10, 15, 20...
				offsetX = 48;
			}

			// Y offsets
			// harder to calculate cleverly...
			if(currentNewTileShips >= 6) 
			{
				offsetY += 12;
			}
			if(currentNewTileShips >= 11) 
			{
				offsetY += 12;
			}
			if(currentNewTileShips >= 16) 
			{
				offsetY += 12;
			}				
			
			// the actual element to move
			var element = document.getElementById('ship-'+oldShip.id);

			// the starting positions
			var startRect = element.getBoundingClientRect();
			var startTop = startRect.top;
			var startLeft = startRect.left;

			// the end positions
			var endPosition = document.querySelector('[data-shipx="'+newShip.x+'"][data-shipy="'+newShip.y+'"]');
			var endRect = endPosition.getBoundingClientRect();
			var endTop = endRect.top + offsetY; // using the offset so we don't overlay the ships
			var endLeft = endRect.left + offsetX; // using the offset so we don't overlay the ships

			// animate it
			moveShipToEnd(gameState, element, startTop, endTop, startLeft, endLeft, i);
			
		}
		// case when a ship is moving to the same tile and there's only one ship on that tile.
		// because other cases are already covered by the above condition, this should only
		// happen when one ship on the scatter phase needs to move to the #1 position on the same tile.
		else if(newShip && destShips.length == 1)
		{
			// the actual element to move
			var element = document.getElementById('ship-'+oldShip.id);

			// the starting positions
			var startRect = element.getBoundingClientRect();
			var startTop = startRect.top;
			var startLeft = startRect.left;

			// the end positions
			var endPosition = document.querySelector('[data-shipx="'+newShip.x+'"][data-shipy="'+newShip.y+'"]');
			var endRect = endPosition.getBoundingClientRect();
			var endTop = endRect.top; // no offset required since only one ship will land there
			var endLeft = endRect.left; // no offset required since only one ship will land there

			// animate it
			moveShipToEnd(gameState, element, startTop, endTop, startLeft, endLeft, i);
		}
		// the ship isn't moving
		else 
		{
			i++;
			shipAnimation(gameState, i);
		}
	}
	// when we've animated all the ships
	else if(i == previousGameState.board.ships.length) {
		// clear the array that tracks how many ships have been moved to destination tiles
		shipsMovedToTile.length = 0;

		// update the game state
		previousGameState = gameState;

		// render the final state which should align perfectly with the last frame of animation
		renderBoard(gameState);
  		renderPlayers(gameState);
  		
  		// send the next event if we're on SHIPSFLY, but if we just did SHIPSFLEE
  		// then the player should send the draw event.
  		if(gameState.phase != "DRAW")
			sendEvent(gameState.phase, gameState);
	} 
}

// finds a ship by the id in the gamestate object
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

// modify the css for ships prior to flying.
// we need a fixed position in order to move the ships to
// another location.
function makeShipsReady(gameState) {

	// the ship elements
	var ships = document.getElementsByClassName('ship');

	for(var i = 0; i < ships.length; ++i)
	{
		// make the position fixed
		ships[i].style.position = 'fixed';

		// get the position attributes - at this stage
		// the position is inherited from the parent
		// but all ships will be overlayed on top of each other
		rect = ships[i].getBoundingClientRect();

		// grab the tile position of each ship (from drawShips function)
		var pos = parseInt(ships[i].dataset.tilepos);
		
		// offset using the tile position so we 
		// un-overlay the ships

		// x offsets
		if(pos % 5 == 2) 
		{
			ships[i].style.left = (rect.left + 12) + "px";
		}
		else if(pos % 5 == 3) 
		{
			ships[i].style.left = (rect.left + 24) + "px";
		}
		else if(pos % 5 == 4) 
		{
			ships[i].style.left = (rect.left + 36) + "px";
		}
		else if(pos % 5 == 0) 
		{
			ships[i].style.left = (rect.left + 48) + "px";
		}

		// y offsets
		if(pos >= 6) 
		{
			ships[i].style.top = (rect.top + 12) + "px";
		}
		if(pos >= 11) 
		{
			ships[i].style.top = (rect.top + 24) + "px";
		}
		if(pos >= 16) 
		{
			ships[i].style.top = (rect.top + 36) + "px";
		}
	}

	// update the image for ships that aren't in the new game state
	// this occurs on scatter phase when we remove two ships from the board.

	// the old ships
	var oldShips = previousGameState.board.ships;

	for(var i = 0; i < oldShips.length; ++i)
	{
		// the new ship
		var newShip = findShipById(gameState, oldShips[i].id);
		
		// if there's no new ship, then the ship is dead
		if(!newShip)
		{
			// get that ship element
			var deadShip = document.getElementById('ship-'+oldShips[i].id);

			// update it's image
			deadShip.style.background = "url('assets/images/shipDead.png')";
		}
	}
}