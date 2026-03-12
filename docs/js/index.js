document.addEventListener("DOMContentLoaded", () => {
    const roomCodeContainer = document.getElementById("room-code");
    const waitRoomBtn = document.getElementById("btn-wait-room");

    const roomCode = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    roomCodeContainer.textContent = roomCode;

    setTimeout(() => {
        waitRoomBtn.textContent = "Suivant";
    }, 2000)

})

