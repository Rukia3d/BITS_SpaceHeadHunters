const {ipcRenderer} = require('electron');
var settings = require('./assets/javascript/settings');
var sets = new settings();

const rows = 9, cols = 9;

// Ship animations timing
const shipMoveTime = 7;
const shipFadeInTime = 15;
const shipFadeOutTime = 50;

// lure animation timing
const lureFadeInTime = 20;
const lureFadeOutTime = 50;


// the previous game state to compare ship positions to current game state.
var previousGameState = null;
let pNum = null;

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
					sets.playSound("generate");
					sendEvent(gamestate.phase, gamestate.player);
				}

				//add the button to the area
				activeArea.appendChild(drawButton);

				break;
			case "PLACE":
				//Display players card in players section before its positioned
				var displayCard = document.createElement("div");
				displayCard.className = "picture";
				displayCard.className += " " + player.currentCard;
				activeArea.append(displayCard);
				
				//show player where he can put his card
				displayAvailableSpots(gamestate);
				break;
			case "LURE":
				//Display players lure in players section before its positioned
				var lure = document.createElement('div');
				lure.className = "picture";
				//Get players number
				var playerNum = element.id;
				playerNum = playerNum.substring(6);
				playerNum = Number(playerNum);
				
				lure.id = "lure-p" + playerNum;		
				activeArea.appendChild(lure);
				
				//show player where he can put his lure
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

		var lure = document.createElement('div');
		lure.id = "lure-p" + (n + 1);
		lure.className = "lure";
		cell.appendChild(lure);
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
			//play sound
			sets.playSound("positioned");
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
			//play sound
			sets.playSound("positioned");
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
		prepareShipsForAnimation(arg);
		// animate the ships - will also do any required rendering AFTER the animations
		// will also fade out lures and dead ships
		animateAllShips(arg, 0);
	}
	else {
		renderBoard(arg); // render the board from gamestate
		hideNewShips(arg); // hide any new ships placed on the board
		fadeInElements(arg, 0); // fade in new ships and lures in gently and advance the state afterward
	}
});

