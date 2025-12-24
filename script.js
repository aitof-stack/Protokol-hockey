// ==============================
// СИСТЕМА МНОГОСТРАНИЧНОСТИ ПРОТОКОЛОВ
// ==============================

// Хранилище всех протоколов
let allProtocols = [];
let currentProtocolIndex = 0;

// Шаблон структуры протокола
const protocolTemplate = {
    id: 0,
    matchNumber: '',
    matchDate: '',
    matchTime: '',
    competition: '',
    city: '',
    arena: '',
    spectators: 0,
    teamA: { 
        name: '', 
        coach: '', 
        players: []
    },
    teamB: { 
        name: '', 
        coach: '', 
        players: []
    },
    scoreA: 0,
    scoreB: 0,
    currentPeriod: 1,
    timeLeft: 15 * 60,
    goals: { A: [], B: [] },
    penalties: { A: [], B: [] },
    playerStats: { A: {}, B: {} },
    goalieStats: { 
        A: {}, 
        B: {} 
    },
    activeGoalies: { 
        A: null, 
        B: null 
    },
    goalieEntryTimes: { 
        A: {}, 
        B: {} 
    },
    periodStats: {
        1: { scoreA: 0, scoreB: 0, penaltiesA: 0, penaltiesB: 0 },
        2: { scoreA: 0, scoreB: 0, penaltiesA: 0, penaltiesB: 0 },
        3: { scoreA: 0, scoreB: 0, penaltiesA: 0, penaltiesB: 0 }
    },
    events: [],
    activePenalties: [],
    penaltyCheckInterval: null,
    shootout: { 
        scoreA: 0, 
        scoreB: 0, 
        winner: null,
        currentRound: 1,
        attemptsA: 0,
        attemptsB: 0,
        isFinished: false
    },
    referees: { main1: '', main2: '', notes: '' },
    isRunning: false,
    timerInterval: null,
    logo: null,
    situation: '' // Текущая игровая ситуация
};

// Текущие глобальные переменные
let currentTeam = null;
let currentPenaltyShotTeam = null;

// ==============================
// ИНИЦИАЛИЗАЦИЯ И УПРАВЛЕНИЕ
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, инициализация протокола...');
    initProtocol();
    
    // Устанавливаем текущую дату
    setCurrentDate();
    
    // Инициализация обработчиков для модальных окон
    initModalHandlers();
});

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('matchDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
    }
    
    // Устанавливаем текущее время
    const now = new Date();
    const timeInput = document.getElementById('matchTime');
    if (timeInput && !timeInput.value) {
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
    
    // Устанавливаем дату подписания
    const signDate = document.getElementById('signDate');
    if (signDate && !signDate.value) {
        const formattedDate = now.toLocaleDateString('ru-RU');
        signDate.value = formattedDate;
    }
}

function initModalHandlers() {
    console.log('🔧 Инициализация обработчиков модальных окон...');
    
    // Обработчик для кнопки подтверждения штрафа
    const confirmPenaltyBtn = document.querySelector('#penaltyDialog .btn-confirm');
    if (confirmPenaltyBtn) {
        confirmPenaltyBtn.addEventListener('click', function() {
            console.log('✅ Кнопка подтверждения штрафа нажата');
            confirmPenalty();
        });
    }
    
    // Обработчик для кнопки подтверждения гола
    const confirmGoalBtn = document.querySelector('#goalDialog .btn-confirm');
    if (confirmGoalBtn) {
        confirmGoalBtn.addEventListener('click', function() {
            console.log('✅ Кнопка подтверждения гола нажата');
            confirmGoal();
        });
    }
    
    // Обработчики для кнопок отмены
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.modal')?.id;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
}

function initProtocol() {
    console.log('Инициализация системы протоколов...');
    
    loadAllProtocols();
    
    if (allProtocols.length === 0) {
        createNewProtocol();
    } else {
        loadProtocol(currentProtocolIndex);
    }
    
    initEventListeners();
    updateProtocolCounter();
    
    console.log('Система инициализирована. Протоколов: ' + allProtocols.length);
}

function initEventListeners() {
    console.log('🎯 Инициализация слушателей событий...');
    
    const autoSaveFields = [
        'matchNumber', 'matchDate', 'matchTime', 'competition', 'city',
        'arena', 'spectators', 'teamA', 'teamB', 'coachA', 'coachB',
        'mainRef', 'mainRef2', 'notes'
    ];
    
    autoSaveFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                if (fieldId === 'matchNumber') {
                    document.getElementById('displayMatchNumber').textContent = this.value || '___';
                } else if (fieldId === 'matchDate' && this.value) {
                    const date = new Date(this.value);
                    document.getElementById('displayDate').textContent = date.toLocaleDateString('ru-RU');
                } else if (fieldId === 'matchTime') {
                    document.getElementById('displayTime').textContent = this.value || '___';
                } else if (fieldId === 'teamA') {
                    const name = this.value || 'Команда А';
                    document.getElementById('teamAName').textContent = name;
                    document.getElementById('liveTeamA').textContent = name;
                    document.getElementById('statsTeamATitle').textContent = name;
                    document.getElementById('shootoutTeamAName').textContent = name;
                } else if (fieldId === 'teamB') {
                    const name = this.value || 'Команда Б';
                    document.getElementById('teamBName').textContent = name;
                    document.getElementById('liveTeamB').textContent = name;
                    document.getElementById('statsTeamBTitle').textContent = name;
                    document.getElementById('shootoutTeamBName').textContent = name;
                }
                
                setTimeout(saveCurrentProtocol, 100);
            });
        }
    });
}

// Создание нового протокола
function newProtocol() {
    saveCurrentProtocol();
    createNewProtocol();
    alert(`Создан новый протокол №${allProtocols.length}`);
}

function createNewProtocol() {
    const newProtocol = JSON.parse(JSON.stringify(protocolTemplate));
    newProtocol.id = allProtocols.length;
    
    // Автонумерация матчей
    const lastMatchNumber = allProtocols.length > 0 ? 
        parseInt(allProtocols[allProtocols.length - 1].matchNumber) || 0 : 0;
    newProtocol.matchNumber = (lastMatchNumber + 1).toString();
    
    // Текущая дата и время
    const now = new Date();
    newProtocol.matchDate = now.toISOString().split('T')[0];
    newProtocol.matchTime = now.toTimeString().slice(0, 5);
    
    // Названия команд по умолчанию
    newProtocol.teamA.name = `Команда А`;
    newProtocol.teamB.name = `Команда Б`;
    
    allProtocols.push(newProtocol);
    currentProtocolIndex = allProtocols.length - 1;
    
    loadProtocol(currentProtocolIndex);
    updateProtocolCounter();
}

// Копирование текущего протокола
function duplicateProtocol() {
    if (allProtocols.length === 0) return;
    
    saveCurrentProtocol();
    
    const currentProtocol = allProtocols[currentProtocolIndex];
    const duplicatedProtocol = JSON.parse(JSON.stringify(currentProtocol));
    duplicatedProtocol.id = allProtocols.length;
    
    // Новый номер матча
    const lastMatchNumber = parseInt(currentProtocol.matchNumber) || allProtocols.length;
    duplicatedProtocol.matchNumber = (lastMatchNumber + 1).toString();
    
    // Отметка "копия" в названиях
    duplicatedProtocol.teamA.name = `${currentProtocol.teamA.name} (копия)`;
    duplicatedProtocol.teamB.name = `${currentProtocol.teamB.name} (копия)`;
    
    // Сброс статистики матча
    duplicatedProtocol.scoreA = 0;
    duplicatedProtocol.scoreB = 0;
    duplicatedProtocol.currentPeriod = 1;
    duplicatedProtocol.timeLeft = 15 * 60;
    duplicatedProtocol.goals = { A: [], B: [] };
    duplicatedProtocol.penalties = { A: [], B: [] };
    duplicatedProtocol.playerStats = { A: {}, B: {} };
    duplicatedProtocol.goalieStats = { A: {}, B: {} };
    duplicatedProtocol.activeGoalies = { A: null, B: null };
    duplicatedProtocol.goalieEntryTimes = { A: {}, B: {} };
    duplicatedProtocol.periodStats = {
        1: { scoreA: 0, scoreB: 0, penaltiesA: 0, penaltiesB: 0 },
        2: { scoreA: 0, scoreB: 0, penaltiesA: 0, penaltiesB: 0 },
        3: { scoreA: 0, scoreB: 0, penaltiesA: 0, penaltiesB: 0 }
    };
    duplicatedProtocol.events = [];
    duplicatedProtocol.activePenalties = [];
    duplicatedProtocol.penaltyCheckInterval = null;
    duplicatedProtocol.shootout = { 
        scoreA: 0, 
        scoreB: 0, 
        winner: null,
        currentRound: 1,
        attemptsA: 0,
        attemptsB: 0,
        isFinished: false
    };
    duplicatedProtocol.isRunning = false;
    duplicatedProtocol.timerInterval = null;
    
    allProtocols.push(duplicatedProtocol);
    currentProtocolIndex = allProtocols.length - 1;
    
    loadProtocol(currentProtocolIndex);
    updateProtocolCounter();
    alert('Протокол скопирован');
}

// Удаление протокола
function deleteProtocol() {
    if (allProtocols.length <= 1) {
        alert('Нельзя удалить последний протокол');
        return;
    }
    
    if (!confirm(`Удалить протокол №${currentProtocolIndex + 1}?`)) {
        return;
    }
    
    allProtocols.splice(currentProtocolIndex, 1);
    
    if (currentProtocolIndex >= allProtocols.length) {
        currentProtocolIndex = allProtocols.length - 1;
    }
    
    loadProtocol(currentProtocolIndex);
    updateProtocolCounter();
    alert('Протокол удален');
}

