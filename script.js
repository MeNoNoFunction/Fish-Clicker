let gameData = {
    fish: 0,
    displayedFish: 0, // Targets counting animations safely
    fishPerClick: 1,
    rebirths: 0,
    multiplier: 1.0,
    currentVolume: 0.5,
    
    // STAGGERED LEVEL CAPS: Lower tiers level high, upper tiers have strict limits
    upgrades: {
        hook:      { level: 0, cost: 10,   power: 1,   baseMaxLevel: 40 },
        line:      { level: 0, cost: 50,   power: 5,   baseMaxLevel: 30 },
        bait:      { level: 0, cost: 250,  power: 25,  baseMaxLevel: 20 },
        rod:       { level: 0, cost: 1000, power: 100, baseMaxLevel: 15 },
        tackleBox: { level: 0, cost: 5000, power: 500, baseMaxLevel: 10 }
    }
};

const bgMusic = document.getElementById('bg-music');

// Start up display score rendering calculations right away
initSmoothScoreEngine();

function playSound(id) {
    const origSound = document.getElementById(id);
    if(origSound) {
        const soundClone = origSound.cloneNode();
        soundClone.volume = gameData.currentVolume;
        soundClone.play().catch(e => {});
    }
}

// Triggers exactly when hitting "CAST LINE"
function startGame() {
    playSound('pop-sound');
    
    // Smooth page transitions
    document.getElementById('start-screen').classList.replace('visible', 'hidden');
    document.getElementById('game-screen').classList.replace('hidden', 'visible');
    
    // LOAD SAVED PROGRESS ON BOOTUP
    loadGame();
    
    // Run the 10-second volume fade engine
    fadeInBackgroundMusic(10000);
    
    // Ignite in-game graphics engine
    initAmbientBubbles();
    startAmbientPondLife();
    updateAquariumDensity();
    updateUI();
    
    // BACKGROUND AUTO-SAVE ENGINE: Saves progress automatically every 5 seconds
    setInterval(saveGame, 5000);
}

// --- LOCAL STORAGE SAVE & LOAD ENGINE ---
function saveGame() {
    // Converts your game data object into a text string and saves it to the browser memory
    localStorage.setItem("fishingClickerSave_v2", JSON.stringify(gameData));
    console.log("Game progress auto-saved safely.");
}

function loadGame() {
    let savedData = localStorage.getItem("fishingClickerSave_v2");
    if (savedData) {
        let parsedData = JSON.parse(savedData);
        
        // Safety check: ensure existing structure fits perfectly
        gameData.fish = parsedData.fish || 0;
        gameData.displayedFish = parsedData.fish || 0; // Prevent score ticking from 0 on load
        gameData.fishPerClick = parsedData.fishPerClick || 1;
        gameData.rebirths = parsedData.rebirths || 0;
        gameData.multiplier = parsedData.multiplier || 1.0;
        gameData.currentVolume = parsedData.currentVolume !== undefined ? parsedData.currentVolume : 0.5;
        
        if (parsedData.upgrades) {
            for (let key in gameData.upgrades) {
                if (parsedData.upgrades[key]) {
                    gameData.upgrades[key].level = parsedData.upgrades[key].level || 0;
                    gameData.upgrades[key].cost = parsedData.upgrades[key].cost || gameData.upgrades[key].cost;
                }
            }
        }
        console.log("Welcome back, Angler! Progress restored successfully.");
    }
}

// --- SMOOTH AUDIO FADE LOGIC ---
function fadeInBackgroundMusic(durationMs) {
    bgMusic.volume = 0;
    bgMusic.play().catch(e => console.log("Audio waiting for desktop focus channels."));
    
    let targetVolume = gameData.currentVolume;
    let stepTime = 100; // Intervals occur every 100ms
    let totalSteps = durationMs / stepTime;
    let volumeIncrement = targetVolume / totalSteps;
    
    let fadeInterval = setInterval(() => {
        if (bgMusic.volume < targetVolume) {
            bgMusic.volume = Math.min(bgMusic.volume + volumeIncrement, targetVolume);
        } else {
            clearInterval(fadeInterval);
        }
    }, stepTime);
}

