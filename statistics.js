// statistics.js - полная версия
// ==============================
// ОСНОВНЫЕ ПЕРЕМЕННЫЕ
// ==============================

let allProtocols = [];
let currentProtocolIndex = 0;

let skatersData = [];
let goaliesData = [];
let teamsData = [];

let currentTab = 'skaters';
let currentSort = { field: 'points', direction: 'desc' };

// ==============================
// ИНИЦИАЛИЗАЦИЯ
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Статистика: DOM загружен');
    initStatistics();
});

function initStatistics() {
    console.log('🚀 Инициализация модуля статистики...');
    
    // Загружаем данные протоколов
    loadProtocolsData();
    
    // Инициализация обработчиков
    initEventHandlers();
    
    // Заполняем фильтры
    populateFilters();
}

function loadProtocolsData() {
    try {
        // Пытаемся получить данные из localStorage
        const savedProtocols = localStorage.getItem('hockeyProtocols');
        const savedIndex = localStorage.getItem('currentProtocolIndex');
        
        if (savedProtocols) {
            allProtocols = JSON.parse(savedProtocols);
            currentProtocolIndex = savedIndex ? parseInt(savedIndex) : 0;
            
            console.log(`📊 Загружено ${allProtocols.length} протоколов`);
            
            if (allProtocols.length > 0) {
                processAllProtocols();
                updateTable();
                updateSummaryStats();
            } else {
                showNoDataMessage();
            }
        } else {
            console.log('⚠️ Нет сохраненных протоколов');
            showNoDataMessage();
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки данных:', e);
        showNoDataMessage();
    }
}

// ==============================
// ОБРАБОТКА ДАННЫХ
// ==============================

function processAllProtocols() {
    console.log('🔄 Обработка данных протоколов...');
    
    // Очищаем предыдущие данные
    skatersData = [];
    goaliesData = [];
    teamsData = [];
    
    // Создаем карты для агрегации данных
    const skatersMap = new Map();
    const goaliesMap = new Map();
    const teamsMap = new Map();
    
    allProtocols.forEach((protocol, protocolIndex) => {
        processProtocolTeams(protocol, protocolIndex, teamsMap);
        processProtocolSkaters(protocol, protocolIndex, skatersMap);
        processProtocolGoalies(protocol, protocolIndex, goaliesMap);
    });
    
    // Преобразуем карты в массивы
    skatersData = Array.from(skatersMap.values());
    goaliesData = Array.from(goaliesMap.values());
    teamsData = Array.from(teamsMap.values());
    
    console.log(`✅ Данные обработаны:`);
    console.log(`   • Полевых игроков: ${skatersData.length}`);
    console.log(`   • Вратарей: ${goaliesData.length}`);
    console.log(`   • Команд: ${teamsData.length}`);
}

function processProtocolTeams(protocol, protocolIndex, teamsMap) {
    const teamA = protocol.teamA.name || 'Команда А';
    const teamB = protocol.teamB.name || 'Команда Б';
    
    // Обработка команды A
    if (!teamsMap.has(teamA)) {
        teamsMap.set(teamA, {
            name: teamA,
            games: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            pim: 0,
            points: 0
        });
    }
    
    const teamAData = teamsMap.get(teamA);
    teamAData.games++;
    teamAData.goalsFor += protocol.scoreA || 0;
    teamAData.goalsAgainst += protocol.scoreB || 0;
    
    // Определяем результат матча для команды A
    if (protocol.scoreA > protocol.scoreB) {
        teamAData.wins++;
        teamAData.points += 2;
    } else if (protocol.scoreA < protocol.scoreB) {
        teamAData.losses++;
    } else {
        teamAData.draws++;
        teamAData.points += 1;
    }
    
    // Штрафные минуты команды A
    if (protocol.periodStats) {
        Object.values(protocol.periodStats).forEach(period => {
            teamAData.pim += (period.penaltiesA || 0);
        });
    }
    
    // Обработка команды B
    if (!teamsMap.has(teamB)) {
        teamsMap.set(teamB, {
            name: teamB,
            games: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            pim: 0,
            points: 0
        });
    }
    
    const teamBData = teamsMap.get(teamB);
    teamBData.games++;
    teamBData.goalsFor += protocol.scoreB || 0;
    teamBData.goalsAgainst += protocol.scoreA || 0;
    
    // Определяем результат матча для команды B
    if (protocol.scoreB > protocol.scoreA) {
        teamBData.wins++;
        teamBData.points += 2;
    } else if (protocol.scoreB < protocol.scoreA) {
        teamBData.losses++;
    } else {
        teamBData.draws++;
        teamBData.points += 1;
    }
    
    // Штрафные минуты команды B
    if (protocol.periodStats) {
        Object.values(protocol.periodStats).forEach(period => {
            teamBData.pim += (period.penaltiesB || 0);
        });
    }
}

function processProtocolSkaters(protocol, protocolIndex, skatersMap) {
    // Обработка полевых игроков команды A
    if (protocol.teamA && protocol.teamA.players) {
        protocol.teamA.players.forEach(player => {
            // Пропускаем вратарей
            if (player.position && (
                player.position.toLowerCase().includes('вр') || 
                player.position.toLowerCase().includes('вратарь')
            )) {
                return;
            }
            
            const playerKey = `${player.number}-${player.name}-${protocol.teamA.name || 'Команда А'}`;
            
            if (!skatersMap.has(playerKey)) {
                skatersMap.set(playerKey, {
                    name: player.name,
                    number: player.number,
                    team: protocol.teamA.name || 'Команда А',
                    position: player.position || 'F',
                    games: 0,
                    goals: 0,
                    assists: 0,
                    points: 0,
                    pim: 0,
                    ppg: 0,
                    rank: 0
                });
            }
            
            const skaterData = skatersMap.get(playerKey);
            skaterData.games++;
            
            // Добавляем статистику из матча
            if (protocol.playerStats && protocol.playerStats.A && protocol.playerStats.A[player.number]) {
                const stats = protocol.playerStats.A[player.number];
                skaterData.goals += (stats.goals || 0);
                skaterData.assists += (stats.assists || 0);
                skaterData.pim += (stats.pim || 0);
                skaterData.points = skaterData.goals + skaterData.assists;
                skaterData.ppg = skaterData.games > 0 ? (skaterData.points / skaterData.games).toFixed(2) : '0.00';
            }
        });
    }
    
    // Обработка полевых игроков команды B
    if (protocol.teamB && protocol.teamB.players) {
        protocol.teamB.players.forEach(player => {
            // Пропускаем вратарей
            if (player.position && (
                player.position.toLowerCase().includes('вр') || 
                player.position.toLowerCase().includes('вратарь')
            )) {
                return;
            }
            
            const playerKey = `${player.number}-${player.name}-${protocol.teamB.name || 'Команда Б'}`;
            
            if (!skatersMap.has(playerKey)) {
                skatersMap.set(playerKey, {
                    name: player.name,
                    number: player.number,
                    team: protocol.teamB.name || 'Команда Б',
                    position: player.position || 'F',
                    games: 0,
                    goals: 0,
                    assists: 0,
                    points: 0,
                    pim: 0,
                    ppg: 0,
                    rank: 0
                });
            }
            
            const skaterData = skatersMap.get(playerKey);
            skaterData.games++;
            
            // Добавляем статистику из матча
            if (protocol.playerStats && protocol.playerStats.B && protocol.playerStats.B[player.number]) {
                const stats = protocol.playerStats.B[player.number];
                skaterData.goals += (stats.goals || 0);
                skaterData.assists += (stats.assists || 0);
                skaterData.pim += (stats.pim || 0);
                skaterData.points = skaterData.goals + skaterData.assists;
                skaterData.ppg = skaterData.games > 0 ? (skaterData.points / skaterData.games).toFixed(2) : '0.00';
            }
        });
    }
}

function processProtocolGoalies(protocol, protocolIndex, goaliesMap) {
    // Обработка вратарей команды A
    if (protocol.teamA && protocol.teamA.players) {
        const goalies = protocol.teamA.players.filter(player => 
            player.position && (
                player.position.toLowerCase().includes('вр') || 
                player.position.toLowerCase().includes('вратарь')
            )
        );
        
        goalies.forEach(goalie => {
            const goalieKey = `${goalie.number}-${goalie.name}-${protocol.teamA.name || 'Команда А'}`;
            
            if (!goaliesMap.has(goalieKey)) {
                goaliesMap.set(goalieKey, {
                    name: goalie.name,
                    number: goalie.number,
                    team: protocol.teamA.name || 'Команда А',
                    games: 0,
                    wins: 0,
                    losses: 0,
                    goalsAgainst: 0,
                    saves: 0,
                    shots: 0,
                    savePercentage: 0,
                    gaa: 0,
                    timeOnIce: 0,
                    rank: 0
                });
            }
            
            const goalieData = goaliesMap.get(goalieKey);
            
            // Учитываем игру, если вратарь был активным
            if (protocol.activeGoalies && protocol.activeGoalies.A === goalie.number) {
                goalieData.games++;
                
                // Определяем результат матча для вратаря
                if (protocol.scoreA > protocol.scoreB) {
                    goalieData.wins++;
                } else if (protocol.scoreA < protocol.scoreB) {
                    goalieData.losses++;
                }
                
                // Добавляем статистику из матча
                if (protocol.goalieStats && protocol.goalieStats.A && protocol.goalieStats.A[goalie.number]) {
                    const stats = protocol.goalieStats.A[goalie.number];
                    goalieData.goalsAgainst += (stats.goalsAgainst || 0);
                    goalieData.saves += (stats.saves || 0);
                    goalieData.shots += (stats.shots || 0);
                    goalieData.timeOnIce += (stats.timeOnIce || 0);
                    
                    // Рассчитываем процент сейвов
                    if (goalieData.shots > 0) {
                        goalieData.savePercentage = ((goalieData.saves / goalieData.shots) * 100).toFixed(1);
                    }
                    
                    // Рассчитываем коэффициент надежности (GAA)
                    if (goalieData.timeOnIce > 0) {
                        const timeInHours = goalieData.timeOnIce / 60;
                        goalieData.gaa = (goalieData.goalsAgainst / timeInHours).toFixed(2);
                    }
                }
            }
        });
    }
    
    // Обработка вратарей команды B
    if (protocol.teamB && protocol.teamB.players) {
        const goalies = protocol.teamB.players.filter(player => 
            player.position && (
                player.position.toLowerCase().includes('вр') || 
                player.position.toLowerCase().includes('вратарь')
            )
        );
        
        goalies.forEach(goalie => {
            const goalieKey = `${goalie.number}-${goalie.name}-${protocol.teamB.name || 'Команда Б'}`;
            
            if (!goaliesMap.has(goalieKey)) {
                goaliesMap.set(goalieKey, {
                    name: goalie.name,
                    number: goalie.number,
                    team: protocol.teamB.name || 'Команда Б',
                    games: 0,
                    wins: 0,
                    losses: 0,
                    goalsAgainst: 0,
                    saves: 0,
                    shots: 0,
                    savePercentage: 0,
                    gaa: 0,
                    timeOnIce: 0,
                    rank: 0
                });
            }
            
            const goalieData = goaliesMap.get(goalieKey);
            
            // Учитываем игру, если вратарь был активным
            if (protocol.activeGoalies && protocol.activeGoalies.B === goalie.number) {
                goalieData.games++;
                
                // Определяем результат матча для вратаря
                if (protocol.scoreB > protocol.scoreA) {
                    goalieData.wins++;
                } else if (protocol.scoreB < protocol.scoreA) {
                    goalieData.losses++;
                }
                
                // Добавляем статистику из матча
                if (protocol.goalieStats && protocol.goalieStats.B && protocol.goalieStats.B[goalie.number]) {
                    const stats = protocol.goalieStats.B[goalie.number];
                    goalieData.goalsAgainst += (stats.goalsAgainst || 0);
                    goalieData.saves += (stats.saves || 0);
                    goalieData.shots += (stats.shots || 0);
                    goalieData.timeOnIce += (stats.timeOnIce || 0);
                    
                    // Рассчитываем процент сейвов
                    if (goalieData.shots > 0) {
                        goalieData.savePercentage = ((goalieData.saves / goalieData.shots) * 100).toFixed(1);
                    }
                    
                    // Рассчитываем коэффициент надежности (GAA)
                    if (goalieData.timeOnIce > 0) {
                        const timeInHours = goalieData.timeOnIce / 60;
                        goalieData.gaa = (goalieData.goalsAgainst / timeInHours).toFixed(2);
                    }
                }
            }
        });
    }
}

// ==============================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ==============================

function updateTable() {
    console.log(`🔄 Обновление таблицы: ${currentTab}`);
    
    hideLoadingMessage();
    
    switch(currentTab) {
        case 'skaters':
            renderSkatersTable();
            break;
        case 'goalies':
            renderGoaliesTable();
            break;
        case 'teams':
            renderTeamsTable();
            break;
    }
}

function renderSkatersTable() {
    const table = document.getElementById('skatersStatsTable');
    const tbody = document.getElementById('skatersTableBody');
    const loading = document.getElementById('skatersLoading');
    const empty = document.getElementById('skatersEmpty');
    
    if (!table || !tbody) return;
    
    // Фильтрация и сортировка данных
    let filteredData = filterSkatersData(skatersData);
    filteredData = sortSkatersData(filteredData, currentSort.field, currentSort.direction);
    
    // Добавляем ранги
    filteredData.forEach((player, index) => {
        player.rank = index + 1;
    });
    
    if (filteredData.length === 0) {
        if (table.style.display !== 'none') table.style.display = 'none';
        if (loading && loading.style.display !== 'none') loading.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    // Скрываем сообщения
    if (loading && loading.style.display !== 'none') loading.style.display = 'none';
    if (empty && empty.style.display !== 'none') empty.style.display = 'none';
    
    // Показываем таблицу
    if (table.style.display === 'none') table.style.display = 'table';
    
    // Рендерим строки
    tbody.innerHTML = '';
    
    filteredData.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="rank">${player.rank}</td>
            <td class="player-name">${player.name} #${player.number}</td>
            <td class="team-name">${player.team}</td>
            <td class="position">${player.position}</td>
            <td class="games">${player.games}</td>
            <td class="goals">${player.goals}</td>
            <td class="assists">${player.assists}</td>
            <td class="points">${player.points}</td>
            <td class="pim">${player.pim}</td>
            <td class="ppg">${player.ppg}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Обновляем счетчик
    const playerCount = document.getElementById('playerCount');
    if (playerCount) {
        playerCount.textContent = `Игроков: ${filteredData.length}`;
    }
}

function renderGoaliesTable() {
    const table = document.getElementById('goaliesStatsTable');
    const tbody = document.getElementById('goaliesTableBody');
    const loading = document.getElementById('goaliesLoading');
    const empty = document.getElementById('goaliesEmpty');
    
    if (!table || !tbody) return;
    
    // Фильтрация и сортировка данных
    let filteredData = filterGoaliesData(goaliesData);
    filteredData = sortGoaliesData(filteredData, 'savePercentage', 'desc');
    
    // Добавляем ранги
    filteredData.forEach((goalie, index) => {
        goalie.rank = index + 1;
    });
    
    if (filteredData.length === 0) {
        if (table.style.display !== 'none') table.style.display = 'none';
        if (loading && loading.style.display !== 'none') loading.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    // Скрываем сообщения
    if (loading && loading.style.display !== 'none') loading.style.display = 'none';
    if (empty && empty.style.display !== 'none') empty.style.display = 'none';
    
    // Показываем таблицу
    if (table.style.display === 'none') table.style.display = 'table';
    
    // Рендерим строки
    tbody.innerHTML = '';
    
    filteredData.forEach(goalie => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="rank">${goalie.rank}</td>
            <td class="player-name">${goalie.name} #${goalie.number}</td>
            <td class="team-name">${goalie.team}</td>
            <td class="games">${goalie.games}</td>
            <td class="wins">${goalie.wins}</td>
            <td class="losses">${goalie.losses}</td>
            <td class="goals-against">${goalie.goalsAgainst}</td>
            <td class="saves">${goalie.saves}</td>
            <td class="save-percentage">${goalie.savePercentage}%</td>
            <td class="gaa">${goalie.gaa}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Обновляем счетчик
    const goalieCount = document.getElementById('goalieCount');
    if (goalieCount) {
        goalieCount.textContent = `Вратарей: ${filteredData.length}`;
    }
}

function renderTeamsTable() {
    const table = document.getElementById('teamsStatsTable');
    const tbody = document.getElementById('teamsTableBody');
    const loading = document.getElementById('teamsLoading');
    const empty = document.getElementById('teamsEmpty');
    
    if (!table || !tbody) return;
    
    // Сортировка данных
    let filteredData = [...teamsData];
    filteredData = sortTeamsData(filteredData, 'points', 'desc');
    
    // Добавляем ранги
    filteredData.forEach((team, index) => {
        team.rank = index + 1;
    });
    
    if (filteredData.length === 0) {
        if (table.style.display !== 'none') table.style.display = 'none';
        if (loading && loading.style.display !== 'none') loading.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    // Скрываем сообщения
    if (loading && loading.style.display !== 'none') loading.style.display = 'none';
    if (empty && empty.style.display !== 'none') empty.style.display = 'none';
    
    // Показываем таблицу
    if (table.style.display === 'none') table.style.display = 'table';
    
    // Рендерим строки
    tbody.innerHTML = '';
    
    filteredData.forEach(team => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="rank">${team.rank}</td>
            <td class="team-name">${team.name}</td>
            <td class="games">${team.games}</td>
            <td class="wins">${team.wins}</td>
            <td class="losses">${team.losses}</td>
            <td class="draws">${team.draws}</td>
            <td class="goals">${team.goalsFor}</td>
            <td class="goals-against">${team.goalsAgainst}</td>
            <td class="pim">${team.pim}</td>
            <td class="points">${team.points}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Обновляем счетчик
    const teamCount = document.getElementById('teamCount');
    if (teamCount) {
        teamCount.textContent = `Команд: ${filteredData.length}`;
    }
}

// ==============================
// ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ==============================

function filterSkatersData(data) {
    const seasonFilter = document.getElementById('seasonFilter').value;
    const teamFilter = document.getElementById('teamFilter').value;
    const positionFilter = document.getElementById('positionFilter').value;
    const gamesFilter = parseInt(document.getElementById('gamesFilter').value) || 0;
    
    return data.filter(player => {
        // Фильтр по команде
        if (teamFilter !== 'all' && player.team !== teamFilter) {
            return false;
        }
        
        // Фильтр по позиции
        if (positionFilter !== 'all') {
            if (positionFilter === 'F' && !['F', 'Нап', 'Л', 'Ц', 'П', 'Н'].includes(player.position)) {
                return false;
            }
            if (positionFilter === 'D' && !['D', 'Защ'].includes(player.position)) {
                return false;
            }
        }
        
        // Фильтр по минимальному количеству игр
        if (player.games < gamesFilter) {
            return false;
        }
        
        return true;
    });
}

function filterGoaliesData(data) {
    const seasonFilter = document.getElementById('seasonFilter').value;
    const teamFilter = document.getElementById('teamFilter').value;
    const gamesFilter = parseInt(document.getElementById('gamesFilter').value) || 0;
    
    return data.filter(goalie => {
        // Фильтр по команде
        if (teamFilter !== 'all' && goalie.team !== teamFilter) {
            return false;
        }
        
        // Фильтр по минимальному количеству игр
        if (goalie.games < gamesFilter) {
            return false;
        }
        
        return true;
    });
}

function sortSkatersData(data, field, direction) {
    return [...data].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Для числовых полей
        if (['games', 'goals', 'assists', 'points', 'pim', 'ppg'].includes(field)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

function sortGoaliesData(data, field, direction) {
    return [...data].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Для числовых полей
        if (['games', 'wins', 'losses', 'goalsAgainst', 'saves', 'savePercentage', 'gaa', 'timeOnIce'].includes(field)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

function sortTeamsData(data, field, direction) {
    return [...data].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Для числовых полей
        if (['games', 'wins', 'losses', 'draws', 'goalsFor', 'goalsAgainst', 'pim', 'points'].includes(field)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

function applySort(field) {
    const th = document.querySelector(`th[data-sort="${field}"]`);
    if (!th) return;
    
    // Сбрасываем сортировку у всех заголовков
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Устанавливаем новую сортировку
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'desc';
    }
    
    // Добавляем класс для отображения стрелки
    th.classList.add(`sort-${currentSort.direction}`);
    
    // Обновляем таблицу
    updateTable();
}

// ==============================
// СВОДНАЯ СТАТИСТИКА
// ==============================

function updateSummaryStats() {
    console.log('📈 Обновление сводной статистики');
    
    // Общее количество игроков (полевых + вратарей)
    const totalPlayers = skatersData.length + goaliesData.length;
    document.getElementById('totalPlayers').textContent = totalPlayers;
    document.getElementById('totalPlayersChange').textContent = `Всего в системе`;
    
    // Общее количество голов
    const totalGoals = skatersData.reduce((sum, player) => sum + player.goals, 0);
    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('totalGoalsChange').textContent = `За все матчи`;
    
    // Общее количество передач
    const totalAssists = skatersData.reduce((sum, player) => sum + player.assists, 0);
    document.getElementById('totalAssists').textContent = totalAssists;
    document.getElementById('totalAssistsChange').textContent = `За все матчи`;
    
    // Средний процент сейвов
    const avgSavePct = goaliesData.length > 0 
        ? (goaliesData.reduce((sum, goalie) => sum + parseFloat(goalie.savePercentage || 0), 0) / goaliesData.length).toFixed(1)
        : 0;
    document.getElementById('avgSavePct').textContent = `${avgSavePct}%`;
    document.getElementById('avgSavePctChange').textContent = `Средний показатель`;
}

// ==============================
// ФИЛЬТРЫ
// ==============================

function populateFilters() {
    console.log('🎛 Заполнение фильтров');
    
    // Заполняем фильтр команд
    const teamFilter = document.getElementById('teamFilter');
    if (!teamFilter) return;
    
    teamFilter.innerHTML = '<option value="all">Все команды</option>';
    
    const uniqueTeams = [...new Set([
        ...skatersData.map(p => p.team),
        ...goaliesData.map(g => g.team),
        ...teamsData.map(t => t.name)
    ])].filter(Boolean);
    
    uniqueTeams.sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });
}

function applyFilters() {
    console.log('🔍 Применение фильтров');
    updateTable();
    updateSummaryStats();
}

// ==============================
// ЭКСПОРТ ДАННЫХ
// ==============================

function exportStatisticsCSV() {
    let csvContent = '';
    let headers = [];
    let data = [];
    
    switch(currentTab) {
        case 'skaters':
            headers = ['Ранг', 'Игрок', 'Команда', 'Позиция', 'Игры', 'Голы', 'Передачи', 'Очки', 'Штр', 'О/И'];
            data = filterSkatersData(skatersData)
                .sort((a, b) => sortSkatersData([a, b], currentSort.field, currentSort.direction)[0] === a ? -1 : 1)
                .map((p, i) => [
                    i + 1,
                    `${p.name} #${p.number}`,
                    p.team,
                    p.position,
                    p.games,
                    p.goals,
                    p.assists,
                    p.points,
                    p.pim,
                    p.ppg
                ]);
            break;
            
        case 'goalies':
            headers = ['Ранг', 'Вратарь', 'Команда', 'Игры', 'Победы', 'Поражения', 'ПШ', 'Сейвы', '%Сейв', 'КН'];
            data = filterGoaliesData(goaliesData)
                .sort((a, b) => sortGoaliesData([a, b], 'savePercentage', 'desc')[0] === a ? -1 : 1)
                .map((g, i) => [
                    i + 1,
                    `${g.name} #${g.number}`,
                    g.team,
                    g.games,
                    g.wins,
                    g.losses,
                    g.goalsAgainst,
                    g.saves,
                    `${g.savePercentage}%`,
                    g.gaa
                ]);
            break;
            
        case 'teams':
            headers = ['Ранг', 'Команда', 'Игры', 'Победы', 'Поражения', 'Ничьи', 'ГЗ', 'ГП', 'Штр', 'Очки'];
            data = teamsData
                .sort((a, b) => sortTeamsData([a, b], 'points', 'desc')[0] === a ? -1 : 1)
                .map((t, i) => [
                    i + 1,
                    t.name,
                    t.games,
                    t.wins,
                    t.losses,
                    t.draws,
                    t.goalsFor,
                    t.goalsAgainst,
                    t.pim,
                    t.points
                ]);
            break;
    }
    
    // Создаем CSV
    csvContent = headers.join(',') + '\n';
    data.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    
    // Создаем Blob и скачиваем
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `hockey_stats_${currentTab}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportStatisticsPDF() {
    alert('Экспорт в PDF будет реализован в следующей версии');
    // В будущем можно использовать библиотеку jsPDF или html2pdf.js
}

// ==============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==============================

function initEventHandlers() {
    console.log('🔄 Инициализация обработчиков событий');
    
    // Навигация по вкладкам
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            if (!tab) return;
            
            // Обновляем активную кнопку
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Скрываем все таблицы
            document.querySelectorAll('.stats-table-container').forEach(container => {
                container.style.display = 'none';
            });
            
            // Показываем активную таблицу
            const activeTable = document.getElementById(`${tab}Table`);
            if (activeTable) {
                activeTable.style.display = 'block';
            }
            
            // Обновляем текущую вкладку
            currentTab = tab;
            
            // Обновляем таблицу
            updateTable();
        });
    });
    
    // Кнопка "Назад"
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            try {
                window.location.href = 'index.html';
            } catch (e) {
                console.log('Ошибка перехода:', e);
                if (window.opener && !window.opener.closed) {
                    window.close();
                } else {
                    window.history.back();
                }
            }
        });
    }
    
    // Кнопка "Режим отладки"
    const debugButton = document.getElementById('debugButton');
    if (debugButton) {
        debugButton.addEventListener('click', function() {
            console.log('🔍 Данные для отладки:');
            console.log('Всего протоколов:', allProtocols.length);
            console.log('Полевые игроки:', skatersData.length);
            console.log('Вратари:', goaliesData.length);
            console.log('Команды:', teamsData.length);
            console.log('Пример данных игроков:', skatersData.slice(0, 3));
            
            alert(`Данные для отладки в консоли:
• Протоколов: ${allProtocols.length}
• Игроков: ${skatersData.length}
• Вратарей: ${goaliesData.length}
• Команд: ${teamsData.length}`);
        });
    }
    
    // Фильтры
    const filters = ['seasonFilter', 'teamFilter', 'positionFilter', 'gamesFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', applyFilters);
            filter.addEventListener('input', applyFilters);
        }
    });
    
    // Сброс фильтров
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            const seasonFilter = document.getElementById('seasonFilter');
            const teamFilter = document.getElementById('teamFilter');
            const positionFilter = document.getElementById('positionFilter');
            const gamesFilter = document.getElementById('gamesFilter');
            
            if (seasonFilter) seasonFilter.value = '2023-24';
            if (teamFilter) teamFilter.value = 'all';
            if (positionFilter) positionFilter.value = 'all';
            if (gamesFilter) gamesFilter.value = '1';
            
            applyFilters();
        });
    }
    
    // Сортировка по заголовкам таблицы
    document.querySelectorAll('.stats-table th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const field = this.getAttribute('data-sort');
            if (field) {
                applySort(field);
            }
        });
    });
    
    // Экспорт
    const exportCSV = document.getElementById('exportCSV');
    const exportPDF = document.getElementById('exportPDF');
    const exportPrint = document.getElementById('exportPrint');
    
    if (exportCSV) exportCSV.addEventListener('click', exportStatisticsCSV);
    if (exportPDF) exportPDF.addEventListener('click', exportStatisticsPDF);
    if (exportPrint) exportPrint.addEventListener('click', window.print);
}

function showNoDataMessage() {
    console.log('📭 Показ сообщения об отсутствии данных');
    
    hideLoadingMessage();
    
    // Скрываем все таблицы
    document.querySelectorAll('.stats-table').forEach(table => {
        table.style.display = 'none';
    });
    
    // Показываем сообщение об отсутствии данных
    const message = document.createElement('div');
    message.className = 'no-data-message';
    message.style.cssText = `
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 16px;
        background: #f8f9fa;
        border-radius: 10px;
        margin: 20px;
    `;
    message.innerHTML = `
        <i class="fas fa-database" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
        <h3>Нет данных для отображения</h3>
        <p>Загрузите протоколы в главном приложении</p>
        <button onclick="window.location.href='index.html'" class="btn" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
            <i class="fas fa-arrow-left"></i> Вернуться к протоколам
        </button>
    `;
    
    const container = document.querySelector('.stats-tables-container');
    if (container) {
        container.innerHTML = '';
        container.appendChild(message);
    }
}

function hideLoadingMessage() {
    document.querySelectorAll('.loading').forEach(loading => {
        loading.style.display = 'none';
    });
}

// ==============================
// ОБРАБОТЧИК СООБЩЕНИЙ ОТ ГЛАВНОГО ОКНА
// ==============================

window.addEventListener('message', function(event) {
    console.log('📨 Получено сообщение в окне статистики:', event.data);
    
    if (event.data && event.data.type === 'OPEN_STATISTICS') {
        if (event.data.data && event.data.data.protocols) {
            allProtocols = event.data.data.protocols;
            currentProtocolIndex = event.data.data.currentProtocolIndex || 0;
            
            console.log(`✅ Получены протоколы из родительского окна: ${allProtocols.length}`);
            
            if (allProtocols.length > 0) {
                processAllProtocols();
                updateTable();
                updateSummaryStats();
                populateFilters();
            } else {
                showNoDataMessage();
            }
        }
    }
});

// Запрашиваем данные у родительского окна при загрузке
if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'REQUEST_PROTOCOLS_DATA' }, '*');
}
