// Состояние игры
let state = {
    dissidents: 0,
    total_dissidents: 0,
    cps: 0,
    event_cps_bonus: 0,
    click_power: 1,
    current_stage: 0,
    vip_active: false,
    // Новые модификаторы
    click_multiplier: 1, // Мультипликатор кликов
    discount: 0,         // Скидка на покупку инструментов (в процентах)
    game_speed: 1        // Ускорение игры (множитель всего CPS)
};

const upgrades = [
    {id: "informers", name: "Осведомители-соседи", base_cost: 15, cps: 1, count: 0, icon: "assets/1.png"},
    {id: "cameras", name: "Камеры слежения", base_cost: 100, cps: 5, count: 0, icon: "assets/2.png"},
    {id: "wiretap", name: "Прослушка телефонов", base_cost: 500, cps: 20, count: 0, icon: "assets/3.png"},
    {id: "bank", name: "Отслеживание транзакций", base_cost: 2000, cps: 80, count: 0, icon: "assets/4.png"},
    {id: "thought", name: "Полиция мыслей", base_cost: 10000, cps: 400, count: 0, icon: "assets/5.png"}
];

// Расширенный список доктрин (включая мультипликаторы, скидки, ускорение и скип времени)
const clickUpgrades = [
    {id: "c_0", name: "Пятиминутки ненависти", desc: "+2 к силе клика", cost: 150, type: "flat", value: 2, req_stage: 1, purchased: false, icon: "assets/6.png"},
    {id: "c_1", name: "Внедрение Новояза", desc: "Увеличивает силу кликов в 2 раза (x2)", cost: 800, type: "mult", value: 2, req_stage: 1, purchased: false, icon: "assets/7.png"},
    {id: "c_2", name: "Эффективность МинПравды", desc: "Скидка 15% на все инструменты контроля", cost: 2500, type: "discount", value: 15, req_stage: 2, purchased: false, icon: "assets/8.png"},
    {id: "c_3", name: "Курсы Двоемыслия", desc: "+25 к силе клика", cost: 15000, type: "flat", value: 25, req_stage: 3, purchased: false, icon: "assets/8.png"},
    {id: "c_4", name: "Форсирование пятилетки", desc: "Ускоряет всю игру в 1.5 раза (+50% CPS)", cost: 35000, type: "speed", value: 1.5, req_stage: 3, purchased: false, icon: "assets/6.png"},
    {id: "c_5", name: "Машина времени Океании", desc: "Мгновенно пропускает 2 часа пассивного дохода", cost: 60000, type: "time_skip", value: 7200, req_stage: 4, purchased: false, icon: "assets/6.png"},
    {id: "c_6", name: "Комната 101", desc: "+100 к силе клика", cost: 75000, type: "flat", value: 100, req_stage: 4, purchased: false, icon: "assets/8.png"}
];

