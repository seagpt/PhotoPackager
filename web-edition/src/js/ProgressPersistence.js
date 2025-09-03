/**
 * ProgressPersistence.js
 * Save and restore processing progress using IndexedDB
 * Allows users to resume interrupted processing sessions
 */

export class ProgressPersistence {
    constructor() {
        this.dbName = 'PhotoPackagerDB';
        this.dbVersion = 1;
        this.storeName = 'processingProgress';
        this.db = null;
        this.currentSessionId = null;
        this.autosaveInterval = null;
        this.autosaveDelay = 30000; // 30 seconds
        
        this.initializeDB();
    }

    /**
     * Initialize IndexedDB database
     */
    async initializeDB() {
        try {
            this.db = await this.openDB();
            console.log('ProgressPersistence initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ProgressPersistence:', error);
            // Fall back to localStorage for basic functionality
            this.useFallback = true;
        }
    }

    /**
     * Open IndexedDB connection
     */
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create main progress store
                const progressStore = db.createObjectStore(this.storeName, { 
                    keyPath: 'sessionId' 
                });
                
                progressStore.createIndex('timestamp', 'timestamp', { unique: false });
                progressStore.createIndex('status', 'status', { unique: false });
                
                // Create file chunks store for large file data
                const chunksStore = db.createObjectStore('fileChunks', { 
                    keyPath: ['sessionId', 'fileIndex'] 
                });
            };
        });
    }

    /**
     * Save current processing progress
     */
    async saveProgress(progressData) {
        if (!this.db && !this.useFallback) return false;

        const sessionData = {
            sessionId: this.currentSessionId || this.generateSessionId(),
            timestamp: Date.now(),
            status: progressData.status || 'in_progress',
            files: progressData.files || [],
            settings: progressData.settings || {},
            completedFiles: progressData.completedFiles || [],
            failedFiles: progressData.failedFiles || [],
            currentIndex: progressData.currentIndex || 0,
            totalFiles: progressData.totalFiles || 0,
            startTime: progressData.startTime || Date.now(),
            metadata: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                version: '1.0'
            }
        };

        if (this.useFallback) {
            return this.saveFallback(sessionData);
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.put(sessionData);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            this.currentSessionId = sessionData.sessionId;
            console.log(`Progress saved for session ${this.currentSessionId}`);
            return true;

        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }

    /**
     * Load saved progress by session ID
     */
    async loadProgress(sessionId = null) {
        if (!this.db && !this.useFallback) return null;

        if (this.useFallback) {
            return this.loadFallback(sessionId);
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            let request;
            if (sessionId) {
                request = store.get(sessionId);
            } else {
                // Get most recent session
                const index = store.index('timestamp');
                request = index.openCursor(null, 'prev');
            }

            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    if (sessionId) {
                        resolve(event.target.result);
                    } else {
                        const cursor = event.target.result;
                        resolve(cursor ? cursor.value : null);
                    }
                };
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Failed to load progress:', error);
            return null;
        }
    }

    /**
     * Get all saved sessions
     */
    async getAllSessions() {
        if (!this.db && !this.useFallback) return [];

        if (this.useFallback) {
            return this.getAllSessionsFallback();
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');

            return new Promise((resolve, reject) => {
                const request = index.getAll();
                request.onsuccess = () => {
                    const sessions = request.result.sort((a, b) => b.timestamp - a.timestamp);
                    resolve(sessions);
                };
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Failed to get all sessions:', error);
            return [];
        }
    }

    /**
     * Delete a saved session
     */
    async deleteSession(sessionId) {
        if (!this.db && !this.useFallback) return false;

        if (this.useFallback) {
            return this.deleteSessionFallback(sessionId);
        }

        try {
            const transaction = this.db.transaction([this.storeName, 'fileChunks'], 'readwrite');
            
            // Delete main progress record
            const progressStore = transaction.objectStore(this.storeName);
            await new Promise((resolve, reject) => {
                const request = progressStore.delete(sessionId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Delete associated file chunks
            const chunksStore = transaction.objectStore('fileChunks');
            const range = IDBKeyRange.bound([sessionId, 0], [sessionId, Number.MAX_SAFE_INTEGER]);
            await new Promise((resolve, reject) => {
                const request = chunksStore.delete(range);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            console.log(`Session ${sessionId} deleted`);
            return true;

        } catch (error) {
            console.error('Failed to delete session:', error);
            return false;
        }
    }

    /**
     * Start autosave for current session
     */
    startAutosave(getProgressCallback) {
        this.stopAutosave(); // Clear any existing interval
        
        this.autosaveInterval = setInterval(async () => {
            if (typeof getProgressCallback === 'function') {
                const progressData = getProgressCallback();
                if (progressData && progressData.status !== 'completed') {
                    await this.saveProgress(progressData);
                }
            }
        }, this.autosaveDelay);
        
        console.log('Autosave started');
    }

    /**
     * Stop autosave
     */
    stopAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
            console.log('Autosave stopped');
        }
    }

    /**
     * Check for resumable sessions on app start
     */
    async checkForResumableSessions() {
        const sessions = await this.getAllSessions();
        const resumableSessions = sessions.filter(session => 
            session.status === 'in_progress' && 
            Date.now() - session.timestamp < 24 * 60 * 60 * 1000 // Less than 24 hours old
        );

        if (resumableSessions.length > 0) {
            return resumableSessions;
        }

        return [];
    }

    /**
     * Resume a session
     */
    async resumeSession(sessionId) {
        const sessionData = await this.loadProgress(sessionId);
        if (!sessionData) {
            throw new Error('Session not found');
        }

        // Validate session data
        if (!sessionData.files || !Array.isArray(sessionData.files)) {
            throw new Error('Invalid session data: missing files');
        }

        if (!sessionData.settings) {
            throw new Error('Invalid session data: missing settings');
        }

        this.currentSessionId = sessionId;
        return sessionData;
    }

    /**
     * Mark session as completed
     */
    async completeSession(sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) return false;

        const sessionData = await this.loadProgress(id);
        if (sessionData) {
            sessionData.status = 'completed';
            sessionData.completedAt = Date.now();
            await this.saveProgress(sessionData);
        }

        this.stopAutosave();
        return true;
    }

    /**
     * Clean up old sessions (older than 7 days)
     */
    async cleanupOldSessions() {
        const sessions = await this.getAllSessions();
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        const oldSessions = sessions.filter(session => session.timestamp < weekAgo);
        
        for (const session of oldSessions) {
            await this.deleteSession(session.sessionId);
        }

        console.log(`Cleaned up ${oldSessions.length} old sessions`);
        return oldSessions.length;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current session ID
     */
    getCurrentSessionId() {
        return this.currentSessionId;
    }

    /**
     * Create new session
     */
    createNewSession() {
        this.currentSessionId = this.generateSessionId();
        return this.currentSessionId;
    }

    /**
     * Fallback methods using localStorage
     */
    saveFallback(sessionData) {
        try {
            const key = `photopackager_session_${sessionData.sessionId}`;
            localStorage.setItem(key, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Fallback save failed:', error);
            return false;
        }
    }

    loadFallback(sessionId) {
        try {
            if (sessionId) {
                const key = `photopackager_session_${sessionId}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } else {
                // Find most recent session
                const keys = Object.keys(localStorage).filter(key => 
                    key.startsWith('photopackager_session_'));
                
                let mostRecentSession = null;
                let mostRecentTime = 0;
                
                for (const key of keys) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp > mostRecentTime) {
                        mostRecentTime = data.timestamp;
                        mostRecentSession = data;
                    }
                }
                
                return mostRecentSession;
            }
        } catch (error) {
            console.error('Fallback load failed:', error);
            return null;
        }
    }

    getAllSessionsFallback() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith('photopackager_session_'));
            
            const sessions = keys.map(key => {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);
            
            return sessions.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Fallback get all sessions failed:', error);
            return [];
        }
    }

    deleteSessionFallback(sessionId) {
        try {
            const key = `photopackager_session_${sessionId}`;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Fallback delete failed:', error);
            return false;
        }
    }

    /**
     * Show resume dialog to user
     */
    showResumeDialog(resumableSessions) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'resume-modal-overlay';
            modal.innerHTML = `
                <div class="resume-modal">
                    <div class="resume-modal-header">
                        <h3>🔄 Resume Processing?</h3>
                        <button id="resume-close" class="resume-close">&times;</button>
                    </div>
                    <div class="resume-modal-body">
                        <p>Found ${resumableSessions.length} interrupted processing session${resumableSessions.length > 1 ? 's' : ''}. Would you like to resume?</p>
                        <div class="resume-sessions">
                            ${resumableSessions.map(session => `
                                <div class="resume-session" data-session-id="${session.sessionId}">
                                    <div class="resume-session-info">
                                        <strong>${session.files.length} files</strong> - 
                                        ${session.completedFiles.length}/${session.totalFiles} completed
                                        <br>
                                        <small>${new Date(session.timestamp).toLocaleString()}</small>
                                    </div>
                                    <div class="resume-session-progress">
                                        <div class="progress-bar-small">
                                            <div class="progress-fill" style="width: ${(session.completedFiles.length / session.totalFiles) * 100}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="resume-modal-actions">
                        <button id="resume-selected" class="btn btn-primary" disabled>Resume Selected</button>
                        <button id="resume-start-new" class="btn btn-secondary">Start New</button>
                        <button id="resume-delete-all" class="btn btn-secondary">Delete All & Start New</button>
                    </div>
                </div>
            `;

            // Add styles
            this.addResumeModalStyles();
            
            document.body.appendChild(modal);

            // Bind events
            let selectedSessionId = null;
            
            modal.querySelectorAll('.resume-session').forEach(session => {
                session.addEventListener('click', () => {
                    modal.querySelectorAll('.resume-session').forEach(s => s.classList.remove('selected'));
                    session.classList.add('selected');
                    selectedSessionId = session.dataset.sessionId;
                    document.getElementById('resume-selected').disabled = false;
                });
            });

            document.getElementById('resume-selected').addEventListener('click', () => {
                modal.remove();
                resolve({ action: 'resume', sessionId: selectedSessionId });
            });

            document.getElementById('resume-start-new').addEventListener('click', () => {
                modal.remove();
                resolve({ action: 'new' });
            });

            document.getElementById('resume-delete-all').addEventListener('click', async () => {
                for (const session of resumableSessions) {
                    await this.deleteSession(session.sessionId);
                }
                modal.remove();
                resolve({ action: 'new' });
            });

            document.getElementById('resume-close').addEventListener('click', () => {
                modal.remove();
                resolve({ action: 'new' });
            });
        });
    }

    /**
     * Add resume modal styles
     */
    addResumeModalStyles() {
        if (document.getElementById('resume-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'resume-modal-styles';
        styles.textContent = `
            .resume-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .resume-modal {
                background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                border: 2px solid #00aeff;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 174, 255, 0.3);
            }

            .resume-modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(0, 174, 255, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .resume-modal-header h3 {
                color: #00aeff;
                margin: 0;
            }

            .resume-close {
                background: none;
                border: none;
                color: #cccccc;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .resume-close:hover {
                color: #ffffff;
                background: rgba(255, 68, 68, 0.2);
                border-radius: 50%;
            }

            .resume-modal-body {
                padding: 1.5rem;
                color: #cccccc;
            }

            .resume-sessions {
                margin-top: 1rem;
            }

            .resume-session {
                padding: 1rem;
                border: 1px solid rgba(0, 174, 255, 0.2);
                border-radius: 8px;
                margin-bottom: 0.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .resume-session:hover {
                border-color: #00aeff;
                background: rgba(0, 174, 255, 0.1);
            }

            .resume-session.selected {
                border-color: #00aeff;
                background: rgba(0, 174, 255, 0.2);
            }

            .resume-session-info {
                flex: 1;
            }

            .resume-session-progress {
                width: 100px;
                margin-left: 1rem;
            }

            .progress-bar-small {
                width: 100%;
                height: 6px;
                background: rgba(0, 174, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: #00aeff;
                transition: width 0.3s ease;
            }

            .resume-modal-actions {
                padding: 1.5rem;
                border-top: 1px solid rgba(0, 174, 255, 0.2);
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                flex-wrap: wrap;
            }

            @media (max-width: 768px) {
                .resume-modal {
                    width: 95%;
                    margin: 1rem;
                }

                .resume-modal-actions {
                    flex-direction: column;
                }

                .resume-session {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .resume-session-progress {
                    width: 100%;
                    margin-left: 0;
                    margin-top: 0.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Export singleton instance
export const progressPersistence = new ProgressPersistence();