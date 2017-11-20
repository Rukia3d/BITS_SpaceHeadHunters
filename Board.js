/*	Board.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

class Board {
/*  Object representing the board, encapsulating the tile and ship objects.
 *  Presents public methods for manipulating the objects on the board, and 
 *  business logic for ensuring legal player moves and performing correct ship 
 *  movements at the end of the placement phases.
 */

    constructor(deck) {

        this.tiles = new Array();
        this.ships = new Array();
        this.idCount = 0;
        this.initBoard(deck);
        this.initShips();

    }
    
    //-------------------------------------------------------------------------
    // PUBLIC INTERFACES
    //-------------------------------------------------------------------------
    placeCard(crd, x, y) {

        // first, check if the location already has tile...
        if (this.getTile(x, y) !== null)
            return false;

        // ...if it doesn't, check location edges for adjacent tiles
        for (let j = 0; j < this.tiles.length; ++j) {

            if((Math.abs(this.tiles[j].x - x) === 1 && this.tiles[j].y === y) ||
               (Math.abs(this.tiles[j].y - y) === 1 && this.tiles[j].x === x)) {
                    
                    // found an adjacent tile, placement is legal yay
                    this.tiles.push({"type": crd, "x": x, "y": y});
                    this.placeShip(x, y);

                    return true;

                }

        }

        // no adjacent tile found, placement illegal
        return false;
    }
    
    placeLure(player, x, y) {
    
        /* legal lure placement must meet the following criteria:
         *  - must have a card at tile
         *  - card must not be pub
         *  - card must have no ships
         */

        // note order of terms is important

        if (this.getTile(x, y) && this.getTile(x, y).type !== "pub" &&
            this.numShipsOnTile(x, y) === 0) { 

            // lure placement is legal
            player.lure = {"x": x, "y": y};
            return true;

        }

        // lure placement is illegal
        return false;
    
    }
    
    placeShip(x, y) {
        
        // for a given coord, scan tile array to ensure tile exists at that 
        // location and that potential location is a gate
        this.tiles.forEach(function(i) {

            if (i.x === x && i.y === y) {
                
                if (i.type.substring(0, 4) === "gate") {
        
                    // cool, coord is valid. now lets grab the 
                    // number of ships for this gate...
                    var numShips = parseInt(i.type.substring(4));
        
                    // ...and add these ships to the board ship array
                    for(var j = 0; j < numShips; ++j) {
        
                        this.ships.push({ "x" : i.x, "y" : i.y, "id" : this.idCount });
                        this.idCount++;
                    }
        
                }

            }
    
        }, this);

        // ships must be sorted for animations to work correctly
        this.sortShips();        
    }

    sortShips() {
    /*  animations require the pub ships to be first ships to be moved.
     *  ships can move both from and to a pub tile during the animation phase.
     *  Because ship position on tile is determined by the new gamestate object
     *  if the pub ships move last - then any ships going TO the pub tile will
     *  move to position 0, and position 1 etc, temporarily overlaying
     *  the ships that will shortly move FROM the pub tile
     *  Quickest solution is to always move ships FROM the pub tile first
     *  and the quickest way to do that is to ensure the sort order of the array so that
     *  the pub ships appear as the first elements.
     */

        // declare temp ship arrays
        var otherShips = new Array();
        var pubShips = new Array();

        // iterate through all ships
        for(var i = 0; i < this.ships.length; ++i)
        {
            var tile = this.getTile(this.ships[i].x, this.ships[i].y);

            // check if ships located on a pub tile 
            if(tile.type == 'pub') {

                // it is, add it to pub array
                pubShips.push(this.ships[i]);
            }
            else {
                // it isn't, add it to non-pub array
                otherShips.push(this.ships[i]);
            }
        }

        // join temp arrays together, pub ships are now first
        this.ships = pubShips.concat(otherShips);
    }

    getTiles() {
    // getter method
        return this.tiles;
    }

    getTile(x, y) {
    // getter method, return the tile at the specified coord
    // or null if no tile at coord

        for (let j = 0; j < this.tiles.length; ++j) {

            if (this.tiles[j].x === x && this.tiles[j].y === y) {
                return this.tiles[j];
            }

        }
        
        return null;

    }

    numShipsOnTile(x, y) {
    //  getter method. given a tile coord, return the number of ships on it

        var shipCount = 0;

        this.ships.forEach(function(i) {
        
            if (i.x === x && i.y === y)
                shipCount++;

        }, this);

        return shipCount;

    }

    getShipIdsOnTile(x, y) {
    /*  given a tile coord, check all ships and record the id of the players
     *  who placed them into an array
     */
        var ids = new Array();

        this.ships.forEach(function(i) {
        
            if (i.x === x && i.y === y)
                ids.push(i.id);

        }, this);
        
        // don't know what this does...
        ids.reverse();

        return ids;
    }

    scatter() {
    /* performs the scattering of the ships when a tile contains too many ships
     */
        
        // all ships on one tile = shipGroup
        var shipGroups = new Array();
        
        this.tiles.forEach(function(i) {
        
            let shipCount = this.numShipsOnTile(i.x, i.y);
            let ids = this.getShipIdsOnTile(i.x, i.y);

            if (shipCount > 0)
                shipGroups.push({ "num": shipCount, "x": i.x, "y": i.y, "ids" : ids });
            
            
        }, this);

        /*
        (0,0) (1,0) (2,0) (3,0) (4,0) (5,0)
        (0,1) (1,1) (2,1) (3,1) (4,1) (5,1)
        (0,2) (1,2) (2,2) (3,2) (4,2) (5,2)
        (0,3) (1,3) (2,3) (3,3) (4,3) (5,3)
        (0,4) (1,4) (2,4) (3,4) (4,4) (5,4)
        (0,5) (1,5) (2,5) (3,5) (4,5) (5,5)
        With starting point (2,3)
        Chain size is 1
        Direction is 0, or UP
        for the size of chain
            -check that many cards in that direction
            -then change direction
            -check that many cards again in the new direction
            -then change direction again, and increase chain size
        so chain is 1
            check 1 card in the up direction (2,2)
            change direciton to right
            check one card in the right direction (3,2)
            change direction to down
            increase chain size to 2
        chain is 2
            check 2 cards in the down direction (3,3) (3,4)
            change direciton to left
            check 2 cards in the left direction (2,4) (1,4)
            change direction to up
            increase chain size to 3
        etc
        */

        // for each ship group
        for(var j = 0; j < shipGroups.length; ++j) {

            // scatter if needed
            if(shipGroups[j].num >= 6) {

                // remove the ships from the tile
                this.removeShipsFromTile(shipGroups[j].x, shipGroups[j].y);

                // scatter amount
                var shipsToScatter = shipGroups[j].num - 2;

                // direction
                var direction = 0;

                // chain size
                var size = 1;

                // starting point is the shipGroup's tile
                var x = shipGroups[j].x;
                var y = shipGroups[j].y;
                var ids = shipGroups[j].ids;

                console.log(`Need to scatter ${shipsToScatter} ships`);

                // this gets tricky... for the num of ships to scatter
                for (var k = shipsToScatter; k > 0; /*condition is inside loop*/) {

                    // for chain size
                    for (var l = 0; l < 2 && k > 0; l++) {

                        // repeat the check and change direction
                        for (var i = 0; i < size && k > 0; i++) {

                            console.log(`Checking tile ( ${x}, ${y} )\n`);

                            // check if there's a card available
                            if(this.getTile(x, y)) {

                                // place a ship if so
                                console.log(`Scattering one ship to ( ${x}, ${y} ) - ${k - 1} ships left to scatter...\n`);
                                this.ships.push({ "x" : x, "y" : y, "id" : ids.pop() });

                                // decrement the ships
                                --k;
                            }
                            else {
                                console.log(`No Card at tile ( ${x}, ${y} )\n`);
                            }

                            // move in the current direction
                            switch (direction) {

                                // up
                                case 0: 
                                    y--; 
                                    break;

                                // right
                                case 1: 
                                    x++; 
                                    break;

                                // down
                                case 2: 
                                    y++;
                                    break;

                                // left
                                case 3: 
                                    x--; 
                                    break;
                            }
                        }

                        // change the direction, reset back to 0 if at 3
                        direction = (direction + 1) % 4;
                    }

                    // increase the chain size
                    size++;
                }
            }
        }
    }

    removeShipsFromTile(x, y) {
    /* given a tile coord, remove all ships from tile
     */
            
        console.log(`removing all ships from ( ${x}, ${y} )`);

        // create temp array
        let newShips = new Array();

        // find ships at coord
        this.ships.forEach(function(i) {
            
            if (i.x == x && i.y == y)
                // if matching ship is found, don't add to new array
                ;
            else
                // add all others
                newShips.push(i);

        }, this);

        // we now have a temp array that excludes the ships at the given coord
        // so replace the board object's ship array with the temp array
        this.ships = newShips;

        // ships must be sorted for animations to work correctly
        this.sortShips();
    }

    shipsFly(players) {
        
        // steps
        // 1 - get shipgroups i.e. the number and position of ships on a tile
        // 2 - find lures in the x or y axis from each ship group position
        // 3 - determine which of those 'axis lures' have a valid path i.e. no empty tiles between them
        // 4 - from the remaining lures, find the closest one(s)/
        // 5 - if there's only one lure, move to it but stop at pub if it's between them
        // 6 - if there are multiple lures, find any cruiser lures that should break tie.
        // 7 - if cruiser lures, find the ship amount for each cruiser lure i.e. if ships %(modulo) lures == 0
        // 8 - check for pubs too
        // 9 - if no cruiser lures, basically do the same as for them.

        // could simplify this a bit I think if there's only one lure, then the ship count modulo% the num lures will
        // still result in that lure gettign all ships. So there's an extra conditional that doesn't need to be in there.
        // i.e. step 5 above


        var shipGroups = new Array();
        var newShipGroups = new Array();

        // get the ship groups
        for(var i = 0; i < this.tiles.length; ++i) {

            var shipCount = this.numShipsOnTile(this.tiles[i].x, this.tiles[i].y);
            var shipIds = this.getShipIdsOnTile(this.tiles[i].x, this.tiles[i].y);

            if(shipCount > 0) {

                shipGroups.push({ "num" : shipCount, "x" : this.tiles[i].x, "y" : this.tiles[i].y, "ids" : shipIds });
            }
        }

        for(var k = shipGroups.length - 1; k >= 0; --k) {

            console.log(`\n\n==================\nShip Group ${k}\n==================`);
            console.log(`Location: ( ${shipGroups[k].x}, ${shipGroups[k].y} )`);
            console.log(`Number of Ships: ${shipGroups[k].num}\n==================\n`);
            
            var axisLures = new Array();
            var cruiserLures = new Array();
            var pub = null;
            var closestLureDistance = 9;
            var numShipsPerLure = 0;

            // determine lures on the x and y axis
            for(var j = 0; j < players.length; ++j) {

                if(players[j].lure.x == shipGroups[k].x) {

                    axisLures.push({ "axis" : "y", "x" : players[j].lure.x, "y" : players[j].lure.y, "distance" : 0 });
                }
                else if(players[j].lure.y == shipGroups[k].y) {

                    axisLures.push({ "axis" : "x", "x" : players[j].lure.x, "y" : players[j].lure.y, "distance" : 0});
                }
            }

            console.log(`Axis Lures\n----------\n`);
            for(var ii = 0; ii < axisLures.length; ++ii) {

                console.log(`Lure ${ii}: ${axisLures[ii].axis}-axis ( ${axisLures[ii].x}, ${axisLures[ii].y} )\n`);
            }

            // determine lures with a valid path to them
            // note that the for loop iterates backwards because we're altering array within the loop itself
            // by removing elements which would result in skipping if we go forwards.
            for(var l = axisLures.length - 1; l >= 0; --l) {
                console.log(`Checking lure ${l}`);
                if(axisLures[l].axis == "y" && !this.checkShipPathY(shipGroups[k].y, axisLures[l].y, axisLures[l].x)) {

                    axisLures.splice(l, 1);
                }
                else if(axisLures[l].axis == "x" && !this.checkShipPathX(shipGroups[k].x, axisLures[l].x, axisLures[l].y)) {

                    axisLures.splice(l, 1);
                }
            }

            console.log(`Path Lures\n----------\n`);
            for(var ii = 0; ii < axisLures.length; ++ii) {
                
                console.log(`Lure ${ii}: ${axisLures[ii].axis}-axis ( ${axisLures[ii].x}, ${axisLures[ii].y} )\n`);
            }

            // find out the closest lures
            for(var n = 0; n < axisLures.length; ++n) {

                if(axisLures[n].axis == "x") {

                    axisLures[n].distance = Math.abs(axisLures[n].x - shipGroups[k].x);
                }
                else {

                    axisLures[n].distance = Math.abs(axisLures[n].y - shipGroups[k].y);
                }
            }

            closestLureDistance = Math.min.apply(Math, axisLures.map(function(o) { return o.distance; }))
            console.log(`Closest Lure Distance: ${closestLureDistance}`);

            // again iterating backwards to avoid skipping elements.
            for(var n = axisLures.length - 1; n >= 0; --n) {

                if(closestLureDistance < axisLures[n].distance) {

                    axisLures.splice(n, 1);
                }
            }

            console.log(`Closest Lures\n----------\n`);
            for(var ii = 0; ii < axisLures.length; ++ii) {
                
                console.log(`Lure ${ii}: ${axisLures[ii].axis}-axis ( ${axisLures[ii].x}, ${axisLures[ii].y} )\n`);
            }


            // one valid lure
            if(axisLures.length == 1) {

                numShipsPerLure = shipGroups[k].num;

                console.log(`Pubs\n----------\n`);
                if(axisLures[0].axis == "x") {

                    pub = this.getPubInPathX(shipGroups[k].x, axisLures[0].x, axisLures[0].y);
                }
                else {

                    pub = this.getPubInPathY(shipGroups[k].y, axisLures[0].y, axisLures[0].x);
                }
                
                if(pub != null) {

                    newShipGroups.push({ "num" : numShipsPerLure, "x" : pub.x,  "y" : pub.y, "ids": shipGroups[k].ids });
                }
                else {

                    newShipGroups.push({ "num" : numShipsPerLure, "x" : axisLures[0].x,  "y" : axisLures[0].y, "ids": shipGroups[k].ids });
                }
            }

            // multiple valid lures
            else if(axisLures.length > 1) {

                // find cruiser lures
                for(var t = 0; t < axisLures.length; ++t) {

                    if(this.getTile(axisLures[t].x, axisLures[t].y).type == "cruiser") {

                        cruiserLures.push({ "axis" : axisLures[t].axis, "x" : axisLures[t].x, "y" : axisLures[t].y });
                    }
                }

                console.log(`Cruiser Lures\n----------\n`);
                for(var ii = 0; ii < cruiserLures.length; ++ii) {
                    
                    console.log(`Lure ${ii}: ${cruiserLures[ii].axis}-axis ( ${cruiserLures[ii].x}, ${cruiserLures[ii].y} )\n`);
                }

                // if we have cruiser lures
                if(cruiserLures.length > 0) {

                    if(shipGroups[k].num % cruiserLures.length == 0)
                    {
                        numShipsPerLure = shipGroups[k].num / cruiserLures.length;
                        console.log("evenly dicisible " + numShipsPerLure);
                    }
                    
                    else {
                        numShipsPerLure = (shipGroups[k].num - 1) / cruiserLures.length;
                        console.log("NOT evenly dicisible " + numShipsPerLure);
                        newShipGroups.push({ "num" : 1, "x" : shipGroups[k].x,  "y" : shipGroups[k].y, "ids" : shipGroups[k].ids.splice(0, 1) });
                    }

                    for(var v = 0; v < cruiserLures.length; ++v) {

                        if(cruiserLures[v].axis == "x") {

                            pub = this.getPubInPathX(shipGroups[k].y, cruiserLures[v].y, cruiserLures[v].x);
                        }
                        else {

                            pub = this.getPubInPathY(shipGroups[k].x, cruiserLures[v].x, cruiserLures[v].y);    
                        }

                        if(pub != null) {

                            newShipGroups.push({ "num" : numShipsPerLure, "x" : pub.x,  "y" : pub.y, "ids" : shipGroups[k].ids.splice(0, numShipsPerLure) });
                        }
                        else {

                            newShipGroups.push({ "num" : numShipsPerLure, "x" : cruiserLures[v].x,  "y" : cruiserLures[v].y, "ids" : shipGroups[k].ids.splice(0, numShipsPerLure) });
                        }
                    }
                }

                // if just normal lures
                else if(cruiserLures.length == 0) {

                    if(shipGroups[k].num % axisLures.length == 0)
                    {
                        numShipsPerLure = shipGroups[k].num / axisLures.length;
                        console.log("evenly dicisible " + numShipsPerLure);
                    }
                    else {
                        numShipsPerLure = (shipGroups[k].num - 1) / axisLures.length;
                        console.log("NOT evenly dicisible " + numShipsPerLure);
                        newShipGroups.push({ "num" : 1, "x" : shipGroups[k].x,  "y" : shipGroups[k].y, "ids" : shipGroups[k].ids.splice(0, 1) });
                    }

                    for(var v = 0; v < axisLures.length; ++v) {

                        if(axisLures[v].axis == "y") {

                            pub = this.getPubInPathY(shipGroups[k].x, axisLures[v].x, axisLures[v].y);

                            if(pub != null) {

                                newShipGroups.push({ "num" : numShipsPerLure, "x" : pub.x,  "y" : pub.y, "ids" : shipGroups[k].ids.splice(0, numShipsPerLure) });
                            }
                            else {

                                newShipGroups.push({ "num" : numShipsPerLure, "x" : axisLures[v].x,  "y" : axisLures[v].y, "ids" : shipGroups[k].ids.splice(0, numShipsPerLure) });
                            }
                        }
                        else if(axisLures[v].axis == "x") {

                            pub = this.getPubInPathX(shipGroups[k].y, axisLures[v].y, axisLures[v].x);

                            if(pub != null) {

                                newShipGroups.push({ "num" : numShipsPerLure, "x" : pub.x,  "y" : pub.y, "ids" : shipsGroups[k].ids.splice(0, numShipsPerLure) });
                            }
                            else {

                                newShipGroups.push({ "num" : numShipsPerLure, "x" : axisLures[v].x,  "y" : axisLures[v].y, "ids" : shipGroups[k].ids.splice(0, numShipsPerLure) });
                            }
                        }
                    }
                }
                // keep the ships were they were i.e. they weren't evenly divisible
                else {
                    //newShipGroups.push({ "num" : shipGroups[k].num, "x" : shipGroups[k].x,  "y" : shipGroups[k].y, "ids" : shipGroups[k].ids });
                }
            }
            // there were no valid lures, so don't move the ships
            else {
                newShipGroups.push({ "num" : shipGroups[k].num, "x" : shipGroups[k].x,  "y" : shipGroups[k].y, "ids" : shipGroups[k].ids });
            }
        }
        // newShipGroups contains the entire boards' new shipGroups even if they haven't moved
        // so get rid of the old ships...
        this.ships.length = 0;

        // ... and add the new ships.
        for(var i = 0; i < newShipGroups.length; ++i) {

            for(var k = 0;  k < newShipGroups[i].num; ++k) {

                this.ships.push({ "x" : newShipGroups[i].x, "y" : newShipGroups[i].y, "id": newShipGroups[i].ids[k] });
            }
        }
        this.sortShips();
    }

    getPubInPathX(xStart, xEnd, y) {
    // check from xStart coord to xEnd coord for pub tiles
    // return coord if found, null if not

        console.log(`Checking pubs in X axis...`);
        if(xStart > xEnd) {

            for(var i = xStart - 1; i > xEnd; --i) {

                console.log(`Checking for pub @ ( ${i}, ${y} )\n`);
                if(this.getTile(i, y).type == "pub") {

                    console.log(`Pub @ ( ${i}, ${y} )\n`);
                    return { "x" : i, "y" : y };
                }
            }
        }
        else {

            for(var i = xStart + 1; i < xEnd; ++i) {

                console.log(`Checking for pub @ ( ${i}, ${y} )\n`);
                if(this.getTile(i, y).type == "pub") {

                    console.log(`Pub @ ( ${i}, ${y} )\n`);
                    return { "x" : i, "y" : y };
                }
            }
        }

        return null;
    }

    getPubInPathY(yStart, yEnd, x) {
    // check from yStart coord to yEnd coord for pub tiles
    // return coord if found, null if not

        console.log(`Checking pubs in Y axis...`);
        if(yStart > yEnd) {

            for(var i = yStart - 1; i > yEnd; --i) {

                console.log(`Checking for pub @ ( ${x}, ${i} )\n`);
                if(this.getTile(x, i).type == "pub") {

                    console.log(`Pub @ ( ${x}, ${i} )\n`);
                    return { "x" : x, "y" : i };
                }
            }
        }
        else {

            for(var i = yStart + 1; i < yEnd; ++i) {

                console.log(`Checking for pub @ ( ${x}, ${i} )\n`);
                if(this.getTile(x, i).type == "pub") {

                    console.log(`Pub @ ( ${x}, ${i} )\n`);
                    return { "x" : x, "y" : i };
                }
            }
        }

        return null;
    }

    checkShipPathX(xStart, xEnd, y) {
    // check from xStart coord to xEnd coord for "gaps"

        console.log(`Checking path in X axis...`);
        if(xStart > xEnd) {

            for(var i = xStart - 1; i > xEnd; --i) {

                if(!this.getTile(i, y)) {
                    console.log(`No card @ ( ${i}, ${y} )`);
                    return false;
                }
            }
        }
        else {

            for(var i = xStart + 1; i < xEnd; ++i) {

                if(!this.getTile(i, y)) {
                    console.log(`No card @ ( ${i}, ${y} )`);
                    return false;
                }
            }
        }

        return true;
    }

    // check from y1 to y2 for gaps
    checkShipPathY(yStart, yEnd, x) {
    // check from yStart coord to yEnd coord for "gaps"

        console.log(`Checking path in Y axis...`);
        if(yStart > yEnd) {

            for(var i = yStart - 1; i > yEnd; --i) {

                if(!this.getTile(x, i)) {
                    console.log(`No card @ ( ${x}, ${i} )`);
                    return false;
                }
            }
        }
        else {

            for(var i = yStart + 1; i < yEnd; ++i) {

                if(!this.getTile(x, i)) {
                    console.log(`No card @ ( ${x}, ${i} )`);
                    return false;
                }
            }
        }

        return true;
    }

    initBoard(deck) {
        // prime the board on startup, so placeCard() logic works
        // tiles locations in accordance with the spec

        this.tiles.push({ "type": deck.drawCard().type, "x":4, "y": 2 });
        this.tiles.push({ "type": deck.drawCard().type, "x":3, "y": 3 });
        this.tiles.push({ "type": deck.drawCard().type, "x":5, "y": 3 });
        this.tiles.push({ "type": deck.drawCard().type, "x":2, "y": 4 });
        this.tiles.push({ "type": deck.drawCard().type, "x":4, "y": 4 });
        this.tiles.push({ "type": deck.drawCard().type, "x":6, "y": 4 });
        this.tiles.push({ "type": deck.drawCard().type, "x":3, "y": 5 });
        this.tiles.push({ "type": deck.drawCard().type, "x":5, "y": 5 });
        this.tiles.push({ "type": deck.drawCard().type, "x":4, "y": 6 });
        
    }

    initShips() {
        // prime the ships array after initBoard()

        this.ships.length = 0;

        this.tiles.forEach(function(i) {
        
            if (i.type.substring(0, 4) === "gate") {

                var numShips = parseInt(i.type.substring(4));
                
                for(var j = 0; j < numShips; ++j) {

                    this.ships.push({ "x" : i.x, "y" : i.y, "id" : this.idCount });
                    this.idCount++;
                }

            }

        }, this);

        this.sortShips();

    }

}

module.exports = Board;