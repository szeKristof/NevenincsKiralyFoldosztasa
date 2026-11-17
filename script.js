
/// Game level boards
// >0: ház és lakói -- 0: ures -- -1: jelölt -- -9: fal
const initialBoards = {
    easy: [
        [1, 0, 5, 0, 0], 
        [0, 0, 0, 0, 0], 
        [0, 1, 0, 0, 0], 
        [0, 0, 0, 5, 0], 
        [1, 0, 0, 0, 0]
    ],
    medium: [
        [12,  0,  0,  0,  0,  0,  4], 
        [ 0,  0,  0,  0,  0,  0,  0], 
        [ 0,  0,  0,  0,  0,  0,  0], 
        [ 1,  0,  1,  0,  0,  0,  0], 
        [ 0,  0,  0,  0,  0,  0,  0], 
        [ 7,  0,  0,  0,  0,  3,  0], 
        [ 0,  0,  0,  0,  0,  0,  0]
    ],
    hard: [
        [12,  0,  0,  0,  0,  0,  0,  7,  0,  0], 
        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0], 
        [ 0,  0,  0,  0,  2,  0,  0,  0,  0,  0], 
        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0], 
        [ 5,  0,  0,  0,  1,  0,  2,  0,  0,  1], 
        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0], 
        [ 0,  0,  0,  0,  1,  0,  1,  0,  1,  0], 
        [13,  0,  0,  0,  0,  1,  0,  0,  0,  0], 
        [ 0,  0,  0,  0,  0,  0,  0,  4,  0,  0], 
        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
    ]
}

const levelNames = {
    easy: "Könnyű",
    medium: "Közepes",
    hard: "Nehéz"
};








/// Game variables
let currentGame = {
    id: Date.now(),
    board: [[]],
    name: "",
    level: "",
    elapsedMilliseconds: 0
};
let timerId = null;
let startTime = 0;
let hoverModeON = false;
let isWallBuild = true;
let positionList = [];
let errorSignalOn = false;








/// DOM elements and listeners
const body = document.querySelector('body');
const errorSignalSwitch = document.querySelector("#error-signal-switch");
const gameScreen = document.querySelector('#game-screen');
const gameBoardElement = document.querySelector("#board");
const gamePlayer = document.querySelector("#game-player");
const gameLevel = document.querySelector("#game-level");
const gameTime = document.querySelector("#game-time");
const errorMsg = document.querySelector("#error-message");
const newGameForm = document.querySelector("#start-form");
const saveButton = document.querySelector("#save-btn");
const mainPageButton = document.querySelector("#menu-btn");
const savedGamesList = document.querySelector("#saved-games");
const leaderBoard = document.querySelector("#leaderboard");



body.addEventListener('click', navClick);

function showScreen(screenId){
    document.querySelectorAll(".screen").forEach((element)=>{
        element.classList.add('hidden');
    });
    document.querySelector(`#${screenId}`).classList.remove('hidden');
}

function navClick(event){
    const button = event.target.closest("button");
    if(!button || !button.dataset.screen){
        return;
    }
    showScreen(button.dataset.screen);
}

errorSignalSwitch.addEventListener('change', errorSignalSetup);

function errorSignalSetup(){
    errorSignalOn = errorSignalSwitch.checked;
}

gameBoardElement.addEventListener('mousedown', cellMouseDownHandler);

function cellMouseDownHandler(event){
    const cell = event.target.closest(".cell");
    if(!cell){
        return;
    }
    event.preventDefault();

    if(event.button==0 && cell.classList.contains("field")){
        setWallBuild();
        hoverModeStart();
        hoverOnCell(cell);
        return;
    }

    if(event.button==0 && cell.classList.contains("wall")){
        setWallDestroy();
        hoverModeStart();
        hoverOnCell(cell);
        return;
    }
}


gameBoardElement.addEventListener('mouseover', cellMouseOverHandler);

