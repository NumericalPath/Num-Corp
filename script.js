function getRandomMove(min=1, max=6) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function increaseDifficulty() {
    if(currentDifficulty < 3){
        currentDifficulty++;

        setTimeout(() => {
            const modal = document.querySelector('#tutorialModal .modal-content');

            // Add flames
            modal.classList.add('flame-border');

            showTutorial(`
                 <h2 style="color:orange;">The difficulty increased
                <p>Level ${currentDifficulty}</p>
            `);
        }, 300);
    }
}

function showFloatingChip(text){
    const div = document.createElement("div");
    div.className = "floating-chip";
    div.textContent = text;

    document.body.appendChild(div);

    setTimeout(()=> div.remove(), 1000);
}

function toggleStats() {
    const panel = document.getElementById('statsPanel');
    if(panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}
  
function updateStatsPanel(){
    const list = document.getElementById("wrongList");

    if(wrongAnswers.length === 0){
        list.innerHTML = "No mistakes yet";
        return;
    }

    list.innerHTML = "";

    wrongAnswers.forEach((item,i)=>{
        const div = document.createElement("div");
        div.style.marginBottom="8px";

        div.innerHTML =
        `<b>Player ${item.player}</b><br>
         <b>Q:</b> ${item.question}<br>
         <span style="color:#ff7675">Answer: ${item.student}</span><br>
         <span style="color:#55efc4">Correct: ${item.correct}</span>`;

        list.appendChild(div);
    });
}

let correctStreak = 0;
let turn = 0, isVsBot = false,
players = [
    {pos:0, score:0, pine:0, grape:0, straw:0},
    {pos:0, score:0, pine:0, grape:0, straw:0}
],
timerObj, activeCard;

let botDifficulty = 'Easy'; // Variable to hold difficulty
let wrongAnswers = [];

// Path Definition: [Number, ColorClass, Row, Col, SpecialText]
const boardMap = [
  // START
  [0, 'pk', 11, 1, 'START'],
  
  // LEFT COLUMN BOTTOM to TOP - btw you can change where the shop tiles appear here
  [1, 'b', 10, 1], [2, 'y', 9, 1], [3, 'w', 8, 1], [4, 'g', 7, 1],
  [5, 'p', 6, 1], [6, 'y', 5, 1], [7, 'w', 4, 1], [8, 'p', 3, 1],
  [9, 'p', 2, 1], [10, 'pk', 1, 1, 'SHOP OF LUCK'], // corner shop --- shop tiles are 10, 19, 29, 38---

  // TOP ROW LEFT to RIGHT
  [11, 'y', 1, 2], [12, 'p', 1, 3], [13, 'w', 1, 4], [14, 'g', 1, 5],
  [15, 'pk', 1, 6], [16, 'y', 1, 7], [17, 'b', 1, 8], [18, 'g', 1, 9],
  [19, 'p', 1, 10, 'SHOP OF LUCK'], // corner shop

  // RIGHT COLUMN TOP to BOTTOM
  [20, 'pk', 2, 10], [21, 'y', 3, 10], [22, 'b', 4, 10], [23, 'p', 5, 10],
  [24, 'g', 6, 10], [25, 'w', 7, 10], [26, 'y', 8, 10], [27, 'g', 9, 10],
  [28, 'p', 10, 10], [29, 'w', 11, 10, 'SHOP OF LUCK'], // corner shop

  // BOTTOM ROW RIGHT → LEFT
  [30, 'pk', 11, 9], [31, 'b', 11, 8], [32, 'y', 11, 7], [33, 'p', 11, 6],
  [34, 'w', 11, 5], [35, 'b', 11, 4], [36, 'p', 11, 3], [37, 'y', 11, 2],
  [38, 'g', 11, 1, 'SHOP OF LUCK'] // corner shop
];

// Bot UI functions
function showBotOptions() {
    document.getElementById('player-options').style.display = 'none';
    document.getElementById('bot-options').style.display = 'block';
}

function startBotGame(difficulty) {
    botDifficulty = difficulty;
    startGame(true);
}

function showTutorial(tutorialStr) {
    document.getElementById('tutorialText').innerHTML = tutorialStr;
    document.getElementById('tutorialModal').style.display = 'flex';
}

function closeTutorial() {
    document.getElementById('tutorialModal').style.display = 'none';

    // remove the "flames" when closing i tinkered with this for so long and didnt fix it so maybe it isnt much needed.
    const modal = document.querySelector('#tutorialModal .modal-content');
    modal.classList.remove('flame-border');
}

function startGame(bot) {
    isVsBot = bot;

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    // SHOW BACK BUTTON IN GAME
    document.getElementById('backMenuBtn').style.display = 'block';

    initBoard();
}

//
const shopItems = [
  {
    label: 'Buy 2× Points for 10 points',
    cost: 10,
    effect: () => {
      players[turn].score *= 2;
      renderMarkers();
    }
  },
  {
    label: 'Skip Next Question for 10 points',
    cost: 10,
    effect: () => {
      players[turn].skipNext = true;
    }
  },
  {
    label: 'Gain 5 Bonus Points for 5 points',
    cost: 5,
    effect: () => {
      players[turn].score += 5;
      renderMarkers();
    }
  }
];

function openShop() {
    const shopDiv = document.getElementById('shopOptions');
    shopDiv.innerHTML = '';

    shopItems.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.margin = '5px';
        btn.style.width = '100%';
        btn.style.background = '#3498db';
        btn.style.color = 'white';
        btn.textContent = `${item.label} (Cost: ${item.cost})`;
        btn.onclick = () => buyItem(index);
        shopDiv.appendChild(btn);
    });

    document.getElementById('shopModal').style.display = 'flex';
}