const stages = [
    {threshold: 0, message: "Этап 0: Ручная работа. Старший Брат смотрит на тебя."},
    {
        threshold: 100, message: "Этап 1: Распознавание лиц. Партия вами довольна.",
        event: {
            title: "Допрос подозреваемого", text: "Пойман член подполья. Он предлагает сдать сообщников в обмен на улучшенный паек. Ваши действия?",
            choices: [
                {text: "Отправить в Комнату 101 (+50 дисс.)", reward_dis: 50, reward_cps: 0, reward_click: 0},
                {text: "Сделать двойным агентом (+2 авто/сек)", reward_dis: 0, reward_cps: 2, reward_click: 0},
                {text: "(Реклама) Ролик МинИзобилия\n(+500 дисс., +15 авто/сек, +5 клик)", reward_dis: 500, reward_cps: 15, reward_click: 5, is_ad: true}
            ]
        }
    },
    {
        threshold: 1000, message: "Этап 2: Эра прозрачности. Личного пространства больше нет.",
        event: {
            title: "Излишки производства", text: "Завод телекранов перевыполнил план на 146%. Куда направить излишки?",
            choices: [
                {text: "В жилые кварталы пролов (+500 дисс.)", reward_dis: 500, reward_cps: 0, reward_click: 0},
                {text: "Кабинеты Внутренней Партии (+20 авто/сек)", reward_dis: 0, reward_cps: 20, reward_click: 0},
                {text: "(Реклама) Реклама в сетчатку\n(+5000 дисс., +150 авто/сек)", reward_dis: 5000, reward_cps: 150, reward_click: 0, is_ad: true}
            ]
        }
    },
    {
        threshold: 10000, message: "Этап 3: Тотальная покорность. Свобода — это рабство.",
        event: {
            title: "Словарный бунт", text: "Группа мыслителей тайно пытается переписать 11-е издание словаря Новояза.",
            choices: [
                {text: "Распылить их всех (+5000 дисс.)", reward_dis: 5000, reward_cps: 0, reward_click: 0},
                {text: "Отправить работать в МинПравды (+200 авто/сек)", reward_dis: 0, reward_cps: 200, reward_click: 0},
                {text: "(Реклама) Спонсорский ролик Евразии\n(+50000 дисс., +1500 авто/сек, +50 клик)", reward_dis: 50000, reward_cps: 1500, reward_click: 50, is_ad: true}
            ]
        }
    },
    {
        threshold: 50000, message: "Этап 4: Утопия. Диссидентов больше не существует... почти.",
        event: {
            title: "Слухи о Голдстейне", text: "Слухи о Братстве и Эммануэле Голдстейне распространяются слишком быстро.",
            choices: [
                {text: "Усилить ночные патрули (+20000 дисс.)", reward_dis: 20000, reward_cps: 0, reward_click: 0},
                {text: "Создать фальшивую ячейку (+1000 авто/сек)", reward_dis: 0, reward_cps: 1000, reward_click: 0},
                {text: "(Реклама) Пауза перед массовой казнью\n(+250000 дисс., +5000 авто/сек, +200 клик)", reward_dis: 250000, reward_cps: 5000, reward_click: 200, is_ad: true}
            ]
        }
    }
];

// --- Функции для монетизации (Заглушки) ---
function openStoreModal() {
    document.getElementById('storeModal').style.display = 'flex';
}
function closeStoreModal() {
    document.getElementById('storeModal').style.display = 'none';
}

function buyMonetization(type) {
    if (type === 'instant_boost') {
        let gain = Math.max(state.cps * 3600, 100);
        state.dissidents += gain;
        state.total_dissidents += gain;
        alert("Пакет успешно оформлен! Министерство зачислило вам эквивалент 1 часа работы.");
    } else if (type === 'double_cps') {
        state.event_cps_bonus += Math.max(state.cps, 10);
        recalculateCPS();
        alert("Индульгенция получена! Ваша продуктивность увеличена.");
    } else if (type === 'vip_autoclick') {
        state.vip_active = true;
        alert("VIP-статус активирован! Теперь Старший Брат кликает за вас.");
    }
    closeStoreModal();
    updateUI();
    saveGame();
}

let adTimerInterval = null;
function openAdModal() {
    let modal = document.getElementById('adModal');
    let textElem = document.getElementById('adTimerText');
    let btnElem = document.getElementById('adCloseBtn');
    
    btnElem.style.display = 'none';
    modal.style.display = 'flex';
    
    let timeLeft = 3;
    textElem.innerText = `Трансляция министерства завершится через ${timeLeft} сек...`;
    
    if(adTimerInterval) clearInterval(adTimerInterval);
    
    adTimerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            textElem.innerText = `Трансляция министерства завершится через ${timeLeft} сек...`;
        } else {
            clearInterval(adTimerInterval);
            textElem.innerText = "Рекламная пауза окончена. Слава Партии!";
            btnElem.style.display = 'block';
        }
    }, 1000);
}

function finishAdReward() {
    let reward = Math.max(state.cps * 30, 50);
    state.dissidents += reward;
    state.total_dissidents += reward;
    document.getElementById('adModal').style.display = 'none';
    updateUI();
    saveGame();
}

// --- Работа с localStorage ---
function saveGame() {
    const saveData = {
        state: state,
        upgrades: upgrades.map(u => ({ id: u.id, count: u.count })),
        clickUpgrades: clickUpgrades.map(c => ({ id: c.id, purchased: c.purchased }))
    };
    localStorage.setItem('big_brother_save', JSON.stringify(saveData));
}

