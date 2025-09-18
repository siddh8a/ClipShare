
async function fetchCurrentCode() {
    try {
        const res = await fetch('/api/code');
        const data = await res.json();
        document.getElementById('currentCode').textContent = data.code;
    } catch (err) {
        console.error('Error fetching code:', err);
    }
}

async function generateCode() {
    await fetchCurrentCode(); // reuses API to always get latest code
}

async function verifyCode() {
    const code = document.getElementById('accessCode').value.trim();
    if (!code) {
        showError('Please enter a code');
        return;
    }
    try {
        const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            document.getElementById('sharedClipboard').style.display = 'block';
            document.getElementById('sharedCode').textContent = code;
        } else {
            showError(data.error || 'Invalid code');
        }
    } catch (err) {
        console.error('Verify error:', err);
        showError('Server error');
    }
}

function showError(message) {
    const errorBox = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorBox.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateCodeBtn').addEventListener('click', generateCode);
    document.getElementById('accessBtn').addEventListener('click', verifyCode);
    document.getElementById('errorClose').addEventListener('click', () => {
        document.getElementById('errorMessage').style.display = 'none';
    });
    fetchCurrentCode(); // load code at startup
});