// Навигация между протоколами
function previousProtocol() {
    if (currentProtocolIndex > 0) {
        saveCurrentProtocol();
        currentProtocolIndex--;
        loadProtocol(currentProtocolIndex);
        updateProtocolCounter();
    } else {
        alert('Это первый протокол');
    }
}

function nextProtocol() {
    if (currentProtocolIndex < allProtocols.length - 1) {
        saveCurrentProtocol();
        currentProtocolIndex++;
        loadProtocol(currentProtocolIndex);
        updateProtocolCounter();
    } else {
        alert('Это последний протокол');
    }
}

// Загрузка протокола
function loadProtocol(index) {
    if (index < 0 || index >= allProtocols.length) return;
    
    const protocol = allProtocols[index];
    
    // Останавливаем таймер если он был запущен
    if (protocol.isRunning && protocol.timerInterval) {
        clearInterval(protocol.timerInterval);
        protocol.isRunning = false;
        protocol.timerInterval = null;
    }
    
    // Останавливаем проверку штрафов
    if (protocol.penaltyCheckInterval) {
        clearInterval(protocol.penaltyCheckInterval);
        protocol.penaltyCheckInterval = null;
    }
    
    // Инициализируем время выхода вратарей, если его нет
    if (!protocol.goalieEntryTimes) {
        protocol.goalieEntryTimes = { A: {}, B: {} };
    }
    
    // Устанавливаем время выхода для текущих вратарей
    const matchTimeElapsed = getTotalMatchTime(protocol);
    ['A', 'B'].forEach(team => {
        const goalie = protocol.activeGoalies[team];
        if (goalie && protocol.goalieEntryTimes[team]) {
            if (!protocol.goalieEntryTimes[team][goalie]) {
                protocol.goalieEntryTimes[team][goalie] = matchTimeElapsed;
            }
        }
    });
    
    // Заполняем форму
    document.getElementById('matchNumber').value = protocol.matchNumber || '';
    document.getElementById('matchDate').value = protocol.matchDate || '';
    document.getElementById('matchTime').value = protocol.matchTime || '';
    document.getElementById('competition').value = protocol.competition || '';
    document.getElementById('city').value = protocol.city || '';
    document.getElementById('arena').value = protocol.arena || '';
    document.getElementById('spectators').value = protocol.spectators || 0;
    
    document.getElementById('teamA').value = protocol.teamA.name || '';
    document.getElementById('coachA').value = protocol.teamA.coach || '';
    document.getElementById('teamB').value = protocol.teamB.name || '';
    document.getElementById('coachB').value = protocol.teamB.coach || '';
    
    document.getElementById('mainRef').value = protocol.referees.main1 || '';
    document.getElementById('mainRef2').value = protocol.referees.main2 || '';
    document.getElementById('notes').value = protocol.referees.notes || '';
    
    updateDisplay(protocol);
    renderRoster('A', protocol.teamA.players, protocol);
    renderRoster('B', protocol.teamB.players, protocol);
    renderEvents(protocol);
    updateProtocolResults(protocol);
    renderPlayerStatsProtocol(protocol);
    renderGoaliesStats(protocol);
    updateGoalieSelects(protocol);
    updateGoalieDisplay('A', protocol);
    updateGoalieDisplay('B', protocol);
    updateLiveTeamNames(protocol);
    updatePenaltiesDisplayOnScoreboard(protocol);
    
    // Обновляем игровую ситуацию
    updateGameSituationDisplay();
}

// Сохранение текущего протокола
function saveCurrentProtocol() {
    if (allProtocols.length === 0 || currentProtocolIndex >= allProtocols.length) return;
    
    const protocol = allProtocols[currentProtocolIndex];
    
    protocol.matchNumber = document.getElementById('matchNumber').value || '';
    protocol.matchDate = document.getElementById('matchDate').value || '';
    protocol.matchTime = document.getElementById('matchTime').value || '';
    protocol.competition = document.getElementById('competition').value || '';
    protocol.city = document.getElementById('city').value || '';
    protocol.arena = document.getElementById('arena').value || '';
    protocol.spectators = parseInt(document.getElementById('spectators').value) || 0;
    
    protocol.teamA.name = document.getElementById('teamA').value || '';
    protocol.teamA.coach = document.getElementById('coachA').value || '';
    
    protocol.teamB.name = document.getElementById('teamB').value || '';
    protocol.teamB.coach = document.getElementById('coachB').value || '';
    
    protocol.referees.main1 = document.getElementById('mainRef').value || '';
    protocol.referees.main2 = document.getElementById('mainRef2').value || '';
    protocol.referees.notes = document.getElementById('notes').value || '';
    
    console.log(`Протокол №${currentProtocolIndex + 1} сохранен`);
}

// Обновление отображения
function updateDisplay(protocol) {
    document.getElementById('displayMatchNumber').textContent = protocol.matchNumber || '___';
    
    if (protocol.matchDate) {
        const date = new Date(protocol.matchDate);
        document.getElementById('displayDate').textContent = date.toLocaleDateString('ru-RU');
    } else {
        document.getElementById('displayDate').textContent = '___';
    }
    
    document.getElementById('displayTime').textContent = protocol.matchTime || '___';
    document.getElementById('teamAName').textContent = protocol.teamA.name || 'Команда А';
    document.getElementById('teamBName').textContent = protocol.teamB.name || 'Команда Б';
    
    document.getElementById('scoreA').textContent = protocol.scoreA || 0;
    document.getElementById('scoreB').textContent = protocol.scoreB || 0;
    document.getElementById('currentPeriod').textContent = protocol.currentPeriod || 1;
    updateTimerDisplay(protocol);
    
    document.getElementById('statsTeamATitle').textContent = protocol.teamA.name || 'Команда А';
    document.getElementById('statsTeamBTitle').textContent = protocol.teamB.name || 'Команда Б';
    
    // Обновляем отображение удалений на табло
    updatePenaltiesDisplayOnScoreboard(protocol);
}

function updateTimerDisplay(protocol) {
    const timer = document.getElementById('gameTimer');
    if (timer) {
        timer.textContent = formatTime(protocol.timeLeft);
    }
}

// Обновление счетчика протоколов
function updateProtocolCounter() {
    const currentNum = document.getElementById('currentProtocolNum');
    const totalNum = document.getElementById('totalProtocols');
    
    if (currentNum && totalNum) {
        currentNum.textContent = currentProtocolIndex + 1;
        totalNum.textContent = allProtocols.length;
        document.title = `Протокол хоккейного матча (${currentProtocolIndex + 1}/${allProtocols.length})`;
    }
}

// Сохранение/загрузка всех протоколов
function saveAllProtocols() {
    if (allProtocols.length === 0) return;
    
    saveCurrentProtocol();
    
    try {
        localStorage.setItem('hockeyProtocols', JSON.stringify(allProtocols));
        localStorage.setItem('currentProtocolIndex', currentProtocolIndex.toString());
        
        const logoImage = document.getElementById('logoImage');
        if (logoImage && logoImage.src) {
            localStorage.setItem('hockeyLogo', logoImage.src);
        }
        
        alert(`✅ Все ${allProtocols.length} протоколов сохранены`);
    } catch (e) {
        alert('Ошибка сохранения: ' + e.message);
    }
}

function loadAllProtocols() {
    try {
        const savedProtocols = localStorage.getItem('hockeyProtocols');
        const savedIndex = localStorage.getItem('currentProtocolIndex');
        
        if (savedProtocols) {
            allProtocols = JSON.parse(savedProtocols);
            currentProtocolIndex = savedIndex ? parseInt(savedIndex) : 0;
            
            if (allProtocols.length > 0) {
                const savedLogo = localStorage.getItem('hockeyLogo');
                if (savedLogo) {
                    const logoImage = document.getElementById('logoImage');
                    const logoEmoji = document.getElementById('logoEmoji');
                    if (logoImage && logoEmoji) {
                        logoImage.src = savedLogo;
                        logoImage.style.display = 'block';
                        logoEmoji.style.display = 'none';
                    }
                }
                
                console.log(`✅ Загружено ${allProtocols.length} протоколов`);
            } else {
                createNewProtocol();
            }
        } else {
            createNewProtocol();
        }
    } catch (e) {
        console.error('Ошибка загрузки: ' + e.message);
        createNewProtocol();
    }
}

// ==============================
// АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ ИГРОВОЙ СИТУАЦИИ
// ==============================

function getGameSituation(protocol, scoringTeam) {
    const teamA = scoringTeam === 'A' ? 'A' : 'B';
    const teamB = scoringTeam === 'A' ? 'B' : 'A';
    
    // Подсчет активных игроков на льду (5 полевых + 1 вратарь)
    const basePlayers = 5;
    
    // Получаем активные штрафы для каждой команды
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    const activePenaltiesA = protocol.activePenalties.filter(p => 
        p.team === teamA && 
        !p.completed && 
        p.endTimeSeconds > currentGameTime &&
        p.startTimeSeconds <= currentGameTime &&
        p.minutes < 5 // Только малые штрафы (2 или 4 минуты)
    );
    
    const activePenaltiesB = protocol.activePenalties.filter(p => 
        p.team === teamB && 
        !p.completed && 
        p.endTimeSeconds > currentGameTime &&
        p.startTimeSeconds <= currentGameTime &&
        p.minutes < 5 // Только малые штрафы (2 или 4 минуты)
    );
    
    // Определяем игроков на льду с учетом удалений
    const playersOnIceA = basePlayers - activePenaltiesA.length;
    const playersOnIceB = basePlayers - activePenaltiesB.length;
    
    // Проверяем на пустые ворота
    const goalieA = protocol.activeGoalies[teamA];
    const goalieB = protocol.activeGoalies[teamB];
    
    if (!goalieB && scoringTeam === teamA) {
        return 'ПВ'; // Пустые ворота
    }
    if (!goalieA && scoringTeam === teamB) {
        return 'ПВ'; // Пустые ворота
    }
    
    // Определяем ситуацию по соотношению игроков
    const difference = playersOnIceA - playersOnIceB;
    
    if (difference > 0 && scoringTeam === teamA) {
        // Команда А в большинстве и забивает
        if (difference >= 2) {
            return '+2'; // Двойное большинство
        } else {
            return '+1'; // Обычное большинство
        }
    } else if (difference < 0 && scoringTeam === teamA) {
        // Команда А в меньшинстве и забивает
        if (difference <= -2) {
            return '-2'; // Двойное меньшинство
        } else {
            return '-1'; // Обычное меньшинство
        }
    } else if (difference > 0 && scoringTeam === teamB) {
        // Команда Б в большинстве и забивает
        if (difference >= 2) {
            return '+2';
        } else {
            return '+1';
        }
    } else if (difference < 0 && scoringTeam === teamB) {
        // Команда Б в меньшинстве и забивает
        if (difference <= -2) {
            return '-2';
        } else {
            return '-1';
        }
    }
    
    return ''; // Равные составы
}

