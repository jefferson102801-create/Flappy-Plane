let currentUser = "";
let isGameRunning = false;
let gameAnimationId = null;
let moveId = null;
let gravityId = null;
let pipeId = null;

/* ================= LOGIN / MENU ================= */

function login() {
    let name = document.getElementById("username").value.trim();
    
    if (name === "") {
        alert("Please enter a username");
        return;
    }
    
    // Validate username
    if (/[<>:"/\\|?*]/.test(name)) {
        alert("Username contains invalid characters. Please use only letters, numbers, and spaces.");
        return;
    }
    
    if (name.length > 15) {
        alert("Username is too long. Maximum 15 characters.");
        return;
    }
    
    currentUser = name;
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("menuScreen").classList.remove("hidden");
}

function logout() {
    currentUser = "";
    document.getElementById("username").value = "";
    document.getElementById("menuScreen").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
}

function startGame() {
    if (isGameRunning) return;
    
    isGameRunning = true;
    document.getElementById("menuScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    startFlappy();
    setupGameControls();
}

function backToMenu() {
    document.getElementById("leaderboardScreen").classList.add("hidden");
    document.getElementById("menuScreen").classList.remove("hidden");
}

function showLeaderboard() {
    document.getElementById("menuScreen").classList.add("hidden");
    document.getElementById("leaderboardScreen").classList.remove("hidden");

    let scores = JSON.parse(localStorage.getItem("flappyScores")) || [];
    let list = document.getElementById("leaderboardList");
    list.innerHTML = "";

   
    let topScores = scores.slice(0, 5);
    
    if (topScores.length === 0) {
        let li = document.createElement("li");
        li.textContent = "No scores yet! Play a game to get on the board!";
        list.appendChild(li);
    } else {
        topScores.forEach((s, index) => {
            let li = document.createElement("li");
            
            // Highlight current user's score
            if (s.name === currentUser) {
                li.style.background = "rgba(76, 175, 80, 0.3)";
                li.style.borderLeft = "4px solid #4CAF50";
                li.style.fontWeight = "bold";
            }
            
            // Add medal emojis for top 3
            let medal = "";
            if (index === 0) medal = "🥇 ";
            else if (index === 1) medal = "🥈 ";
            else if (index === 2) medal = "🥉 ";
            
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>
                         
                        ${medal}${s.name} 
                        ${s.name === currentUser ? '(You)' : ''}
                    </span>
                    <span style="color: gold; font-weight: bold;">
                        ${s.score} pts
                    </span>
                </div>
               
            `;
            
            list.appendChild(li);
        });
    }
    
 
}


/* ================= GAME SETUP ================= */

let move_speed = 3;
let gravity = 0.6;
let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let sound_point = new Audio('sounds effect/point.mp3');
let sound_die = new Audio('sounds effect/die.mp3');
let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');

let bird_props;
let game_state = 'Start';
let bird_dy = 0;
let background_rect;

// Mute sounds initially to prevent autoplay issues
sound_point.volume = 0.5;
sound_die.volume = 0.5;
sound_point.muted = true;
sound_die.muted = true;

img.style.display = 'none';

/* ================= CONTROLS ================= */

function handleKeyDown(e) {
    if ((e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') && game_state === 'Play') {
        bird_dy = -13.6;
        img.src = 'images/plane.png';
    }
    
    // Space bar shouldn't scroll the page
    if (e.key === ' ') {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        img.src = 'images/plane-2.png';
    }
}

function setupGameControls() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Also support touch/click for mobile
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('click', handleTouch);
}

function handleTouch(e) {
    if (game_state === 'Play') {
        bird_dy = -7.6;
        img.src = 'images/plane.png';
        setTimeout(() => {
            img.src = 'images/plane-2.png';
        }, 200);
    }
    
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
}

function cleanupGameControls() {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('touchstart', handleTouch);
    document.removeEventListener('click', handleTouch);
}

/* ================= START GAME ================= */

function startFlappy() {
    // Cancel any existing animations
    if (moveId) cancelAnimationFrame(moveId);
    if (gravityId) cancelAnimationFrame(gravityId);
    if (pipeId) cancelAnimationFrame(pipeId);
    
    // Remove all existing pipes
    document.querySelectorAll('.pipe_sprite').forEach(e => e.remove());
    
    // Reset game state
    img.style.display = 'block';
    bird.style.top = '40vh';
    game_state = 'Play';
    bird_dy = 0;
    
    // Get fresh background dimensions
    let backgroundEl = document.querySelector('.background');
    background_rect = backgroundEl.getBoundingClientRect();
    bird_props = bird.getBoundingClientRect();
    
    // Reset UI
    message.innerHTML = '';
    score_title.innerHTML = 'Score : ';
    score_val.innerHTML = '0';
    message.classList.remove('messageStyle');
    
    // Unmute sounds
    sound_point.muted = false;
    sound_die.muted = false;
    
    // Start game loops
    play();
}

/* ================= GAME LOGIC ================= */

function play() {
    function move() {
        if (game_state !== 'Play') {
            moveId = null;
            return;
        }
        
        document.querySelectorAll('.pipe_sprite').forEach(pipe => {
            let pipe_props = pipe.getBoundingClientRect();
            bird_props = bird.getBoundingClientRect();

            // Remove pipe if it's off screen
            if (pipe_props.right <= 0) {
                pipe.remove();
                return;
            }
            
            // Collision detection
            if (
                bird_props.left < pipe_props.left + pipe_props.width &&
                bird_props.left + bird_props.width > pipe_props.left &&
                bird_props.top < pipe_props.top + pipe_props.height &&
                bird_props.top + bird_props.height > pipe_props.top
            ) {
                endGame();
                return;
            }

            // Score increment
            if (
                pipe_props.right < bird_props.left &&
                pipe_props.right + move_speed >= bird_props.left &&
                pipe.increase_score === '1'
            ) {
                let currentScore = parseInt(score_val.innerHTML) + 1;
                score_val.innerHTML = currentScore;
                pipe.increase_score = '0';
                
                // Increase speed every 5 points
                if (currentScore % 5 === 0 && move_speed < 8) {
                    move_speed += 0.5;
                }
                
                sound_point.currentTime = 0;
                sound_point.play();
            }

            // Move pipe
            pipe.style.left = (pipe_props.left - move_speed) + 'px';
        });
        
        moveId = requestAnimationFrame(move);
    }

    function apply_gravity() {
        if (game_state !== 'Play') {
            gravityId = null;
            return;
        }
        
        bird_dy += gravity;
        let newTop = bird_props.top + bird_dy;
        bird.style.top = newTop + 'px';
        bird_props = bird.getBoundingClientRect();

        // Ground and ceiling collision
        if (bird_props.top <= 0 || bird_props.bottom >= background_rect.bottom) {
            endGame();
            return;
        }
        
        gravityId = requestAnimationFrame(apply_gravity);
    }

    let pipe_separation = 0;
    let pipe_gap = 30; // Reduced from 35 for better gameplay

    function create_pipe() {
        if (game_state !== 'Play') {
            pipeId = null;
            return;
        }
        
        if (pipe_separation > 115) {
            pipe_separation = 0;
            
            // Random pipe position (between 20% and 70% of screen)
            let pipe_posi = Math.floor(Math.random() * 50) + 20;
            
            // Create top pipe
            let topPipe = document.createElement('div');
            topPipe.className = 'pipe_sprite';
            topPipe.style.top = (pipe_posi - 70) + 'vh';
            topPipe.style.left = '100vw';
            topPipe.style.height = '70vh';
            
            // Create bottom pipe
            let bottomPipe = document.createElement('div');
            bottomPipe.className = 'pipe_sprite';
            bottomPipe.style.top = (pipe_posi + pipe_gap) + 'vh';
            bottomPipe.style.left = '100vw';
            bottomPipe.style.height = '70vh';
            bottomPipe.increase_score = '1';
            
            // Add to game screen
            document.getElementById("gameScreen").appendChild(topPipe);
            document.getElementById("gameScreen").appendChild(bottomPipe);
        }
        
        pipe_separation++;
        pipeId = requestAnimationFrame(create_pipe);
    }
    
    // Start all game loops
    moveId = requestAnimationFrame(move);
    gravityId = requestAnimationFrame(apply_gravity);
    pipeId = requestAnimationFrame(create_pipe);
}

/* ================= GAME OVER ================= */

function endGame() {
    if (game_state !== 'Play') return;
    
    game_state = 'End';
    isGameRunning = false;
    
    // Cancel all animations
    if (moveId) cancelAnimationFrame(moveId);
    if (gravityId) cancelAnimationFrame(gravityId);
    if (pipeId) cancelAnimationFrame(pipeId);
    
    // Hide bird
    img.style.display = 'none';
    
    // Show game over message
    message.innerHTML = 'Game Over!';
    message.classList.add('messageStyle');
    
    // Save score
    let finalScore = parseInt(score_val.innerHTML);
    saveScore(finalScore);
    
    // Play death sound
    sound_die.currentTime = 0;
    sound_die.play();
    
    // Clean up controls
    cleanupGameControls();
    
    // Return to menu after delay
    setTimeout(() => {
        document.getElementById("gameScreen").classList.add("hidden");
        document.getElementById("menuScreen").classList.remove("hidden");
        move_speed = 3; // Reset speed
    }, 2000);
}

/* ================= LEADERBOARD ================= */

// SIMPLER VERSION - Just update if higher score
function saveScore(score) {
    if (!currentUser || score === 0) return;
    
    let scores = JSON.parse(localStorage.getItem("flappyScores")) || [];
    
    // Remove any existing entry for this user
    scores = scores.filter(s => s.name !== currentUser);
    
    // Add new score
    scores.push({ 
        name: currentUser, 
        score: score
    });
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores
    scores = scores.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem("flappyScores", JSON.stringify(scores));
}

/* ================= INITIALIZATION ================= */

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    // Check if user was already logged in (from previous session)
    let savedUser = localStorage.getItem("lastUser");
    if (savedUser) {
        document.getElementById("username").value = savedUser;
    }
    
    // Focus on username input
    document.getElementById("username").focus();
    
    // Enter key support for login
    document.getElementById("username").addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Update login to remember user
    let originalLogin = login;
    login = function() {
        let name = document.getElementById("username").value.trim();
        if (name && name.length > 0 && !/[<>:"/\\|?*]/.test(name)) {
            localStorage.setItem("lastUser", name);
        }
        originalLogin();
    };
});

// Prevent context menu on game screen
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('#gameScreen')) {
        e.preventDefault();
    }
});