function loadGame() {
    let saved = localStorage.getItem('big_brother_save');
    if (!saved) return;
    try {
        let data = JSON.parse(saved);
        if (data.state) state = Object.assign(state, data.state);
        
        if (data.upgrades) {
            data.upgrades.forEach(savedUpg => {
                let target = upgrades.find(u => u.id === savedUpg.id);
                if (target) target.count = savedUpg.count;
            });
        }
        
        if (data.clickUpgrades) {
            data.clickUpgrades.forEach(savedClick => {
                let target = clickUpgrades.find(c => c.id === savedClick.id);
                if (target) target.purchased = savedClick.purchased;
            });
        }
        
        recalculateCPS();
        let stageMsg = document.getElementById("stageMessage");
        if(stages[state.current_stage]) {
            stageMsg.innerText = stages[state.current_stage].message;
            if(state.current_stage > 0) stageMsg.style.color = "#ff4444";
        }
    } catch(e) {
        console.error("Ошибка загрузки сохранения:", e);
    }
}

function resetGame() {
    if (confirm("Вы уверены? Партия узнает об обнулении вашей лояльности!")) {
        localStorage.removeItem('big_brother_save');
        location.reload();
    }
}

function getUpgradeCost(upg) {
    let rawCost = upg.base_cost * Math.pow(1.15, upg.count);
    // Применяем скидку от улучшений
    let discountedCost = rawCost * (1 - state.discount / 100);
    return Math.floor(discountedCost);
}

function clickManual() {
    let actualPower = state.click_power * state.click_multiplier;
    state.dissidents += actualPower;
    state.total_dissidents += actualPower;
    checkStages();
    updateUI();
    saveGame();
}

function buyUpgrade(index) {
    let upg = upgrades[index];
    let cost = getUpgradeCost(upg);
    if (state.dissidents >= cost) {
        state.dissidents -= cost;
        upg.count++;
        recalculateCPS();
        updateUI();
        saveGame();
    }
}

// Обработка покупки уникальных доктрин (мультипликаторы, скидки, ускорение, скип времени)
function buyClickUpgrade(index) {
    let upg = clickUpgrades[index];
    if (state.dissidents >= upg.cost && !upg.purchased) {
        state.dissidents -= upg.cost;
        upg.purchased = true;

        // Применяем эффект в зависимости от типа улучшения
        if (upg.type === "flat") {
            state.click_power += upg.value;
        } else if (upg.type === "mult") {
            state.click_multiplier *= upg.value;
        } else if (upg.type === "discount") {
            state.discount += upg.value;
        } else if (upg.type === "speed") {
            state.game_speed *= upg.value;
            recalculateCPS();
        } else if (upg.type === "time_skip") {
            let bonusTimeScore = state.cps * upg.value;
            state.dissidents += bonusTimeScore;
            state.total_dissidents += bonusTimeScore;
            alert(`Машина времени активирована! Получено ресурсов за 2 часа простоя: +${Math.floor(bonusTimeScore)}`);
        }

        renderClickUpgrades();
        updateUI();
        saveGame();
    }
}

function recalculateCPS() {
    let base_cps = 0;
    upgrades.forEach(upg => { base_cps += upg.count * upg.cps; });
    // Итоговый CPS с учетом бонусных бонусов от событий и множителя ускорения игры
    state.cps = (base_cps + state.event_cps_bonus) * state.game_speed;
}

function updatePassiveIncome() {
    if (state.cps > 0) {
        let added = state.cps / 10.0;
        state.dissidents += added;
        state.total_dissidents += added;
        checkStages();
        updateUI();
    }
    // Автокликер от VIP заглушки
    if (state.vip_active) {
        let vipPower = (state.click_power * state.click_multiplier) / 10.0;
        state.dissidents += vipPower;
        state.total_dissidents += vipPower;
    }
}

function checkStages() {
    if (state.current_stage < stages.length - 1) {
        let next_stage = stages[state.current_stage + 1];
        if (state.total_dissidents >= next_stage.threshold) {
            state.current_stage++;
            let stageMsg = document.getElementById("stageMessage");
            stageMsg.innerText = stages[state.current_stage].message;
            stageMsg.style.color = "#ff4444";
            
            renderClickUpgrades();
            
            if (next_stage.event) { triggerEvent(next_stage.event); }
            saveGame();
        }
    }
}

