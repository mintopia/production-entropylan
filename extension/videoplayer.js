const EventEmitter = require('events');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

class VideoPlayer extends EventEmitter {
    constructor(nodecg, obs, replicant, settings) {
        super();

        this.nodecg = nodecg;
        this.obs = obs;
        this.replicant = replicant;
        this.settings = settings;

        // Watch the directory for changes
        fs.watch(this.settings.localPath, (eventType, filename) => {
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
        nodecg.listenFor('videoplayer.playVideo', (filename) => {
            const video = this.getVideo(filename);
            if (video) {
                this.playVideo(video);
            }
        })

        // OBS Events
        this.obs.on('MediaStarted', (event) => {
            if (event.sourceName !== this.settings.sourceName) {
                return;
            }
            this.emit('playing', this.getCurrentVideo());
        });

        this.obs.on('MediaEnded', (event) => {
            if (event.sourceName !== this.settings.sourceName) {
                return;
            }
            const playlist = this.getCurrentPlaylist();
            if (playlist) {
                // We are playing a playlist

                // If at the end of the list - reset to the beginning
                if (this.replicant.status.playlistPosition + 1 > playlist.videos.length) {
                    this.replicant.status.playlistPosition = 1;
                } else {
                    this.replicant.status.playlistPosition++;
                }
                this.replicant.status.video = this.getVideo(playlist.videos[this.replicant.status.playlistPosition]);
            }
            this.updateState();
            this.emit('stopped');
        });

        // Refresh file list on initialization
        this.refreshVideos();
        this.updateState();

        setInterval(() => {
            this.updateState();
        }, 10000);
    }

    getCurrentVideo() {
        return this.getVideo(this.replicant.status.video);
    }

    getVideo(name) {
        return this.replicant.videos.find((video) => {
            return video.filename === name;
        });
    }

    getCurrentPlaylist() {
        return this.getPlaylist(this.replicant.status.playlist);
    }

    getPlaylist(name) {
        return this.replicant.playlists.find((playlist) => {
            return playlist.name === name;
        });
    }

    async updateState() {
        try {
            const state = await this.obs.send('GetMediaState', {
                sourceName: this.settings.sourceName,
            });
            const currentPosition = await this.obs.send('GetMediaTime', {
                sourceName: this.settings.sourceName,
            });
            if (state.mediaState === 'ended') {
                this.replicant.status.state = 'stopped';
            } else {
                this.replicant.status.state = state.mediaState;
            }
            this.replicant.status.currentPosition = currentPosition.timestamp;
            this.replicant.status.updatedAt = new Date();

        } catch (err) {
            console.error(err);
        }
    }

    updatePlaylists()
    {
        // TODO: Iterate each playlist and remove any videos that have been removed
    }

    async refreshVideos() {
        try {
            const filenames = await fs.promises.readdir(this.settings.localPath);

            const oldVideos = this.replicant.videos.slice();
            const newVideos = await Promise.all(filenames
                .filter((filename) => /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(filename))
                .map((filename) => new Video(this.settings.localPath, this.settings.remotePath, filename)));

            await Promise.all(newVideos.map(video => video.updateMetadata()));

            this.replicant.videos = newVideos;

            if (newVideos.length !== oldVideos.length ||
                JSON.stringify(newVideos.length) !== JSON.stringify(oldVideos)) {
                // Emit 'change' event if file list has changed
                this.emit('filesChanged', newVideos);
                this.updatePlaylists();
            }
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async playVideo(video) {
        try {
            await this.obs.send('SetSourceSettings', {
                sourceName: this.settings.sourceName,
                sourceSettings: {
                    playlist: [{
                        'hidden': false,
                        'selected': false,
                        'value': video.remotePath,
                    }]
                },
            });

            this.replicant.status = {
                state: 'playing',
                video: video.filename,
                playlist: null,
                currentPosition: 0,
                playlistPosition: null,
                updatedAt: new Date()
            };

            setTimeout(() => {
                this.updateState();
            }, 50);
        } catch (err) {
            console.error(err);
        }
    }

    async playPlaylist(playlist, position = 1) {
        try {
            let videos = [];
            for (const name of playlist.videos) {
                const video = this.getVideo(name);
                if (video) {
                    videos.push(video);
                }
            }

            await this.obs.send('SetSourceSettings', {
                sourceName: this.settings.sourceName,
                sourceSettings: {
                    playlist: videos.map((video) => {
                        return {
                            'hidden': false,
                            'selected': video === playlist.videos[position - 1],
                            'value': video.remotePath,
                        }
                    }),
                },
            });


            this.replicant.status = {
                state: 'playing',
                video: playlist.videos[position - 1],
                playlist: playlist,
                currentPosition: 0,
                playlistPosition: position,
                updatedAt: new Date()
            };

            setTimeout(() => {
                this.updateState();
            }, 50);
        } catch (err) {
            console.error(err);
        }
    }

    async playpause() {
        try {
            // Get current status
            const status = await this.obs.send('GetMediaState', {
                sourceName: this.settings.sourceName,
            });
            if (status === 'stopped') {
                await this.play();
            } else {
                await this.obs.send('PlayPauseMedia', {
                    sourceName: this.settings.sourceName,
                });
                await this.updateState();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async stop() {
        try {
            await this.obs.send('StopMedia', {
                sourceName: this.settings.sourceName,
            });
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async next() {
        try {
            const playlist = this.getCurrentPlaylist();
            if (playlist === null) {
                return;
            }

            if (this.replicant.status.playlistPosition >= playlist.videos.length) {
                return;
            }
            await this.obs.send('NextMedia', {
                sourceName: this.settings.sourceName,
            });
            this.replicant.status.currentPosition++;
            this.replicant.status.video = this.getVideo(playlist.videos[this.replicant.status.currentPosition - 1]);
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }

    async previous() {
        try {
            if (this.getCurrentPlaylist() === null) {
                return;
            }

            if (this.replicant.status.playlistPosition === 1) {
                return;
            }

            await this.obs.send('PreviousMedia', {
                sourceName: this.settings.sourceName,
            });
            this.replicant.status.playlistPosition--;
            this.replicant.status.video = this.getVideo(playlist.videos[this.replicant.status.currentPosition - 1]);
            await this.updateState();
        } catch (err) {
            console.error(err);
        }
    }
}

class Video {
    constructor(localPath, remotePath, filename) {
        this.localPath = `${localPath}/${filename}`;
        this.remotePath = `${localPath}/${filename}`
        this.filename = filename;
        this.length = 0;
        this.filesize = 0;
        this.width = 0;
        this.height = 0;
    }

    async updateMetadata() {
        // Check if file is a video file using ffmpeg
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(this.localPath, (err, metadata) => {
                if (err) {
                    // Not a video file
                    resolve(false);
                    return;
                }

                this.length = metadata.format.duration;
                this.filesize = fs.statSync(this.localPath).size;
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

class Playlist {
    constructor(name, videos) {
        this.name = name;
        this.videos = videos;
    }
}

module.exports = VideoPlayer;
