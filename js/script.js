let mp3Files = [];
let currentSongIndex = 0;
let dolbyEnabled = false;

let initialLoad = true;
let sound; // This will hold the Howl instance
let isPlaying = false; // Variable to track play/pause state
let duration = 0; // Total duration of the current song
let currentTimeInterval; // To store the interval for updating current time

const repoOwner = "codekripa";
let repoName = "NewSongs";

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
    // Initialize the Howl instance for the first song
    let songIndex = getSongIndexToLocalStorage(repoName);
    playSpecificSong(songIndex);

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

// Update media session metadata
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
  setSongIndexToLocalStorage(repoName, currentSongIndex);
  const song = mp3Files[currentSongIndex];

  // Create a new Howl instance for the current song
  if (sound) sound.unload(); // Unload the previous sound instance if any

  const formats = dolbyEnabled ? ['dolby', 'mp3'] : ['mp3']; // Toggle formats based on Dolby

  sound = new Howl({
    src: [song.url],
    format: formats,  // Use Dolby if enabled
    html5: true, // Enable HTML5 for better compatibility
    preload: true, // Preload the audio before playing
    autoplay: true,
    onend: nextSong, // Move to the next song when this one ends
    onplay: () => {
      duration = sound.duration(); // Get the total duration of the current song
      updateSeekBar(); // Update the seek bar
      updateTotalTime(); // Update the total time
      isPlaying = true; // Update state to playing
      updatePlayPauseButton(); // Update button icon

      // Start updating the current time continuously
      currentTimeInterval = setInterval(() => {
        updateSeekBar();
        updateCurrentTime(sound.seek());
      }, 1000); // Update every 1 second
    },
    onseek: updateSeekBar, // Update the seek bar as the song seeks
    onload: updateTotalTime // Update the total time when song is loaded
  });

  updateMediaSessionMetadata();
}

// Toggle Play/Pause button
function togglePlayPause() {
  if (isPlaying) {
    sound.pause();
    clearInterval(currentTimeInterval); // Stop updating the current time
    isPlaying = false; // Update state to paused
  } else {
    sound.play();
    isPlaying = true; // Update state to playing

    // Start updating the current time again
    currentTimeInterval = setInterval(() => {
      updateSeekBar();
      updateCurrentTime(sound.seek());
    }, 1000);
  }

  updatePlayPauseButton(); // Update button icon
}

// Update the Play/Pause button icon based on the play state
function updatePlayPauseButton() {
  const playPauseButton = document.getElementById("playPauseButton");
  if (isPlaying) {
    playPauseButton.innerHTML = "&#10074;&#10074;"; // Pause icon
  } else {
    playPauseButton.innerHTML = "&#9654;"; // Play icon
  }
}

// Update the seek bar position based on the current time
function updateSeekBar() {
  if (sound) {
    const currentTime = sound.seek(); // Get current time
    const seekBar = document.getElementById("seek-bar");
    seekBar.value = (currentTime / duration) * 100; // Set seek bar value as percentage
  }
}

// Update the current time display
function updateCurrentTime(currentTime) {
  const currentTimeDisplay = document.getElementById("current-time");
  currentTimeDisplay.textContent = formatTime(currentTime);
}

// Update the total time display
function updateTotalTime() {
  const totalTimeDisplay = document.getElementById("total-time");
  totalTimeDisplay.textContent = formatTime(duration);
}

// Format time in mm:ss format
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

// Seek to the specific position in the audio when user interacts with the seek bar
function seekAudio(event) {
  const seekBar = document.getElementById("seek-bar");
  const seekPosition = (event.target.value / 100) * duration; // Calculate time in seconds
  sound.seek(seekPosition); // Seek the audio to the selected position
}

// Next song
function nextSong() {
  if (currentSongIndex < mp3Files.length - 1) {
    currentSongIndex++;
  } else {
    currentSongIndex = 0;
  }

  playSpecificSong(currentSongIndex);
}

// Previous song
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

function toggleDolby() {
  dolbyEnabled = !dolbyEnabled; // Toggle Dolby status

  const button = document.querySelector('.toggle-dolby-btn');
  button.textContent = dolbyEnabled ? "Disable Dolby" : "Enable Dolby"; // Update button text

  // Reload the current song with the new setting
  playSpecificSong(currentSongIndex);
}

function setSongIndexToLocalStorage(playlistKey, index) {
  localStorage.setItem(playlistKey, index);
}

function getSongIndexToLocalStorage(playlistKey) {
  let songIndex = localStorage.getItem(playlistKey);

  return songIndex ? +songIndex : 0;
}


// Initialize
displayMP3Urls();
