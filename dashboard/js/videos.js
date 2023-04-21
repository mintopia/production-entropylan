document.addEventListener("DOMContentLoaded", () => {
    const replicant = nodecg.Replicant('videoplayer');

    const videoList = document.getElementById('videos');

    const updateVideos = (videos) => {
        let content = '';
        for (const video of videos) {
            content += `<li data-filename="${video.filename}">${video.filename}</li>`;
        }
        videoList.innerHTML = content;

        const elements = videoList.getElementsByTagName('li');
        for (const element of elements) {
            element.addEventListener('click', (event) => {
                nodecg.sendMessage('videoplayer.playVideo', element.innerHTML);
            });
        }
    }

    replicant.on('change', (newValue, oldValue) => {
        updateVideos(newValue.videos);
    });
});
