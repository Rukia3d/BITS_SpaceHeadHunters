# BITS_SpaceHeadHunters
A study project for RMIT

## Installation
- Clone the repository.
- Install dependencies with the "npm install" command.

## Package Creation
- Use the command for your OS;
	- npm run package-win
	- npm run package-mac
	- npm run package-linux

## Network Functionality
- Network gameplay has been tested cross-platform (Windows/MacOS/Ubuntu) on LAN
- To host a network game:
	- Start an instance of Space Headhunters, click "Network Game"
	- Click "Host Game"
	- When up to between 1 and 3 other hosts have connected, click "Start Game"
- To join a network game:
	- Start an instance of Space Headhunters, click "Network Game"
	- Enter IP address of host PC and click "Connect", or
	- Leave blank and click "Connect" to connect to a host instance of Space Headhunters running on same computer (for testing)
	- Await host starting match

## Known Issues

- CSS Buttons Styling                  
	- Invision prototype the action button for each player has the same colour as the player's avatar and lure.
- "No spots for lure" edge case
	- A possible situation may occur where a player cannot place a lure. This should be very rare.
- Board doesn't scatter multiple times
	- After completing the scatter phase (during SHIPSFLEE), the board may have one or more tiles containing enough 
	  ships that require scattering as well. This is currently unsupported by the engine backend.
- Various networking polish cases
	- Networking doesn't handle client disconnects
	- Host is unable to kill a network game in an elegant way
	- Board and button interactivity isn't locked down for players outside their turn
	- No ability to inform a client that a host doesn't exist at a specified IP