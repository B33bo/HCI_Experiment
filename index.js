const GameStates = {
    Intro:  0,
    Switch_Hand_Dominant: 1,
    Game_RightHand: 2,
    Switch_Hand_NonDominant: 3,
    Game_LeftHand: 4,
    End: 5
}

// each "state" of the experiment will have a different number associated w it
var GameState = GameStates.Intro;

var IntroPage = document.getElementById("Intro");
var SwitchHandPage = document.getElementById("SwitchHand");
var GamePage = document.getElementById("Game");
var EndPage = document.getElementById("End");

var HandCurrentlyDominant = true;

function Hide(page) {
    // "hidden" class is inside style.css all it does is disable it
    page.classList.add("hidden");
}

function Show(page) {
    page.classList.remove("hidden");
}

function SetGameState(newState) {
    console.log("Game state switching from " + GameState + " to " + newState);
    GameState = newState;

    Hide(IntroPage);
    Hide(SwitchHandPage);
    Hide(GamePage);
    Hide(EndPage);

    switch (GameState) {
        case GameStates.Intro:
            Show(IntroPage);
            break;
        case GameStates.Switch_Hand_Dominant:
        case GameStates.Switch_Hand_NonDominant:
            Show(SwitchHandPage);
            break;
        case GameStates.Game_LeftHand:
        case GameStates.Game_RightHand:
            Show(GamePage);
            break;
        case GameStates.End:
            Show(EndPage);
            break;
    }
}

function StartGame() {
    console.log("New Test Started")
    SetGameState(GameStates.Switch_Hand_Dominant);
}

function StartTimer() {
    let timer = 5;
    document.getElementById("timer").innerHTML = timer; 
    let intervalHandler = setInterval(UpdateTimer, 1000);

    function UpdateTimer() {
        timer -= 1;
        document.getElementById("timer").innerHTML = timer;
        if (timer == 0) {
            clearInterval(intervalHandler);
            alert("TODO: THE REST");
        }
    }
}

function HandSwitched() {
    if (GameState == GameStates.Switch_Hand_Dominant) {
        HandCurrentlyDominant == true;
        StartTimer();
    }
    else if (GameState == GameStates.Switch_Hand_NonDominant){
        HandCurrentlyDominant = false;
        StartTimer();
    }
    else{
        throw "Invalid game state to switch hands";
    }
}

function Main() {
    SetGameState(GameStates.Intro);
}

Main();