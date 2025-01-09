let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Mencegah browser menampilkan prompt default
  e.preventDefault();
  deferredPrompt = e;

  // Tampilkan tombol install
  const installButton = document.getElementById('installButton');
  installButton.classList.remove('hidden');

  // Tambahkan event listener untuk klik tombol
  installButton.addEventListener('click', async () => {
    installButton.classList.add('hidden'); // Sembunyikan tombol
    deferredPrompt.prompt(); // Tampilkan prompt install

    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('PWA berhasil diinstal');
    } else {
      console.log('PWA instalasi dibatalkan');
    }
    deferredPrompt = null;
  });
});
