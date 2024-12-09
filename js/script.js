let mp3Files = [];
let currentSongIndex = 0;
let isPlaying = false; // Variable to track play/pause state
let duration = 0; // Total duration of the current song
let currentTimeInterval; // To store the interval for updating current time

const repoOwner = "codekripa";
let repoName = "NewSongs";

// Get the audio element
const audioElement = document.getElementById("audioElement");

async function getMP3FilesRecursive(path = "") {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
  try {
    const response = await fetch(url);
    const files = await response.json();
    let mp3Files = [];
    for (let file of files) {
      if (file.type === "file" && file.name.endsWith(".mp3")) {
        mp3Files.push({
          name: file.name,
          url: `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${file.path}`,
        });
      } else if (file.type === "dir") {
        const subDirectoryMP3s = await getMP3FilesRecursive(file.path);
        mp3Files = mp3Files.concat(subDirectoryMP3s);
      }
    }
    return mp3Files;
  } catch (error) {
    console.error("Error fetching file list:", error);
  }
}

async function displayMP3Urls() {
  mp3Files = await getMP3FilesRecursive();
  if (mp3Files.length > 0) {
    playSpecificSong(currentSongIndex);
    const songListContainer = document.getElementById("songList");
    songListContainer.innerHTML = '';
    mp3Files.forEach((song, index) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<span class="song-name">${song.name}</span>
                            <button class="play-button" onclick="playSpecificSong(${index})">Play</button>`;
      songListContainer.appendChild(listItem);
    });
  } else {
    console.error("No MP3 files found.");
  }
}

function updateMediaSessionMetadata() {
  if ("mediaSession" in navigator) {
    const currentSong = mp3Files[currentSongIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name,
      artist: "Unknown Artist",
      album: "One Player",
      artwork: [
        {
          src: "./asset/player.jpeg",
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("previoustrack", prevSong);
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);
  }
}

function playSpecificSong(index) {
  currentSongIndex = index;
  const song = mp3Files[currentSongIndex];
  audioElement.src = song.url;
  audioElement.load();

  audioElement.onplay = () => {
    isPlaying = true;
    updatePlayPauseButton();
    currentTimeInterval = setInterval(() => {
      updateSeekBar();
      updateCurrentTime(audioElement.currentTime);
    }, 1000);
  };

  audioElement.onended = nextSong;
  audioElement.onseeked = updateSeekBar;
  audioElement.onloadmetadata = () => {
    duration = audioElement.duration;
    if (!isNaN(duration) && duration > 0) {
      updateSeekBar();
      updateTotalTime();
    }
  };

  updateMediaSessionMetadata();
  audioElement.play();
}

function togglePlayPause() {
  if (isPlaying) {
    audioElement.pause();
    clearInterval(currentTimeInterval);
    isPlaying = false;
  } else {
    audioElement.play();
    isPlaying = true;
    currentTimeInterval = setInterval(() => {
      updateSeekBar();
      updateCurrentTime(audioElement.currentTime);
    }, 1000);
  }
  updatePlayPauseButton();
}

function updatePlayPauseButton() {
  const playPauseButton = document.getElementById("playPauseButton");
  playPauseButton.innerHTML = isPlaying ? "&#10074;&#10074;" : "&#9654;";
}

function updateSeekBar() {
  if (!isNaN(duration)) {
    const seekBar = document.getElementById("seek-bar");
    seekBar.value = (audioElement.currentTime / duration) * 100;
    seekBar.max = 100;
  }
}

function updateCurrentTime(currentTime) {
  document.getElementById("current-time").textContent = formatTime(currentTime);
}

function updateTotalTime() {
  const totalTimeDisplay = document.getElementById("total-time");
  totalTimeDisplay.textContent = !isNaN(duration) ? formatTime(duration) : "00:00";
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

function seekAudio(event) {
  const seekBar = document.getElementById("seek-bar");
  const seekPosition = (event.target.value / 100) * duration;
  audioElement.currentTime = seekPosition;
}

function nextSong() {
  currentSongIndex = (currentSongIndex + 1) % mp3Files.length;
  playSpecificSong(currentSongIndex);
}

function prevSong() {
  currentSongIndex = (currentSongIndex - 1 + mp3Files.length) % mp3Files.length;
  playSpecificSong(currentSongIndex);
}

function setSource(repo) {
  repoName = repo;
  displayMP3Urls();
}

displayMP3Urls();
