// Ini adalah file JavaScript yang berisi fungsi-fungsi yang digunakan di berbagai halaman web
export const getById = (id) => document.getElementById(id);

// Fungsi untuk memformat angka ke dalam format Rupiah
export const formatRupiahValue = (value) => {
    let angka = value.toString().replace(/\D/g, ''); // Pastikan hanya angka
    return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Tambahkan pemisah ribuan
};

export const formatRupiah = (element) => {
    let value = element instanceof HTMLInputElement ? element.value : element.textContent;
    let angka = value.replace(/\D/g, ''); // Remove non-numeric characters
    angka = angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Add thousand separators

    if (element instanceof HTMLInputElement) {
        element.value = angka;  // Update input value
    } else {
        element.textContent = `Rp ${angka}`;  // Update text content for non-input elements
    }
};

export const formatRupiah2 = (angka) => {
    const elemen = document.createElement('span');
    elemen.textContent = angka;
    formatRupiah(elemen);
    return elemen.innerHTML;
};

export const addRupiahFormatting = (inputId) => {
    const inputElement = document.getElementById(inputId);
    inputElement.addEventListener('input', function() {
        formatRupiah(this);
    });
};

export function removeSpecialChars(event) {
    const inputField = event.target;
    inputField.value = inputField.value.replace(/[^A-Za-z\s]/g, '');
}

export const getNumericValue = (input) => {
    // Jika input adalah string, anggap sebagai ID dan cari elemen
    const inputElement = typeof input === 'string' ? document.getElementById(input) : input;

    if (!inputElement) {
        console.error(`Input element "${input}" not found.`);
        return 0;
    }

    const inputValue = inputElement.textContent || inputElement.value; // Untuk elemen dengan textContent
    if (!inputValue) {
        console.warn(`Input value for element "${input}" is empty.`);
        return 0;
    }

    const numericValue = parseInt(inputValue.replace(/\./g, ''), 10);
    if (isNaN(numericValue)) {
        console.warn(`Input value "${inputValue}" is not a valid number.`);
        return 0;
    }

    return numericValue;
};


// Menambahkan event listener untuk validasi input pada elemen yang sesuai
//const inputElements = [expenseNote];
//inputElements.forEach(inputElement => {
//    inputElement.addEventListener('input', removeSpecialChars);
//});