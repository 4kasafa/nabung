import { nipsRef, ref, app, database, get, incomeRef, withdrawRef, goalsRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, getDatabase, memberRef, balanceRef, memberListRef } from './firebase.js';
import { formatRupiah, addRupiahFormatting, getNumericValue, getById } from './functions.js';
import { togglePinModal, setConfirmCallback, isLocked, getLockUntil } from './nip.js';

// Initialize app
const initApp = () => {
    loadMember();
    loadBalance();
};

// DOM elements
const dom = {
    content: getById('content'),
    lockInfo: getById('lockInfo'),
    withdrawForm: getById('withdrawForm'),
    namaAnggota: getById('namaAnggota'),
    jumlahInput: getById('jumlahAmbil'),
    keteranganInput: getById('keterangan'),
    loadingScreen: getById('loading-screen'),
    totalSaldo: getById('totalSaldo'),
    saldoAlert: getById('alertSaldo'),
};

// lock info
setInterval(() => {

    if (isLocked()) {
        const lockUntil = getLockUntil();
        const minutes = Math.floor(lockUntil / 60000);

        dom.content.classList.add('hidden');
        dom.lockInfo.classList.remove('hidden');
        dom.lockInfo.innerHTML = `<i class="fas fa-circle-info text-red-500"></i> Anda sedang terkunci. Coba lagi dalam ${minutes + 1} menit.`;
    } else {
        
        dom.content.classList.remove('hidden');
        dom.lockInfo.classList.add('hidden');
        
    }
    
}, 1000);

// load member from firebase
function loadMember() {
    toggleLoading(true);

    onValue(memberListRef, (snapshot) => {
        toggleLoading(false);
        const data = snapshot.val();

        if (data !== null) {

            Object.keys(data).forEach((key) => {
                dom.namaAnggota.innerHTML += `
                    <option value="${key}">${key}</option>
                `;
            });

        }

    });

};

// load balance from firebase
function loadBalance() {

    onValue(balanceRef, (snapshot) => {
        const balance = snapshot.val();
        const balanceContent = document.createElement('span');
        balanceContent.textContent = balance;
        formatRupiah(balanceContent);
        dom.totalSaldo.innerHTML = `Saldo saat ini: ${balanceContent.outerHTML}`;
    });

};

// add event listener for input element
dom.jumlahInput.addEventListener('input', function() {
    formatRupiah(this);
});


let dataPengambilan = null;
// add event listener for form
dom.withdrawForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const withdrawAmount = getNumericValue('jumlahAmbil');
    
    if (withdrawAmount <= 0) {
        return;
    }

    try {
        const balanceSnap = await get(balanceRef);

        if (balanceSnap.exists()) {
            const currentBalance = balanceSnap.val();

            if (withdrawAmount >= currentBalance) {
                dom.saldoAlert.classList.remove('hidden');
                dom.jumlahInput.style.border = '1px solid red';
                return;
            } else {
                dom.saldoAlert.classList.add('hidden');
                dom.jumlahInput.style.border = '1px solid #e2e8f0';
            }

        }

    } catch (error) {
        console.error(error);
        return;
    } 
    
    dataPengambilan = {
        type: 'withdraw',
        name: dom.namaAnggota.value,
        amount: withdrawAmount,
        note: dom.keteranganInput.value,
        date: new Date().toISOString(),
    };


    togglePinModal();
});

async function addWithdraw() {
    const id = `TRX${Date.now()}`;
    const trxRef = ref(database, `members/withdrawHistory/${id}`);
    const membersRef = ref(database, `members/list/${dataPengambilan.name}`);

    try {
        // Simpan data transaksi ke riwayat pengambilan
        await set(trxRef, dataPengambilan);

        if (dataPengambilan.note.toLowerCase().includes('galon')) {
            console.log('Pengeluaran untuk galon tidak akan dimasukkan ke pengeluaran anggota.');
            return; // Keluar dari fungsi jika keterangan adalah 'galon'
        }


        // Ambil data anggota dari database
        const memberSnapshot = await get(membersRef);

        if (memberSnapshot.exists()) {
            const member = memberSnapshot.val();
            const current = member.pengambilan || 0; // Default ke 0 jika belum ada pengambilan
            const pengambilan = current + dataPengambilan.amount;

            // Update data pengambilan anggota
            await set(membersRef, { ...member, pengambilan: pengambilan });

            console.log('Pengambilan berhasil diperbarui.');
            window.location.href = `receipt.html?type=withdraw&id=${id}`;
        } else {
            console.error('Anggota tidak ditemukan.');
        }

    } catch (error) {
        console.error('Error saat menambahkan pengambilan:', error);
    }

};


setConfirmCallback( async () => {
    
    if (dataPengambilan) {
        
        try {
            await addWithdraw();
            dom.jumlahInput.value = '';
            dom.keteranganInput.value = '';
            dataPengambilan = null;
        } catch (error) {
            console.error(error);
        }
        
    }
    
});

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

initApp();