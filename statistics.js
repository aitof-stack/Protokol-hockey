// В функции initEventHandlers в statistics.js добавьте:
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
            // Пытаемся вернуться на главную страницу
            try {
                window.location.href = 'index.html';
            } catch (e) {
                console.log('Ошибка перехода:', e);
                // Альтернативный вариант
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
• Команды: ${teamsData.length}`);
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
    
    // Экспорт
    const exportCSV = document.getElementById('exportCSV');
    const exportPDF = document.getElementById('exportPDF');
    const exportPrint = document.getElementById('exportPrint');
    
    if (exportCSV) exportCSV.addEventListener('click', exportStatisticsCSV);
    if (exportPDF) exportPDF.addEventListener('click', exportStatisticsPDF);
    if (exportPrint) exportPrint.addEventListener('click', window.print);
}

// В функции showNoDataMessage исправьте:
function showNoDataMessage() {
    hideLoadingMessage();
    
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