// Get reference to the audio element
let audio = document.getElementById("audioPlayer");

// MP3 file list and current index
let mp3Files = [];
let currentSongIndex = 0;

let initialLoad = true;

// Fetch MP3 files recursively from the GitHub repository
const repoOwner = "codekripa"; // Replace with your GitHub username
let repoName = "OneMusic"; // Replace with your repository name

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
    audio.src = mp3Files[currentSongIndex].url;

    const songListContainer = document.getElementById("songList");
    songListContainer.innerHTML = '';
    mp3Files.forEach((song, index) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<span class="song-name">${song.name}</span>
                                  <button class="play-button" onclick="playSpecificSong(${index})">Play</button>`;
      songListContainer.appendChild(listItem);
    });

    playSpecificSong(currentSongIndex);
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
      artist: "Unknown Artist", // Replace with dynamic artist info if available
      album: "One Player", // Replace with album info if available
      artwork: [
        {
          src: "./asset/player.jpeg", // Add artwork URL if available
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });

    // Define media session actions
    navigator.mediaSession.setActionHandler("play", playAudio);
    navigator.mediaSession.setActionHandler("pause", pauseAudio);
    navigator.mediaSession.setActionHandler("previoustrack", prevSong);
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);
  }
}

// Play specific song by index
async function playSpecificSong(index) {
  currentSongIndex = index;
  const song = mp3Files[currentSongIndex];
  audio.src = song.url;
  audio.play();
  updateMediaSessionMetadata();
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

function playAudio() {
  if (initialLoad) nextSong();
  else audio.play();

  initialLoad = false;
}

function pauseAudio() {
  audio.pause();
}

function setSource(repo) {
  console.log('repo', repo);

  repoName = repo;
  displayMP3Urls();
}


audio.addEventListener("ended", nextSong);

// Initialize
displayMP3Urls();