function updateGameSituationDisplay(team) {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    const situation = getGameSituation(protocol, team || 'A');
    const situationText = getSituationDescription(situation);
    
    const display = document.getElementById('currentSituationText');
    if (display) {
        display.textContent = situationText;
    }
    
    const select = document.getElementById('gameSituation');
    if (select) {
        select.value = situation;
    }
    
    // Сохраняем текущую ситуацию в протокол
    protocol.situation = situationText;
}

function getSituationDescription(code) {
    switch(code) {
        case '+1': return 'Большинство 5 на 4, 4 на 3';
        case '+2': return 'Большинство 5 на 3';
        case '-1': return 'Меньшинство 4 на 5, 3 на 4';
        case '-2': return 'Меньшинство 3 на 5';
        case 'ПВ': return 'Пустые ворота';
        case 'ШБ': return 'Штрафной бросок';
        default: return 'Равные составы';
    }
}

// ==============================
// ОТСЛЕЖИВАНИЕ ВРЕМЕНИ ШТРАФОВ (С ПРЕКРАЩЕНИЕМ ПРИ ГОЛЕ)
// ==============================

function startPenaltyCheck(protocol) {
    if (protocol.penaltyCheckInterval) {
        clearInterval(protocol.penaltyCheckInterval);
    }
    
    protocol.penaltyCheckInterval = setInterval(() => {
        checkPenaltiesExpiration(protocol);
    }, 1000);
}

function checkPenaltiesExpiration(protocol) {
    if (allProtocols.length === 0) return;
    
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    let updated = false;
    
    // Проверяем каждый активный штраф
    for (let i = protocol.activePenalties.length - 1; i >= 0; i--) {
        const penalty = protocol.activePenalties[i];
        
        if (!penalty.completed && currentGameTime >= penalty.endTimeSeconds) {
            // Штраф завершен по времени
            completePenalty(protocol, penalty, 'time');
            updated = true;
        }
    }
    
    if (updated) {
        updatePenaltiesDisplayOnScoreboard(protocol);
        saveCurrentProtocol();
    }
}

function completePenalty(protocol, penalty, reason) {
    penalty.completed = true;
    
    // Находим игрока
    const players = penalty.team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const player = players.find(p => p.number == penalty.playerNum);
    
    if (player) {
        const reasonText = reason === 'goal' ? 'голом' : 'временем';
        addEvent(protocol, `Штраф завершен ${reasonText}: ${player.name} (#${penalty.playerNum})`, 'penalty-end');
    }
    
    // Обновляем отображение удалений на табло
    updatePenaltiesDisplayOnScoreboard(protocol);
}

// ФУНКЦИЯ ДЛЯ ПРЕКРАЩЕНИЯ ШТРАФОВ ПРИ ГОЛЕ (ПРАВИЛО ГОЛА В МЕНЬШИНСТВЕ)
function terminatePenaltiesOnGoal(protocol, scoringTeam) {
    const oppositeTeam = scoringTeam === 'A' ? 'B' : 'A';
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    let penaltiesTerminated = 0;
    
    // Находим все активные малые штрафы противоположной команды
    const activeMinorPenalties = protocol.activePenalties.filter(p => 
        p.team === oppositeTeam && 
        !p.completed && 
        p.minutes < 5 && // Только малые штрафы (2 или 4 минуты)
        p.startTimeSeconds <= currentGameTime
    );
    
    // Если команда забила в меньшинстве, завершаем самый ранний штраф
    if (activeMinorPenalties.length > 0) {
        // Сортируем штрафы по времени начала (самый ранний первый)
        activeMinorPenalties.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
        
        // Завершаем самый ранний штраф
        const penaltyToTerminate = activeMinorPenalties[0];
        completePenalty(protocol, penaltyToTerminate, 'goal');
        penaltiesTerminated++;
        
        // Обновляем время окончания в протоколе
        const penaltyIndex = protocol.penalties[oppositeTeam].findIndex(p => 
            p.player === penaltyToTerminate.playerNum && 
            p.time === formatTime(penaltyToTerminate.startTimeSeconds)
        );
        
        if (penaltyIndex !== -1) {
            protocol.penalties[oppositeTeam][penaltyIndex].end = formatTime(currentGameTime) + " (прерван голом)";
        }
    }
    
    return penaltiesTerminated;
}

// ОТОБРАЖЕНИЕ УДАЛЕНИЙ НА ОСНОВНОМ ТАБЛО
function updatePenaltiesDisplayOnScoreboard(protocol) {
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    
    // Получаем активные штрафы для каждой команды
    const activePenaltiesA = protocol.activePenalties.filter(p => 
        p.team === 'A' && 
        !p.completed && 
        p.endTimeSeconds > currentGameTime &&
        p.startTimeSeconds <= currentGameTime
    );
    
    const activePenaltiesB = protocol.activePenalties.filter(p => 
        p.team === 'B' && 
        !p.completed && 
        p.endTimeSeconds > currentGameTime &&
        p.startTimeSeconds <= currentGameTime
    );
    
    // Обновляем заголовки на панели живого матча
    const penaltiesTeamA = document.getElementById('activePenaltiesTeamA');
    const penaltiesTeamB = document.getElementById('activePenaltiesTeamB');
    
    if (penaltiesTeamA) {
        penaltiesTeamA.textContent = `Команда А: ${activePenaltiesA.length}`;
    }
    if (penaltiesTeamB) {
        penaltiesTeamB.textContent = `Команда Б: ${activePenaltiesB.length}`;
    }
    
    // Заполняем список активных штрафов для команды А
    const penaltiesListA = document.getElementById('activePenaltiesListA');
    if (penaltiesListA) {
        penaltiesListA.innerHTML = '';
        
        if (activePenaltiesA.length > 0) {
            activePenaltiesA.forEach(penalty => {
                const players = protocol.teamA.players;
                const player = players.find(p => p.number == penalty.playerNum);
                const timeLeft = Math.max(0, penalty.endTimeSeconds - currentGameTime);
                
                const penaltyElement = document.createElement('div');
                penaltyElement.className = 'penalty-item';
                penaltyElement.innerHTML = `
                    <span class="penalty-player">#${penalty.playerNum} ${player ? player.name : 'Игрок'}</span>
                    <span class="penalty-time">${formatTime(timeLeft)}</span>
                    <span class="penalty-minutes">${penalty.minutes} мин</span>
                `;
                penaltiesListA.appendChild(penaltyElement);
            });
        } else {
            penaltiesListA.innerHTML = '<div class="no-penalties">Нет удалений</div>';
        }
    }
    
    // Заполняем список активных штрафов для команды Б
    const penaltiesListB = document.getElementById('activePenaltiesListB');
    if (penaltiesListB) {
        penaltiesListB.innerHTML = '';
        
        if (activePenaltiesB.length > 0) {
            activePenaltiesB.forEach(penalty => {
                const players = protocol.teamB.players;
                const player = players.find(p => p.number == penalty.playerNum);
                const timeLeft = Math.max(0, penalty.endTimeSeconds - currentGameTime);
                
                const penaltyElement = document.createElement('div');
                penaltyElement.className = 'penalty-item';
                penaltyElement.innerHTML = `
                    <span class="penalty-player">#${penalty.playerNum} ${player ? player.name : 'Игрок'}</span>
                    <span class="penalty-time">${formatTime(timeLeft)}</span>
                    <span class="penalty-minutes">${penalty.minutes} мин</span>
                `;
                penaltiesListB.appendChild(penaltyElement);
            });
        } else {
            penaltiesListB.innerHTML = '<div class="no-penalties">Нет удалений</div>';
        }
    }
}

// ==============================
// ОСНОВНЫЕ ФУНКЦИИ МАТЧА
// ==============================

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeMinutes(seconds) {
    return (seconds / 60).toFixed(1);
}

// Функция для получения общего времени матча в секундах
function getTotalMatchTime(protocol) {
    // Общее время матча в секундах с начала матча
    // (прошедшие периоды * 15 мин) + (15 мин - оставшееся время текущего периода)
    return (15 * 60 * (protocol.currentPeriod - 1)) + (15 * 60 - protocol.timeLeft);
}

function startTimer() {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    if (protocol.isRunning) return;
    
    protocol.isRunning = true;
    protocol.timerInterval = setInterval(() => {
        if (protocol.timeLeft > 0) {
            protocol.timeLeft--;
            updateTimerDisplay(protocol);
            
            // Обновляем время вратарей
            updateGoalieTime(protocol);
            
            // Проверяем истечение штрафов
            checkPenaltiesExpiration(protocol);
            
            if (protocol.timeLeft % 30 === 0) {
                saveCurrentProtocol();
            }
        } else {
            pauseTimer();
            alert('Период завершен!');
            
            // Фиксируем время вратарей при завершении периода
            finalizeGoalieTimeForPeriod(protocol);
            
            saveCurrentProtocol();
        }
    }, 1000);
    
    // Запускаем проверку штрафов
    startPenaltyCheck(protocol);
}