// ============================================================================
// ANIMATION STUFF
// ============================================================================
// Animating by comparing the previous gamestate with the current one.
function animateShip(gameState, element, startTop, endTop, startLeft, endLeft, i) {

	var animate;	
	// play sound
	sets.playSound("shipsfly");
	
	// Up Left
	if(startTop > endTop && startLeft > endLeft) 
	{
		animate = setInterval(function() {
			if(startTop <= endTop && startLeft <= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
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
		}, shipMoveTime);
	}

	// Up Right
	else if(startTop > endTop && startLeft < endLeft) 
	{
		animate = setInterval(function() {
			if(startTop <= endTop && startLeft >= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
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
		}, shipMoveTime);
	}

	// Down Left
	else if(startTop < endTop && startLeft > endLeft)
	{
		animate = setInterval(function() {
			if(startTop >= endTop && startLeft <= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
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
		}, shipMoveTime);
	}

	// Down Right
	else if(startTop < endTop && startLeft < endLeft)
	{
		animate = setInterval(function() {
			if(startTop >= endTop && startLeft >= endLeft)
			{
				element.style.top = endTop + "px";
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
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
		}, shipMoveTime);
	}

	// Left
	else if(startLeft > endLeft)
	{
		animate = setInterval(function() {
			if(startLeft <= endLeft)
			{
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
			}
			else 
			{
				startLeft--;
				element.style.left = parseInt(startLeft) + "px";
			}
		}, shipMoveTime);
	}

	// Right
	else if(startLeft < endLeft)
	{
		animate = setInterval(function() {
			if(startLeft >= endLeft)
			{
				element.style.left = endLeft + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
			}
			else 
			{
				startLeft++;
				element.style.left = parseInt(startLeft) + "px";
			}
		}, shipMoveTime);
	}

	// Down
	else if(startTop < endTop)
	{
		animate = setInterval(function() {
			if(startTop >= endTop)
			{
				element.style.top = endTop + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
			}
			else 
			{
				startTop++;
				element.style.top = parseInt(startTop) + "px";
			}
		}, shipMoveTime);
	}

	// Up
	else if(startTop > endTop)
	{
		animate = setInterval(function() {
			if(startTop <= endTop)
			{
				element.style.top = endTop + "px";
				clearInterval(animate);
				i++;
				animateAllShips(gameState, i);
			}
			else 
			{
				startTop--;
				element.style.top = parseInt(startTop) + "px";
			}
		}, shipMoveTime);
	}
	else
	{
		i++;
		animateAllShips(gameState, i);
	}
}

function addShipsStuckOnPubTile(gameState) 
{
	if(previousGameState)
	{
		for(var i = 0; i < previousGameState.board.ships.length; ++i)
		{
			for(var k = 0; k < gameState.board.ships.length; ++k)
			{
				// if ship didn't move
				if(previousGameState.board.ships[i].id == gameState.board.ships[k].id &&
				   previousGameState.board.ships[i].x == gameState.board.ships[k].x &&
				   previousGameState.board.ships[i].y == gameState.board.ships[k].y)
				{
					// check what tile it's on
					for(var m = 0; m < previousGameState.board.tiles.length; ++m)
					{
						// if it's on a pub
						if(previousGameState.board.tiles[m].type == 'pub' && 
						   previousGameState.board.tiles[m].x == previousGameState.board.ships[i].x &&
					       previousGameState.board.tiles[m].y == previousGameState.board.ships[i].y)
						{
							shipsMovedToTile.push({ "x" : previousGameState.board.ships[i].x, "y" : previousGameState.board.ships[i].y });
						}
					}					
				}
			}
		}
	}
}

function animateAllShips(gameState, i) {

	if(i == 0)
	{
		fadeOutDeadShips(gameState, false);
		addShipsStuckOnPubTile(gameState);
	}

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
			if(ships.length > 0 && previousGameState.phase == 'SHIPSFLEE')
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
			animateShip(gameState, element, startTop, endTop, startLeft, endLeft, i);
			
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
			animateShip(gameState, element, startTop, endTop, startLeft, endLeft, i);
		}
		// the ship isn't moving
		else 
		{
			i++;
			animateAllShips(gameState, i);
		}
	}
	// when we've animated all the ships
	else if(i == previousGameState.board.ships.length) {
		// clear the array that tracks how many ships have been moved to destination tiles
		shipsMovedToTile.length = 0;

		fadeOutAllLures(gameState, false);
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
	
ipcRenderer.on("SET_PNUM", (event, arg) => {

	console.log("setting pNum to " + arg);
	this.pNum = event;

});

// modify the css for ships prior to flying.
// we need a fixed position in order to move the ships to
// another location.
function prepareShipsForAnimation(gameState) {

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

function hideNewShips(gameState) {

	// only hide ships when we've just placed a new tile
	if(previousGameState && previousGameState.phase == 'PLACE')
	{
		var newShips = gameState.board.ships;
		var oldShips = previousGameState.board.ships;
		
		// compare new ships list to the previous list
		for(var i = 0; i < newShips.length; ++i)
		{
			var found = false;

			for(var k = 0; k < oldShips.length; ++k)
			{
				if(newShips[i].id == oldShips[k].id)
				{
					found = true;				
				}
			}

			// if we didn't find the ship, then it's a new one - hide it!
			if(!found)
			{
				document.getElementById(`ship-${newShips[i].id}`).style.visibility = 'hidden';
			}
		}
	}
}

function fadeInElements(gameState, i) {

	if(previousGameState && i < gameState.board.ships.length)
	{
		var ship = gameState.board.ships[i];
		var oldShips = previousGameState.board.ships;
		var found = false;
		var element = document.getElementById(`ship-${ship.id}`);

		// compare new ships list to the previous list
		for(var k = 0; k < oldShips.length; ++k)
		{
			if(ship.id == oldShips[k].id)
			{
				found = true;
			}
		}
		if(!found)
		{
			// if we didn't find it, fade it in
			fadeInShip(gameState, element, i);
		}
		else
		{
			// otherwise, repeat for the next ship
			i++;
			fadeInElements(gameState, i);
		}
	}
	else if(i == gameState.board.ships.length && previousGameState && previousGameState.phase == 'PLACE') {
		var op = 1.0;
	    var timer = setInterval(function ()
	    {
	        if (op <= 0.1)
	        {
	        	fadeInLure(gameState, false);
	            clearInterval(timer);
	        }
	        op -= 0.1;
	    }, shipFadeInTime);
	}
	else if(i == gameState.board.ships.length) 
	{
		// once we're done with the ships, fade in the lures
		fadeInLure(gameState, false);
	}
	// there was no previous game state, but we still need to progress
	// to fade in lures eventually in order to progress the game state object
	// at the end of that function.
	else {
		i++;
		fadeInElements(gameState, i);
	}
}

function fadeOutDeadShips(gameState, finished) {

	if(previousGameState && previousGameState.phase == 'SHIPSFLEE' && !finished)
	{
		// we want to fade these guys out simultaneously
		var deadShips = new Array();

		// get all the dead ships
		for(var i = 0; i < previousGameState.board.ships.length; ++i)
		{
			var oldShip = previousGameState.board.ships[i];
			var newShips = gameState.board.ships;
			var found = false;
			var element = document.getElementById(`ship-${oldShip.id}`);

			for(var k = 0; k < newShips.length; ++k)
			{
				if(oldShip.id == newShips[k].id)
				{
					found = true;
				}
			}
			if(!found)
			{
				deadShips.push(element);
			}
		}

		// fade them out
		if(deadShips.length > 0)
		{
			for(var i = 0; i < deadShips.length; ++i)
			{
				if(i == deadShips.length - 1)
				{
					// fading out the last ship progresses the state
					fadeOutLastDeadShip(gameState, deadShips[i]);
				}
				else 
				{
					fadeOutDeadShip(deadShips[i]);
				}
			}
		}
	}
	else
	{
		// we're finished - no need to test the finished variable though
		return;
	}
}

// adapted from https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeOutDeadShip(element) 
{
    var op = 1.0;
    var timer = setInterval(function ()
    {
        if (op <= 0.1)
        {
        	element.style.visibility = 'hidden';
            clearInterval(timer);
        }
        element.style.opacity = op;
        op -= 0.1;
    }, shipFadeOutTime);
}

// adapted from https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeOutLastDeadShip(gameState, element) 
{
    var op = 1.0;
    var timer = setInterval(function ()
    {
        if (op <= 0.1)
        {
        	element.style.visibility = 'hidden';
            clearInterval(timer);
            fadeOutDeadShips(gameState, true); // progress the state
        }
        element.style.opacity = op;
        op -= 0.1;
    }, shipFadeOutTime);
}

// adapted from https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeInShip(gameState, element, i) 
{
	console.log('ship entered');
	element.style.opacity = 0;
	element.style.visibility = 'visible';

    var op = 0;  // initial opacity
    var timer = setInterval(function () 
    {
        if (op >= 1)
        {
        	element.style.opacity = 1;
            clearInterval(timer);
            i++;
            fadeInElements(gameState, i);
        }

        element.style.opacity = op;
        op += 0.1;
    }, shipFadeInTime);
}

// adapted from https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeInLure(gameState, finished) {

	if(previousGameState && previousGameState.phase == 'LURE' && !finished)
	{
		var player = previousGameState.player;
		var lure = document.getElementById('lure-p' + (parseInt(player) + 1));
		if(lure)
		{
			lure.style.visibility = 'hidden';
			lure.style.opacity = 0;
			lure.style.visibility = 'visible';

    		var op = 0;  // initial opacity
		    var timer = setInterval(function () 
		    {
		        if (op >= 1)
		        {
					lure.style.opacity = 1;		        	
		            clearInterval(timer);
		            fadeInLure(gameState, true);
		        }

		        lure.style.opacity = op;
		        op += 0.1;
		    }, lureFadeInTime);
		}
	}

	// when we're done, progress the state
	else if(!previousGameState || previousGameState.phase != 'LURE' || finished) 
	{
		renderPlayers(gameState); // render both players from gamestate
		previousGameState = gameState;

		switch (gameState.phase) 
		{
			case "SHIPSFLY":
			case "SHIPSFLEE":
				sendEvent(gameState.phase, gameState);
				break;
		}
	}
}

function fadeOutAllLures(gameState, finished) {

	// fade them out simultaneously
	if(previousGameState && previousGameState.phase == 'SHIPSFLEE' && !finished)
	{
		for(var i = 0; i < gameState.players.length; ++i)
		{
			var lure = document.getElementById(`lure-p${i + 1}`);

			if(i == gameState.players.length - 1)
			{
				// this one will move us to the else clause via callback to this function.
				fadeOutLastLure(gameState, lure);
			}
			else 
			{
				fadeOutLure(lure);	
			}
		}
	}
	// we're done, so progress the state
	else 
	{
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

// adapted from https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeOutLure(element) {

	var op = 1.0;
    var timer = setInterval(function ()
    {
        if (op <= 0.1)
        {
        	element.style.visibility = 'hidden';
            clearInterval(timer);
        }
        element.style.opacity = op;
        op -= 0.1;
    }, lureFadeOutTime);
}

// adapted from https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
function fadeOutLastLure(gameState, element) {
	var op = 1.0;
    var timer = setInterval(function ()
    {
        if (op <= 0.1)
        {
        	element.style.visibility = 'hidden';
            clearInterval(timer);
            fadeOutAllLures(gameState, true);
        }
        element.style.opacity = op;
        op -= 0.1;
    }, lureFadeOutTime);
}


// SETTINGS MENU
var settings = document.getElementById('settings');
settings.onclick = function() {
	sendEvent('SETTINGS');
}