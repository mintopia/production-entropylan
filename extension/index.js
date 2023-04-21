const {OBSUtility} = require('nodecg-utility-obs');
const VideoPlayer = require('./videoplayer');

module.exports = function (nodecg) {
	const obsVideo = new OBSUtility(nodecg, { "namespace": "video" });

	const settingsReplicant = nodecg.Replicant('settings');
	const videoPlayerReplicant = nodecg.Replicant('videoplayer');
	const counterReplicant = nodecg.Replicant('counter', {
		visible: false,
		number: 0,
		single: 'Item',
		plural: 'Items',
	});

	const videoPlayer = new VideoPlayer(nodecg, obsVideo, videoPlayerReplicant.value, settingsReplicant.value.videoplayer);

	videoPlayer.on('filesChanged', (videos) => {
		videoPlayer.playVideo(videos[1]);
	});
};
