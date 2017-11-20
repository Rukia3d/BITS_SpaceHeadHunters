/*	main-menu.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

const {ipcRenderer} = require('electron');
var settings = require('./assets/javascript/settings');
var sets = new settings();

// main menu buttons
var hotseat = document.getElementById('btn-hotseat');
var network = document.getElementById('btn-network');
var settings = document.getElementById('btn-settings');
var exit = document.getElementById('btn-exit');


// menu panels
var mainMenuPanel = document.getElementById('main-menu');
var networkPanel = document.getElementById('network');
var settingsPanel = document.getElementById('settings');
var lobbyPanel = document.getElementById('lobby');
var hotseatPanel = document.getElementById('hotseat');


// settings
var settingsBack = document.getElementById('settings-back');
var musicToggle = document.getElementById('music');
var sfxToggle = document.getElementById('sfx');

// hotseat
var hotseatBack = document.getElementById('hotseat-back');
var hotseatStart = document.getElementById('hotseat-start');
var hotseatPlayers = document.getElementById('hotseat-players');

// network
var networkBack = document.getElementById('network-back');
var connect = document.getElementById('connect');
var lobbyBtn = document.getElementById('lobby-btn');

// lobby
var lobbyBack = document.getElementById('lobby-back');
var hostStart = document.getElementById('host-start');
var clientWaiting = document.getElementById('client-waiting-message');
var playerCount = document.getElementById('network-player-count')

//-----------------------------------------------------------------------------
// HOTSEAT
//-----------------------------------------------------------------------------

hotseat.onclick = function(e) 
{
	e.preventDefault();
	hotseatPanel.style.display = 'block';
	mainMenuPanel.style.display = 'none';
}

hotseatStart.onclick = function(e) 
{
	e.preventDefault();
	ipcRenderer.send('UPDATESOUND', sets.getPlayTime());
	ipcRenderer.send('HOTSEAT', parseInt(hotseatPlayers.value));
}

hotseatBack.onclick = function(e) 
{
	e.preventDefault();
	hotseatPanel.style.display = 'none';
	mainMenuPanel.style.display = 'block';
}

//-----------------------------------------------------------------------------
// NETWORK
//-----------------------------------------------------------------------------
network.onclick = function(e) 
{
	e.preventDefault();
	mainMenuPanel.style.display = 'none';
	networkPanel.style.display = 'block';
}

// NETWORK back
networkBack.onclick = function(e) 
{
	e.preventDefault();
	mainMenuPanel.style.display = 'block';
	networkPanel.style.display = 'none';
}

// NETWORK IP Address
function nextSegment(obj) 
{
	var ids = ['ip-1','ip-2','ip-3','ip-4'];
	for(var i = 0; i < ids.length; i++)
	{
		if(obj.id == ids[i])
		{
			if(obj.value.match(/\./) != null)
			{
				obj.value = obj.value.replace(".", "");
				if(i < ids.length - 1)
				{
					document.getElementById(ids[i + 1]).value = ""
					document.getElementById(ids[i + 1]).focus();
				}
			}
		}
	}
}

// NETWORK LOBBY
lobbyBtn.onclick = function(e)
{
	e.preventDefault();
	networkPanel.style.display = 'none';
	lobbyPanel.style.display = 'block';
	ipcRenderer.send('HOST', {});
}

// NETWORK connect
connect.onclick = function(e) 
{
	e.preventDefault();
	var ipAddress = document.getElementById('ip-1').value + "." + 
					document.getElementById('ip-2').value + "." +  
					document.getElementById('ip-3').value + "." + 
					document.getElementById('ip-4').value;
	ipcRenderer.send('CONNECT', ipAddress);
	networkPanel.style.display = 'none';
	lobbyPanel.style.display = 'block';
	hostStart.style.display = 'none';
	clientWaiting.style.display = 'block';
}

//-----------------------------------------------------------------------------
// LOBBY
//-----------------------------------------------------------------------------

// SETTINGS back
lobbyBack.onclick = function(e) 
{
	e.preventDefault();
	networkPanel.style.display = 'block';
	lobbyPanel.style.display = 'none';
	ipcRenderer.send('HOSTEND', {});
}

// LOBBY Host
hostStart.onclick = function(e) 
{
	var players = parseInt(playerCount.innerHTML);
	e.preventDefault();
	ipcRenderer.send('UPDATESOUND', sets.getPlayTime());
	ipcRenderer.send('HOSTSTART', players);
}

//-----------------------------------------------------------------------------
// SETTINGS
//-----------------------------------------------------------------------------
settings.onclick = function(e) 
{
	e.preventDefault();
	mainMenuPanel.style.display = 'none';
	settingsPanel.style.display = 'block';
}

// SETTINGS back
settingsBack.onclick = function(e) 
{
	e.preventDefault();
	mainMenuPanel.style.display = 'block';
	settingsPanel.style.display = 'none';
}

//-----------------------------------------------------------------------------
// EXIT
//-----------------------------------------------------------------------------
exit.onclick = function(e) 
{
	e.preventDefault();
	ipcRenderer.send('PLAYSOUND', 'bPressed');
	ipcRenderer.send('EXIT', {});
}

ipcRenderer.on('playerUpdate', (event, arg) => {
  	console.log(arg);
	playerCount.innerHTML = arg;
});

//-----------------------------------------------------------------------------
// SOUNDS
//-----------------------------------------------------------------------------
[exit, settingsBack, settings, hostStart, lobbyBack, connect, lobbyBtn,
networkBack, network, hotseatBack, hotseatStart, hotseat].forEach(function(btn){
	btn.addEventListener('mouseover', () => {
		ipcRenderer.send('PLAYSOUND', 'bHover');
	});
	btn.addEventListener('click', () => {
		ipcRenderer.send('PLAYSOUND', 'bPressed');
	});
});

musicToggle.addEventListener('click', () => {
	ipcRenderer.send('SOUNDTOGGLE', 'music');
});

sfxToggle.addEventListener('click', () => {
	ipcRenderer.send('SOUNDTOGGLE', 'sfx');
});

ipcRenderer.on('SOUNDTOGGLE', function(event, sound) {
	sets.toggleSound(sound.sound, sound.status);
});

ipcRenderer.on('PLAYSOUND', function(event, sound) {
	sets.playSound(sound);
});

ipcRenderer.on('INITSOUNDS', function(event, soundSettings) {
	sets.initSounds(soundSettings);
	if(!soundSettings.music)
	{
		musicToggle.checked = false;
	}
	if(!soundSettings.sfx)
	{
		sfxToggle.checked = false;
	}
});