function pauseTimer() {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    if (!protocol.isRunning) return;
    
    protocol.isRunning = false;
    if (protocol.timerInterval) {
        clearInterval(protocol.timerInterval);
        protocol.timerInterval = null;
    }
    
    // Останавливаем проверку штрафов
    if (protocol.penaltyCheckInterval) {
        clearInterval(protocol.penaltyCheckInterval);
        protocol.penaltyCheckInterval = null;
    }
    
    saveCurrentProtocol();
}

function resetTimer() {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    pauseTimer();
    protocol.timeLeft = 15 * 60;
    updateTimerDisplay(protocol);
    saveCurrentProtocol();
}

function nextPeriod() {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    if (protocol.currentPeriod < 3) {
        pauseTimer();
        
        // Фиксируем время вратарей перед переходом к следующему периоду
        finalizeGoalieTimeForPeriod(protocol);
        
        protocol.currentPeriod++;
        protocol.timeLeft = 15 * 60;
        document.getElementById('currentPeriod').textContent = protocol.currentPeriod;
        updateTimerDisplay(protocol);
        addEvent(protocol, `Начало ${protocol.currentPeriod} периода`, 'period');
        
        // Завершаем все штрафы из предыдущего периода
        const currentGameTime = 15 * 60; // Начало нового периода
        protocol.activePenalties.forEach(penalty => {
            if (!penalty.completed && penalty.endTimeSeconds <= currentGameTime) {
                completePenalty(protocol, penalty, 'period');
            }
        });
        
        updatePenaltiesDisplayOnScoreboard(protocol);
        saveCurrentProtocol();
    } else {
        if (protocol.scoreA === protocol.scoreB) {
            alert('Счет равный! Назначаются послематчевые броски (буллиты)');
            startShootout();
        } else {
            alert('Матч завершен!');
            
            // Фиксируем итоговое время вратарей для последнего периода
            finalizeGoalieTimeForPeriod(protocol);
            
            // Завершаем все активные штрафы
            protocol.activePenalties.forEach(penalty => {
                if (!penalty.completed) {
                    completePenalty(protocol, penalty, 'game');
                }
            });
            saveCurrentProtocol();
        }
    }
}

function finalizeGoalieTimeForPeriod(protocol) {
    const periodDuration = 15 * 60; // 15 минут в секундах
    const periodStartTime = (protocol.currentPeriod - 1) * periodDuration;
    const periodEndTime = protocol.currentPeriod * periodDuration;
    
    ['A', 'B'].forEach(team => {
        const goalie = protocol.activeGoalies[team];
        if (goalie && protocol.goalieStats[team][goalie] && protocol.goalieEntryTimes[team]) {
            const entryTime = protocol.goalieEntryTimes[team][goalie] || 0;
            
            // Вратарь мог выйти в середине периода, поэтому учитываем фактическое время
            const actualEntryTime = Math.max(entryTime, periodStartTime);
            const timeOnIceThisPeriod = Math.max(0, periodEndTime - actualEntryTime);
            
            if (timeOnIceThisPeriod > 0) {
                // Добавляем время этого периода (в минутах)
                protocol.goalieStats[team][goalie].timeOnIce = 
                    (protocol.goalieStats[team][goalie].timeOnIce || 0) + (timeOnIceThisPeriod / 60);
            }
            
            // Сбрасываем время выхода для следующего периода
            protocol.goalieEntryTimes[team][goalie] = 0;
        }
    });
}

function addEvent(protocol, description, type) {
    const event = {
        time: formatTime(15 * 60 - protocol.timeLeft),
        period: protocol.currentPeriod,
        description: description,
        type: type,
        timestamp: new Date().toLocaleTimeString('ru-RU')
    };
    
    protocol.events.unshift(event);
    renderEvents(protocol);
    saveCurrentProtocol();
}

function renderEvents(protocol) {
    const container = document.getElementById('eventsLog');
    if (!container) return;
    
    container.innerHTML = protocol.events.map(event => `
        <div class="event-item ${event.type}">
            <span class="event-time">${event.time} (П${event.period})</span>
            <span class="event-description">${event.description}</span>
            <small>${event.timestamp}</small>
        </div>
    `).join('');
}

// ==============================
// ФУНКЦИИ РЕНДЕРИНГА
// ==============================

function renderRoster(team, players, protocol) {
    const tbodyId = team === 'A' ? 'teamARoster' : 'teamBRoster';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const rowCount = Math.max(20, players.length);
    
    for (let i = 0; i < rowCount; i++) {
        const player = players[i] || { number: '', name: '', position: '' };
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${player.number}</td>
            <td class="player-name">${player.name}</td>
            <td><input type="text" style="width: 30px;"></td>
            <td>${player.position}</td>
            <td><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 50px;"></td>
            <td class="event-cell"><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 40px;"></td>
            <td class="event-cell"><input type="text" style="width: 50px;"></td>
            <td class="event-cell"><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 30px;"></td>
            <td class="event-cell"><input type="text" style="width: 100px;"></td>
            <td class="event-cell"><input type="text" style="width: 40px;"></td>
            <td class="event-cell"><input type="text" style="width: 40px;"></td>
        `;
        
        tbody.appendChild(row);
    }
    
    fillRosterWithEvents(team, protocol);
}

function fillRosterWithEvents(team, protocol) {
    const tbody = document.getElementById(team === 'A' ? 'teamARoster' : 'teamBRoster');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    // Заполняем голы
    const goals = protocol.goals[team];
    goals.forEach((goal, index) => {
        if (index < rows.length) {
            const row = rows[index];
            if (row.cells[5]) row.cells[5].querySelector('input').value = index + 1;
            if (row.cells[6]) row.cells[6].querySelector('input').value = goal.time;
            if (row.cells[7]) row.cells[7].querySelector('input').value = goal.scorer;
            if (row.cells[8] && goal.assist1) row.cells[8].querySelector('input').value = goal.assist1;
            if (row.cells[9] && goal.assist2) row.cells[9].querySelector('input').value = goal.assist2;
            if (row.cells[10] && goal.situation) row.cells[10].querySelector('input').value = goal.situation;
        }
    });
    
    // Заполняем штрафы
    const penalties = protocol.penalties[team];
    penalties.forEach((penalty, index) => {
        if (index < rows.length) {
            const row = rows[index];
            if (row.cells[11]) row.cells[11].querySelector('input').value = penalty.time;
            if (row.cells[12]) row.cells[12].querySelector('input').value = penalty.player;
            if (row.cells[13]) row.cells[13].querySelector('input').value = penalty.minutes;
            if (row.cells[14]) row.cells[14].querySelector('input').value = penalty.reason;
            if (row.cells[15]) row.cells[15].querySelector('input').value = penalty.start;
            if (row.cells[16]) row.cells[16].querySelector('input').value = penalty.end || '';
        }
    });
}

function updateProtocolResults(protocol) {
    const p1Score = document.getElementById('p1Score');
    const p2Score = document.getElementById('p2Score');
    const p3Score = document.getElementById('p3Score');
    const otScore = document.getElementById('otScore');
    const soScore = document.getElementById('soScore');
    const p1Penalty = document.getElementById('p1Penalty');
    const p2Penalty = document.getElementById('p2Penalty');
    const p3Penalty = document.getElementById('p3Penalty');
    const otPenalty = document.getElementById('otPenalty');
    const soPenalty = document.getElementById('soPenalty');
    const totalScore = document.getElementById('totalScore');
    
    if (p1Score) p1Score.value = `${protocol.periodStats[1].scoreA}:${protocol.periodStats[1].scoreB}`;
    if (p2Score) p2Score.value = `${protocol.periodStats[2].scoreA}:${protocol.periodStats[2].scoreB}`;
    if (p3Score) p3Score.value = `${protocol.periodStats[3].scoreA}:${protocol.periodStats[3].scoreB}`;
    
    if (p1Penalty) p1Penalty.value = `${protocol.periodStats[1].penaltiesA}:${protocol.periodStats[1].penaltiesB}`;
    if (p2Penalty) p2Penalty.value = `${protocol.periodStats[2].penaltiesA}:${protocol.periodStats[2].penaltiesB}`;
    if (p3Penalty) p3Penalty.value = `${protocol.periodStats[3].penaltiesA}:${protocol.periodStats[3].penaltiesB}`;
    
    if (soScore) soScore.value = `${protocol.shootout.scoreA}:${protocol.shootout.scoreB}`;
    
    let totalScoreText = `${protocol.scoreA}:${protocol.scoreB}`;
    if (protocol.shootout.winner) {
        totalScoreText += ` (б)`;
    }
    if (totalScore) totalScore.value = totalScoreText;
}

function renderPlayerStatsProtocol(protocol) {
    renderTeamStats('A', protocol);
    renderTeamStats('B', protocol);
}

function renderTeamStats(team, protocol) {
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const stats = protocol.playerStats[team];
    const tbody = document.getElementById(team === 'A' ? 'statsTeamA' : 'statsTeamB');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const playersWithStats = players.map(player => ({
        number: player.number,
        name: player.name,
        goals: stats[player.number]?.goals || 0,
        assists: stats[player.number]?.assists || 0,
        points: (stats[player.number]?.goals || 0) + (stats[player.number]?.assists || 0),
        pim: stats[player.number]?.pim || 0
    })).filter(p => p.points > 0 || p.pim > 0)
      .sort((a, b) => b.points - a.points);
    
    if (playersWithStats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Нет статистики</td></tr>';
        return;
    }
    
    playersWithStats.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.number}</td>
            <td class="player-name-col">${player.name}</td>
            <td>${player.goals}</td>
            <td>${player.assists}</td>
            <td>${player.pim}</td>
            <td><strong>${player.points}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

// ==============================
// СТАТИСТИКА ВРАТАРЕЙ (ИСПРАВЛЕННАЯ)
// ==============================

function renderGoaliesStats(protocol) {
    const tbody = document.getElementById('goaliesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const teamAName = protocol.teamA.name || 'Команда А';
    const teamBName = protocol.teamB.name || 'Команда Б';
    
    const goaliesA = protocol.teamA.players.filter(p => 
        p.position && (p.position.toLowerCase().includes('вр') || p.position.toLowerCase().includes('вратарь'))
    );
    
    const goaliesB = protocol.teamB.players.filter(p => 
        p.position && (p.position.toLowerCase().includes('вр') || p.position.toLowerCase().includes('вратарь'))
    );
    
    function createGoalieRow(teamName, goalie, team) {
        const stats = protocol.goalieStats[team][goalie.number] || { 
            saves: 0, 
            goalsAgainst: 0, 
            timeOnIce: 0,
            shots: 0
        };
        
        const saves = stats.saves || 0;
        const goalsAgainst = stats.goalsAgainst || 0;
        const shots = stats.shots || (saves + goalsAgainst);
        const savePercentage = shots > 0 ? ((saves * 100) / shots).toFixed(1) : '0.0';
        
        // Время на площадке в минутах
        const timeOnIce = stats.timeOnIce || 0;
        const timeOnIceFormatted = timeOnIce.toFixed(1);
        
        // Коэффициент надежности (КН = ПШ / Время в часах)
        const timeInHours = timeOnIce / 60;
        const gaa = timeInHours > 0 ? (goalsAgainst / timeInHours).toFixed(2) : '0.00';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamName}</td>
            <td>${goalie.number}</td>
            <td>${goalie.name}</td>
            <td>${shots}</td>
            <td>${goalsAgainst}</td>
            <td>${saves}</td>
            <td>${savePercentage}%</td>
            <td>${gaa}</td>
            <td>${timeOnIceFormatted}</td>
        `;
        return row;
    }
    
    // Вратари команды А
    if (goaliesA.length > 0) {
        goaliesA.forEach(goalie => {
            tbody.appendChild(createGoalieRow(teamAName, goalie, 'A'));
        });
    } else {
        // Запасной вариант, если вратарей нет
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamAName}</td>
            <td><input type="text" style="width: 30px;"></td>
            <td><input type="text" style="width: 120px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 50px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 50px;"></td>
        `;
        tbody.appendChild(row);
    }
    
    // Вратари команды Б
    if (goaliesB.length > 0) {
        goaliesB.forEach(goalie => {
            tbody.appendChild(createGoalieRow(teamBName, goalie, 'B'));
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamBName}</td>
            <td><input type="text" style="width: 30px;"></td>
            <td><input type="text" style="width: 120px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 50px;"></td>
            <td><input type="text" style="width: 40px;"></td>
            <td><input type="text" style="width: 50px;"></td>
        `;
        tbody.appendChild(row);
    }
}