function buyItem(index) {
    const p = players[turn];
    const item = shopItems[index];

    if(p.score >= item.cost) {
        p.score -= item.cost;
        item.effect();
        renderMarkers();
        alert('Purchased: ' + item.label);
    } else {
        alert('Not enough points!');
    }

    closeShop();
    switchTurn();
}

function closeShop() {
    document.getElementById('shopModal').style.display = 'none';
    // If bot landed on shop and closed it (bot just skips shop for now), resume turns.
    if (turn === 1 && isVsBot) { switchTurn(); }
}

function initBoard() {
    const b = document.getElementById('board');
    boardMap.forEach(data => {
        const cell = document.createElement('div');
        cell.className = `cell ${data[1]}`;
        cell.style.gridRow = data[2];
        cell.style.gridColumn = data[3];
        cell.innerHTML = `<div>${data[0]}</div>`;
        if(data[4]) cell.innerHTML += `<div class="shop-tile">${data[4]}</div>`;
        cell.innerHTML += `<div class="marker-zone" id="z-${data[0]}"></div>`;
        b.appendChild(cell);
    });
    renderMarkers();
}

function renderMarkers() {
    document.querySelectorAll('.marker-zone').forEach(z => z.innerHTML = '');
    players.forEach((p, i) => {
        const t = document.createElement('div');
        t.className = `token p${i+1}-token`;
        document.getElementById(`z-${p.pos}`).appendChild(t);
    });
}

// EXPANDED QUESTION DECK
let currentDifficulty = 1;

const decks = {
    1: [
        { q: '24 + 16', a: 40, m: 3, tutorial: '24 + 16 = 40' },
        { q: '9 x 6', a: 54, m: 4, tutorial: '9 × 6 = 54' }
    ],
    2: [
        { q: '3 + 4 x 5', a: 23, m: 4, tutorial: 'Order: 4×5=20 +3 = 23' },
        { q: '50 - 25 ÷ 5', a: 45, m: 4, tutorial: '25÷5=5 → 50-5=45' }
    ],
    3: [
        { q: '12² + 5', a: 149, m: 6, tutorial: '12²=144 +5 =149' },
        { q: '(8 x 3)²', a: 576, m: 7, tutorial: '8×3=24 → 24²=576' }
    ]
};

