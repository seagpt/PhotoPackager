document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('job-settings-form');
    const startBtn = document.getElementById('start-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const defaultsBtn = document.getElementById('defaults-btn');
    const statusBar = document.getElementById('status-bar');
    const processingLog = document.getElementById('processing-log');
    const browseBtns = document.querySelectorAll('.browse-btn');

    let isJobRunning = false;
    let currentJobId = null;

    // --- MCP Tool Interaction ---
    async function callMcpTool(tool, args) {
        try {
            const response = await fetch('/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool, args }),
            });
            if (!response.ok) {
                throw new Error(`MCP tool '${tool}' failed.`);
            }
            const result = await response.json();
            return result.result;
        } catch (error) {
            updateLog(`Error: ${error.message}`);
            return null;
        }
    }

    browseBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetInputId = btn.dataset.target;
            const targetInput = document.getElementById(targetInputId);
            const title = targetInputId.includes('source') ? 'Select Source Folder' : 'Select Output Folder';

            const selectedPath = await callMcpTool('select_directory', { title });

            if (selectedPath) {
                targetInput.value = selectedPath;
                validateForm();
            }
        });
    });

    // --- Form & UI Logic ---
    function validateForm() {
        const sourceFolder = document.getElementById('source-folder').value;
        const outputFolder = document.getElementById('output-folder').value;
        startBtn.disabled = !sourceFolder || !outputFolder || isJobRunning;
    }

    function updateLog(message, clear = false) {
        if (clear) {
            processingLog.textContent = message;
        } else {
            processingLog.textContent += `\n${message}`;
        }
        processingLog.scrollTop = processingLog.scrollHeight;
    }

    function setStatus(message) {
        statusBar.textContent = message;
    }

    // --- API Interaction ---
    startBtn.addEventListener('click', async () => {
        statusBar.style.display = 'none'; // Hide status bar on new job start
        if (isJobRunning) return;

        isJobRunning = true;
        validateForm();
        updateLog('Starting new job...', true);
        setStatus('Processing...');

        const formData = new FormData(form);
        const settings = {};
        formData.forEach((value, key) => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element && element.type === 'checkbox') {
                settings[key] = element.checked;
            } else if (element && element.type === 'number') {
                settings[key] = Number(value);
            } else {
                settings[key] = value;
            }
        });
        // Ensure all checkboxes are present
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (!settings.hasOwnProperty(cb.name)) {
                settings[cb.name] = false;
            }
        });

        try {
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start job.');
            }

            const result = await response.json();
            currentJobId = result.job_id;
            updateLog(`Job started with ID: ${currentJobId}`);
            pollJobStatus(currentJobId);

        } catch (error) {
            updateLog(`Error: ${error.message}`);
            setStatus('Error!');
            isJobRunning = false;
            validateForm();
        }
    });

    function pollJobStatus(jobId) {
        const intervalId = setInterval(async () => {
            if (!isJobRunning) {
                clearInterval(intervalId);
                return;
            }
            try {
                const response = await fetch(`/api/jobs/${jobId}/status`);
                const data = await response.json();

                if (data.log) {
                    updateLog(data.log);
                }

                if (data.status === 'success' || data.status === 'failed') {
                    clearInterval(intervalId);
                    setStatus(data.status === 'success' ? 'Done!' : 'Failed!');
                    isJobRunning = false;
                    validateForm();
                    if (data.status === 'success') {
                        updateLog('--- Job Complete ---');
                        statusBar.style.display = 'block'; // Show the status bar
                    }
                }
            } catch (error) {
                clearInterval(intervalId);
                updateLog('Error polling for status.');
                setStatus('Error!');
                isJobRunning = false;
                validateForm();
            }
        }, 2000);
    }

    cancelBtn.addEventListener('click', () => {
        if (isJobRunning && currentJobId) {
            // In a real app, you'd call a cancel endpoint.
            // Here, we'll just stop polling.
            isJobRunning = false;
            updateLog(`--- Job Canceled by User ---`);
            setStatus('Canceled');
            validateForm();
        }
    });

    // Initial state
    validateForm();
});