function updateGoalieSelects(protocol) {
    const selectA = document.getElementById('activeGoalieA');
    const selectB = document.getElementById('activeGoalieB');
    
    if (!selectA || !selectB) return;
    
    const goaliesA = protocol.teamA.players.filter(p => 
        p.position && (p.position.toLowerCase().includes('вр') || p.position.toLowerCase().includes('вратарь'))
    );
    
    const goaliesB = protocol.teamB.players.filter(p => 
        p.position && (p.position.toLowerCase().includes('вр') || p.position.toLowerCase().includes('вратарь'))
    );
    
    selectA.innerHTML = '<option value="">Выберите вратаря</option>' + 
        goaliesA.map(g => `<option value="${g.number}" ${protocol.activeGoalies.A === g.number ? 'selected' : ''}>#${g.number} ${g.name}</option>`).join('');
    
    selectB.innerHTML = '<option value="">Выберите вратаря</option>' + 
        goaliesB.map(g => `<option value="${g.number}" ${protocol.activeGoalies.B === g.number ? 'selected' : ''}>#${g.number} ${g.name}</option>`).join('');
    
    goaliesA.forEach(g => {
        if (!protocol.goalieStats.A[g.number]) {
            protocol.goalieStats.A[g.number] = { 
                saves: 0, 
                goalsAgainst: 0, 
                timeOnIce: 0, 
                shots: 0 
            };
        }
        if (!protocol.goalieEntryTimes.A) protocol.goalieEntryTimes.A = {};
        if (!protocol.goalieEntryTimes.A[g.number]) {
            protocol.goalieEntryTimes.A[g.number] = 0;
        }
    });
    
    goaliesB.forEach(g => {
        if (!protocol.goalieStats.B[g.number]) {
            protocol.goalieStats.B[g.number] = { 
                saves: 0, 
                goalsAgainst: 0, 
                timeOnIce: 0, 
                shots: 0 
            };
        }
        if (!protocol.goalieEntryTimes.B) protocol.goalieEntryTimes.B = {};
        if (!protocol.goalieEntryTimes.B[g.number]) {
            protocol.goalieEntryTimes.B[g.number] = 0;
        }
    });
}

function updateGoalieDisplay(team, protocol) {
    const goalie = protocol.activeGoalies[team];
    if (!goalie) return;
    
    const stats = protocol.goalieStats[team][goalie] || { 
        saves: 0, 
        goalsAgainst: 0, 
        timeOnIce: 0, 
        shots: 0 
    };
    
    const savesId = team === 'A' ? 'savesA' : 'savesB';
    const goalsAgainstId = team === 'A' ? 'goalsAgainstA' : 'goalsAgainstB';
    const timeOnIceId = team === 'A' ? 'timeOnIceA' : 'timeOnIceB';
    
    const savesElement = document.getElementById(savesId);
    const goalsAgainstElement = document.getElementById(goalsAgainstId);
    const timeOnIceElement = document.getElementById(timeOnIceId);
    
    if (savesElement) savesElement.textContent = stats.saves;
    if (goalsAgainstElement) goalsAgainstElement.textContent = stats.goalsAgainst;
    
    // Время на площадке уже хранится в минутах, просто форматируем
    if (timeOnIceElement) {
        const timeOnIceSeconds = stats.timeOnIce * 60;
        timeOnIceElement.textContent = formatTime(timeOnIceSeconds);
    }
    
    // Обновляем таблицу статистики
    renderGoaliesStats(protocol);
}

function updateGoalieTime(protocol) {
    if (!protocol.isRunning) return;
    
    const matchTimeElapsed = getTotalMatchTime(protocol);
    
    // Обновляем отображение времени для активных вратарей
    ['A', 'B'].forEach(team => {
        const goalie = protocol.activeGoalies[team];
        if (goalie && protocol.goalieStats[team][goalie]) {
            const timeOnIceId = team === 'A' ? 'timeOnIceA' : 'timeOnIceB';
            const timeOnIceElement = document.getElementById(timeOnIceId);
            
            if (timeOnIceElement) {
                const entryTime = protocol.goalieEntryTimes[team] ? 
                    (protocol.goalieEntryTimes[team][goalie] || 0) : 0;
                const currentSessionTime = Math.max(0, matchTimeElapsed - entryTime);
                const stats = protocol.goalieStats[team][goalie];
                const totalTimeOnIce = (stats.timeOnIce || 0) + (currentSessionTime / 60);
                
                timeOnIceElement.textContent = formatTime(totalTimeOnIce * 60);
            }
        }
    });
}

function changeGoalie(team) {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    const selectId = team === 'A' ? 'activeGoalieA' : 'activeGoalieB';
    const select = document.getElementById(selectId);
    
    if (!select) return;
    
    const newGoalie = select.value;
    
    if (!newGoalie) {
        // Если выбрано "Выберите вратаря", фиксируем время старого вратаря
        const oldGoalie = protocol.activeGoalies[team];
        const matchTimeElapsed = getTotalMatchTime(protocol);
        
        if (oldGoalie && protocol.goalieStats[team][oldGoalie]) {
            const entryTime = protocol.goalieEntryTimes[team] ? 
                (protocol.goalieEntryTimes[team][oldGoalie] || 0) : 0;
            const timeOnIce = Math.max(0, matchTimeElapsed - entryTime);
            
            if (timeOnIce > 0) {
                // Добавляем только фактическое время игры (в минутах)
                protocol.goalieStats[team][oldGoalie].timeOnIce = 
                    (protocol.goalieStats[team][oldGoalie].timeOnIce || 0) + (timeOnIce / 60);
                
                // Добавляем событие
                const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
                const oldGoaliePlayer = players.find(p => p.number == oldGoalie);
                if (oldGoaliePlayer) {
                    addEvent(protocol, `Вратарь ${oldGoaliePlayer.name} покидает лед (сыграл ${formatTime(timeOnIce)})`, 'goalie-change');
                }
            }
        }
        
        protocol.activeGoalies[team] = null;
        updateGoalieDisplay(team, protocol);
        saveCurrentProtocol();
        return;
    }
    
    const oldGoalie = protocol.activeGoalies[team];
    const matchTimeElapsed = getTotalMatchTime(protocol);
    
    // 1. Фиксируем время выхода старого вратаря
    if (oldGoalie && protocol.goalieStats[team][oldGoalie]) {
        const entryTime = protocol.goalieEntryTimes[team] ? 
            (protocol.goalieEntryTimes[team][oldGoalie] || 0) : 0;
        const timeOnIce = Math.max(0, matchTimeElapsed - entryTime);
        
        if (timeOnIce > 0) {
            // Только фактическое время на площадке (в минутах)
            protocol.goalieStats[team][oldGoalie].timeOnIce = 
                (protocol.goalieStats[team][oldGoalie].timeOnIce || 0) + (timeOnIce / 60);
            
            // Добавляем событие о замене
            const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
            const oldGoaliePlayer = players.find(p => p.number == oldGoalie);
            if (oldGoaliePlayer) {
                addEvent(protocol, `Замена вратаря: ${oldGoaliePlayer.name} покидает лед (сыграл ${formatTime(timeOnIce)})`, 'goalie-change');
            }
        }
    }
    
    // 2. Устанавливаем нового вратаря
    protocol.activeGoalies[team] = newGoalie;
    
    // 3. Запоминаем время выхода нового вратаря (абсолютное время матча)
    if (!protocol.goalieEntryTimes[team]) {
        protocol.goalieEntryTimes[team] = {};
    }
    
    // Запоминаем абсолютное время с начала матча
    protocol.goalieEntryTimes[team][newGoalie] = matchTimeElapsed;
    
    // 4. Инициализируем статистику, если нужно
    if (!protocol.goalieStats[team][newGoalie]) {
        protocol.goalieStats[team][newGoalie] = { 
            saves: 0, 
            goalsAgainst: 0, 
            timeOnIce: 0,
            shots: 0
        };
    }
    
    // 5. Добавляем событие
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const goalie = players.find(p => p.number == newGoalie);
    
    if (goalie) {
        addEvent(protocol, `Вратарь: ${goalie.name} (#${newGoalie}) выходит на лед`, 'goalie');
    }
    
    updateGoalieDisplay(team, protocol);
    saveCurrentProtocol();
}

