let gameData = {
    fish: 0,
    displayedFish: 0,
    fishPerClick: 1,
    fishPerSecond: 0, 
    rebirths: 0,
    multiplier: 1.0,
    currentVolume: 0.5,
    
    upgrades: {
        rod:       { level: 0, cost: 10,   power: 1,   baseMaxLevel: 15, costScale: 1.30 },
        bread:     { level: 0, cost: 15,   power: 1,   baseMaxLevel: 40, costScale: 1.15 },
        worm:      { level: 0, cost: 80,   power: 5,   baseMaxLevel: 30, costScale: 1.15 },
        shrimp:    { level: 0, cost: 400,  power: 22,  baseMaxLevel: 20, costScale: 1.16 },
        squid:     { level: 0, cost: 2500, power: 110, baseMaxLevel: 10, costScale: 1.18 }
    }
};

const rodModels = [
    "Basic Wooden Rod",      
    "Sturdy Bamboo Pole",    
    "Reinforced Fiberglass", 
    "Carbon-Weave Caster",   
    "Titanium Deep-Spool",   
    "Graphite Apex Rod",     
    "Chronos Temporal Reel", 
    "Quantum Magnetic Rod"   
];

const bgMusic = document.getElementById('bg-music');

initSmoothScoreEngine();
initPassiveIncomeLoop(); 

function playSound(id) {
    const origSound = document.getElementById(id);
    if(origSound) {
        const soundClone = origSound.cloneNode();
        soundClone.volume = gameData.currentVolume;
        soundClone.play().catch(e => {});
    }
}

function startGame() {
    playSound('pop-sound');
    document.getElementById('start-screen').classList.replace('visible', 'hidden');
    document.getElementById('game-screen').classList.replace('hidden', 'visible');
    
    loadGame();
    fadeInBackgroundMusic(8000);
    
    initAmbientBubbles();
    startAmbientPondLife();
    updateAquariumDensity();
    updateUI();
    
    setInterval(saveGame, 5000);
}

function saveGame() {
    localStorage.setItem("fishingClickerSave_v5_tycoon", JSON.stringify(gameData));
}

function loadGame() {
    let savedData = localStorage.getItem("fishingClickerSave_v5_tycoon");
    if (savedData) {
        let parsedData = JSON.parse(savedData);
        gameData.fish = parsedData.fish || 0;
        gameData.displayedFish = parsedData.fish || 0;
        gameData.fishPerClick = parsedData.fishPerClick || 1;
        gameData.fishPerSecond = parsedData.fishPerSecond || 0;
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
    }
}

