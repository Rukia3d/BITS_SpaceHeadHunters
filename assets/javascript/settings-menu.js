const {ipcRenderer} = require('electron');
const remote = require('electron').remote;

var sounds = {
	music: new Audio("assets/sounds/backgroundMusic.mp3"),
	bPressed : new Audio("assets/sounds/buttonPressed.mp3"),
	bHover: new Audio("assets/sounds/buttonHover.mp3")
};

sounds.music.volume = 0.05;
sounds.music.autoplay = true;
sounds.music.loop = true;

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
	ipcRenderer.send('MAINMENU', {});
};

//-----------------------------------------------------------------------------
// EXIT
//-----------------------------------------------------------------------------
exit.onclick = function(e) 
{
	e.preventDefault();
	playSound("bPressed");
	ipcRenderer.send('EXIT', {});
};

returnToGame.onclick = function(e)
{
	e.preventDefault();
	ipcRenderer.send('SETTINGSCLOSE', {});
};

//-----------------------------------------------------------------------------
// SOUNDS
//-----------------------------------------------------------------------------
[exit, settingsBack, settings, returnToGame, mainMenu].forEach(function(btn){
	btn.addEventListener('mouseover', () => console.log("boo") || playSound("bHover"));
	btn.addEventListener('click', () => console.log("boo") || playSound("bPressed"));
});

musicToggle.addEventListener('click', () => console.log("musicToggle") || toggleSound("music"));
sfxToggle.addEventListener('click', () => {
	console.log("sfxToggle1") || toggleSound("bHover"); 
	console.log("sfxToggle2") || toggleSound("bPressed");
});

function playSound(sound){
	sounds[sound].currentTime = 0;
	sounds[sound].play();
}

function toggleSound(sound) {
	if(sounds[sound].muted == true)
		sounds[sound].muted = false;
	else
		sounds[sound].muted = true;
}