function registerSave(team) {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    const goalie = protocol.activeGoalies[team];
    
    if (!goalie) {
        alert('Выберите активного вратаря');
        return;
    }
    
    if (!protocol.goalieStats[team][goalie]) {
        protocol.goalieStats[team][goalie] = { 
            saves: 0, 
            goalsAgainst: 0, 
            timeOnIce: 0, 
            shots: 0 
        };
    }
    
    protocol.goalieStats[team][goalie].saves++;
    protocol.goalieStats[team][goalie].shots = 
        (protocol.goalieStats[team][goalie].shots || 0) + 1;
    
    updateGoalieDisplay(team, protocol);
    
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const goaliePlayer = players.find(p => p.number == goalie);
    
    if (goaliePlayer) {
        addEvent(protocol, `🧤 Сейв: ${goaliePlayer.name} (#${goalie})`, 'save');
    }
    
    saveCurrentProtocol();
}

function updateLiveTeamNames(protocol) {
    const teamAName = protocol.teamA.name || 'Команда А';
    const teamBName = protocol.teamB.name || 'Команда Б';
    
    const liveTeamA = document.getElementById('liveTeamA');
    const liveTeamB = document.getElementById('liveTeamB');
    
    if (liveTeamA) liveTeamA.textContent = teamAName;
    if (liveTeamB) liveTeamB.textContent = teamBName;
}

// ==============================
// ИМПОРТ CSV
// ==============================

function importCSV() {
    document.getElementById('csvModal').style.display = 'flex';
}

function closeCSVModal() {
    document.getElementById('csvModal').style.display = 'none';
}

