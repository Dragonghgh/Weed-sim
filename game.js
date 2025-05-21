// Game State
const gameState = {
    money: 5000,
    reputation: 50,
    day: 1,
    totalProfit: 0,
    totalHarvested: 0,
    businessLevel: 1,
    businessXP: 0,
    growSlots: 3,
    growSlotsUnlocked: 3,
    plants: [],
    inventory: {},
    upgrades: {},
    strainMastery: {},
    dealerInventory: [],
    dealerRefreshTimer: 3, // days
    dealerRefreshCounter: 0
};

// Game Data
const strains = [
    { id: 'og_kush', name: 'OG Kush', baseYield: 3, growTime: 5, basePrice: 80, rarity: 1 },
    { id: 'sour_diesel', name: 'Sour Diesel', baseYield: 4, growTime: 6, basePrice: 90, rarity: 1 },
    { id: 'blue_dream', name: 'Blue Dream', baseYield: 5, growTime: 7, basePrice: 100, rarity: 2 },
    { id: 'girl_scout_cookies', name: 'Girl Scout Cookies', baseYield: 6, growTime: 8, basePrice: 120, rarity: 2 },
    { id: 'gelato', name: 'Gelato', baseYield: 7, growTime: 9, basePrice: 140, rarity: 3 },
    { id: 'purple_haze', name: 'Purple Haze', baseYield: 8, growTime: 10, basePrice: 160, rarity: 3 },
    { id: 'white_widow', name: 'White Widow', baseYield: 10, growTime: 12, basePrice: 200, rarity: 4 }
];

const seeds = strains.map(strain => ({
    id: `${strain.id}_seed`,
    name: `${strain.name} Seed`,
    type: 'seed',
    strainId: strain.id,
    price: Math.floor(strain.basePrice * 0.3),
    rarity: strain.rarity
}));

const upgrades = [
    { id: 'grow_tent', name: 'Basic Grow Tent', description: 'Unlocks 2 additional grow slots', price: 2000, effect: { growSlots: 2 }, requiredLevel: 1 },
    { id: 'better_lights', name: 'Better Lights', description: 'Reduces grow time by 1 day for all plants', price: 5000, effect: { growTimeModifier: -1 }, requiredLevel: 2 },
    { id: 'ventilation', name: 'Ventilation System', description: 'Increases yield by 1 for all plants', price: 8000, effect: { yieldModifier: 1 }, requiredLevel: 3 },
    { id: 'security', name: 'Security System', description: 'Reduces risk of raids', price: 10000, effect: { security: 1 }, requiredLevel: 4 },
    { id: 'premium_seeds', name: 'Premium Seeds Access', description: 'Unlocks rare strains at the dealer', price: 15000, effect: { premiumSeeds: true }, requiredLevel: 5 },
    { id: 'commercial_space', name: 'Commercial Space', description: 'Unlocks 5 additional grow slots', price: 25000, effect: { growSlots: 5 }, requiredLevel: 6 },
    { id: 'hydroponics', name: 'Hydroponics System', description: 'Reduces grow time by 2 days and increases yield by 2', price: 40000, effect: { growTimeModifier: -2, yieldModifier: 2 }, requiredLevel: 7 },
    { id: 'distribution', name: 'Distribution Network', description: 'Increases sell prices by 20%', price: 60000, effect: { sellPriceModifier: 1.2 }, requiredLevel: 8 },
    { id: 'brand', name: 'Brand Recognition', description: 'Further increases sell prices by 30%', price: 100000, effect: { sellPriceModifier: 1.3 }, requiredLevel: 9 },
    { id: 'dispensary', name: 'Own Dispensary', description: 'Unlocks highest sell prices', price: 200000, effect: { dispensary: true }, requiredLevel: 10 }
];

// Initialize the game
function initGame() {
    loadGame();
    generateDealerInventory();
    renderGame();
    startGameLoop();
}

// Game loop
function startGameLoop() {
    setInterval(() => {
        gameState.day++;
        gameState.dealerRefreshCounter++;
        
        if (gameState.dealerRefreshCounter >= gameState.dealerRefreshTimer) {
            generateDealerInventory();
            gameState.dealerRefreshCounter = 0;
            showNotification('Dealer has new stock!', 'success');
        }
        
        updatePlants();
        checkUpgrades();
        renderGame();
        saveGame();
    }, 60000); // 1 minute = 1 day
}