// --- SMOOTH ODOMETER VALUE ENGINES ---
function initSmoothScoreEngine() {
    setInterval(() => {
        if (gameData.displayedFish < gameData.fish) {
            let diff = gameData.fish - gameData.displayedFish;
            let step = Math.ceil(diff * 0.15); // Snap up 15% closer each loop execution
            gameData.displayedFish += step;
            document.getElementById('fish-count').innerText = gameData.displayedFish;
        } else if (gameData.displayedFish > gameData.fish) {
            // instant reset correction (crucial for Rebirth updates)
            gameData.displayedFish = gameData.fish;
            document.getElementById('fish-count').innerText = gameData.displayedFish;
        }
    }, 30); // ~33 tracking checks executed per second
}

function clickPond() {
    playSound('pop-sound');
    let finalEarned = Math.round(gameData.fishPerClick * gameData.multiplier);
    
    gameData.fish += finalEarned;
    createFloatingNumber(`+${finalEarned}`);
    updateUI();
}

// Calculates current max tier ceiling based on Rebirth tier progression
function getCurrentMaxLevel(type) {
    return gameData.upgrades[type].baseMaxLevel + (gameData.rebirths * 5);
}

function buyUpgrade(type) {
    let upgrade = gameData.upgrades[type];
    let currentMax = getCurrentMaxLevel(type);
    
    if (upgrade.level >= currentMax) return; 
    
    if (gameData.fish >= upgrade.cost) {
        playSound('pop-sound');
        gameData.fish -= upgrade.cost;          
        upgrade.level++;                        
        gameData.fishPerClick += upgrade.power; 
        upgrade.cost = Math.floor(upgrade.cost * 1.5); 
        
        updateAquariumDensity(); 
        updateUI();
        
        saveGame(); // Force an instant structural backup save on purchase
    } else {
        triggerCustomNotification();
    }
}

// --- REBIRTH REQUIREMENT COUPLINGS ---
function checkRebirthStatus() {
    let ready = true;
    for (let key in gameData.upgrades) {
        let currentMax = getCurrentMaxLevel(key);
        if (gameData.upgrades[key].level < currentMax) {
            ready = false;
            break;
        }
    }
    
    const rbBtn = document.getElementById('rebirth-btn');
    if (ready) {
        rbBtn.className = "rebirth-btn-ready";
        rbBtn.innerText = "⭐ READY TO REBIRTH ⭐";
    } else {
        rbBtn.className = "rebirth-btn-locked";
        rbBtn.innerText = "🔒 REBIRTH LOCKED";
    }
    return ready;
}

function attemptRebirth() {
    if (checkRebirthStatus()) {
        playSound('rebirth-sound');
        
        gameData.rebirths++;
        gameData.multiplier += 0.15; 
        
        // Reset economy local loop structures cleanly
        gameData.fish = 0;
        gameData.displayedFish = 0;
        gameData.fishPerClick = 1;
        
        for (let key in gameData.upgrades) {
            gameData.upgrades[key].level = 0;
        }
        gameData.upgrades.hook.cost = 10;
        gameData.upgrades.line.cost = 50;
        gameData.upgrades.bait.cost = 250;
        gameData.upgrades.rod.cost = 1000;
        gameData.upgrades.tackleBox.cost = 5000;
        
        updateAquariumDensity();
        updateUI();
        
        saveGame(); // Force save tracking immediately following rebirth sequence
        
        alert(`🪐 Rebirth Complete! All items can now go +5 levels higher!`);
    }
}

