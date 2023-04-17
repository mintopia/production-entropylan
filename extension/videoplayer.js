const EventEmitter = require('events');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

class VideoPlayer extends EventEmitter {
    constructor(nodecg, directory, obs, videoSource) {
        super();

        this.nodecg = nodecg;
        this.directory = directory;
        this.obs = obs;
        this.videoSource = videoSource;
        this.videos = [];
        this.currentPlaylist = [];
        this.currentPosition = 0;

        // Watch the directory for changes
        fs.watch(this.directory, (eventType, filename) => {
            if (eventType === 'rename') {
                // Directory has changed, refresh file list
                this.refreshVideos();
            }
        });

        // NodeCG Events
        nodecg.listenFor('videoplayer.stop', () => {
            this.stop().catch((error) => {});
        });
        nodecg.listenFor('videoplayer.playpause', () => {
            this.playpause().catch((error) => {});
        });
        nodecg.listenFor('videoplayer.next', () => {
            this.next().catch((error) => {});
        });
        nodecg.listenFor('videoplayer.previous', () => {
            this.previous().catch((error) => {});
        });

        // OBS Events
        this.obs.on('MediaStarted', (event) => {
            if (event.sourceName !== this.videoSource) {
                return;
            }
            let video = null;
            if (this.currentPosition < this.currentPlaylist.length) {
                video = this.currentPlaylist[this.currentPosition];
            }
            this.emit('playing', video);
        });

        this.obs.on('MediaEnded', (event) => {
            if (event.sourceName !== this.videoSource) {
                return;
            }
            this.currentPosition++;
            if (this.currentPosition >= this.currentPlaylist.length) {
                this.currentPosition = 0;
                this.currentPlaylist = [];
            }
            this.updateState();
            this.emit('stopped');
        });

        this.obs.on('MediaStopped', (event) => {
            if (event.sourceName !== this.videoSource) {
                return;
            }
            this.currentPosition = 0;
            this.currentPlaylist = [];
            this.updateState();
            this.emit('stopped');
        });

        // Refresh file list on initialization
        this.refreshVideos();
        this.updateState();

        setInterval(() => {
            this.updateState();
        }, 5000);
    }

    async updateState() {
        try {
            const state = await this.obs.send('GetMediaState', {
                sourceName: this.videoSource,
            });
            const position = await this.obs.send('GetMediaTime', {
                sourceName: this.videoSource,
            });
            this.nodecg.sendMessage('videoplayer.state', {
                video: this.currentPlaylist[this.currentPosition] ?? null,
                playlistPosition: this.currentPosition,
                playlist: this.currentPlaylist,
                status: state.mediaState,
                currentPosition: position.timestamp / 1000,
            });
        } catch (err) {
            console.error(err);
        }
    }

    async refreshVideos() {
        try {
            const filenames = await fs.promises.readdir(this.directory);

            const oldVideos = this.videos.slice();
            const newVideos = await Promise.all(filenames
                .filter((filename) => /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(filename))
                .map((filename) => new Video(`${this.directory}/${filename}`)));

            await Promise.all(newVideos.map(video => video.updateMetadata()));

            this.videos = newVideos;

            if (this.videos.length !== oldVideos.length ||
                JSON.stringify(this.videos) !== JSON.stringify(oldVideos)) {
                // Emit 'change' event if file list has changed
                this.emit('filesChanged', this.videos);
            }
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async play(videos) {
        try {
            this.currentPlaylist = videos;
            this.currentPosition = 0;
            await this.obs.send('SetSourceSettings', {
                sourceName: this.videoSource,
                sourceSettings: {
                    playlist: videos.map((video) => {
                        return {
                            'hidden': false,
                            'selected': false,
                            'value': video.path,
                        }
                    }),
                },
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async playpause() {
        try {
            await this.obs.send('PlayPauseMedia', {
                sourceName: this.videoSource,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async stop() {
        try {
            await this.obs.send('StopMedia', {
                sourceName: this.videoSource,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async pause() {
        try {
            await this.obs.send('PlayPauseMedia', {
                sourceName: this.videoSource,
                playPause: true,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async resume() {
        try {
            await this.obs.send('PlayPauseMedia', {
                sourceName: this.videoSource,
                playPause: false,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async next() {
        try {
            if ((this.currentPosition + 1) > this.currentPlaylist.length) {
                return;
            }
            await this.obs.send('NextMedia', {
                sourceName: this.videoSource,
            });
            this.currentPosition++;
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async previous() {
        try {
            if (this.currentPosition === 0) {
                return;
            }
            await this.obs.send('PreviousMedia', {
                sourceName: this.videoSource,
            });
            this.currentPosition--;
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async restart() {
        try {
            await this.obs.send('RestartMedia', {
                sourceName: this.videoSource,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async scrubTo(time) {
        try {
            await this.obs.send('SetMediaTime', {
                sourceName: this.videoSource,
                timestamp: time,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }
}

class Video {
    constructor(path) {
        this.path = path;
        this.filename = path.split('/').pop();
        this.length = 0;
        this.filesize = 0;
        this.width = 0;
        this.height = 0;
    }

    async updateMetadata() {
        // Check if file is a video file using ffmpeg
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(this.path, (err, metadata) => {
                if (err) {
                    // Not a video file
                    resolve(false);
                    return;
                }

                this.length = metadata.format.duration;
                this.filesize = fs.statSync(this.path).size;
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                if (videoStream) {
                    this.width = videoStream.width;
                    this.height = videoStream.height;
                }
                resolve(true);
            });
        });
    }
}

module.exports = VideoPlayer;
