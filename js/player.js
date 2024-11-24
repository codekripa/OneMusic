let currentIndex = 0;
let sound;
let durationInterval;

const repoOwner = "codekripa";
const repoName = "OneMusic";
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

let mp3Files = [];

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

    console.log("mp3File ", mp3Files);
    return mp3Files;
  } catch (error) {
    console.error("Error fetching file list:", error);
  }
}

async function displaySongs() {
  mp3Files = await getMP3FilesRecursive();
  const songList = document.getElementById("songList");
  mp3Files.forEach((song, index) => {
    const li = document.createElement("li");
    li.innerText = song.name;
    li.onclick = () => {
      currentIndex = index;
      playSong();
    };
    songList.appendChild(li);
  });
}

// let mp3Files = [
//   {
//     name: "Aahista Aahista - Bachna Ae Haseeno",
//     url: "https://raw.githubusercontent.com/codekripa/OneMusic/main/songs/Aahista%20Aahista%20-%20Bachna%20Ae%20Haseeno%20320%20Kbps.mp3",
//   },
//   {
//     name: "Aaja Mahiya Fiza",
//     url: "https://raw.githubusercontent.com/codekripa/OneMusic/main/songs/Aaja%20Mahiya%20Fiza%20320%20Kbps.mp3",
//   },
//   {
//     name: "Aaoge Jab Tum Jab We Met",
//     url: "https://raw.githubusercontent.com/codekripa/OneMusic/main/songs/Aaoge%20Jab%20Tum%20Jab%20We%20Met%20320%20Kbps.mp3",
//   },
// ];

function playSong() {
  if (sound) {
    sound.stop();
  }
  sound = new Howl({
    src: [mp3Files[currentIndex].url],
    volume: 0.8,
    onend: nextSong,
    onload: () => {
      updateDuration();
    },
  });

  sound.play();
  updateNowPlaying();
  updateProgress();
}

function pauseSong() {
  if (sound) {
    sound.pause();
  }
}

function nextSong() {
  currentIndex = (currentIndex + 1) % mp3Files.length;
  playSong();
}

function previousSong() {
  currentIndex = (currentIndex - 1 + mp3Files.length) % mp3Files.length;
  playSong();
}

function updateNowPlaying() {
  document.getElementById(
    "nowPlaying"
  ).innerText = `Now Playing: ${mp3Files[currentIndex].name}`;
}

function updateDuration() {
  const duration = sound.duration();
  document.getElementById("duration").innerText = formatTime(duration);
  document.getElementById("seekBar").max = Math.floor(duration);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}

function updateProgress() {
  if (durationInterval) {
    clearInterval(durationInterval);
  }

  durationInterval = setInterval(() => {
    if (sound && sound.playing()) {
      const currentTime = sound.seek();
      document.getElementById("currentTime").innerText =
        formatTime(currentTime);
      document.getElementById("seekBar").value = Math.floor(currentTime);
    }
  }, 1000);
}

function seekSong(value) {
  if (sound) {
    sound.seek(value);
  }
}

// displaySongs();
