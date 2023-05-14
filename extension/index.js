const {OBSUtility} = require('nodecg-utility-obs');
const VideoPlayer = require('./videoplayer');

module.exports = function (nodecg) {
	const obsVideo = new OBSUtility(nodecg, { "namespace": "video" });

	const settingsReplicant = nodecg.Replicant('settings');
	const videoPlayerReplicant = nodecg.Replicant('videoplayer');

	const carouselReplicant = nodecg.Replicant('carousel');
	const lowerthirdReplicant = nodecg.Replicant('lowerthird');

	const videoPlayer = new VideoPlayer(nodecg, obsVideo, videoPlayerReplicant.value, settingsReplicant.value.videoplayer);

	videoPlayer.on('filesChanged', (videos) => {
		videoPlayer.playVideo(videos[1]);
	});

	lowerthirdReplicant.on('change', (newValue, oldValue) => {
		if (newValue === undefined) {
			return;
		}
		if (newValue.visible === true && (oldValue === undefined || oldValue.visible === false)) {
			carouselReplicant.value.visible = false;
		}
	});

	carouselReplicant.on('change', (newValue, oldValue) => {
		if (newValue === undefined) {
			return;
		}
		if (newValue.visible === true && (oldValue === undefined || oldValue.visible === false)) {
			lowerthirdReplicant.value.visible = false;
		}
	});

};
