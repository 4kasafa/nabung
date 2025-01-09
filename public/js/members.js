import { ref, app, database, incomeRef, incomeCategoryRef, set, push, onValue, remove, incomeHistoryRef, memberRef, memberListRef, get } from './firebase.js';
import { addRupiahFormatting, getById, formatRupiah, getNumericValue } from "./functions.js";

let members;

const dom = {
    memberModal: getById('memberModal'),
    memberBtn: getById('addMemberBtn'),
    batalBtn: getById('batalBtn'),
    memberForm: getById('memberForm'),
    nameInput: getById('memberName'),
    statusInput: getById('memberStatus'),
    pengambilanInput: getById('pengambilan'),
    noteInput: getById('keterangan'),
    membersList: getById('membersList'),
    totalMembers: getById('totalMembers'),
    loadingScreen: getById('loading-screen'),

    editModal: getById('editModal'),
    editForm: getById('editForm'),
    editName: getById('editName'),
    editStatus: getById('editStatus'),
    editKeterangan: getById('editKeterangan'),
    editPengambilan: getById('editPengambilan'),
    batalEditBtn: getById('batalEditBtn'),
    deleteBtn: getById('deleteBtn'),

    deleteModal: getById('deleteModal'),
    yesBtn: getById('yesBtn'),
    noBtn: getById('noBtn'),
};

function toggleMemberModal() {
    dom.memberModal.classList.toggle('hidden');
    dom.memberModal.classList.toggle('flex');
}
dom.memberBtn.addEventListener('click', toggleMemberModal);
dom.batalBtn.addEventListener('click', toggleMemberModal);

function toggleEditModal() {
    dom.editModal.classList.toggle('hidden');
    dom.editModal.classList.toggle('flex');
}
batalEditBtn.addEventListener('click', toggleEditModal);

// load member data

function loadMember() {
    toggleLoading(true);
    
    onValue(memberListRef, (snapshot) => {
        toggleLoading(false);
        const data = snapshot.val();
        dom.membersList.innerHTML = '';

        if (members !== null) {
            Object.keys(data).forEach((key) => {
                members = data[key];
                console.log(members);
                dom.totalMembers.textContent = Object.keys(data).length;

                let statusColor = '';
                if (members.status === 'aktif') {
                    statusColor = 'text-blue-500';
                } else if (members.status === 'nonaktif') {
                    statusColor = 'text-red-500';
                } else {
                    statusColor = 'text-yellow-500';
                };

                const pengambilan = document.createElement('span');
                pengambilan.textContent = members.pengambilan;

                formatRupiah(pengambilan);
                
                dom.membersList.innerHTML += `
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center space-x-4">
                        <div class="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="flex-1">
                            <h2 class="text-lg font-bold text-gray-800 dark:text-white">${key}</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Status: <span class="${statusColor} font-medium">${members.status}</span></p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Note: ${members.note}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Pengambilan: ${pengambilan.textContent}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button data-key="${key}" class="editMemberBtn p-2 rounded-full dark:text-white">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `;

            });
        }

    });
}
console.log(members);

// input event listener
dom.pengambilanInput.addEventListener('input', function() {
    formatRupiah(this);
});

// add member
let memberData = null;

function addMember() {
    const name = dom.nameInput.value.trim();  
    const pengambilan = getNumericValue('pengambilan');
    memberData = {
        status: dom.statusInput.value,
        pengambilan: pengambilan || 0,
        note: dom.noteInput.value || 'Anggota',
    };

    const membersRef = ref(database, `members/list/${name}`);
    set(membersRef, memberData);

}

dom.memberForm.addEventListener('submit', (e) => {
    e.preventDefault();

    addMember();

    toggleMemberModal();

    clearInput();

    toggleLoading();
});

// edit member
dom.editPengambilan.addEventListener('input', function() {
    formatRupiah(this);
});

let currentAnggotaRef = null;

dom.membersList.addEventListener('click', async (e) => {

    if (e.target.closest('.editMemberBtn')) {
        const key = e.target.closest('button').getAttribute('data-key');
        currentAnggotaRef = ref(database, `members/list/${key}`)
        
        try {
            const data = await get(currentAnggotaRef)

            if (data.exists()) {
                const member = data.val();
                dom.editName.value = key;
                dom.editStatus.value = member.status;
                dom.editKeterangan.value = member.note;
                dom.editPengambilan.value = member.pengambilan;

                toggleEditModal(); 
            }

        } catch (error) {
            console.error(error);
        }
        
    }

});

// delete member
async function handleDelete(ref) {
    const isConfirm = await confirmDelete();

    if (isConfirm) {
       await deleteAnggota(ref);
    }
    
}

dom.deleteBtn.addEventListener('click', async () => {

    toggleConfirmPopup(true);

    await handleDelete(currentAnggotaRef);


});

const toggleConfirmPopup = (open) => {
    
    if (open) {
        dom.deleteModal.classList.remove('hidden');
        dom.deleteModal.classList.add('flex');
    } else {
        dom.deleteModal.classList.remove('flex');
        dom.deleteModal.classList.add('hidden');
    }

};

async function deleteAnggota (ref) {

    if (ref) {

        dom.editName.value = '';
            dom.editStatus.value = '';
            dom.editKeterangan.value = '';
            dom.editPengambilan.value = '';

        try {
            await remove(ref); // Hapus anggota dari database
            console.log('Data berhasil dihapus');
        } catch (error) {
            console.error('Gagal menghapus data:', error);
        }

    } else {
        console.warn('Tidak ada referensi anggota untuk dihapus');
    }

};

function confirmDelete() {
    
    return new Promise((resolve, reject) => {
        dom.yesBtn.addEventListener('click', () => {
            resolve(true);
            toggleConfirmPopup(false);
        });

        dom.noBtn.addEventListener('click', () => {
            resolve(false);
            toggleConfirmPopup(false);
        });

    });
    
};

dom.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    set(ref(database, `members/list/${dom.editName.value}`), {
        status: dom.editStatus.value,
        pengambilan: getNumericValue('editPengambilan'),
        note: dom.editKeterangan.value,
    });

    toggleEditModal();
});

function clearInput() {
    dom.nameInput.value = '';
    dom.pengambilanInput.value = '';
    dom.noteInput.value = '';
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


const initApp = () => {
    loadMember();
};

initApp();