function cellMouseOverHandler(event){
    const cell = event.target.closest(".cell");
    if(!cell || cell.classList.contains("house") || !hoverModeON){
        return;
    }
    hoverOnCell(cell);
}


gameBoardElement.addEventListener('contextmenu', cellRightClickHandler);

function cellRightClickHandler(event){
    event.preventDefault();
    const cell = event.target.closest(".cell");
    if(!cell){
        return;
    }
    if(event.button==2 && cell.classList.contains("field")){
        if(cell.classList.contains("signed")){
            fieldUnSign(cell);
        }else{
            fieldSign(cell);
        }
    }
}


newGameForm.addEventListener('submit', newGameStart);

function newGameStart(event){
    event.preventDefault();
    const name = newGameForm.elements.playerName.value.trim();
    const level = newGameForm.elements.level.value;
    if(name==""){
        return
    }

    currentGame.id = Date.now();
    currentGame.board = JSON.parse(JSON.stringify(initialBoards[level]));
    currentGame.name = name;
    currentGame.level = level;
    currentGame.elapsedMilliseconds = 0;
    newGameForm.reset();

    gameScreen.classList.remove("won");
    drawGame(currentGame);
    startTimer();
    showScreen("game-screen");
}


saveButton.addEventListener('click', saveGame);

function saveGame(){
    stopTimer();
    
    const saves = JSON.parse(localStorage.getItem("saves")) ?? [];
    
    const index = saves.findIndex((game) => game.id === currentGame.id);
    if(index === -1){
        saves.push(currentGame);
    } else {
        saves[index] = currentGame;
    }
    localStorage.setItem("saves", JSON.stringify(saves));

    updateSavedGames();
}

mainPageButton.addEventListener('click', quitGame);

function quitGame(){
    stopTimer();
    const saves = JSON.parse(localStorage.getItem("saves")) ?? [];
    const remainingSaves = saves.filter((game) => game.id !== currentGame.id);
    localStorage.setItem("saves", JSON.stringify(remainingSaves));
    updateSavedGames();
}

savedGamesList.addEventListener('click', loadSavedGame);

function loadSavedGame(event){
    const button = event.target.closest("button");
    if(!button){
        return;
    }
    const saves = JSON.parse(localStorage.getItem("saves")) ?? [];

    if(!saves[button.dataset.index]){
        return;
    }
    currentGame = saves[button.dataset.index];

    gameScreen.classList.remove("won");
    drawGame(currentGame);
    startTimer();
    checkGameState();
}


window.addEventListener('mouseup', mouseUpHandler);

function mouseUpHandler(event){
    if(event.button==0){
        hoverModeEnd();
    }
}








