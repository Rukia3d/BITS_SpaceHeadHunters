// includes
var electron = require("electron");
var path = require("path");

var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var ipc = electron.ipcMain;

app.on("ready", function() {

	var appWindow = new BrowserWindow({
		//Window size for the app
		width: 950,
		height: 750,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		show: false
	});

	appWindow.loadURL("file://" + __dirname + "/index.html");

	appWindow.once("ready-to-show", function() {

		// do we want to run it maximized?
		// appWindow.maximize();
		appWindow.show();

	});
});

app.on("window-all-closed", app.quit);