// Update plants
function updatePlants() {
    gameState.plants.forEach(plant => {
        if (plant.stage < 4) {
            plant.progress++;
            
            if (plant.progress >= plant.growTime) {
                plant.stage++;
                plant.progress = 0;
                
                if (plant.stage === 4) {
                    showNotification(`${plant.name} is ready to harvest!`, 'success');
                }
            }
        }
    });
}

// Generate dealer inventory
function generateDealerInventory() {
    gameState.dealerInventory = [];
    
    // Always have basic seeds
    const basicSeeds = seeds.filter(seed => seed.rarity === 1);
    shuffleArray(basicSeeds);
    gameState.dealerInventory.push(...basicSeeds.slice(0, 3));
    
    // Add some medium rarity seeds
    if (gameState.reputation >= 30 || (gameState.upgrades.premium_seeds && gameState.upgrades.premium_seeds.purchased)) {
        const mediumSeeds = seeds.filter(seed => seed.rarity === 2);
        shuffleArray(mediumSeeds);
        gameState.dealerInventory.push(...mediumSeeds.slice(0, 2));
    }
    
    // Add rare seeds with higher reputation or upgrade
    if (gameState.reputation >= 70 || (gameState.upgrades.premium_seeds && gameState.upgrades.premium_seeds.purchased)) {
        const rareSeeds = seeds.filter(seed => seed.rarity === 3);
        shuffleArray(rareSeeds);
        gameState.dealerInventory.push(...rareSeeds.slice(0, 1));
    }
    
    // Add very rare seeds only with upgrade and high reputation
    if (gameState.reputation >= 90 && gameState.upgrades.premium_seeds && gameState.upgrades.premium_seeds.purchased) {
        const veryRareSeeds = seeds.filter(seed => seed.rarity === 4);
        shuffleArray(veryRareSeeds);
        gameState.dealerInventory.push(...veryRareSeeds.slice(0, 1));
    }
    
    // Add some random items (fertilizer, grow lights, etc.)
    const randomItems = [
        { id: 'fertilizer', name: 'Fertilizer', description: 'Speeds up plant growth by 1 day', type: 'item', price: 500, effect: { growTimeModifier: -1 } },
        { id: 'grow_light', name: 'Grow Light', description: 'Increases yield by 1 for next harvest', type: 'item', price: 800, effect: { yieldModifier: 1 } },
        { id: 'security_upgrade', name: 'Security Upgrade', description: 'Reduces risk of raids for 7 days', type: 'item', price: 1200, effect: { security: 1, duration: 7 } }
    ];
    
    shuffleArray(randomItems);
    gameState.dealerInventory.push(...randomItems.slice(0, 2));
}

// Plant a seed
function plantSeed(seedId, slotIndex) {
    const seed = seeds.find(s => s.id === seedId);
    if (!seed) return false;
    
    const strain = strains.find(s => s.id === seed.strainId);
    if (!strain) return false;
    
    // Check if slot is empty
    if (gameState.plants[slotIndex]) return false;
    
    // Create plant
    const plant = {
        id: `${strain.id}_${Date.now()}`,
        name: strain.name,
        strainId: strain.id,
        stage: 0, // 0-3 (seedling, vegetative, flowering, harvest)
        progress: 0,
        growTime: strain.growTime,
        yield: strain.baseYield,
        quality: 1, // 0.8-1.2 based on random factors
        slot: slotIndex
    };
    
    // Apply upgrades
    if (gameState.upgrades.better_lights && gameState.upgrades.better_lights.purchased) {
        plant.growTime += gameState.upgrades.better_lights.effect.growTimeModifier;
    }
    
    if (gameState.upgrades.ventilation && gameState.upgrades.ventilation.purchased) {
        plant.yield += gameState.upgrades.ventilation.effect.yieldModifier;
    }
    
    gameState.plants[slotIndex] = plant;
    
    // Update strain mastery
    if (!gameState.strainMastery[strain.id]) {
        gameState.strainMastery[strain.id] = { harvested: 0, experience: 0 };
    }
    
    return true;
}

