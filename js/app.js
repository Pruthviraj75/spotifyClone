// Fetch songs.json from the same repository
fetch('./songs.json')
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load songs.json");
    }
    return response.json();
  })
  .then(data => {
    songs = data;
    console.log("Songs loaded:", songs);
  })
  .catch(error => console.error("Error loading songs:", error));

let currentSong = new Audio();
let songs = [];
let currFolder;

async function getSongs(folder) {
  currFolder = folder;
  try {
    let a = await fetch(`./${folder}/`);
    if (!a.ok) {
      throw new Error(`Failed to load folder: ${folder}`);
    }
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
      const element = as[index];
      if (element.href.endsWith(".mp3")) {
        songs.push(element.href.split(`/${folder}/`)[1]);
      }
    }

    // Show all the songs in the playlists
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
      songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="images/music.svg" alt="">
              <div class="info">
                 <div>${song.replaceAll("%20", " ")}</div>
                 <div>Tupac</div>
              </div>
              <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="images/play.svg" alt="">
              </div></li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
      e.addEventListener("click", element => {
        playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
      });
    });
  } catch (error) {
    console.error("Error loading folder:", error);
  }
  return songs;
}

const playMusic = (track, pause = false) => {
  if (!track) {
    console.error("No track provided");
    return;
  }
  currentSong.src = `./${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "images/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  try {
    let a = await fetch(`./songs/`);
    if (!a.ok) {
      throw new Error("Failed to load songs folder");
    }
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
      const e = array[index];
      if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
        let folder = e.href.split("/").slice(-1)[0];
        // Get the metadata of the folder
        let a = await fetch(`./songs/${folder}/info.json`);
        if (!a.ok) {
          throw new Error(`Failed to load info.json for folder: ${folder}`);
        }
        let response = await a.json();
        cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                      <div class="play">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="70" height="150" fill="none">
                              <circle cx="24" cy="24" r="18" fill="#1ed660"/>
                              <path d="M19 22.3996V25.6004C19 28.639 19 30.1582 19.9115 30.7724C20.823 31.3865 22.0696 30.707 24.563 29.3482L27.4994 27.7476C30.4998 26.1124 32 25.2948 32 24C32 22.7052 30.4998 21.8876 27.4994 20.2524L24.563 18.6518C22.0696 17.293 20.823 16.6136 19.9115 17.2278C19 17.842 19 19.361 19 22.3996Z" fill="black"/>
                          </svg>
                      </div>
                      <img src="./songs/${folder}/cover.jpg" alt="">
                      <h2>${response.title}</h2>
                      <p>${response.description}</p>
                    </div>`;
      }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
      e.addEventListener("click", async item => {
        console.log("Fetching Songs");
        songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
        if (songs.length > 0) {
          playMusic(songs[0]);
        } else {
          console.error("No songs found in the folder");
        }
      });
    });
  } catch (error) {
    console.error("Error displaying albums:", error);
  }
}

async function main() {
  // Get the list of all songs
  await getSongs("songs/ncs");

  // Ensure songs array is populated
  if (songs.length > 0) {
    playMusic(songs[0], true);
  } else {
    console.error("No songs found in the folder");
  }

  // Display all the albums on the page
  await displayAlbums();

  // Attach event listener to play, next, and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "images/pause.svg";
    } else {
      currentSong.pause();
      play.src = "images/play.svg";
    }
  });

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Add event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = ((currentSong.duration) * percent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = 0;
  });

  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Add an event listener to previous
  previous.addEventListener("click", () => {
    currentSong.pause();
    console.log("previous clicked");
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if ((index - 1) >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Add an event listener to next
  next.addEventListener("click", () => {
    currentSong.pause();
    console.log("next clicked");
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if ((index + 1) < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Add an event listener to volume (seekbar)
  document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
    console.log("setting volume to", e.target.value, "/ 100");
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.volume > 0) {
      document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
    } else {
      document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg");
    }
  });

  // Add event listener to mute the track
  document.querySelector(".volume>img").addEventListener("click", e => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = "0";
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range").getElementsByTagName("input")[0].value = "10";
    }
  });
}

main();
