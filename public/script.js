document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const passwordField = document.getElementById('password');
  const errorDiv = document.getElementById('error');

  generateBtn.addEventListener('click', generatePassword);
  copyBtn.addEventListener('click', copyPassword);

  async function generatePassword() {
    const length = parseInt(document.getElementById('length').value);
    const useSpecialChars = document.getElementById('specialChars').checked;
    const useUppercase = document.getElementById('uppercase').checked;

    errorDiv.classList.add('hidden');

    try {
      const response = await fetch('http://localhost:3000/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length,
          useSpecialChars,
          useUppercase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }

      passwordField.value = data.password;
    } catch (error) {
      showError(error.message);
    }
  }

  function copyPassword() {
    if (!passwordField.value) return;
    
    passwordField.select();
    document.execCommand('copy');
    
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
});