// --- PARTICLE GENERATION ENGINE ---
function initAmbientBubbles() {
    const container = document.getElementById('bubble-container');
    if(!container) return;
    setInterval(() => {
        const bubble = document.createElement('div');
        bubble.classList.add('bg-bubble');
        let size = Math.random() * 20 + 8;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 5 + 6}s`;
        container.appendChild(bubble);
        setTimeout(() => { bubble.remove(); }, 11000);
    }, 400);
}

function updateAquariumDensity() {
    const aquarium = document.getElementById('swimming-fish-aquarium');
    if(!aquarium) return;
    aquarium.innerHTML = "";
    let totalLevels = 0;
    for(let key in gameData.upgrades) { totalLevels += gameData.upgrades[key].level; }
    let targetFishCount = Math.floor(totalLevels / 3) + 1;
    const fishSprites = ['🐟', '🐠', '🐡'];

    for (let i = 0; i < targetFishCount; i++) {
        const fish = document.createElement('div');
        fish.classList.add('aquarium-fish');
        fish.innerText = fishSprites[Math.floor(Math.random() * fishSprites.length)];
        fish.style.top = `${Math.random() * 60 + 20}%`;
        fish.style.animationDuration = `${Math.random() * 6 + 8}s`;
        fish.style.animationDelay = `${Math.random() * -10}s`;
        aquarium.appendChild(fish);
    }
}

function createFloatingNumber(text) {
    const pondWrapper = document.getElementById('pond-wrapper');
    if(!pondWrapper) return;
    const floatText = document.createElement('div');
    floatText.innerText = text;
    floatText.style.position = 'absolute';
    floatText.style.left = `${Math.random() * 40 + 40}%`;
    floatText.style.top = `${Math.random() * 30 + 30}%`;
    floatText.style.fontSize = '2.2rem';
    floatText.style.fontWeight = 'bold';
    floatText.style.color = '#74ebd5';
    floatText.style.textShadow = '2px 2px 8px #001f3f';
    floatText.style.pointerEvents = 'none';
    floatText.style.transition = 'all 0.8s ease-out';
    pondWrapper.appendChild(floatText);
    setTimeout(() => {
        floatText.style.transform = 'translateY(-70px) scale(1.2)';
        floatText.style.opacity = '0';
    }, 50);
    setTimeout(() => { floatText.remove(); }, 850);
}

function startAmbientPondLife() {
    setInterval(() => { if (Math.random() < 0.4) { triggerJumpingFish(); } }, 3000);
}

function triggerJumpingFish() {
    const container = document.getElementById('jumping-fish-container');
    if(!container) return;
    const fish = document.createElement('div');
    fish.classList.add('jumping-fish');
    const fishTypes = ['🐟', '🐠', '🐡'];
    fish.innerText = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    fish.style.left = `${Math.random() * 60 + 20}%`;
    fish.style.top = `${Math.random() * 40 + 30}%`;
    container.appendChild(fish);
    playSound('splash-sound');
    setTimeout(() => { fish.remove(); }, 1200);
}

function triggerCustomNotification() {
    const notification = document.getElementById('notification');
    if(!notification) return;
    notification.classList.add('hidden');
    void notification.offsetWidth; 
    notification.classList.remove('hidden');
}

function updateUI() {
    document.getElementById('rebirth-count').innerText = gameData.rebirths;
    document.getElementById('multiplier-count').innerText = `+${Math.round((gameData.multiplier - 1) * 100)}%`;
    
    let baseEarned = gameData.fishPerClick * gameData.multiplier;
    document.getElementById('fpc-count').innerText = Math.round(baseEarned);

    for (let type in gameData.upgrades) {
        let upgrade = gameData.upgrades[type];
        let currentMax = getCurrentMaxLevel(type);
        const badge = document.getElementById(`${type}-badge`);
        
        if (upgrade.level >= currentMax) {
            document.getElementById(`${type}-cost`).innerText = "MAXED";
            badge.innerText = "MAX LVL";
            badge.classList.add('lvl-maxed');
        } else {
            document.getElementById(`${type}-cost`).innerText = upgrade.cost;
            badge.innerHTML = `Lv. <span id="${type}-lvl">${upgrade.level}</span>/${currentMax}`;
            badge.classList.remove('lvl-maxed');
        }
    }
    checkRebirthStatus();
}

function toggleSettingsMenu() {
    playSound('pop-sound');
    document.getElementById('settings-overlay').classList.toggle('hidden');
}

function changeVolume(val) {
    gameData.currentVolume = val;
    bgMusic.volume = val;
    saveGame(); // Save settings choice natively
}

function toggleMute() {
    playSound('pop-sound');
    const muteBtn = document.getElementById('mute-btn');
    if (bgMusic.muted) {
        bgMusic.muted = false;
        muteBtn.innerText = "Mute Audio";
    } else {
        bgMusic.muted = true;
        muteBtn.innerText = "Unmute Audio";
    }
}