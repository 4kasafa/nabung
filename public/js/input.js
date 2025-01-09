import { ref, app, database, incomeRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef } from './firebase.js';
import { formatRupiah, addRupiahFormatting, getNumericValue, getById } from './functions.js';
import { togglePinModal, setConfirmCallback, isLocked, getLockUntil } from './nip.js';

// Initialize app
const initApp = () => {
    loadKategori();
};

// dom elements
const dom = {
    content: getById('content'),

    lockInfo: getById('lockInfo'),

    loadingScreen: getById('loading-screen'),

    kategoriBtn: getById('kategoriBtn'),
    kategoriPopup: getById('kategoriPopup'),
    closeKategoriBtn: getById('closeKategoriBtn'),
    kategoriInput: getById('kategoriInput'),
    addKategoriBtn: getById('addKategoriBtn'),
    kategoriList: getById('kategori-list'),
    deleteKategoriBtn: getById('deleteKategoriBtn'),
    insideKategoriPopup: getById('insideKategoriPopup'),

    confirmPopup: getById('confirmPopup'),
    yesBtn: getById('yesBtn'),
    noBtn: getById('noBtn'),

    form: getById('inputForm'),
    tipePemasukan: getById('tipePemasukan'),
    jumlahPemasukan: getById('jumlahPemasukan'),
    keteranganPemasukan: getById('keterangan')
}

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


// kategori function
function toggleKategoriPopup() {
    dom.kategoriPopup.classList.toggle('hidden');
    dom.kategoriPopup.classList.toggle('flex');
}
dom.kategoriBtn.addEventListener('click', toggleKategoriPopup);
dom.closeKategoriBtn.addEventListener('click', toggleKategoriPopup);

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

// load kategori from firebase
let kategoriData = [];

function loadKategori() {
    toggleLoading(true);
    
    onValue(incomeCategoryRef, (snapshot) => {
        toggleLoading(false);
        kategoriData = snapshot.val();
        
        dom.kategoriList.innerHTML = '';
        dom.tipePemasukan.innerHTML = '';

        if (kategoriData !== null) {
            Object.keys(kategoriData).forEach(key => {

                dom.kategoriList.innerHTML += `
                <li class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <span class="text-gray-800 dark:text-white">${key}</span>
                    <button data-key="${key}" class="deleteKategoriBtn text-red-500 hover:text-red-600">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </li>
                `;

                dom.tipePemasukan.innerHTML += `
                <option value="${key}">${key}</option>
                `;

            });

        }

        // default value
        const defaultKategori = 'Bayar hutang';
        dom.kategoriList.innerHTML += `
        <li class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <span class="text-gray-800 dark:text-white">${defaultKategori}</span>
            <button class=" text-red-300">
                <i class="fas fa-trash-alt"></i>
            </button>
        </li>
        `;
        dom.tipePemasukan.innerHTML += `
        <option value="${defaultKategori}">${defaultKategori}</option>
        `;

    });
    
}

// add kategori
dom.addKategoriBtn.addEventListener('click', () => {
    const kategori = dom.kategoriInput.value.trim();
    
    if (kategori !== '') {
        const kategoriRef = ref(database, `income/incomeCategory/${kategori}`);

        set(kategoriRef, 0);

        dom.kategoriInput.value = '';
                
    }
});


// delete kategori
function deleteKategori(key) {
    remove(ref(database, `income/incomeCategory/${key}`)); // Remove the category from the database
}

async function handleDelete(key) {
    const isConfirm = await confirmDelete();

    if (isConfirm) {
        deleteKategori(key);
    }
    
}

dom.kategoriList.addEventListener('click', async (e) => {

    if (e.target.closest('.deleteKategoriBtn')) {
        const key = e.target.closest('button').getAttribute('data-key');
        toggleConfirmPopup();

        await handleDelete(key);

        toggleConfirmPopup();
    }
});

// confirm popup
function toggleConfirmPopup() {
    dom.confirmPopup.classList.toggle('hidden');
    dom.confirmPopup.classList.toggle('flex');
}

function confirmDelete() {
    
    return new Promise((resolve, reject) => {
        dom.yesBtn.addEventListener('click', () => {
            resolve(true);
        });

        dom.noBtn.addEventListener('click', () => {
            resolve(false);
        });

    });
    
};

// Add event listener for the input element
dom.jumlahPemasukan.addEventListener('input', function() {
    formatRupiah(this);
});

// Add event listener for the form element
let dataPemasukan = null;

dom.form.addEventListener('submit', (e) => {
    e.preventDefault();

    dataPemasukan = {
        type: 'income',
        category: dom.tipePemasukan.value,
        amount: getNumericValue('jumlahPemasukan'),
        note: dom.keteranganPemasukan.value || 'Pemasukan',
        date: new Date().toISOString()
    };

    if (dataPemasukan.amount > 0) {
        togglePinModal();
    }

});

async function addTansaction(dataPemasukan) {
    const id = `TRX${Date.now()}`;
    const trxRef = ref(database, `income/incomeHistory/${id}`);
    set(trxRef, dataPemasukan);

    window.location.href = `receipt.html?type=income&id=${id}`;
}

setConfirmCallback( async () => {

    if (dataPemasukan) {
        
        try {
            await addTansaction(dataPemasukan);
            
            dom.jumlahPemasukan.value = '';
            dom.keteranganPemasukan.value = '';
            dataPemasukan = null;
        } catch (error) {
            console.error(error);
        }
        
    }

});

initApp();