function processCSV(team) {
    const textareaId = team === 'A' ? 'csvTeamA' : 'csvTeamB';
    const textarea = document.getElementById(textareaId);
    
    if (!textarea) return;
    
    const csv = textarea.value.trim();
    
    if (!csv) {
        alert('Вставьте данные CSV');
        return;
    }
    
    try {
        const lines = csv.split(/[\r\n]+/).filter(line => line.trim());
        const players = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            if (line.toLowerCase().includes('номер') || line.toLowerCase().includes('фамилия')) {
                continue;
            }
            
            const parts = line.split(',').map(p => p.trim());
            
            if (parts.length >= 2) {
                players.push({
                    number: parts[0],
                    name: parts[1],
                    position: parts[2] || ''
                });
            }
        }
        
        if (players.length === 0) {
            alert('Не удалось распознать игроков');
            return;
        }
        
        if (allProtocols.length === 0) return;
        const protocol = allProtocols[currentProtocolIndex];
        
        if (team === 'A') {
            protocol.teamA.players = players;
            renderRoster('A', players, protocol);
        } else {
            protocol.teamB.players = players;
            renderRoster('B', players, protocol);
        }
        
        saveCurrentProtocol();
        updateGoalieSelects(protocol);
        renderGoaliesStats(protocol);
        
        alert(`✓ Загружено ${players.length} игроков для команды ${team}`);
        closeCSVModal();
        
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ==============================
// ГОЛЫ И ШТРАФЫ (С ПРЕКРАЩЕНИЕМ ШТРАФОВ ПРИ ГОЛЕ) - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ==============================

function showGoalDialog(team) {
    console.log(`🎯 Открытие диалога гола для команды ${team}`);
    currentTeam = team;
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    
    if (players.length === 0) {
        alert('Загрузите состав команды');
        return;
    }
    
    const dialog = document.getElementById('goalDialog');
    if (!dialog) {
        console.error('Диалог гола не найден');
        return;
    }
    
    const scorerSelect = document.getElementById('goalScorer');
    const assist1Select = document.getElementById('assist1');
    const assist2Select = document.getElementById('assist2');
    
    if (!scorerSelect || !assist1Select || !assist2Select) {
        console.error('Селекторы не найдены');
        return;
    }
    
    scorerSelect.innerHTML = players.map(p => 
        `<option value="${p.number}">#${p.number} ${p.name}</option>`
    ).join('');
    
    assist1Select.innerHTML = '<option value="">Нет</option>' + players.map(p => 
        `<option value="${p.number}">#${p.number} ${p.name}</option>`
    ).join('');
    
    assist2Select.innerHTML = '<option value="">Нет</option>' + players.map(p => 
        `<option value="${p.number}">#${p.number} ${p.name}</option>`
    ).join('');
    
    // Автоматически определяем ситуацию
    updateGameSituationDisplay(team);
    
    dialog.style.display = 'flex';
    console.log('✅ Диалог гола открыт');
}

function confirmGoal() {
    console.log('✅ Подтверждение гола');
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    const team = currentTeam;
    
    const scorerNum = document.getElementById('goalScorer').value;
    const assist1Num = document.getElementById('assist1').value;
    const assist2Num = document.getElementById('assist2').value;
    const gameSituation = document.getElementById('gameSituation').value;
    
    console.log(`Гол: команда ${team}, игрок ${scorerNum}, ассистенты ${assist1Num}, ${assist2Num}`);
    
    if (!scorerNum) {
        alert('Выберите автора гола');
        return;
    }
    
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const scorer = players.find(p => p.number == scorerNum);
    
    if (!scorer) {
        alert('Игрок не найден');
        return;
    }
    
    // ПРЕКРАЩЕНИЕ ШТРАФОВ ПРИ ГОЛЕ (правило гола в меньшинстве)
    const terminatedPenalties = terminatePenaltiesOnGoal(protocol, team);
    
    if (team === 'A') {
        protocol.scoreA++;
        protocol.periodStats[protocol.currentPeriod].scoreA++;
        document.getElementById('scoreA').textContent = protocol.scoreA;
    } else {
        protocol.scoreB++;
        protocol.periodStats[protocol.currentPeriod].scoreB++;
        document.getElementById('scoreB').textContent = protocol.scoreB;
    }
    
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    const goalData = {
        time: formatTime(currentGameTime),
        period: protocol.currentPeriod,
        scorer: scorerNum,
        assist1: assist1Num || '',
        assist2: assist2Num || '',
        situation: gameSituation || ''
    };
    
    protocol.goals[team].push(goalData);
    
    if (!protocol.playerStats[team][scorerNum]) {
        protocol.playerStats[team][scorerNum] = { goals: 0, assists: 0, pim: 0 };
    }
    protocol.playerStats[team][scorerNum].goals++;
    
    if (assist1Num) {
        if (!protocol.playerStats[team][assist1Num]) {
            protocol.playerStats[team][assist1Num] = { goals: 0, assists: 0, pim: 0 };
        }
        protocol.playerStats[team][assist1Num].assists++;
    }
    
    if (assist2Num) {
        if (!protocol.playerStats[team][assist2Num]) {
            protocol.playerStats[team][assist2Num] = { goals: 0, assists: 0, pim: 0 };
        }
        protocol.playerStats[team][assist2Num].assists++;
    }
    
    // Обновление статистики вратаря
    const oppositeTeam = team === 'A' ? 'B' : 'A';
    const goalie = protocol.activeGoalies[oppositeTeam];
    if (goalie && protocol.goalieStats[oppositeTeam][goalie]) {
        protocol.goalieStats[oppositeTeam][goalie].goalsAgainst++;
        protocol.goalieStats[oppositeTeam][goalie].shots = 
            (protocol.goalieStats[oppositeTeam][goalie].shots || 0) + 1;
        updateGoalieDisplay(oppositeTeam, protocol);
    }
    
    let eventText = `🏒 ГОЛ! ${scorer.name} (#${scorerNum})`;
    if (assist1Num) {
        const assist1 = players.find(p => p.number == assist1Num);
        eventText += `, ассист: ${assist1.name}`;
    }
    if (assist2Num) {
        const assist2 = players.find(p => p.number == assist2Num);
        eventText += `, ${assist2.name}`;
    }
    if (gameSituation) {
        eventText += ` (${getSituationDescription(gameSituation)})`;
    }
    if (terminatedPenalties > 0) {
        eventText += ` [прерван ${terminatedPenalties} штраф]`;
    }
    
    addEvent(protocol, eventText, 'goal');
    renderRoster(team, protocol.teamA.players, protocol);
    renderPlayerStatsProtocol(protocol);
    updateDisplay(protocol);
    updateProtocolResults(protocol);
    updatePenaltiesDisplayOnScoreboard(protocol);
    
    closeModal('goalDialog');
    document.getElementById('gameSituation').value = '';
    
    saveCurrentProtocol();
    console.log('✅ Гол успешно зарегистрирован');
}

function showPenaltyDialog(team) {
    console.log(`⚠️ Открытие диалога штрафа для команды ${team}`);
    currentTeam = team;
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    
    if (players.length === 0) {
        alert('Загрузите состав команды');
        return;
    }
    
    const dialog = document.getElementById('penaltyDialog');
    if (!dialog) {
        console.error('Диалог штрафа не найден');
        return;
    }
    
    const playerSelect = document.getElementById('penaltyPlayer');
    if (!playerSelect) {
        console.error('Селектор игрока не найден');
        return;
    }
    
    playerSelect.innerHTML = players.map(p => 
        `<option value="${p.number}">#${p.number} ${p.name}</option>`
    ).join('');
    
    document.getElementById('penaltyReason').value = '';
    
    dialog.style.display = 'flex';
    console.log('✅ Диалог штрафа открыт');
}

function confirmPenalty() {
    console.log('✅ Подтверждение штрафа');
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    const team = currentTeam;
    
    const playerNum = document.getElementById('penaltyPlayer').value;
    const minutes = document.getElementById('penaltyMinutes').value;
    const reason = document.getElementById('penaltyReason').value || 'Нарушение правил';
    
    console.log(`Штраф: команда ${team}, игрок ${playerNum}, ${minutes} мин, причина: ${reason}`);
    
    if (!playerNum) {
        alert('Выберите игрока');
        return;
    }
    
    if (!minutes) {
        alert('Выберите время штрафа');
        return;
    }
    
    const players = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const player = players.find(p => p.number == playerNum);
    
    if (!player) {
        alert('Игрок не найден');
        return;
    }
    
    const penaltyMinutes = parseInt(minutes);
    
    if (team === 'A') {
        protocol.periodStats[protocol.currentPeriod].penaltiesA += penaltyMinutes;
    } else {
        protocol.periodStats[protocol.currentPeriod].penaltiesB += penaltyMinutes;
    }
    
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    const startTime = formatTime(currentGameTime);
    let endTime = '';
    
    // Для штрафа "до конца игры" не указываем время окончания
    if (penaltyMinutes === 20) {
        endTime = "до конца игры";
    } else {
        const endTimeSeconds = currentGameTime + (penaltyMinutes * 60);
        endTime = formatTime(endTimeSeconds);
    }
    
    const penaltyData = {
        time: startTime,
        period: protocol.currentPeriod,
        player: playerNum,
        minutes: minutes,
        reason: reason,
        start: startTime,
        end: endTime
    };
    
    const penaltyIndex = protocol.penalties[team].length + 1;
    protocol.penalties[team].push(penaltyData);
    
    // Добавляем в активные штрафы (кроме дисциплинарных 10 минут и матч-штрафов)
    if (penaltyMinutes !== 10 && penaltyMinutes !== 20) { 
        protocol.activePenalties.push({
            team: team,
            playerNum: playerNum,
            penaltyIndex: penaltyIndex,
            startTimeSeconds: currentGameTime,
            endTimeSeconds: currentGameTime + (penaltyMinutes * 60),
            completed: false,
            minutes: penaltyMinutes
        });
    }
    
    if (!protocol.playerStats[team][playerNum]) {
        protocol.playerStats[team][playerNum] = { goals: 0, assists: 0, pim: 0 };
    }
    protocol.playerStats[team][playerNum].pim += penaltyMinutes;
    
    addEvent(protocol, `⚠️ ШТРАФ: ${player.name} (#${playerNum}) - ${minutes} мин - ${reason}`, 'penalty');
    renderRoster(team, protocol.teamA.players, protocol);
    renderPlayerStatsProtocol(protocol);
    updateProtocolResults(protocol);
    
    // Обновляем отображение удалений на табло
    updatePenaltiesDisplayOnScoreboard(protocol);
    
    closeModal('penaltyDialog');
    document.getElementById('penaltyReason').value = '';
    
    saveCurrentProtocol();
    console.log('✅ Штраф успешно зарегистрирован');
}

// ==============================
// БУЛЛИТЫ (ШТРАФНЫЕ БРОСКИ) - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ==============================

function showPenaltyShotDialog(team) {
    currentPenaltyShotTeam = team;
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    const roster = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const oppositeRoster = team === 'A' ? protocol.teamB.players : protocol.teamA.players;
    
    if (roster.length === 0 || oppositeRoster.length === 0) {
        alert('Загрузите составы обеих команд');
        return;
    }
    
    if (protocol.isRunning) {
        pauseTimer();
        addEvent(protocol, '⏸ Время остановлено для выполнения буллита', 'penalty-shot');
    }
    
    const dialog = document.getElementById('penaltyShotDialog');
    if (!dialog) return;
    
    const playerSelect = document.getElementById('penaltyShotPlayer');
    if (playerSelect) {
        playerSelect.innerHTML = roster.map(p => 
            `<option value="${p.number}">#${p.number} ${p.name}</option>`
        ).join('');
    }
    
    const goalies = oppositeRoster.filter(p => 
        p.position && (p.position.toLowerCase().includes('вр') || p.position.toLowerCase().includes('вратарь'))
    );
    
    const goalieSelect = document.getElementById('penaltyShotGoalie');
    if (goalieSelect) {
        if (goalies.length > 0) {
            goalieSelect.innerHTML = goalies.map(g => 
                `<option value="${g.number}">#${g.number} ${g.name}</option>`
            ).join('');
        } else {
            goalieSelect.innerHTML = '<option value="">Вратарь не указан</option>';
        }
    }
    
    dialog.style.display = 'flex';
}

function executePenaltyShot(isGoal) {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    const team = currentPenaltyShotTeam;
    
    const playerNum = document.getElementById('penaltyShotPlayer').value;
    const goalieNum = document.getElementById('penaltyShotGoalie').value;
    
    if (!playerNum) {
        alert('Выберите игрока для выполнения буллита');
        return;
    }
    
    const roster = team === 'A' ? protocol.teamA.players : protocol.teamB.players;
    const oppositeTeam = team === 'A' ? 'B' : 'A';
    const oppositeRoster = team === 'A' ? protocol.teamB.players : protocol.teamA.players;
    
    const player = roster.find(p => p.number == playerNum);
    const goalie = oppositeRoster.find(p => p.number == goalieNum);
    
    if (!player) {
        alert('Игрок не найден');
        return;
    }
    
    const currentGameTime = 15 * 60 - protocol.timeLeft;
    
    if (isGoal) {
        // ОБНОВЛЯЕМ СЧЕТ НЕМЕДЛЕННО
        if (team === 'A') {
            protocol.scoreA++;
            protocol.periodStats[protocol.currentPeriod].scoreA++;
            document.getElementById('scoreA').textContent = protocol.scoreA;
        } else {
            protocol.scoreB++;
            protocol.periodStats[protocol.currentPeriod].scoreB++;
            document.getElementById('scoreB').textContent = protocol.scoreB;
        }
        
        const goalData = {
            time: formatTime(currentGameTime),
            period: protocol.currentPeriod,
            scorer: playerNum,
            assist1: '',
            assist2: '',
            situation: 'ШБ'  // Штрафной бросок
        };
        
        protocol.goals[team].push(goalData);
        
        if (!protocol.playerStats[team][playerNum]) {
            protocol.playerStats[team][playerNum] = { goals: 0, assists: 0, pim: 0 };
        }
        protocol.playerStats[team][playerNum].goals++;
        
        if (goalieNum && protocol.goalieStats[oppositeTeam][goalieNum]) {
            protocol.goalieStats[oppositeTeam][goalieNum].goalsAgainst++;
            protocol.goalieStats[oppositeTeam][goalieNum].shots = 
                (protocol.goalieStats[oppositeTeam][goalieNum].shots || 0) + 1;
            updateGoalieDisplay(oppositeTeam, protocol);
        }
        
        addEvent(protocol, `🎯 ГОЛ С БУЛЛИТА! ${player.name} (#${playerNum}) забил${goalie ? ` вратарю ${goalie.name}` : ''}`, 'penalty-shot-goal');
    } else {
        if (goalieNum && protocol.goalieStats[oppositeTeam][goalieNum]) {
            protocol.goalieStats[oppositeTeam][goalieNum].saves++;
            protocol.goalieStats[oppositeTeam][goalieNum].shots = 
                (protocol.goalieStats[oppositeTeam][goalieNum].shots || 0) + 1;
            updateGoalieDisplay(oppositeTeam, protocol);
        }
        
        addEvent(protocol, `🎯 Буллит не реализован: ${player.name} (#${playerNum})${goalie ? `, отразил ${goalie.name}` : ''}`, 'penalty-shot-miss');
    }
    
    // Обновляем все отображения сразу
    updateDisplay(protocol);
    renderRoster(team, protocol.teamA.players, protocol);
    renderPlayerStatsProtocol(protocol);
    updateProtocolResults(protocol);
    
    closeModal('penaltyShotDialog');
    addEvent(protocol, '▶ Игра может быть возобновлена', 'info');
    
    // Сразу сохраняем протокол
    saveCurrentProtocol();
}

// ==============================
// ПОСЛЕМАТЧЕВЫЕ БРОСКИ
// ==============================

function startShootout() {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    protocol.shootout = { 
        scoreA: 0, 
        scoreB: 0, 
        winner: null,
        currentRound: 1,
        attemptsA: 0,
        attemptsB: 0,
        isFinished: false
    };
    
    const modal = document.getElementById('shootoutModal');
    if (modal) {
        modal.style.display = 'flex';
        updateShootoutDisplay(protocol);
    }
}

function shootoutGoal(team) {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    if (protocol.shootout.isFinished) return;
    
    if (team === 'A') {
        protocol.shootout.scoreA++;
        protocol.shootout.attemptsA++;
    } else {
        protocol.shootout.scoreB++;
        protocol.shootout.attemptsB++;
    }
    
    addEvent(protocol, `🏒 ГОЛ в буллитах: команда ${team}`, 'shootout-goal');
    updateShootoutDisplay(protocol);
    checkShootoutWinner(protocol);
}

function shootoutMiss(team) {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    if (protocol.shootout.isFinished) return;
    
    if (team === 'A') {
        protocol.shootout.attemptsA++;
    } else {
        protocol.shootout.attemptsB++;
    }
    
    addEvent(protocol, `✗ ПРОМАХ в буллитах: команда ${team}`, 'shootout-miss');
    updateShootoutDisplay(protocol);
    checkShootoutWinner(protocol);
}

function checkShootoutWinner(protocol) {
    // Основная серия - по 3 броска
    if (protocol.shootout.currentRound <= 3) {
        // Если обе команды сделали броски в этом раунде
        if (protocol.shootout.attemptsA >= protocol.shootout.currentRound && 
            protocol.shootout.attemptsB >= protocol.shootout.currentRound) {
            
            // Проверяем, можно ли определить победителя
            const remainingRounds = 3 - protocol.shootout.currentRound;
            const scoreDiff = Math.abs(protocol.shootout.scoreA - protocol.shootout.scoreB);
            
            if (scoreDiff > remainingRounds) {
                // Победитель определен досрочно
                finishShootout();
                return;
            }
            
            protocol.shootout.currentRound++;
        }
    } else {
        // Внезапная смерть
        const totalAttempts = protocol.shootout.attemptsA + protocol.shootout.attemptsB;
        
        // Проверяем после каждой пары бросков
        if (totalAttempts % 2 === 0 && protocol.shootout.attemptsA === protocol.shootout.attemptsB) {
            if (protocol.shootout.scoreA !== protocol.shootout.scoreB) {
                finishShootout();
            }
        }
    }
    
    updateShootoutDisplay(protocol);
}

function updateShootoutDisplay(protocol) {
    const shootoutScoreAElement = document.getElementById('shootoutScoreA');
    const shootoutScoreBElement = document.getElementById('shootoutScoreB');
    const shootoutRoundNumElement = document.getElementById('shootoutRoundNum');
    const shootoutPhaseElement = document.getElementById('shootoutPhase');
    const shootoutCurrentTeamElement = document.getElementById('shootoutCurrentTeam');
    
    if (shootoutScoreAElement) shootoutScoreAElement.textContent = protocol.shootout.scoreA;
    if (shootoutScoreBElement) shootoutScoreBElement.textContent = protocol.shootout.scoreB;
    
    if (protocol.shootout.currentRound <= 3) {
        if (shootoutPhaseElement) shootoutPhaseElement.textContent = `Основная серия (по 3 броска)`;
        if (shootoutRoundNumElement) shootoutRoundNumElement.textContent = protocol.shootout.currentRound;
    } else {
        if (shootoutPhaseElement) shootoutPhaseElement.textContent = `Внезапная смерть`;
        if (shootoutRoundNumElement) shootoutRoundNumElement.textContent = protocol.shootout.currentRound;
    }
    
    // Определяем, какая команда бросает следующей
    if (protocol.shootout.attemptsA <= protocol.shootout.attemptsB) {
        if (shootoutCurrentTeamElement) shootoutCurrentTeamElement.textContent = 'A';
    } else {
        if (shootoutCurrentTeamElement) shootoutCurrentTeamElement.textContent = 'B';
    }
}

function finishShootout() {
    if (allProtocols.length === 0) return;
    const protocol = allProtocols[currentProtocolIndex];
    
    if (protocol.shootout.isFinished) return;
    
    protocol.shootout.isFinished = true;
    
    if (protocol.shootout.scoreA > protocol.shootout.scoreB) {
        protocol.shootout.winner = 'A';
        protocol.scoreA++;
        alert(`Команда А победила в серии буллитов ${protocol.shootout.scoreA}:${protocol.shootout.scoreB}!`);
    } else {
        protocol.shootout.winner = 'B';
        protocol.scoreB++;
        alert(`Команда Б победила в серии буллитов ${protocol.shootout.scoreA}:${protocol.shootout.scoreB}!`);
    }
    
    // Обновляем счет на табло сразу
    document.getElementById('scoreA').textContent = protocol.scoreA;
    document.getElementById('scoreB').textContent = protocol.scoreB;
    
    updateDisplay(protocol);
    updateProtocolResults(protocol);
    closeModal('shootoutModal');
    addEvent(protocol, `Победа в буллитах: ${protocol.shootout.scoreA}:${protocol.shootout.scoreB}`, 'shootout-win');
    saveCurrentProtocol();
}

// ==============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==============================

function toggleLiveMode() {
    const panel = document.getElementById('livePanel');
    const btn = document.getElementById('liveModeBtn');
    
    if (!panel || !btn) return;
    
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-stop"></i> Закрыть режим матча';
        btn.classList.add('active');
        if (allProtocols.length > 0) {
            const protocol = allProtocols[currentProtocolIndex];
            updateLiveTeamNames(protocol);
            updatePenaltiesDisplayOnScoreboard(protocol);
        }
    } else {
        panel.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-play"></i> Режим матча';
        btn.classList.remove('active');
    }
}