function fadeInBackgroundMusic(durationMs) {
    bgMusic.volume = 0;
    bgMusic.play().catch(e => {});
    let targetVolume = gameData.currentVolume;
    let stepTime = 100;
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

function initPassiveIncomeLoop() {
    setInterval(() => {
        if (gameData.fishPerSecond > 0) {
            let fractionalIncome = (gameData.fishPerSecond * gameData.multiplier) / 33;
            gameData.fish += fractionalIncome;
        }
    }, 30); 
}

function initSmoothScoreEngine() {
    setInterval(() => {
        let roundedTarget = Math.floor(gameData.fish);
        if (gameData.displayedFish < roundedTarget) {
            let diff = roundedTarget - gameData.displayedFish;
            let step = Math.ceil(diff * 0.15);
            gameData.displayedFish += step;
            document.getElementById('fish-count').innerText = gameData.displayedFish;
        } else if (gameData.displayedFish > roundedTarget) {
            gameData.displayedFish = roundedTarget;
            document.getElementById('fish-count').innerText = gameData.displayedFish;
        }
    }, 30);
}

function clickPond(event) {
    playSound('pop-sound');
    let finalEarned = Math.round(gameData.fishPerClick * gameData.multiplier);
    gameData.fish += finalEarned;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    spawnAdvancedSplashFX(x, y);
    createFloatingNumber(`+${finalEarned}`, x, y);
    updateUI();
}

function spawnAdvancedSplashFX(clickX, clickY) {
    const particleLayer = document.getElementById('fx-particle-layer');
    if(!particleLayer) return;
    
    const ripple = document.createElement('div');
    ripple.classList.add('water-ripple-ring');
    ripple.style.left = `${clickX}px`;
    ripple.style.top = `${clickY}px`;
    particleLayer.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 600);
    
    const dropletCount = 8;
    for (let i = 0; i < dropletCount; i++) {
        const droplet = document.createElement('div');
        droplet.classList.add('splash-droplet');
        
        let size = Math.random() * 8 + 4;
        droplet.style.width = `${size}px`;
        droplet.style.height = `${size + 4}px`;
        droplet.style.left = `${clickX}px`;
        droplet.style.top = `${clickY}px`;
        
        particleLayer.appendChild(droplet);
        
        let angle = (i * (360 / dropletCount)) + (Math.random() * 20 - 10);
        let radians = angle * (Math.PI / 180);
        let velocity = Math.random() * 4 + 3;
        
        let velocityX = Math.cos(radians) * velocity;
        let velocityY = Math.sin(radians) * velocity - 4;
        let gravity = 0.4;
        
        let currentX = clickX;
        let currentY = clickY;
        let opacity = 1;
        
        let particleLoop = setInterval(() => {
            velocityY += gravity;
            currentX += velocityX;
            currentY += velocityY;
            opacity -= 0.05;
            
            droplet.style.left = `${currentX}px`;
            droplet.style.top = `${currentY}px`;
            droplet.style.opacity = opacity;
            droplet.style.transform = `rotate(${angle + 90}deg)`;
            
            if (opacity <= 0) {
                clearInterval(particleLoop);
                droplet.remove();
            }
        }, 25);
    }
}

function buildCartoonFishDOM(themeClass) {
    const fishContainer = document.createElement('div');
    fishContainer.className = `cartoon-fish-art ${themeClass}`;
    fishContainer.innerHTML = `
        <div class="fish-tail"></div>
        <div class="fish-body">
            <div class="fish-eye"><div class="fish-pupil"></div></div>
            <div class="fish-fin"></div>
        </div>
    `;
    return fishContainer;
}

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
        
        if (type === 'rod') {
            gameData.fishPerClick += upgrade.power;
        } else {
            gameData.fishPerSecond += upgrade.power;
        }
        
        upgrade.cost = Math.floor(upgrade.cost * upgrade.costScale); 
        
        updateAquariumDensity(); 
        updateUI();
        saveGame();
    } else {
        triggerCustomNotification();
    }
}

function checkRebirthStatus() {
    let ready = true;
    for (let key in gameData.upgrades) {
        let currentMax = getCurrentMaxLevel(key);
        if (gameData.upgrades[key].level < currentMax) { ready = false; break; }
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
        gameData.multiplier += 0.50;
        
        gameData.fish = 0;
        gameData.displayedFish = 0;
        gameData.fishPerClick = 1;
        gameData.fishPerSecond = 0;
        
        gameData.upgrades.rod.cost = 10;
        gameData.upgrades.bread.cost = 15;
        gameData.upgrades.worm.cost = 80;
        gameData.upgrades.shrimp.cost = 400;
        gameData.upgrades.squid.cost = 2500;
        
        for (let key in gameData.upgrades) { gameData.upgrades[key].level = 0; }
        
        updateAquariumDensity();
        updateUI();
        saveGame();
        alert(`🪐 Ascension Complete! All production speeds accelerated by +50%!`);
    }
}

function initAmbientBubbles() {
    const container = document.getElementById('bubble-container');
    if(!container) return;
    setInterval(() => {
        const bubble = document.createElement('div');
        bubble.classList.add('bg-bubble');
        let size = Math.random() * 14 + 6;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.bottom = `-20px`;
        bubble.style.position = 'absolute';
        bubble.style.pointerEvents = 'none';
        
        let duration = Math.random() * 4 + 5;
        bubble.style.transition = `transform ${duration}s linear, opacity ${duration}s`;
        container.appendChild(bubble);
        
        setTimeout(() => {
            bubble.style.transform = `translateY(-110vh) translateX(${Math.random() * 40 - 20}px)`;
            bubble.style.opacity = '0';
        }, 50);
        setTimeout(() => { bubble.remove(); }, duration * 1000 + 100);
    }, 700);
}

