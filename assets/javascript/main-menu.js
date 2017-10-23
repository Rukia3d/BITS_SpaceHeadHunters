const {ipcRenderer} = require('electron');

// main menu buttons
var hotseat = document.getElementById('btn-hotseat');
var network = document.getElementById('btn-network');
var settings = document.getElementById('btn-settings');
var exit = document.getElementById('btn-exit');


// menu panels
var mainMenuPanel = document.getElementById('main-menu');
var networkPanel = document.getElementById('network');
var settingsPanel = document.getElementById('settings');

// settings
var settingsBack = document.getElementById('settings-back');

// network
var networkBack = document.getElementById('network-back');
var host = document.getElementById('host');
var connect = document.getElementById('connect');

//-----------------------------------------------------------------------------
// HOTSEAT
//-----------------------------------------------------------------------------
hotseat.onclick = function(e) 
{
	e.preventDefault();
	sendEvent('HOTSEAT', {});
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

// NETWORK Host
host.onclick = function(e) 
{
	e.preventDefault();
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
	ipcRenderer.send('EXIT', {});
}