function closeModal(modalId) {
    console.log(`Закрытие модального окна: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        console.log(`✅ Модальное окно ${modalId} закрыто`);
    } else {
        console.error(`❌ Модальное окно ${modalId} не найдено`);
    }
}

function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const logoImage = document.getElementById('logoImage');
        const logoEmoji = document.getElementById('logoEmoji');
        
        if (logoImage && logoEmoji) {
            logoImage.src = e.target.result;
            logoImage.style.display = 'block';
            logoEmoji.style.display = 'none';
        }
    };
    
    reader.readAsDataURL(file);
}

function exportCurrentProtocol() {
    if (allProtocols.length === 0) return;
    
    saveCurrentProtocol();
    const protocol = allProtocols[currentProtocolIndex];
    
    const dataStr = JSON.stringify(protocol, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `протокол_матча_${protocol.matchNumber}_${protocol.matchDate}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert(`Протокол №${protocol.matchNumber} экспортирован`);
}

function exportPDF() {
    if (allProtocols.length === 0) {
        alert('Нет активного протокола');
        return;
    }
    
    const element = document.getElementById('protocol');
    
    if (!element) {
        alert('Элемент протокола не найден');
        return;
    }
    
    saveCurrentProtocol();
    
    const originalFontSize = element.style.fontSize;
    const originalPadding = element.style.padding;
    element.style.fontSize = '8px';
    element.style.padding = '10px';
    
    const opt = {
        margin: [5, 5, 5, 5],
        filename: `protocol_${allProtocols[currentProtocolIndex].matchNumber || 'match'}_${currentProtocolIndex + 1}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
            scale: 1.5,
            useCORS: true,
            letterRendering: true,
            logging: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    const inputs = element.querySelectorAll('input');
    const originalBorders = [];
    inputs.forEach((input, index) => {
        originalBorders[index] = input.style.border;
        input.style.border = 'none';
    });
    
    html2pdf().set(opt).from(element).save().then(() => {
        inputs.forEach((input, index) => {
            input.style.border = originalBorders[index] || '';
        });
        element.style.fontSize = originalFontSize;
        element.style.padding = originalPadding;
    });
}

// ==============================
// ФУНКЦИЯ ОТКРЫТИЯ СТАТИСТИКИ
// ==============================

function openStatistics() {
    // Сохраняем текущий протокол перед переходом
    saveCurrentProtocol();
    saveAllProtocols();
    
    // Подготовка данных для передачи
    const protocolsData = {
        type: 'OPEN_STATISTICS',
        data: {
            protocols: allProtocols,
            currentProtocolIndex: currentProtocolIndex
        }
    };
    
    // Сохраняем в localStorage для страницы статистики
    localStorage.setItem('hockeyProtocols', JSON.stringify(allProtocols));
    localStorage.setItem('currentProtocolIndex', currentProtocolIndex.toString());
    
    // Открываем страницу статистики в новой вкладке
    const statsWindow = window.open('statistics.html', '_blank');
    
    // Если окно успешно открылось, отправляем данные
    if (statsWindow) {
        // Небольшая задержка для загрузки страницы статистики
        setTimeout(() => {
            try {
                statsWindow.postMessage(protocolsData, '*');
                console.log('✅ Данные протоколов отправлены в окно статистики');
            } catch (e) {
                console.error('❌ Ошибка отправки данных:', e);
            }
        }, 1000);
    }
}

function showFileManagementMenu() {
    alert('Меню управления файлами будет реализовано в следующей версии');
}

function restoreFromBackup() {
    const backup = localStorage.getItem('hockeyProtocols_backup');
    if (!backup) {
        alert('Резервная копия не найдена');
        return;
    }
    
    if (confirm('Восстановить данные из резервной копии? Текущие данные будут заменены.')) {
        localStorage.setItem('hockeyProtocols', backup);
        alert('Данные восстановлены! Перезагрузите страницу.');
    }
}

// Автосохранение при закрытии
window.addEventListener('beforeunload', function(e) {
    saveCurrentProtocol();
    saveAllProtocols();
});

// Обработчик сообщений от окна статистики
window.addEventListener('message', function(event) {
    console.log('Получено сообщение от дочернего окна:', event.data);
    
    if (event.data && event.data.type === 'REQUEST_PROTOCOLS_DATA') {
        // Отправляем данные протоколов в окно статистики
        const response = {
            type: 'PROTOCOLS_DATA',
            data: {
                protocols: allProtocols,
                currentProtocolIndex: currentProtocolIndex
            }
        };
        
        try {
            event.source.postMessage(response, '*');
            console.log('Данные протоколов отправлены в ответ на запрос');
        } catch (e) {
            console.error('Ошибка отправки данных:', e);
        }
    }
});
