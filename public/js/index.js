import { app, database, incomeRef, withdrawRef, goalsRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, balanceRef, withdrawHistoryRef, loadHistory } from './firebase.js';
import { formatRupiah, addRupiahFormatting, getNumericValue, getById } from './functions.js';

// Initialize app
const initApp = () => {
    loadBalance();
    loadIncome();
    renderHistory();
};

// DOM elements
const dom = {
    menu: getById('menu'),
    burgerIcon: getById('burgerIcon'),
    burgerBtn: getById('burger'),
    closeIcon: getById('closeIcon'),
    closeBtn: getById('close'),
    goalPopup: getById('targetPopup'),
    goalBtn: getById('goalBtn'),
    closeGoalBtn: getById('closeGoalPopup'),
    goalInput: getById('goalInput'),
    saveGoalBtn: getById('saveGoalBtn'),
    goalContent: getById('goalContent'),
    goalCard: getById('goalCard'),
    loadingScreen: getById('loading-screen'),
    totalIncome: getById('totalIncome'),
    totalSaldo: getById('totalSaldo'),
    totalWithdraw: getById('totalPengambilan'),
    persenNumber: getById('persenNumber'),
    progressBar: getById('progressBar'),
    historyContainer: getById('historyContainer'),
}

// load income from firebase

function loadIncome() {
    toggleLoading(true);

    onValue(incomeHistoryRef, (snapshot) => {
        
        const incomeData = snapshot.val();
        let income = 0;
        let withdraw = 0;

        if (snapshot.exists()) {
            
            for (const key in incomeData) {
                const data = incomeData[key];
                income += data.amount;
            }

        }

        onValue(withdrawHistoryRef, (snapshot) => {
            toggleLoading(false);
            const withdrawData = snapshot.val();
            
            if (snapshot.exists()) {
                for (const key in withdrawData) {
                    const data = withdrawData[key];
                    withdraw += data.amount;
                }
            }

            const totalIncome = income - withdraw;
            set(balanceRef, totalIncome);

            const withdrawContent = document.createElement('span');
            withdrawContent.textContent = withdraw;
            formatRupiah(withdrawContent);
            dom.totalWithdraw.innerHTML = withdrawContent.outerHTML;

        });

        const incomeContent = document.createElement('span');
        incomeContent.textContent = income;
        formatRupiah(incomeContent);
        dom.totalIncome.innerHTML = incomeContent.outerHTML;
    });

}

// load balance from firebase
function loadBalance() {
    toggleLoading(true);

    onValue(balanceRef, (snapshot) => {
        const balance = snapshot.val();
        let balanceContent;

        if (snapshot.exists()) {
            balanceContent = document.createElement('span');
            balanceContent.textContent = balance;
            formatRupiah(balanceContent);
            dom.totalSaldo.innerHTML = balanceContent.outerHTML;
        }

        // load target
        onValue(goalsRef, (snapshot) => {
            const goalData = snapshot.val();

            if (goalData !== null) {

                const goalContent = document.createElement('span');
                goalContent.textContent = goalData;
                formatRupiah(goalContent);
                dom.goalContent.textContent = `${balanceContent.innerHTML} / ${goalContent.innerHTML}`;
                dom.goalCard.classList.remove('hidden');
                toggleLoading(false);
            }

            const calculate = (balance / goalData) * 100;
            const percentage = calculate.toFixed(0);
            
            dom.persenNumber.textContent = `${percentage}% Tercapai`;
            dom.progressBar.style.width = `${percentage}%`;
            
            
        });

    });

}

// load history from firebase
async function renderHistory() {
    toggleLoading(true);
    dom.historyContainer.innerHTML = '';

    try {
        const sortedData = await loadHistory();
        toggleLoading(false);
        
        sortedData.forEach(data => {
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

            const transactionHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="${isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} py-2 px-3 rounded-full">
                            <i class="${isIncome ? 'fas fa-arrow-up text-green-500 dark:text-green-400' : 'fas fa-arrow-down text-red-500 dark:text-red-400'}"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${isIncome ? data.category : data.name}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${formattedDate} - ${formattedTime}</p>
                        </div>
                    </div>
                    <span class="${isIncome ? 'text-sm font-medium text-green-600 dark:text-green-400' : 'text-sm font-medium text-red-600 dark:text-red-400'}">${formattedAmount}</span>
                </div>
            `;

            dom.historyContainer.innerHTML += transactionHTML;
        });
        
    } catch (error) {
        console.error(error);
        dom.historyContainer.innerHTML = '<p class="text-center text-red-500">Gagal memuat riwayat</p>';
    }

}


// Menu function
function toggleMenu() {
    dom.menu.classList.toggle('hidden');
    dom.menu.classList.toggle('fixed');
    dom.burgerIcon.classList.toggle('hidden');
    dom.closeIcon.classList.toggle('hidden');
}
dom.burgerBtn.addEventListener('click', toggleMenu);
dom.closeBtn.addEventListener('click', toggleMenu);

/* ======================== Goals function ======================== */
// goal popup
function toggleGoalPopup() {
    dom.goalPopup.classList.toggle('hidden');
    dom.goalPopup.classList.toggle('flex');
}
dom.closeGoalBtn.addEventListener('click', toggleGoalPopup);
dom.goalBtn.addEventListener('click', () => {
    toggleGoalPopup();

    if (window.innerWidth < 768) {
        toggleMenu();
    }

});


// Add goal
dom.goalInput.addEventListener('input', function() {
    formatRupiah(this);
});

dom.saveGoalBtn.addEventListener('click', () => {
    const newGoal = getNumericValue('goalInput');

    if (newGoal > 0) {
        set(goalsRef, newGoal);
    }

    toggleGoalPopup();
});

// togle loading
const toggleLoading = (show) => {

    if (show) {
        dom.loadingScreen.classList.remove('hidden');
        dom.loadingScreen.classList.add('flex');
    } else {
        dom.loadingScreen.classList.remove('flex');
        dom.loadingScreen.classList.add('hidden');
    }

};

// start app
initApp();