// Harvest a plant
function harvestPlant(slotIndex) {
    const plant = gameState.plants[slotIndex];
    if (!plant || plant.stage < 3) return false;
    
    const strain = strains.find(s => s.id === plant.strainId);
    if (!strain) return false;
    
    // Calculate final yield
    let finalYield = plant.yield;
    finalYield = Math.max(1, Math.floor(finalYield * plant.quality));
    
    // Add to inventory
    if (!gameState.inventory[strain.id]) {
        gameState.inventory[strain.id] = 0;
    }
    gameState.inventory[strain.id] += finalYield;
    
    // Update stats
    gameState.totalHarvested += finalYield;
    
    // Update strain mastery
    gameState.strainMastery[strain.id].harvested += finalYield;
    gameState.strainMastery[strain.id].experience += 1;
    
    // Clear the slot
    gameState.plants[slotIndex] = null;
    
    return finalYield;
}

// Buy item from dealer
function buyFromDealer(itemId) {
    const item = gameState.dealerInventory.find(i => i.id === itemId);
    if (!item) return false;
    
    if (gameState.money < item.price) {
        showNotification('Not enough money!', 'error');
        return false;
    }
    
    // Handle different item types
    if (item.type === 'seed') {
        // For seeds, just add to inventory
        if (!gameState.inventory[item.id]) {
            gameState.inventory[item.id] = 0;
        }
        gameState.inventory[item.id]++;
    } else if (item.type === 'item') {
        // For items, apply their effect immediately
        applyItemEffect(item);
    }
    
    // Deduct money
    gameState.money -= item.price;
    
    // Remove from dealer inventory
    gameState.dealerInventory = gameState.dealerInventory.filter(i => i.id !== itemId);
    
    // Increase reputation slightly
    gameState.reputation = Math.min(100, gameState.reputation + 1);
    
    showNotification(`Purchased ${item.name} for $${item.price}`, 'success');
    return true;
}

// Apply item effect
function applyItemEffect(item) {
    // This would apply the item's effect to the game
    // For now just show a notification
    showNotification(`Used ${item.name}: ${item.description}`, 'success');
}

// Sell product
function sellProduct(strainId, amount, priceType) {
    if (!gameState.inventory[strainId] || gameState.inventory[strainId] < amount) {
        showNotification('Not enough product to sell!', 'error');
        return false;
    }
    
    const strain = strains.find(s => s.id === strainId);
    if (!strain) return false;
    
    let pricePerUnit;
    switch (priceType) {
        case 'low':
            pricePerUnit = strain.basePrice * 0.6;
            break;
        case 'medium':
            pricePerUnit = strain.basePrice;
            break;
        case 'high':
            pricePerUnit = strain.basePrice * 1.4;
            break;
        default:
            pricePerUnit = strain.basePrice;
    }
    
    // Apply upgrades
    if (gameState.upgrades.distribution && gameState.upgrades.distribution.purchased) {
        pricePerUnit *= gameState.upgrades.distribution.effect.sellPriceModifier;
    }
    
    if (gameState.upgrades.brand && gameState.upgrades.brand.purchased) {
        pricePerUnit *= gameState.upgrades.brand.effect.sellPriceModifier;
    }
    
    if (gameState.upgrades.dispensary && gameState.upgrades.dispensary.purchased) {
        pricePerUnit *= 1.5; // Even higher prices with dispensary
    }
    
    // Calculate total
    const total = Math.floor(pricePerUnit * amount);
    
    // Update game state
    gameState.inventory[strainId] -= amount;
    gameState.money += total;
    gameState.totalProfit += total;
    
    // Update reputation based on sale type
    if (priceType === 'low') {
        gameState.reputation = Math.max(0, gameState.reputation - 1);
    } else if (priceType === 'high') {
        gameState.reputation = Math.min(100, gameState.reputation + 2);
    }
    
    // Add business XP
    addBusinessXP(amount);
    
    showNotification(`Sold ${amount}oz of ${strain.name} for $${total}`, 'success');
    return true;
}

// Buy upgrade
function buyUpgrade(upgradeId) {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    
    if (gameState.money < upgrade.price) {
        showNotification('Not enough money for this upgrade!', 'error');
        return false;
    }
    
    if (gameState.businessLevel < upgrade.requiredLevel) {
        showNotification(`Requires business level ${upgrade.requiredLevel}`, 'error');
        return false;
    }
    
    // Check if already purchased
    if (gameState.upgrades[upgradeId] && gameState.upgrades[upgradeId].purchased) {
        showNotification('You already have this upgrade!', 'warning');
        return false;
    }
    
    // Purchase the upgrade
    gameState.money -= upgrade.price;
    gameState.upgrades[upgradeId] = {
        purchased: true,
        effect: upgrade.effect
    };
    
    // Apply immediate effects
    if (upgrade.effect.growSlots) {
        gameState.growSlotsUnlocked += upgrade.effect.growSlots;
    }
    
    // Add business XP
    addBusinessXP(upgrade.price / 100);
    
    showNotification(`Purchased upgrade: ${upgrade.name}`, 'success');
    return true;
}

