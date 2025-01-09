import { app, database, incomeRef, withdrawRef, goalsRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, balanceRef, withdrawHistoryRef, loadHistory, ref } from './firebase.js';
import { formatRupiah2, getById } from './functions.js';

// DOM
const dom = {
    contentContainer: getById('receipt-container'),
    buttonContainer: getById('bottom-container'),
    notFound: getById('not-found'),
    loadingScreen: getById('loading-screen'),
    transactionDetail: getById('transactionDetail'),
    tanggalTransaksi: getById('tanggalTransaksi')
}


const dataQuery = window.location.search;
const urlPharams = new URLSearchParams(dataQuery);
const trxData = {
    type: urlPharams.get('type'),
    id: urlPharams.get('id')
}
console.log(trxData);



function loadData () {
    toggleLoading(true);

    if (!trxData.type || !trxData.id) {
        console.error('Type and id not found in query string!');
        dom.notFound.classList.remove('hidden');
        toggleLoading(false);
        return;
    }

    let dataRef;
    if (trxData.type === 'income') {
        dataRef = ref(database, `income/incomeHistory/${trxData.id}`)
    } else if (trxData.type === 'withdraw') {
        dataRef = ref(database, `members/withdrawHistory/${trxData.id}`)
    } else {
        console.error('Invalid transaction data!');
        dom.notFound.classList.remove('hidden');
        toggleLoading(false);
        return;
    }

    onValue(dataRef, (snapshot) => {
        toggleLoading(false)

        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('Transaction data:', data);

            displayData(data);
        } else {
            console.error('Transaction data not found!');
            dom.notFound.classList.remove('hidden');
        }

    }, (error) => {
        console.error('Error fetching data:', error);
    });

}

// display data
function displayData(data) {
    togleElement(dom.contentContainer);
    togleElement(dom.buttonContainer);
    const isIncome = trxData.type === 'income';

    const formattedDate = new Date(data.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const formattedTime = new Date(data.date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    dom.tanggalTransaksi.innerHTML = `${formattedDate} pukul ${formattedTime}`;

    const formattedAmount = formatRupiah2(data.amount);
    dom.transactionDetail.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">ID Transaksi</span>
                    <span class="text-gray-800 dark:text-white font-medium">${trxData.id}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Jenis Transaksi</span>
                    <span class="text-gray-800 dark:text-white font-medium">${isIncome ? 'Pemasukan' : 'Pengambilan'}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">${isIncome ? 'Tipe Pemasukan' : 'Nama Pengambil'}</span>
                    <span class="text-gray-800 dark:text-white font-medium">${isIncome ? data.category : data.name}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Jumlah</span>
                    <span class="${isIncome ? 'text-green-600 dark:text-green-400' : 'text-lg font-bold text-red-600 dark:text-red-400'} font-bold text-xl">${formattedAmount}</span>
                </div>
                <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Keterangan:</span>
                    <p class="mt-1 text-gray-800 dark:text-white">${data.note}</p>
                </div>
    `;


}

// togle element
function togleElement(element) {
    element.classList.remove('hidden');
}

// toggle loading screen
const toggleLoading = (show) => {

    if (show) {
        dom.loadingScreen.classList.remove('hidden');
        dom.loadingScreen.classList.add('flex');
    } else {
        dom.loadingScreen.classList.remove('flex');
        dom.loadingScreen.classList.add('hidden');
    }

};

loadData()
//?type=income&id=12345678
