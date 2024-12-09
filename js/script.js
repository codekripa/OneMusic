let mp3Files = [];
let currentSongIndex = 0;
let isPlaying = false; // Variable to track play/pause state
let duration = 0; // Total duration of the current song
let currentTimeInterval; // To store the interval for updating current time

const repoOwner = "codekripa";
let repoName = "NewSongs";

// Create an audio element globally
let audioElement = new Audio();
audioElement.preload = "auto";

// Fetch MP3 files from GitHub repository
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
    // Play the first song
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

  // Load the song URL into the audio element
  audioElement.src = song.url;
  audioElement.load(); // Preload the audio file

  // Set up event listeners for the audio element
  audioElement.onplay = () => {
    // Start updating the current time continuously when the audio starts
    isPlaying = true; // Update state to playing
    updatePlayPauseButton(); // Update button icon

    // Start the interval to update seek bar and current time every second
    currentTimeInterval = setInterval(() => {
      updateSeekBar();
      updateCurrentTime(audioElement.currentTime);
    }, 1000); // Update every 1 second
  };

  audioElement.onended = nextSong; // Move to the next song when this one ends
  audioElement.onseeked = updateSeekBar; // Update seek bar as the song seeks
  
  // Update the total time when song metadata is loaded
  audioElement.onloadmetadata = () => {
    duration = audioElement.duration; // Set the duration when metadata is loaded
    if (!isNaN(duration) && duration > 0) {

      updateSeekBar(); // Update the seek bar
      updateTotalTime(); // Update the total time display
    }

    updateMediaSessionMetadata();
  };

  // Start playing the song immediately
  audioElement.play(); 
}

function togglePlayPause() {
  if (isPlaying) {
    audioElement.pause();
    clearInterval(currentTimeInterval); // Stop updating the current time
    isPlaying = false; // Update state to paused
  } else {
    audioElement.play();
    isPlaying = true; // Update state to playing

    // Start updating the current time again
    currentTimeInterval = setInterval(() => {
      updateSeekBar();
      updateCurrentTime(audioElement.currentTime);
    }, 1000);
  }

  updatePlayPauseButton(); // Update button icon
}

function updatePlayPauseButton() {
  const playPauseButton = document.getElementById("playPauseButton");
  if (isPlaying) {
    playPauseButton.innerHTML = "&#10074;&#10074;"; // Pause icon
  } else {
    playPauseButton.innerHTML = "&#9654;"; // Play icon
  }
}

function updateSeekBar() {
  if (audioElement && !isNaN(duration)) {
    const currentTime = audioElement.currentTime; // Get current time
    const seekBar = document.getElementById("seek-bar");
    
    // Update the seek bar position
    seekBar.value = (currentTime / duration) * 100; // Set seek bar value as percentage
    
    // Ensure seek bar max value is set correctly
    seekBar.max = 100;
  }
}

function updateCurrentTime(currentTime) {
  const currentTimeDisplay = document.getElementById("current-time");
  currentTimeDisplay.textContent = formatTime(currentTime);
}

function updateTotalTime() {
  const totalTimeDisplay = document.getElementById("total-time");
  if (!isNaN(duration) && duration > 0) {
    totalTimeDisplay.textContent = formatTime(duration);
  } else {
    totalTimeDisplay.textContent = "00:00"; // Fallback in case duration is not available
  }
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

function seekAudio(event) {
  const seekBar = document.getElementById("seek-bar");
  const seekPosition = (event.target.value / 100) * duration; // Calculate time in seconds
  audioElement.currentTime = seekPosition; // Seek the audio to the selected position
}

function nextSong() {
  if (currentSongIndex < mp3Files.length - 1) {
    currentSongIndex++;
  } else {
    currentSongIndex = 0;
  }
  playSpecificSong(currentSongIndex);
}

function prevSong() {
  if (currentSongIndex > 0) {
    currentSongIndex--;
  } else {
    currentSongIndex = mp3Files.length - 1;
  }
  playSpecificSong(currentSongIndex);
}

function setSource(repo) {
  repoName = repo;
  displayMP3Urls();
}

// Initialize
displayMP3Urls();
