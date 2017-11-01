const {ipcRenderer} = require('electron');
const rows = 9, cols = 9;

// for animations
var previousGameState = null;
var shipsMovedToTile = new Array();
var oldShipPos = new Array();

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
	
	var shipWrap = document.createElement('div');
	shipWrap.className = 'ship-wrap';
	shipWrap.dataset.shipx = x;
	shipWrap.dataset.shipy = y;

	if(ships.length > 0) 
	{
		var html = "";

		for(var i = 0; i < ships.length; ++i) 
		{
			html += ` <div class='ship' id='${"ship-" + ships[i].id}'></div>`;
		}

		shipWrap.innerHTML += html;
	}

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
	if(previousGameState && (previousGameState.phase == "SHIPSFLY" || previousGameState.phase == "SHIPSFLEE")) {
		for(var k = 0; k < previousGameState.board.ships.length; ++k)
		{
			var element = document.getElementById('ship-' + previousGameState.board.ships[k].id );
			var rect = element.getBoundingClientRect();
			oldShipPos.push({ "left" : rect.left, "top" : rect.top, "id" : previousGameState.board.ships[k].id });
		}
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
		}, 10);
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
		}, 10);
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
		}, 10);
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
		}, 10);
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
		}, 10);
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
		}, 10);
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
		}, 10);
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
		}, 10);
	}
	else
	{
		i++;
		shipAnimation(gameState, i);
	}
}

function shipAnimation(gameState, i) {

	// animate the ships in turn
	if(i < previousGameState.board.ships.length) 
	{
		// the ship objects with x, y, and ID
		var oldShip = previousGameState.board.ships[i];
		var newShip = findShipById(gameState, oldShip.id);

		if(newShip && (oldShip.x != newShip.x || oldShip.y != newShip.y)) 
		{
			// ships on tile previously
			var previousTileShips = 0;
			var ships = findByXY(previousGameState.board.ships, newShip.x, newShip.y);
			if(ships.length > 0){
				for(var j = 0; j < ships.length; ++j) {
					previousTileShips++;
					shipsMovedToTile.push({ "x" : newShip.x, "y" : newShip.y });
				}
			}

			shipsMovedToTile.push({ "x" : newShip.x, "y" : newShip.y });

			// find the number of ships on the new tile
			var currentNewTileShips = 0;
			if(shipsMovedToTile.length != 0)
			{
				for(var k = 0; k < shipsMovedToTile.length; ++k) 
				{
					if(shipsMovedToTile[k].x == newShip.x && shipsMovedToTile[k].y == newShip.y)
						currentNewTileShips++;
				}
			}

			// offset for ship's position on the destination tile.
			var offsetX = 0;
			var offsetY = 0;
			
			// X offsets
			if(currentNewTileShips % 5 == 0) {
				offsetX += 48;
			}
			else if(currentNewTileShips % 4 == 0) {
				offsetX += 36;
			}
			else if(currentNewTileShips % 3 == 0) {
				offsetX += 24;
			}
			else if(currentNewTileShips % 2 == 0) {
				offsetX += 12;
			}

			// Y offsets
			if(currentNewTileShips >= 6) {
				offsetY += 12;
			}
			if(currentNewTileShips >= 11) {
				offsetY += 12;
			}
			if(currentNewTileShips >= 16) {
				offsetY += 12;
			}				
						
			var element = document.getElementById('ship-'+oldShip.id);

			// get the old ship element positions
			var startRect = element.getBoundingClientRect();
			
			element.style.position = "fixed";

			for(var l = 0; l < oldShipPos.length; ++l)
			{
				if(oldShipPos[l].id == oldShip.id)
				{
					element.style.top = oldShipPos[l].top + "px";
					element.style.left = oldShipPos[l].left + "px";
				}
			}

			var startTop = startRect.top;
			var startLeft = startRect.left;

			// get the new ship element positions.
			var endPosition = document.querySelector('[data-shipx="'+newShip.x+'"][data-shipy="'+newShip.y+'"]');
			var endRect = endPosition.getBoundingClientRect();

			// offsets for ship positions within the tile
			var endTop = endRect.top + offsetY;
			var endLeft = endRect.left + offsetX;

			// move it there
			moveShipToEnd(gameState, element, startTop, endTop, startLeft, endLeft, i);
			
		}
		else 
		{
			console.log(i);
			i++;
			shipAnimation(gameState, i);
		}
	}
	else if(i == previousGameState.board.ships.length) {

		shipsMovedToTile.length = 0;
		previousGameState = gameState;
		renderBoard(gameState); // render the board from gamestate
  		renderPlayers(gameState); // render both players from gamestate
  		
  		if(gameState.phase != "DRAW")
			sendEvent(gameState.phase, gameState);
	} 
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