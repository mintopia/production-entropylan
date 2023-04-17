const {OBSUtility} = require('nodecg-utility-obs');
const VideoPlayer = require('./videoplayer');

module.exports = function (nodecg) {
	const obs = new OBSUtility(nodecg);

	const player = new VideoPlayer(nodecg, 'C:/Users/Jess/Videos', obs, 'Video Player');

	player.on('filesChanged', () => {
		const playlist = [
			player.videos[0],
			player.videos[1],
		];
		player.play(playlist);
		setTimeout(() => {
			player.scrubTo(0);
		}, 10000);
	});
};
