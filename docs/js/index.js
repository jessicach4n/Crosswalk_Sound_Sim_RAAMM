document.addEventListener("DOMContentLoaded", () => {
    const roomCodeContainer = document.getElementById("room-code");
    const waitRoomBtn = document.getElementById("btn-wait-room");

    const roomCode = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    roomCodeContainer.textContent = roomCode;

    setTimeout(() => {
        waitRoomBtn.textContent = "Suivant";
    }, 2000)

    //display server nb according to user input
    let server_nb_input;

    document.getElementById("Submit").onclick=function(){
        server_nb_input= document.getElementById("server-input").value;
        console.log(server_nb_input);
        document.getElementById("server-nb").textContent=server_nb_input;
    };

    //play music
    // Select audio element and play button
const audio = document.getElementById("myAudio");
const playBtn = document.querySelector(".play");
const replayBtn = document.querySelector(".replay");

// Play on click
playBtn.addEventListener("click", () => {
    audio.play();
});

// Replay on click
replayBtn.addEventListener("click", () => {
    audio.currentTime = 0;
    audio.play();
});


})



