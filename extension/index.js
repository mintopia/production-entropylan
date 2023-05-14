const {OBSUtility} = require('nodecg-utility-obs');
const VideoPlayer = require('./videoplayer');

module.exports = function (nodecg) {
	const obsVideo = new OBSUtility(nodecg, { "namespace": "video" });

	const settingsReplicant = nodecg.Replicant('settings');
	const videoPlayerReplicant = nodecg.Replicant('videoplayer');

	const videoPlayer = new VideoPlayer(nodecg, obsVideo, videoPlayerReplicant.value, settingsReplicant.value.videoplayer);

	videoPlayer.on('filesChanged', (videos) => {
		videoPlayer.playVideo(videos[1]);
	});

};
