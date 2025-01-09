import { database, get, push, set, ref, nipsRef} from './firebase.js';


const pinDots = document.querySelectorAll('[data-pin-dot]');
const pinKeys = document.querySelectorAll('.pin-key');
const canselKey = document.getElementById('pinCancel');
const submitKey = document.getElementById('pinSubmit');
const deleteKey = document.getElementById('pinDelete');
const pinModal = document.getElementById('pinModal');
const errorMessage = document.getElementById('errorMessage');

export let enteredValue = '';
let attempt = 0;
const MAX_ATTEMPT = 3;
const LOCK_KEY = 'locked';
const LOCK_DURATION = 10 * 60 * 1000;

export function isLocked() {
    const lockData = localStorage.getItem('locked');
    if (!lockData) {
        return false;
    }

    const lockUntil = localStorage.getItem('lockUntil');
    const now = Date.now();

    if (now >= lockUntil) {
        localStorage.removeItem('locked');
        localStorage.removeItem('lockUntil');
        return false;
    }

    return true;
};

export function getLockUntil() {
    const lockData = localStorage.getItem(LOCK_KEY);
    if (!lockData) {
        return 0;
    }

    const lockUntil = localStorage.getItem('lockUntil');
    const now = Date.now();
    return Math.max(0, lockUntil - now);
};

export function togglePinModal() {
    pinModal.classList.toggle('hidden');
    pinModal.classList.toggle('flex');
    resetPin();
};
canselKey.addEventListener('click', togglePinModal);


// reset pin
function resetPin() {
    enteredValue = '';
    submitKey.disabled = true;
    updatePinDots();
};

// update pin dots
function updatePinDots() {
    pinDots.forEach((dot, index) => {
        if (index < enteredValue.length) {
            dot.classList.add('bg-blue-500', 'border-blue-500');
            dot.classList.remove('border-gray-300', 'dark:border-gray-600');
        } else {
            dot.classList.add('border-gray-300', 'dark:border-gray-600');
            dot.classList.remove('bg-blue-500', 'border-blue-500');
        }
    });
};

// add pin digit
function addPinDigit(digit) {
    if (enteredValue.length < 6) {
        enteredValue += digit;
        updatePinDots();
        console.log(enteredValue);
        if (enteredValue.length === 6) {
            submitKey.disabled = false;
        }
    }
};

// add pin key event
pinKeys.forEach(key => {
    key.addEventListener('click', () => {
        const digit = key.textContent.trim();
        addPinDigit(digit);
    });
});

// delete pin digit
function deletePinDigit() {
    if (enteredValue.length > 0) {
        enteredValue = enteredValue.slice(0, -1);
        updatePinDots();
        pinSubmit.disabled = true;
    }
};
deleteKey.addEventListener('click', deletePinDigit);

// submit pin
let confirmCallback = null;

export function setConfirmCallback(callback) {
    confirmCallback = callback;
};

submitKey.addEventListener('click', async () => {

    if (enteredValue.length === 6) {
        
        try {
            const value = parseInt(enteredValue);
            const isValid = await checkPin(value);

            if (isValid) {
                attempt = 0;
                togglePinModal();

                if (!errorMessage.classList.contains('hidden')) {
                    errorMessage.classList.add('hidden');
                }

                if (typeof confirmCallback === 'function') {
                    confirmCallback();
                }

            } else {
                if (attempt === MAX_ATTEMPT - 1) {
                    localStorage.setItem(LOCK_KEY, Date.now());
                    localStorage.setItem('lockUntil', Date.now() + LOCK_DURATION);
                    togglePinModal();
                }
                attempt++;
                console.log('attempt', attempt);
                errorMessage.classList.remove('hidden');
                resetPin();
            }

        } catch (error) {
            console.log(error);
            console.error(error);
        }

    }

});

// check pin
async function checkPin(pin) {
   
    try {
        const snapshot = await get(nipsRef);
        
        if (snapshot.exists()) {
            const nip = snapshot.val();
            if (nip === pin) {
                return true;
            } else {            
                return false;
            }
        } 

    } catch (error) {
        console.error('kesalahan mengambil data dari firebase', error);
        throw error;
    }

};