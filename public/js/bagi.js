import { app, database, incomeRef, withdrawRef, goalsRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, balanceRef, withdrawHistoryRef, loadHistory, memberListRef } from './firebase.js';
import { formatRupiah, addRupiahFormatting, getNumericValue, getById, formatRupiah2 } from './functions.js';

// Initialize app
const initApp = () => {
    loadBalance();
    getAnggotaData();
};

// DOM elements
const dom = {
    pemasukanInput: getById('pemasukan'),
    pengeluaranInput: getById('pengeluaran'),
    totalInput: getById('total'),
    tableBody: getById('tableBody'),
    hitungButton: getById('hitungBtn'), // Tombol "Hitung"
    loadingScreen: getById('loading-screen'),
};

// Format Rupiah in input
dom.pemasukanInput.addEventListener('input', function () {
    formatRupiah(this);
});
dom.pengeluaranInput.addEventListener('input', function () {
    formatRupiah(this);
});

// Load balance from Firebase (masih bisa dipakai kalau mau isi default)
function loadBalance() {
    onValue(balanceRef, (snapshot) => {
        const balance = snapshot.val();
        if (snapshot.exists()) {
            dom.totalInput.value = formatRupiah2(balance);
        }
    });
}

// Get all members from Firebase
function getAnggotaData() {
    toggleLoading(true);

    onValue(memberListRef, (snapshot) => {
        toggleLoading(false);
        const anggotaData = snapshot.val();
        dom.tableBody.innerHTML = '';

        if (snapshot.exists()) {
            Object.keys(anggotaData).forEach((key) => {
                const anggota = anggotaData[key];

                let percentage = 0;
                if (anggota.status === 'aktif') {
                    percentage = 1;
                } else if (anggota.status === 'pengganti') {
                    percentage = 0.5;
                } else {
                    percentage = 0;
                }

                const row = document.createElement('tr');
                row.classList.add('border-t', 'border-gray-200', 'dark:border-gray-700');
                row.innerHTML = `
                    <td class="p-2 md:p-4 text-gray-700 dark:text-gray-300">${key}</td>
                    <td class="p-2 md:p-4 text-gray-700 dark:text-gray-300">
                        <input type="number" class="percentageInput w-14 p-1 md:p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white" step="0.01" value="${percentage}">
                    </td>
                    <td class="hasilPembagian p-2 md:p-4 text-gray-700 dark:text-gray-300"></td>
                    <td class="pengambilan p-2 md:p-4 text-gray-700 dark:text-gray-300"> - ${formatRupiah2(anggota.pengambilan || 0)}</td>
                    <td class="total p-2 md:p-4 text-green-700 dark:text-green-400"></td>
                `;
                row.dataset.key = key; // Simpan key anggota untuk identifikasi
                dom.tableBody.appendChild(row);
            });
        }
    });
}

// Hitung dan update tabel
dom.hitungButton.addEventListener('click', function (e) {
    e.preventDefault();

    const pemasukan = parseFloat(dom.pemasukanInput.value.replace(/\D/g, '')) || 0;
    const pengeluaran = parseFloat(dom.pengeluaranInput.value.replace(/\D/g, '')) || 0;
    const totalSaldo = pemasukan - pengeluaran;

    dom.totalInput.value = formatRupiah2(totalSaldo);

    const rows = Array.from(dom.tableBody.querySelectorAll('tr'));
    const anggotaData = rows.map((row) => {
        const key = row.dataset.key;
        const percentageInput = row.querySelector('.percentageInput');
        const percentage = parseFloat(percentageInput.value) || 0;
        const pengambilan = row.querySelector('.pengambilan').textContent.replace(/\D/g, '') || 0;

        return { key, percentage, pengambilan, row };
    });

    bagiUang(totalSaldo, anggotaData);
});

function bagiUang(totalSaldo, anggotaData) {
    const totalPersentase = anggotaData.reduce((sum, anggota) => sum + anggota.percentage, 0);

    anggotaData.forEach((anggota) => {
        const bagian = totalPersentase > 0 ? (totalSaldo * anggota.percentage) / totalPersentase : 0;
        const roundedBagian = roundToNearest100(bagian);
        const total = roundedBagian - anggota.pengambilan;

        // Update kolom dalam tabel
        anggota.row.querySelector('.hasilPembagian').textContent = formatRupiah2(roundedBagian);
        anggota.row.querySelector('.total').textContent = formatRupiah2(total);
    });
}

// Round number to nearest 100
function roundToNearest100(num) {
    return Math.round(num / 100) * 100;
}

// toggleLoading function
const toggleLoading = (isLoading) => {
    if (isLoading) {
        dom.loadingScreen.classList.remove('hidden');
        dom.loadingScreen.classList.add('flex');
    } else {
        dom.loadingScreen.classList.add('hidden');
        dom.loadingScreen.classList.remove('flex');
    }
};

// Initialize app
initApp();
