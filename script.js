function setStatus(connected, message) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    if (connected) {
        statusIndicator.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
        statusText.textContent = message || 'Connected';
    } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.classList.add('disconnected');
        statusText.textContent = message || 'Disconnected';
    }
}

async function fetchCurrentCode() {
    try {
        const res = await fetch('/api/code');
        const data = await res.json();
        document.getElementById('currentCode').textContent = data.code;
        setStatus(true, 'Code active');
    } catch (err) {
        console.error('Error fetching code:', err);
        setStatus(false, 'Server unreachable');
    }
}

async function generateCode() {
    await fetchCurrentCode();
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
            setStatus(true, 'Access granted');
            document.getElementById('sharedClipboard').style.display = 'block';
            document.getElementById('sharedCode').textContent = code;
        } else {
            setStatus(false, 'Invalid code');
            showError(data.error || 'Invalid code');
        }
    } catch (err) {
        console.error('Verify error:', err);
        setStatus(false, 'Server error');
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
    fetchCurrentCode(); // load code on startup
});
