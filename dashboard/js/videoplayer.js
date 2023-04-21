const formatTime = (duration) => {
    // Convert duration to seconds
    const seconds = Math.round(duration);

    // Calculate hours, minutes, and remaining seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // Format hours, minutes, and remaining seconds as strings
    const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
    const secondsStr = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds.toString();

    // Format time string based on whether hours are present
    let timeStr = "";
    if (hours > 0) {
        timeStr = hours.toString() + ":" + minutesStr + ":" + secondsStr;
    } else {
        timeStr = minutesStr + ":" + secondsStr;
    }

    return timeStr;
}
document.addEventListener("DOMContentLoaded", () => {
    // Get the button element
    const playpauseButton = document.getElementById("playpause");
    const stopButton = document.getElementById("stop");
    const nextButton = document.getElementById("next");
    const previousButton = document.getElementById("previous");

    const positionText = document.getElementById("position");
    const lengthText = document.getElementById("length");
    const progressbar = document.getElementById("progressbar");
    const playbackIcon = document.getElementById("playbackicon");
    const filenameText = document.getElementById("filename");
    const playpauseIcon = document.getElementById("playpauseicon");

    const replicant = nodecg.Replicant('videoplayer');

    let stateUpdatedAt = null;
    let status = null;
    let playlists = [];
    let videos = [];
    let currentVideo = null;
    let currentPlaylist = null;

    // Attach an event listener to the button
    playpauseButton.addEventListener("click", () => {
        // Do something when the button is clicked
        nodecg.sendMessage('videoplayer.playpause');
    });

    // Attach an event listener to the button
    stopButton.addEventListener("click", () => {
        nodecg.sendMessage('videoplayer.stop');
    });

    // Attach an event listener to the button
    nextButton.addEventListener("click", () => {
        nodecg.sendMessage('videoplayer.next');
    });

    // Attach an event listener to the button
    previousButton.addEventListener("click", () => {
        nodecg.sendMessage('videoplayer.previous');
    });

    replicant.on('change', (newValue, oldValue) => {
        status = newValue.status;
        videos = newValue.videos;
        playlists = newValue.playlists;
        updateControls();
        updateTimer();
    });

    const clearPlayer = () => {
        previousButton.disabled = true;
        nextButton.disabled = true;
        playpauseButton.disabled = true;
        stopButton.disabled = true;

        filenameText.innerHTML = 'Nothing Playing';
        positionText.innerHTML = '--:--';
        lengthText.innerHTML = '--:--';
        progressbar.style.width = 0;
        playbackIcon.classList.add('text-muted');
        playbackIcon.classList.remove('text-success', 'text-danger');
        filenameText.classList.add('text-muted');
    }

    const updateControls = () => {
        if (status === null || status.video === null) {
            clearPlayer();
            return;
        }

        currentVideo = videos.find((v) => {
            return v.filename === status.video;
        });
        if (!currentVideo) {
            clearPlayer();
            return;
        }

        filenameText.innerHTML = currentVideo.filename;
        playbackIcon.classList.remove('text-muted');
        filenameText.classList.remove('text-muted');
        playpauseButton.disabled = false;
        stopButton.disabled = false;

        currentPlaylist = playlists.find((p) => {
            return p.name === status.playlist;
        });
        if (currentPlaylist) {
            previousButton.disabled = status.playlistPosition <= 1;
            nextButton.disabled = status.playlistPosition >= playlist.videos.length;
        }

        switch (status.state) {
            case 'playing':
                playpauseButton.classList.add('btn-warning');
                playpauseButton.classList.remove('btn-success');
                playpauseIcon.classList.add('fa-pause');
                playpauseIcon.classList.remove('fa-play');
                playbackIcon.classList.add('fa-play-circle', 'text-success');
                playbackIcon.classList.remove('fa-pause-circle', 'fa-stop-circle', 'text-danger', 'text-warning');
                break;
            case 'paused':
                playpauseButton.classList.add('btn-success');
                playpauseButton.classList.remove('btn-warning');
                playpauseIcon.classList.add('fa-play');
                playpauseIcon.classList.remove('fa-pause');
                playbackIcon.classList.add('fa-pause-circle', 'text-warning');
                playbackIcon.classList.remove('fa-play-circle', 'fa-stop-circle', 'text-danger', 'text-success');
                break;
            case 'stopped':
                playpauseButton.classList.add('btn-success');
                playpauseButton.classList.remove('btn-warning');
                playpauseIcon.classList.add('fa-play');
                playpauseIcon.classList.remove('fa-pause');
                playbackIcon.classList.add('fa-stop-circle', 'text-danger');
                playbackIcon.classList.remove('fa-play-circle', 'fa-pause-circle', 'text-warning', 'text-success');
                break;
        }
    }

    const updateTimer = () => {
        if (!status || !currentVideo) {
            positionText.innerHTML = '--:--';
            lengthText.innerHTML = '--:--';
            progressbar.style.width = 0;
            return;
        }
        let currentPosition = status.currentPosition / 1000;
        if (status.state === 'playing') {
            const now = new Date();
            const updatedAt = new Date(status.updatedAt);
            const diff = (now.getTime() - updatedAt.getTime()) / 1000;
            currentPosition += diff;
        } else if (status.state === 'stopped') {
            currentPosition = 0;
        }

        const length = Math.ceil(currentVideo.length);
        currentPosition = Math.floor(Math.min(currentPosition, length));
        const remaining = Math.max(0, length - currentPosition);
        positionText.innerHTML = formatTime(currentPosition);
        let prefix = '-';
        if (remaining === 0) {
            prefix = '';
        }
        lengthText.innerHTML = prefix + formatTime(remaining);
        progressbar.style.width = '' + ((currentPosition / currentVideo.length) * 100) + '%';
    }

    setInterval(updateTimer, 1000);
});