function updateAquariumDensity() {
    const aquarium = document.getElementById('swimming-fish-aquarium');
    if(!aquarium) return;
    aquarium.innerHTML = "";
    
    let totalLevels = 0;
    for(let key in gameData.upgrades) { totalLevels += gameData.upgrades[key].level; }
    let targetFishCount = Math.min(Math.floor(totalLevels / 3) + 1, 25); 
    
    const themes = ['fish-theme-red', 'fish-theme-blue', 'fish-theme-gold'];

    for (let i = 0; i < targetFishCount; i++) {
        let chosenTheme = themes[Math.floor(Math.random() * themes.length)];
        const fishWrapper = buildCartoonFishDOM(chosenTheme);
        fishWrapper.classList.add('aquarium-fish-instance');
        
        fishWrapper.style.top = `${Math.random() * 50 + 20}%`;
        fishWrapper.style.animationDuration = `${Math.random() * 5 + 8}s`;
        fishWrapper.style.animationDelay = `${Math.random() * -10}s`;
        
        aquarium.appendChild(fishWrapper);
    }
}

function createFloatingNumber(text, targetX, targetY) {
    const pondWrapper = document.getElementById('pond-wrapper');
    if(!pondWrapper) return;
    
    const floatText = document.createElement('div');
    floatText.className = 'floating-score';
    floatText.innerText = text;
    floatText.style.left = `${targetX}px`;
    floatText.style.top = `${targetY}px`;
    
    pondWrapper.appendChild(floatText);
    setTimeout(() => { floatText.remove(); }, 700);
}

function startAmbientPondLife() {
    setInterval(() => { if (Math.random() < 0.35) { triggerJumpingFish(); } }, 2500);
}

function triggerJumpingFish() {
    const container = document.getElementById('jumping-fish-container');
    if(!container) return;
    
    const themes = ['fish-theme-red', 'fish-theme-blue', 'fish-theme-gold'];
    let chosenTheme = themes[Math.floor(Math.random() * themes.length)];
    
    const jumpingFish = buildCartoonFishDOM(chosenTheme);
    jumpingFish.classList.add('jumping-fish-instance');
    
    let spawnX = Math.random() * 100 + 50;
    jumpingFish.style.left = `${spawnX}px`;
    jumpingFish.style.top = `100px`;
    
    container.appendChild(jumpingFish);
    playSound('splash-sound');
    
    setTimeout(() => { spawnAdvancedSplashFX(spawnX + 100, 240); }, 1000);
    setTimeout(() => { jumpingFish.remove(); }, 1300);
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
    document.getElementById('fps-count').innerText = Math.round(gameData.fishPerSecond * gameData.multiplier);

    let modelIndex = Math.min(Math.floor(gameData.upgrades.rod.level / 2), rodModels.length - 1);
    document.getElementById('rod-name-display').innerText = rodModels[modelIndex];

    for (let type in gameData.upgrades) {
        let upgrade = gameData.upgrades[type];
        let currentMax = getCurrentMaxLevel(type);
        const badge = document.getElementById(`${type}-badge`);
        
        if (badge) {
            if (upgrade.level >= currentMax) {
                badge.innerText = "MAXED";
                badge.classList.add('lvl-maxed');
            } else {
                badge.innerHTML = `Lv. ${upgrade.level}/${currentMax}`;
                badge.classList.remove('lvl-maxed');
            }
        }
        const costEl = document.getElementById(`${type}-cost`);
        if(costEl) costEl.innerText = upgrade.level >= currentMax ? "MAX" : upgrade.cost;
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
    saveGame();
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