/// Timer functions
function startTimer() {
    stopTimer();
    startTime = Date.now() - currentGame.elapsedMilliseconds;
    timerId = setInterval(updateTimer, 50);
    updateTimer();
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

function updateTimer() {
    currentGame.elapsedMilliseconds = Date.now() - startTime;
    gameTime.textContent = formTime(currentGame.elapsedMilliseconds);
}

function formTime(milliseconds){
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}








/// State changer
function setWallBuild(){
    isWallBuild = true;
}

function setWallDestroy(){
    isWallBuild = false;
}

function fieldSign(cellElement){
    cellElement.classList.add("signed");
    currentGame.board[cellElement.dataset.row][cellElement.dataset.column] = -1;

}

function fieldUnSign(cellElement){
    cellElement.classList.remove("signed");
    currentGame.board[cellElement.dataset.row][cellElement.dataset.column] = 0;
}

function wallBuildOnField(cellElement){
    if(cellElement.classList.contains("signed")){
        return;
    }
    cellElement.classList.remove("field");
    cellElement.classList.add("wall");
    currentGame.board[cellElement.dataset.row][cellElement.dataset.column] = -9;
}

function wallDestroyOnField(cellElement){
    if(!cellElement.classList.contains("wall")){
        return
    }
    cellElement.classList.remove("wall");
    cellElement.classList.add("field");
    currentGame.board[cellElement.dataset.row][cellElement.dataset.column] = 0;
}

function hoverModeStart(){
    hoverModeON = true;
}

function hoverModeEnd(){
    if(hoverModeON){
        checkGameState();
    }
    hoverModeON = false;
    positionList = [];
}

function hoverOnCell(cellElement){
    if(!positionList.includes(cellElement)){
        positionList.push(cellElement);
        
        if(isWallBuild){
            wallBuildOnField(cellElement);
        }else{
            wallDestroyOnField(cellElement);
        }
    }
}

function initGame(){
    updateSavedGames();
    updateLeaderBoard();
    showScreen("main-screen");
}








/// State checker
function getNeighbors(row, col){
    const board = currentGame.board;
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for(const [rowStep, colStep] of directions){
        const r = row + rowStep;
        const c = col + colStep;
        if(r >= 0 && r < board.length && c >= 0 && c < board[r].length){
            neighbors.push([r, c]);
        }
    }
    return neighbors;
}

function getHouseArea(startRow, startCol, canPass){
    const board = currentGame.board;
    const visited = new Set();
    visited.add(`${startRow},${startCol}`);
    const queue = [[startRow, startCol]];
    const cells = [];
    while(queue.length > 0){
        const [row, col] = queue.shift();
        cells.push([row, col]);
        for(const [r, c] of getNeighbors(row, col)){
            const key = `${r},${c}`;
            if(!visited.has(key) && canPass(board[r][c])){
                visited.add(key);
                queue.push([r, c]);
            }
        }
    }
    return cells;
}

function get2x2Walls(){
    const board = currentGame.board;
    const cells = [];
    for(let i = 0; i < board.length - 1; i++){
        for(let j = 0; j < board[i].length - 1; j++){
            if(board[i][j] == -9 && board[i + 1][j] == -9 && board[i][j + 1] == -9 && board[i + 1][j + 1] == -9){
                cells.push([i, j]);
                cells.push([i + 1, j]);
                cells.push([i, j + 1]);
                cells.push([i + 1, j + 1]);
            }
        }
    }
    return cells;
}

function markErrorCells(cells){
    for(const [row, col] of cells){
        gameBoardElement.querySelector(`[data-row="${row}"][data-column="${col}"]`).classList.add("error");
    }
}

function wonGame(){
    stopTimer();
    
    const leaderBoard = JSON.parse(localStorage.getItem("leaderboard")) ?? [];
    leaderBoard.push(currentGame);
    localStorage.setItem("leaderboard", JSON.stringify(leaderBoard));

    const saves = JSON.parse(localStorage.getItem("saves")) ?? [];
    const remainingSaves = saves.filter((game) => game.id !== currentGame.id);
    localStorage.setItem("saves", JSON.stringify(remainingSaves));
    updateSavedGames();

    updateLeaderBoard();
    gameScreen.classList.add("won");
}

function checkGameState(){
    const board = currentGame.board;

    gameBoardElement.querySelectorAll(".cell").forEach((element) => {
        element.classList.remove("error");
    });

    let hasError = false;
    let isSolved = true;
    let wallCount = 0;
    let firstWall = null;
    let landCount = 0;
    let houseSum = 0;
    errorMsg.textContent = "";

    for(let i = 0; i < board.length; i++){
        for(let j = 0; j < board[i].length; j++){
            const value = board[i][j];

            if(value == -9){
                wallCount++;
                if(!firstWall){
                    firstWall = [i, j];
                }
                continue;
            }

            landCount++;

            if(value > 0){
                houseSum += value;

                const area = getHouseArea(i, j, (v) => v != -9);
                const houseCount = area.filter(([r, c]) => board[r][c] > 0).length;

                
                if(area.length < value){
                    markErrorCells(area);
                    hasError = true;
                    if(errorSignalOn){
                        errorMsg.textContent = "Túl kicsi birtok!";
                    }
                }

                
                if(houseCount == 1 && area.length > value){
                    markErrorCells(area);
                    hasError = true;
                    if(errorSignalOn){
                        errorMsg.textContent = "Túl nagy birtok!";
                    }
                }

                
                if(area.length != value || houseCount != 1){
                    isSolved = false;
                }
            }
        }
    }


    const wallBlockCells = get2x2Walls();
    if(wallBlockCells.length > 0){
        markErrorCells(wallBlockCells);
        hasError = true;
        if(errorSignalOn){
            errorMsg.textContent = "2×2-es faltömb!";
        }
    }

    
    if(firstWall && getHouseArea(firstWall[0], firstWall[1], (v) => v == -9).length != wallCount){
        isSolved = false;
    }

    if(landCount != houseSum){
        isSolved = false;
    }

    if(hasError || !isSolved){
        return;
    }


    wonGame();
}








/// DOM changer
function drawGame(gameState){
    const boardStateMatrix = gameState.board;
    let tableHTML = '';
    for(let i = 0; i < boardStateMatrix.length; i++){
        tableHTML += '<div class="row">';
        for(let j = 0; j < boardStateMatrix[i].length; j++){
            if(boardStateMatrix[i][j]==0){
                tableHTML += `<div class="cell field" data-row="${i}" data-column="${j}"></div>`;
            }else if(boardStateMatrix[i][j]==-1){
                tableHTML += `<div class="cell field signed" data-row="${i}" data-column="${j}"></div>`;
            }else if(boardStateMatrix[i][j]==-9){
                tableHTML += `<div class="cell wall" data-row="${i}" data-column="${j}"></div>`;
            }else{
                tableHTML += `<div class="cell house" data-row="${i}" data-column="${j}"> ${boardStateMatrix[i][j]} </div>`;
            }
        }
        tableHTML += '</div>';
    }
    gameBoardElement.innerHTML = tableHTML;

    gamePlayer.textContent = gameState.name;
    gameLevel.textContent = levelNames[gameState.level];
    gameTime.textContent = formTime(gameState.elapsedMilliseconds);

    errorMsg.textContent = ""
}

function updateSavedGames(){
    const saves = JSON.parse(localStorage.getItem("saves")) ?? [];
    savedGamesList.innerHTML = '';

    for(let i = 0; i<saves.length; i++){
        const li = document.createElement("li");
        li.classList.add("save-item");

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.screen = "game-screen";
        button.dataset.index = i;

        [levelNames[saves[i].level], saves[i].name, formTime(saves[i].elapsedMilliseconds)].forEach((str)=>{
            const span = document.createElement("span");
            span.textContent = str;
            button.append(span);
        });

        li.append(button);
        savedGamesList.append(li);
    }
}

function drawScoreList(title, levelScores){
    levelScores.sort((a, b) => a.elapsedMilliseconds - b.elapsedMilliseconds);

    const h3 = document.createElement("h3");
    h3.textContent = title;

    const ol = document.createElement("ol");
    levelScores.forEach((score) => {
        const li = document.createElement("li");
        li.classList.add("score-card");

        [score.name, formTime(score.elapsedMilliseconds)].forEach((str) => {
            const span = document.createElement("span");
            const strong = document.createElement("strong");
            strong.textContent = str;
            span.append(strong);
            li.append(span);
        });

        ol.append(li);
    });

    leaderBoard.append(h3, ol);
}

function updateLeaderBoard(){
    const scores = JSON.parse(localStorage.getItem("leaderboard")) ?? [];
    leaderBoard.innerHTML = '';

    drawScoreList("Könnyű", scores.filter((game) => game.level === "easy"));
    drawScoreList("Közepes", scores.filter((game) => game.level === "medium"));
    drawScoreList("Nehéz", scores.filter((game) => game.level === "hard"));
}








initGame();