function drawCard() {

    const currentDeck = decks[currentDifficulty];
    activeCard = currentDeck[Math.floor(Math.random() * currentDeck.length)];
    document.getElementById('question').textContent = activeCard.q;
    document.getElementById('cardModal').style.display = 'flex'; 
    
    const isTeacher = document.getElementById('teacherMode').checked;

    if(isTeacher){
        // show the answer immediately
        document.getElementById('answerInput').value = activeCard.a;
    }
    
    // NEW: Reset Flip and start animation
    const flipInner = document.getElementById('flipCardInner');
    flipInner.classList.remove('flipped');
    
    // Wait for player to see the front card, then it flip it automatically
    setTimeout(() => {
        flipInner.classList.add('flipped');
        
        // Start Timer ONLY AFTER the card finishes flipping (0.8s animation delay)
        setTimeout(() => {
            startTimerLogic();
        }, 800);
        
    }, 1200);
}

function startTimerLogic() {
    // Timer adjusts based on bot difficulty mode (affects human player too to balance)
    let time = 30;
    if (isVsBot) {
        if (botDifficulty === 'Easy') time = 45;
        else if (botDifficulty === 'Medium') time = 30;
        else if (botDifficulty === 'Mar') time = 15;
    }
    
    document.getElementById('timerDisp').textContent = time;

    clearInterval(timerObj);
    timerObj = setInterval(() => {
        time--; document.getElementById('timerDisp').textContent = time;
        if(time <= 0) { clearInterval(timerObj); closeModal(); switchTurn(); }
    }, 1000);
}

function checkAnswer() {
    const val = parseInt(document.getElementById('answerInput').value);
    clearInterval(timerObj);
    closeModal(); // hide question modal

    const correct = val === activeCard.a;

    // --- ADD THIS BLOCK TO TRACK WRONG ANSWERS ---
   if(!correct){
    wrongAnswers.push({
        player: turn + 1,
        question: activeCard.q,
        correct: activeCard.a,
        student: val
    });
    updateStatsPanel();
}

if(correct){
    correctStreak++;

    if(correctStreak >= 3){
        increaseDifficulty();
        correctStreak = 0; // reset streak
    }

} else {
    correctStreak = 0; // reset streak

    decreaseDifficulty(); // NEW
}

function decreaseDifficulty(){
    if(currentDifficulty > 1){
        currentDifficulty--;

        showTutorial(`
            ⚠️ <b>1/b>Difiic crease<br>
            Back to Level ${currentDifficulty}<br>
            Try again!
        `);
    }
}
    // ---------------------------------------------

    showTutorial(activeCard.tutorial + (correct ? '<br><b>Correct!' : '<br><b>Incorrect'));

    // After closing tutorial, move player if correct, then switch turn
    const tutorialCloseBtn = document.querySelector('#tutorialModal .btn');
    tutorialCloseBtn.onclick = function() {
        closeTutorial();
        let shopLanded = false;
        if(correct) {
            let randomSteps = getRandomMove(1, 6); // random 1-6
            shopLanded = movePlayer(randomSteps);
        }
        // Original logic called switchTurn blindly here; ensuring we don't double call if shop opens
        if(!shopLanded) switchTurn();
    };

    document.getElementById('answerInput').value = '';
}

function movePlayer(m) {
    let p = players[turn];
    p.pos = (p.pos + m) % boardMap.length;

    const tile = boardMap[p.pos];
    const color = tile[1];

    // 🎉 CHIP REWARDS
    if(color === 'y'){ // Yellow
        p.pine++;
        p.score += 2;
        showFloatingChip("🍍 +2");
    }
    else if(color === 'p'){ // Purple
        p.grape++;
        p.score += 3;
        showFloatingChip("🍇 +3");
    }
    else if(color === 'g'){ // Green
        p.straw++;
        p.score += 1;
        showFloatingChip("🍓 +1");
    }

    renderMarkers();
    updateLeaderboard();

    // SHOP CHECK
    if(tile[4] && tile[4].toLowerCase().includes('shop')) {
        openShop();
        return true;
    }

    return false;
}

