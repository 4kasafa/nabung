import { app, database, incomeRef, withdrawRef, goalsRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, balanceRef, withdrawHistoryRef, loadHistory } from './firebase.js';
import { formatRupiah, addRupiahFormatting, getNumericValue, getById } from './functions.js';

const dom = {
    container: getById('container'),
    loadingScreen: getById('loading-screen'),
};

const initApp = () => {
    loadHistoryData();
};

const toggleLoading = (isLoading) => {
    if (isLoading) {
        dom.loadingScreen.classList.remove('hidden');
        dom.loadingScreen.classList.add('flex');
    } else {
        dom.loadingScreen.classList.add('hidden');
        dom.loadingScreen.classList.remove('flex');
    }
}

async function loadHistoryData() {
    toggleLoading(true);
    dom.container.innerHTML = '';

    try {
        const history = await loadHistory();
        toggleLoading(false);

        history.forEach(data => {
            const isIncome = data.type === 'income';

            const formattedDate = new Date(data.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });

            const formattedTime = new Date(data.date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const dataAmount = document.createElement('span');
            dataAmount.textContent = data.amount;
            formatRupiah(dataAmount);

            const formattedAmount = (isIncome ? '+' : '-') + dataAmount.innerHTML;

            const historyElement = document.createElement('div');
            historyElement.className = "bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow flex items-center";
            historyElement.innerHTML = `
                <i class="${isIncome ? 'fas fa-arrow-up text-green-500 dark:text-green-400' : 'fas fa-arrow-down text-red-500 dark:text-red-400'} text-2xl mr-4"></i>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">${isIncome ? data.category : data.name}</p>
                    <p class="truncate text-sm text-gray-600 dark:text-gray-400 w-32 sm:w-full">${data.note}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${formattedDate} - ${formattedTime}</p>
                </div>
                <p class="text-lg font-bold ${isIncome ? 'text-lg font-bold text-green-600 dark:text-green-400' : 'text-lg font-bold text-red-600 dark:text-red-400'}">${formattedAmount}</p>
            `;

            // Tambahkan event listener untuk double-click
            historyElement.addEventListener('dblclick', () => {
                window.location.href = `receipt.html?type=${data.type}&id=${data.id}`;
            });

            dom.container.appendChild(historyElement);
        });      

    } catch (error) {
        console.error(error);
        dom.container.innerHTML = '<p class="text-center text-red-500">Gagal memuat riwayat</p>';
    }
}



initApp();