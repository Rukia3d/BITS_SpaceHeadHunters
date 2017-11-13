const {ipcRenderer} = require('electron');
const remote = require('electron').remote;
var settings = require('./assets/javascript/settings');
var sets = new settings();

// main menu buttons
var exit = document.getElementById('btn-exit');
var mainMenu = document.getElementById('btn-main');

// menu panels
var mainMenuPanel = document.getElementById('main-menu');

var gameOver = document.getElementById('game-over');
var scoreBox = document.getElementById('scores');

ipcRenderer.on('GAMEOVERDATA', function(event, data) {
	
	var text = "Players ";
	var winningPlayers = new Array();
	var scores = "";
	var winningScore = 0;

	for(var i = 0; i < data.players.length; ++i) {
		scores += "Player " + (i + 1) + ": " + data.players[i].score + "<br/>";
		if(data.players[i].score >= winningScore) {
			winningPlayers.push(i + 1);
			winningScore = data.players[i].score;
		}
	}
	if(winningPlayers.length == 1) {
		text = "Player " + winningPlayers[0] + " wins!";
	}
	else {
		for(var j = 0; j < winningPlayers.length; ++j) {
			if(j == winningPlayers.length - 1) {
				text +=  " " + winningPlayers[j] + " win!";
			}
			else {
				text += " " + winningPlayers[j] + " &";
			}
		}	
	}

	gameOver.innerHTML = text;
	scoreBox.innerHTML = scores;
});

mainMenu.onclick = function(e)
{
	e.preventDefault();
	ipcRenderer.send('UPDATESOUND', sets.getPlayTime());
	ipcRenderer.send('MAINMENU', {});
};

exit.onclick = function(e) 
{
	e.preventDefault();
	ipcRenderer.send('PLAYSOUND', 'bPressed');
	ipcRenderer.send('EXIT', {});
};

//-----------------------------------------------------------------------------
// SOUNDS
//-----------------------------------------------------------------------------
[exit, mainMenu].forEach(function(btn){
	btn.addEventListener('mouseover', () => {
		ipcRenderer.send('PLAYSOUND', 'bHover');
	});
	btn.addEventListener('click', () => {
		ipcRenderer.send('PLAYSOUND', 'bPressed');
	});
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