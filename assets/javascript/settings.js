/*	settings.js
 *	RMIT CPT111 - Building IT Systems - SP3 2017
 *	Space Headhunters
 *	
 *	Proudly built by:
 *		- Inga Pflaumer      s3385215
 *		- Ashley Hepplewhite s3675296
 *		- Kevin Murphy       s3407899
 *		- Joshua Phillips    s3655612
 */

class settings {

	constructor() {

		this.sounds = {
			music: new Audio("assets/sounds/backgroundMusic.mp3"),
			bPressed : new Audio("assets/sounds/buttonPressed.mp3"),
			bHover: new Audio("assets/sounds/buttonHover.mp3"),
			positioned: new Audio("assets/sounds/positioned.mp3"),
			shipsfly: new Audio("assets/sounds/shipsfly.mp3"),
			generate: new Audio("assets/sounds/generate.mp3"),
		};

		this.sounds.music.volume = 0.05;
		this.sounds.music.autoplay = true;
		this.sounds.music.loop = true;
	}
	
	playSound(sound) {

		this.sounds[sound].currentTime = 0;
		this.sounds[sound].play();
	}

	toggleSound(sound, status) {
		if(sound == 'sfx')
		{
			this.sounds['bPressed'].muted = status;
			this.sounds['bHover'].muted = status;
			this.sounds['shipsfly'].muted = status;
			this.sounds['positioned'].muted = status;
			this.sounds['generate'].muted = status;
		}
		else
			this.sounds[sound].muted = status;
	}

	initSounds(soundSettings) {
		this.sounds['music'].muted = !soundSettings.music;
		this.sounds['bHover'].muted = !soundSettings.sfx;
		this.sounds['bPressed'].muted = !soundSettings.sfx;
		this.sounds['shipsfly'].muted = !soundSettings.sfx;
		this.sounds['positioned'].muted = !soundSettings.sfx;
		this.sounds['generate'].muted = !soundSettings.sfx;
		this.sounds['music'].currentTime = soundSettings.playTime;
	}

	disableSound() {
		this.sounds['music'].muted = true;
		this.sounds['bHover'].muted = true;
		this.sounds['bPressed'].muted = true;
		this.sounds['shipsfly'].muted = true;
		this.sounds['positioned'].muted = true;
		this.sounds['generate'].muted = true;
	}

	getPlayTime() {
		return this.sounds['music'].currentTime;
	}
}

module.exports = settings;