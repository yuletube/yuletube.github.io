// Please excuse the horrible code below.  Consider it a quick proof of concept.

var localStorageName = "yuletube_2";
var logs = [
        { id: "Sy1Qlxgo2ek", name: "Christmas Room 1" },
        { id: "nk6cnaLQPnM", name: "Christmas Room 2" },
        { id: "9LssTi4X8jY", name: "Yule Log 1" },
        { id: "IExpnvKDnnU", name: "Yule Log 2" },
        { id: "97g1krDkzNI", name: "Yule Log 3" }
];

var library = [
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "It's Beginning To Look A Lot Like Christmas", start: 6, stop: 209 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Santa Claus Is Coming To Town", start: 210, stop: 380 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "All I Want For Christmas", start: 383, stop: 552 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Holly Jolly Christmas", start: 555, stop: 673 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Have Yourself a Merry Little Christmas", start: 685, stop: 906 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Christmas (Baby Please Come Home)", start: 908, stop: 1095 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Silent Night", start: 1097, stop: 1322 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Cold December Night", start: 1326, stop: 1522 },
    { id: "pjNnzgLpo4s", artist: "Michael Buble", track: "Ava Maria", start: 1525, stop: 1764 }
];

var recentTracks = [];
var recentTrackLimit = 20;

var settings = {};

var yt_ready = false;
var page_ready = false;

var fire_player = null;
var music_player = null;

var now_playing = null;

function init() {
    if (window && window.localStorage && JSON) {

        if (window.localStorage[localStorageName]) {
            settings = JSON.parse(window.localStorage[localStorageName]);
        }
        else {
            settings.log = getRandomLog();
            settings.logMuted = false;
            settings.musicPlaying = true;
        }

        storeSettings();

        if (library.length < 100) {
            recentTrackLimit = Math.floor(library.length * 0.2);
            if (recentTrackLimit < 3)
            {
                recentTrackLimit = 3;
            }
        }

        page_ready = true;
        update();

        setButtonStates();

        if (settings.musicPlaying) {
            nextTrack();
        }

        var logOptHtml = "";
        for (var i = 0; i < logs.length; i++) {
            logOptHtml += "<li onclick=\"set_log("+ i +")\">"+ logs[i].name+"</li>";
        }

        document.getElementById("log_options").innerHTML = logOptHtml;
    }
    else {
        alert('Sorry, your browser is not supported by YuleTube');
    }
};

function onYouTubeIframeAPIReady() {
    yt_ready = true;
    update();
    if (settings.musicPlaying) {
        nextTrack();
    }
}

function firePlayerReady(event) {
    if (settings.logMuted) {
        event.target.mute();
    }
    event.target.playVideo();
}

function fireStateChange(event) {
    if (event.data != YT.PlayerState.BUFFERING && event.data != YT.PlayerState.PLAYING) {
        event.target.playVideo();
    }
}

function update() {
    if (yt_ready && page_ready) {
        if (fire_player == null) {
            fire_player = new YT.Player('fire_player', {
                height: "100%",
                width: "100%",
                videoId: logs[settings.log].id,
                events: {
                    "onReady": firePlayerReady,
                    "onStateChange": fireStateChange
                },
                playerVars: {
                    controls: "0",
                    iv_load_policy: "3",
                    showinfo: "0"
                }
            });
        }
        else {
            fire_player.cueVideoById({ videoId: logs[settings.log].id });
        }
    }
}

function nextTrack() {
    if (yt_ready && page_ready) {
        var next = -1;
        var attempts = 0;

        while (next == -1 && attempts < 5)
        {
            var random_track = Math.floor(Math.random() * library.length);
            var usedRecently = false;
            for (var i = 0; i < recentTracks.length; i++)
            {
                if (random_track == recentTracks[i]) {
                    usedRecently = true;
                }
            }

            if (!usedRecently) {
                next = random_track;
            }

            attempts++;
        }


        if (next == -1)
        {
            // any song will do.
            Math.floor(Math.random() * library.length);
        }

        now_playing = library[next];
        recentTracks.push(next);
        if (recentTracks.length > recentTrackLimit) {
            recentTracks = recentTracks.splice(1, recentTrackLimit + 1);
        }


        if (music_player == null) {
           
            music_player = new YT.Player('music_player', {
                height: "1",
                width: "1",
                events: {
                    "onReady": musicPlayerReady,
                    "onStateChange": musicStateChange
                },
                playerVars: {
                    controls: "0"
                }
            });

        }
        else {
            cue_now_playing();
        }

        settings.musicPlaying = true;
        storeSettings();
        setButtonStates();
    }
};

function cue_now_playing() {
    if (!now_playing.start && !now_playing.stop) {
        music_player.cueVideoById({ videoId: now_playing.id });
    }
    else if (now_playing.start && now_playing.stop) {
        music_player.cueVideoById({ videoId: now_playing.id, startSeconds: now_playing.start, endSeconds: now_playing.end });
    }
    else if (now_playing.start) {
        music_player.cueVideoById({ videoId: now_playing.id, startSeconds: now_playing.start });
    }
    else {
        music_player.cueVideoById({ videoId: now_playing.id, endSeconds: now_playing.stop });
    }
    music_player.playVideo();

    document.getElementById("artist").innerText = now_playing.artist;
    document.getElementById("track").innerText = now_playing.track;
    document.getElementById("now_playing").style.display = "block";
    document.getElementById("now_playing").setAttribute("href", "//www.youtube.com/watch?v=" + now_playing.id);
}

function musicPlayerReady(event) {
    cue_now_playing();
}

function musicStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
       nextTrack();
    }
};

function getRandomLog() {
    return Math.floor(Math.random() * logs.length);
};

function storeSettings() {
    window.localStorage[localStorageName] = JSON.stringify(settings);
};

function toggleLogMute() {
    settings.logMuted = !settings.logMuted;

    if (settings.logMuted) {
        fire_player.mute();
    }
    else {
        fire_player.unMute();
    }

    setButtonStates();
    storeSettings();
};

function toggleMusic() {
    settings.musicPlaying = !settings.musicPlaying;

    if (settings.musicPlaying) {
        nextTrack();
    }
    else {
        music_player.pauseVideo();
    }

    setButtonStates();
    storeSettings();
};

function setButtonStates() {
    document.getElementById("music_stop").childNodes[0].className = "fa " + (settings.musicPlaying ? "fa-stop" : "fa-play");
    document.getElementById("log_mute").childNodes[0].className = "fa " + (settings.logMuted ? "fa-volume-off" : "fa-volume-up");
}

function set_log(logno) {
    settings.log = logno;
    update();
}

function show_settings() {
    document.getElementById("settings").style.display = "block";
}

function hide_settings() {
    document.getElementById("settings").style.display = "none";
}