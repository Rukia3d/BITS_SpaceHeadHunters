class Board {


    constructor(deck) {

        this.tiles = new Array();
        this.ships = new Array();
        this.idCount = 0;
        this.initBoard(deck);
        this.initShips();

    }
    
    /* PUBLIC INTERFACE */
    placeCard(crd, x, y) {

        // if tile exists, return false
        if (this.getTile(x, y) !== null)
            return false;

        for (let j = 0; j < this.tiles.length; ++j) {

            if((Math.abs(this.tiles[j].x - x) === 1 && this.tiles[j].y === y) ||
               (Math.abs(this.tiles[j].y - y) === 1 && this.tiles[j].x === x)) {
                
                    this.tiles.push({"type": crd, "x": x, "y": y});
                    this.placeShip(x, y);

                    return true;

                }

        }

        return false;
    }
    
    placeLure(player, x, y) {
    
        // must have a card at tile
        // card must not be pub
        // card must have no ships
        if (this.getTile(x, y) && this.getTile(x, y).type !== "pub" &&
            this.numShipsOnTile(x, y) === 0) { 

            player.lure = {"x": x, "y": y};
            return true;

        }

        return false;
    
    }
    
    placeShip(x, y) {
        
        this.tiles.forEach(function(i) {

            if (i.x === x && i.y === y) {
                
                if (i.type.substring(0, 4) === "gate") {
        
                    var numShips = parseInt(i.type.substring(4));
        
                    for(var j = 0; j < numShips; ++j) {
        
                        this.ships.push({ "x" : i.x, "y" : i.y, "id" : this.idCount });
                        this.idCount++;
                    }
        
                }

            }
    
        }, this);
        this.sortShips();        
    }

    // animations require the pub ships to be first ships to be moved.
    // ships can move both from and to a pub tile during the animation phase.
    // Because ship position on tile is determined by the new gamestate object
    // if the pub ships move last - then any ships going TO the pub tile will
    // move to position 0, and position 1 etc, temporarily overlaying
    // the ships that will shortly move FROM the pub tile
    // Quickest solution is to always move ships FROM the pub tile first
    // and the quickest way to do that is to ensure the sort order of the array so that
    // the pub ships appear as the first elements.

    sortShips() {

        var otherShips = new Array();
        var pubShips = new Array();

        for(var i = 0; i < this.ships.length; ++i)
        {
            var tile = this.getTile(this.ships[i].x, this.ships[i].y);

            if(tile.type == 'pub') {
                pubShips.push(this.ships[i]);
            }
            else {
                otherShips.push(this.ships[i]);
            }
        }

        this.ships = pubShips.concat(otherShips);
    }

    getTiles() {
        return this.tiles;
    }

    getTile(x, y) {

        for (let j = 0; j < this.tiles.length; ++j) {

            if (this.tiles[j].x === x && this.tiles[j].y === y) {
                return this.tiles[j];
            }

        }
        
        return null;

    }

    /* PRIVATE MEMBERS */
    // obvious
    numShipsOnTile(x, y) {
    
        var shipCount = 0;

        this.ships.forEach(function(i) {
        
            if (i.x === x && i.y === y)
                shipCount++;

        }, this);

        return shipCount;

    }

    getShipIdsOnTile(x, y) {

        var ids = new Array();

        this.ships.forEach(function(i) {
        
            if (i.x === x && i.y === y)
                ids.push(i.id);

        }, this);

        return ids;
    }

    scatter() {
        
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

    // takes ships off the tile
    // TODO rewrote this function, requires testing...
    removeShipsFromTile(x, y) {
            
        console.log(`removing all ships from ( ${x}, ${y} )`);

        let newShips = new Array();

        this.ships.forEach(function(i) {
            
            if (i.x == x && i.y == y)
                ;// continue
            else
                newShips.push(i);

        }, this);

        this.ships = newShips;
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

        for(var k = 0; k < shipGroups.length; ++k) {

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

                    if(this.getTile(axisLures[t].x, axisLures[t].y) == "cruiser") {

                        cruiserLures.push({ "axis" : axisLures[t].axis, "x" : axisLures[t].x, "y" : axisLures[t].y });
                    }
                }

                console.log(`Cruiser Lures\n----------\n`);
                for(var ii = 0; ii < cruiserLures.length; ++ii) {
                    
                    console.log(`Lure ${ii}: ${cruiserLures[ii].axis}-axis ( ${cruiserLures[ii].x}, ${cruiserLures[ii].y} )\n`);
                }

                // if we have cruiser lures
                if(cruiserLures.length > 0 && shipGroups[k].num % cruiserLures.length == 0) {

                    numShipsPerLure = shipGroups[k].num / cruiserLures.length;

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
                else if(cruiserLures.length == 0 && shipGroups[k].num % axisLures.length == 0) {

                    numShipsPerLure = shipGroups[k].num / axisLures.length;

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
                    newShipGroups.push({ "num" : shipGroups[k].num, "x" : shipGroups[k].x,  "y" : shipGroups[k].y, "ids" : shipGroups[k].ids });
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

    // check from x1 to x2 for pubs
    getPubInPathX(xStart, xEnd, y) {
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

    // check from y1 to y2 for pubs
    getPubInPathY(yStart, yEnd, x) {
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

    // check from x1 to x2 for gaps
    checkShipPathX(xStart, xEnd, y) {
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

        // prime the board, so placeCard() logic works

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