// Add business XP
function addBusinessXP(amount) {
    gameState.businessXP += amount;
    
    // Check for level up
    const xpNeeded = gameState.businessLevel * 1000;
    if (gameState.businessXP >= xpNeeded) {
        gameState.businessLevel++;
        gameState.businessXP = 0;
        showNotification(`Business leveled up to ${gameState.businessLevel}!`, 'success');
    }
}

// Check for available upgrades
function checkUpgrades() {
    // This would check if any new upgrades are available based on level/reputation
}

// Show notification
function showNotification(message, type = 'success') {
    const notificationArea = document.querySelector('.notification-area');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Render the game
function renderGame() {
    // Update stats
    document.getElementById('money').textContent = `$${gameState.money.toLocaleString()}`;
    document.getElementById('reputation').textContent = gameState.reputation;
    document.getElementById('day').textContent = `Day ${gameState.day}`;
    document.getElementById('total-profit').textContent = `$${gameState.totalProfit.toLocaleString()}`;
    document.getElementById('total-harvested').textContent = `${gameState.totalHarvested}oz`;
    document.getElementById('business-level').textContent = `Level ${gameState.businessLevel}`;
    
    // Render grow room
    renderGrowRoom();
    
    // Render dealer
    renderDealer();
    
    // Render market
    renderMarket();
    
    // Render upgrades
    renderUpgrades();
    
    // Render stats
    renderStats();
}

// Render grow room
function renderGrowRoom() {
    const growSlotsContainer = document.querySelector('.grow-slots');
    growSlotsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.growSlotsUnlocked; i++) {
        const slot = document.createElement('div');
        slot.className = 'grow-slot';
        slot.dataset.slotIndex = i;
        
        const plant = gameState.plants[i];
        if (plant) {
            slot.classList.add('occupied');
            
            const plantDiv = document.createElement('div');
            plantDiv.className = 'plant';
            
            const plantName = document.createElement('div');
            plantName.className = 'plant-name';
            plantName.textContent = plant.name;
            
            const plantStage = document.createElement('div');
            plantStage.className = 'plant-stage';
            
            const stages = ['Seedling', 'Vegetative', 'Flowering', 'Ready to Harvest'];
            plantStage.textContent = stages[plant.stage];
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progress = document.createElement('div');
            progress.className = 'progress';
            
            // Calculate progress percentage
            const progressPercent = (plant.progress / plant.growTime) * 100;
            progress.style.width = `${progressPercent}%`;
            
            progressBar.appendChild(progress);
            
            plantDiv.appendChild(plantName);
            plantDiv.appendChild(plantStage);
            plantDiv.appendChild(progressBar);
            
            if (plant.stage === 3) {
                const harvestBtn = document.createElement('button');
                harvestBtn.className = 'btn harvest-btn';
                harvestBtn.textContent = 'Harvest';
                harvestBtn.addEventListener('click', () => {
                    const yieldAmount = harvestPlant(i);
                    if (yieldAmount) {
                        showNotification(`Harvested ${yieldAmount}oz of ${plant.name}!`, 'success');
                        renderGame();
                    }
                });
                
                plantDiv.appendChild(harvestBtn);
            }
            
            slot.appendChild(plantDiv);
        } else {
            slot.classList.add('empty');
            
            // Show seed selection if player has seeds
            const playerSeeds = Object.entries(gameState.inventory)
                .filter(([id, amount]) => id.endsWith('_seed') && amount > 0)
                .map(([id]) => seeds.find(s => s.id === id));
            
            if (playerSeeds.length > 0) {
                const seedSelect = document.createElement('select');
                seedSelect.className = 'seed-select';
                
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a seed';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                seedSelect.appendChild(defaultOption);
                
                playerSeeds.forEach(seed => {
                    const option = document.createElement('option');
                    option.value = seed.id;
                    option.textContent = `${seed.name} (${gameState.inventory[seed.id]} available)`;
                    seedSelect.appendChild(option);
                });
                
                const plantBtn = document.createElement('button');
