/*	settings-menu.js
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
const remote = require('electron').remote;
var settings = require('./assets/javascript/settings');
var sets = new settings();

// main menu buttons
var settings = document.getElementById('btn-settings');
var exit = document.getElementById('btn-exit');
var returnToGame = document.getElementById('btn-return');
var mainMenu = document.getElementById('btn-main');

// menu panels
var mainMenuPanel = document.getElementById('main-menu');
var settingsPanel = document.getElementById('settings');

// settings
var settingsBack = document.getElementById('settings-back');
var musicToggle = document.getElementById('music');
var sfxToggle = document.getElementById('sfx');

//-----------------------------------------------------------------------------
// SETTINGS
//-----------------------------------------------------------------------------
settings.onclick = function(e) 
{
	e.preventDefault();
	mainMenuPanel.style.display = 'none';
	settingsPanel.style.display = 'block';
};

// SETTINGS back
settingsBack.onclick = function(e) 
{
	e.preventDefault();
	mainMenuPanel.style.display = 'block';
	settingsPanel.style.display = 'none';
};

mainMenu.onclick = function(e)
{
	e.preventDefault();
	ipcRenderer.send('UPDATESOUND', sets.getPlayTime());
	ipcRenderer.send('MAINMENU', {});
};

//-----------------------------------------------------------------------------
// EXIT
//-----------------------------------------------------------------------------
exit.onclick = function(e) 
{
	e.preventDefault();
	ipcRenderer.send('PLAYSOUND', 'bPressed');
	ipcRenderer.send('EXIT', {});
};

returnToGame.onclick = function(e)
{
	e.preventDefault();
	ipcRenderer.send('UPDATESOUND', sets.getPlayTime());
	ipcRenderer.send('SETTINGSCLOSE', {});
};

//-----------------------------------------------------------------------------
// SOUNDS
//-----------------------------------------------------------------------------
[exit, settingsBack, settings, returnToGame, mainMenu].forEach(function(btn){
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