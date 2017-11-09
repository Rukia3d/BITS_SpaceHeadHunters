class settings {

	constructor() {

		this.sounds = {
			music: new Audio("assets/sounds/backgroundMusic.mp3"),
			bPressed : new Audio("assets/sounds/buttonPressed.mp3"),
			bHover: new Audio("assets/sounds/buttonHover.mp3")
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
		}
		else
			this.sounds[sound].muted = status;
	}

	initSounds(soundSettings) {
		console.log('music is muted is ...' + !soundSettings.music)
		this.sounds['music'].muted = !soundSettings.music;
		this.sounds['bHover'].muted = !soundSettings.sfx;
		this.sounds['bPressed'].muted = !soundSettings.sfx;
	}
}

module.exports = settings;