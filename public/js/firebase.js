import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { get, getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://tabungan-d57a1-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// firebase reference
const incomeRef = ref(database, 'income');
const withdrawRef = ref(database, 'withdraws');
const goalsRef = ref(database, 'goals');
const incomeCategoryRef = ref(database, 'income/incomeCategory');
const incomeHistoryRef = ref(database, 'income/incomeHistory');
const nipsRef = ref(database, 'snip');
const memberRef = ref(database, 'members');
const memberListRef = ref(database, 'members/list');
const balanceRef = ref(database, 'balance');
const withdrawHistoryRef = ref(database, 'members/withdrawHistory');

/**
 * Fungsi untuk memuat histori transaksi dari Firebase
 * @returns {Promise<Array>} Resolusi berupa array data histori transaksi yang sudah diurutkan berdasarkan waktu
 */

export async function loadHistory() {

    try {

        const [incomeSnapshot, withdrawSnapshot] = await Promise.all([
            get(incomeHistoryRef),
            get(withdrawHistoryRef)
        ]);

        let incomeData;
        if (incomeSnapshot.exists()) {

            incomeData = Object.keys(incomeSnapshot.val()).map(key => {

                return {
                    id: key,
                    type: 'income',
                    category: incomeSnapshot.val()[key].category,
                    note: incomeSnapshot.val()[key].keterangan,
                    ...incomeSnapshot.val()[key]
                };

            });

        } else {
            incomeData = [];
        }

        let withdrawData;
        if (withdrawSnapshot.exists()) {

            withdrawData = Object.keys(withdrawSnapshot.val()).map(key => {

                return {
                    id: key,
                    type: 'withdraw',
                    name: withdrawSnapshot.val()[key].name,
                    note: withdrawSnapshot.val()[key].note,
                    ...withdrawSnapshot.val()[key]
                };

            });

        } else {
            withdrawData = [];
        }

        const allData = [...incomeData, ...withdrawData];
        const sortedData = allData.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!Array.isArray(allData)) {
            throw new Error('Data yang diterima bukan array yang valid');
        }

        console.log(allData);
        

        return sortedData;        
    } catch (error) {
        console.error(error);
        throw error;
    }

};

export { nipsRef, ref, app, database, get, incomeRef, withdrawRef, goalsRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, getDatabase, memberRef, balanceRef, memberListRef, withdrawHistoryRef };