function updateLeaderboard(){
    document.getElementById('p1-pine').textContent = players[0].pine;
    document.getElementById('p1-grape').textContent = players[0].grape;
    document.getElementById('p1-straw').textContent = players[0].straw;
    document.getElementById('p1-total').textContent = players[0].score;

    document.getElementById('p2-pine').textContent = players[1].pine;
    document.getElementById('p2-grape').textContent = players[1].grape;
    document.getElementById('p2-straw').textContent = players[1].straw;
    document.getElementById('p2-total').textContent = players[1].score;
}

function switchTurn() {
    turn = turn === 0 ? 1 : 0;
    document.getElementById('p1-score').textContent = players[0].score;
    document.getElementById('p2-score').textContent = players[1].score;
    document.getElementById('turnLabel').textContent = `Player ${turn+1} Turn`;
    
    const drawBtn = document.getElementById('drawBtn');
    
    if(turn === 1 && isVsBot) {
        // Disable button and execute advanced Bot Logic
        drawBtn.disabled = true;
        document.getElementById('turnLabel').textContent = `Bot is calculating...`;
        
        // Execute NEW Bot AI
        executeBotTurn();
    } else {
        drawBtn.disabled = false;
    }
}

// Advanced Bot Execution Logic
function executeBotTurn() {
    const botCard = deck[Math.floor(Math.random()*deck.length)];
    let thinkTime = 1000;
    let isCorrect = true;

    // Difficulty Matrix
    if (botDifficulty === 'Easy') {
        thinkTime = Math.random() * 3000 + 4000; // 4-7 seconds (Slow)
        isCorrect = Math.random() > 0.4; // 60% chance to be right
    } else if (botDifficulty === 'Medium') {
        thinkTime = Math.random() * 2000 + 2000; // 2-4 seconds (Average)
        isCorrect = Math.random() > 0.15; // 85% chance to be right
    } else if (botDifficulty === 'Mar') {
        thinkTime = Math.random() * 1000 + 500; // 0.5-1.5 seconds (Lightning Fast)
        isCorrect = Math.random() > 0.02; // 98% chance to be right
    }

    setTimeout(() => {
        let msg = isCorrect 
            ? `<b>Bot got it right!</b><br>Bot calculated: ${botCard.tutorial}<br>Moving ${botCard.m} spaces.` 
            : `<b>Bot got it wrong!</b><br>Bot fumbled the math.`;
            
        showTutorial(msg);
        
        const tutorialCloseBtn = document.querySelector('#tutorialModal .btn');
        tutorialCloseBtn.onclick = function() {
            closeTutorial();
            let shopLanded = false;
            if(isCorrect) {
                shopLanded = movePlayer(botCard.m);
            }
            if(!shopLanded) switchTurn();
        };
    }, thinkTime);
}

function closeModal() {
    document.getElementById('cardModal').style.display = 'none';
    document.getElementById('answerInput').value = '';
}

// Simple Scratchpad Logic System ok
const canvas = document.getElementById('scratchPad'), ctx = canvas.getContext('2d');
let drawing = false;

canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => { drawing = false; ctx.beginPath(); };
canvas.onmousemove = (e) => {
    if(!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
};

// CLEAR BUTTON 
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//Mainmenu button, finally added after days
function backToMainMenu() {
    clearInterval(timerObj);

    // Hide game
    document.getElementById('game').style.display = 'none';

    // Show main menu
    document.getElementById('setup').style.display = 'block';

    // Show normal menu
    document.getElementById('player-options').style.display = 'block';

    // Hide bot selection
    document.getElementById('bot-options').style.display = 'none';

    // Reset bot effects
    document.getElementById('bot-options').classList.remove('bot-selected');

    document.querySelectorAll('#bot-options > button').forEach(bot => {
        bot.classList.remove('selected-bot');
    });

    // HIDE BACK BUTTON
    document.getElementById('backMenuBtn').style.display = 'none';
}

function showBotOptions() {
    document.getElementById('player-options').style.display = 'none';
    document.getElementById('bot-options').style.display = 'block';

    // SHOW BACK BUTTON
    document.getElementById('backMenuBtn').style.display = 'block';
}