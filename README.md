# BITS_SpaceHeadHunters
A study project for RMIT

## How to run
- first <b>npm install</b>
- then run server with <b>node server.js</b>
- then run client with <b>electron .</b>
- then run another client with <b>electron .</b>
- play with the two clients.


## Networking-test
Checking out socket.io networking. The game has a very quick and dirty network play mode.

We should put a server.js or similar file on a web server somewhere.
main.js will communicate with this web server, mostly to send game state objects back and forth between all clients.
The back end should also enforce player turns and not allow a player to take the turn of another. Some simple networked and player vars have been added the GameState to achieve this.
Like I said, it's quick and dirty and only supports 2 players that connect in order, and don't disconnect etc.

Needs a lot more work!