function triggerEvent(eventData) {
    document.getElementById('eventTitle').innerText = eventData.title;
    document.getElementById('eventText').innerText = eventData.text;
    
    let choicesContainer = document.getElementById('eventChoices');
    choicesContainer.innerHTML = '';
    
    eventData.choices.forEach((choice) => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn ' + (choice.is_ad ? 'ad-btn' : '');
        btn.innerText = choice.text;
        btn.onclick = () => resolveEventChoice(choice);
        choicesContainer.appendChild(btn);
    });
    
    document.getElementById('eventModal').style.display = 'flex';
}

function resolveEventChoice(choice) {
    if (choice.is_ad) {
        alert("Министерство Изобилия\n\nПартия благодарит вас за просмотр пропагандистского ролика!\nВаша лояльность щедро вознаграждена.");
    }
    
    state.dissidents += (choice.reward_dis || 0);
    state.total_dissidents += (choice.reward_dis || 0);
    state.event_cps_bonus += (choice.reward_cps || 0);
    state.click_power += (choice.reward_click || 0);
    
    recalculateCPS();
    document.getElementById('eventModal').style.display = 'none';
    checkStages();
    updateUI();
    saveGame();
}

function renderUpgrades() {
    let container = document.getElementById('upgradesContainer');
    container.innerHTML = '';
    upgrades.forEach((upg, index) => {
        let card = document.createElement('div');
        card.className = 'item-card passive';
        card.innerHTML = `
            <div class="item-left">
                <img src="${upg.icon}" class="item-icon" alt="icon">
                <div class="item-info">
                    <strong>${upg.name} (Ур. <span id="count_${index}" style="display:inline; color:white; font-size:13px;">${upg.count}</span>)</strong>
                    <span>+${Math.floor(upg.cps * state.game_speed)} / сек</span>
                </div>
            </div>
            <button class="buy-btn" id="btn_${index}" onclick="buyUpgrade(${index})">Купить</button>
        `;
        container.appendChild(card);
    });
}

function renderClickUpgrades() {
    let container = document.getElementById('clickUpgradesContainer');
    container.innerHTML = '';
    let hasAvailable = false;
    
    clickUpgrades.forEach((upg, index) => {
        if (!upg.purchased && state.current_stage >= upg.req_stage) {
            hasAvailable = true;
            let card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-left">
                    <img src="${upg.icon}" class="item-icon" alt="icon">
                    <div class="item-info" style="color: #66ccff;">
                        <strong>${upg.name}</strong>
                        <span>${upg.desc}</span>
                    </div>
                </div>
                <button class="buy-btn" id="clickBtn_${index}" onclick="buyClickUpgrade(${index})">Внедрить (${upg.cost})</button>
            `;
            container.appendChild(card);
        }
    });
    
    document.getElementById('clickSection').style.display = hasAvailable ? 'block' : 'none';
}

function updateUI() {
    document.getElementById('score').innerText = `Диссидентов поймано: ${Math.floor(state.dissidents)}`;
    document.getElementById('cps').innerText = `Автоматический отлов: ${Math.floor(state.cps)} / сек`;
    
    let totalPowerDisplay = state.click_power * state.click_multiplier;
    document.getElementById('clickPowerText').innerText = `(Мощь: ${totalPowerDisplay})`;

    upgrades.forEach((upg, index) => {
        let cost = getUpgradeCost(upg);
        let countSpan = document.getElementById(`count_${index}`);
        if(countSpan) countSpan.innerText = upg.count;
        
        let btn = document.getElementById(`btn_${index}`);
        if(btn) {
            btn.innerText = `Купить (${cost})`;
            if (state.dissidents >= cost) {
                btn.disabled = false;
                btn.classList.add('active-passive');
            } else {
                btn.disabled = true;
                btn.classList.remove('active-passive');
            }
        }
    });

    clickUpgrades.forEach((upg, index) => {
        if (!upg.purchased && state.current_stage >= upg.req_stage) {
            let btn = document.getElementById(`clickBtn_${index}`);
            if(btn) {
                if (state.dissidents >= upg.cost) {
                    btn.disabled = false;
                    btn.classList.add('active-click');
                } else {
                    btn.disabled = true;
                    btn.classList.remove('active-click');
                }
            }
        }
    });
}

// Инициализация при запуске
loadGame();
renderUpgrades();
renderClickUpgrades();
updateUI();

setInterval(saveGame, 10000);
setInterval(updatePassiveIncome, 100);