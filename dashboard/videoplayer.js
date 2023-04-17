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

    let stateUpdatedAt = null;
    let latestState = null;

    // Attach an event listener to the button
    playpauseButton.addEventListener("click", function() {
        // Do something when the button is clicked
        nodecg.sendMessage('videoplayer.playpause');
    });

    // Attach an event listener to the button
    stopButton.addEventListener("click", function() {
        nodecg.sendMessage('videoplayer.stop');
    });

    // Attach an event listener to the button
    nextButton.addEventListener("click", function() {
        nodecg.sendMessage('videoplayer.next');
    });

    // Attach an event listener to the button
    previousButton.addEventListener("click", function() {
        nodecg.sendMessage('videoplayer.previous');
    });

    setInterval(() => {
        if (latestState === null || stateUpdatedAt === null || latestState.video === null) {
            return;
        }

        let currentPosition = latestState.currentPosition;
        if (latestState.status === 'playing') {
            const now = new Date();
            const diff = (now.getTime() - stateUpdatedAt.getTime()) / 1000;
            currentPosition += diff;
        }

        const length = Math.ceil(latestState.video.length);
        currentPosition = Math.floor(Math.min(currentPosition, length));
        const remaining = Math.max(0, length - currentPosition);
        positionText.innerHTML = formatTime(currentPosition);
        lengthText.innerHTML = '-' + formatTime(remaining);
        progressbar.style.width = '' + ((currentPosition / latestState.video.length) * 100) + '%';

    }, 1000);

    const updatePlayer = (playerState) => {
        latestState = playerState;
        stateUpdatedAt = new Date();

        // Default state
        if (playerState === null || playerState.video === null) {
            previousButton.disabled = true;
            nextButton.disabled = true;
            playpauseButton.disabled = true;
            stopButton.disabled = true;

            positionText.innerHTML = '--:--';
            lengthText.innerHTML = '--:--';
            filenameText.innerHTML = 'Nothing Playing';
            progressbar.style.width = 0;
            playbackIcon.classList.add('text-muted');
            playbackIcon.classList.remove('text-success', 'text-danger');
            filenameText.classList.add('text-muted');

            return;
        }

        // If we have a current video, update relevant state
        if (playerState.video !== null) {
            filenameText.innerHTML = playerState.video.filename;
            playbackIcon.classList.remove('text-muted');
            filenameText.classList.remove('text-muted');
            playpauseButton.setAttribute('disabled', false);
            positionText.innerHTML = formatTime(playerState.currentPosition);
        }

        // Next/Previous based on playlist
        if (playerState.playlistPosition > 0) {
            previousButton.disabled = false;
        } else {
            previousButton.disabled = true;
        }
        if ((playerState.playlistPosition + 1) < playerState.playlist.length) {
            nextButton.disabled = false;
        } else {
            nextButton.disabled = true;
        }

        // Playback state
        if (playerState.status === 'playing') {
            stopButton.disabled = false;
            playpauseButton.classList.add('btn-warning');
            playpauseButton.classList.remove('btn-success');
            playpauseIcon.classList.add('fa-pause');
            playpauseIcon.classList.remove('fa-play');
            playpauseButton.disabled = false;
            playbackIcon.classList.add('fa-play-circle', 'text-success');
            playbackIcon.classList.remove('fa-pause-circle', 'fa-stop-circle', 'text-danger', 'text-warning');

        } else if (playerState.status === 'stopped') {
            stopButton.disabled = true;
            playpauseIcon.classList.add('fa-play');
            playpauseIcon.classList.remove('fa-pause');
            playpauseButton.classList.add('btn-success');
            playpauseButton.classList.remove('btn-warning');
            playbackIcon.classList.add('fa-stop-circle', 'text-danger');
            playbackIcon.classList.remove('fa-pause-circle', 'fa-play-circle', 'text-success', 'text-warning');

        } else if (playerState.status === 'paused') {
            stopButton.disabled = false;
            playpauseButton.disabled = false;
            playpauseButton.classList.add('btn-success');
            playpauseButton.classList.remove('btn-warning');
            playpauseIcon.classList.add('fa-play');
            playpauseIcon.classList.remove('fa-pause');
            playbackIcon.classList.add('fa-pause-circle', 'text-warning');
            playbackIcon.classList.remove('fa-play-circle', 'fa-stop-circle', 'text-danger', 'text-success');


        }
    };

    nodecg.listenFor('videoplayer.state', (state) => {
        updatePlayer(state);
    });
});
