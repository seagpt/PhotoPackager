/**
 * PhotoPackager Web Edition - Progress Persistence System
 * 
 * Copyright (c) 2025 DropShock Digital LLC
 * Created by Steven Seagondollar
 * 
 * Licensed under the MIT License:
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * This file is part of PhotoPackager Web Edition, an open-source photo processing tool.
 * 
 * ProgressPersistence.js
 * Save and restore processing progress using IndexedDB
 * Allows users to resume interrupted processing sessions
 */

import { config } from './Config.js';
import { logger } from './Logger.js';

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
            // Check if IndexedDB is available
            if (!window.indexedDB) {
                throw new Error('IndexedDB not supported');
            }

            this.db = await this.openDB();
            config.log('ProgressPersistence initialized successfully');
            
            // Test the database connection
            await this.testConnection();
            
        } catch (error) {
            logger.error('Failed to initialize ProgressPersistence:', error);
            this.handleIndexedDBError(error);
            // Fall back to localStorage for basic functionality
            this.useFallback = true;
            
            // Notify user if not in private browsing
            if (error.name === 'QuotaExceededError') {
                this.showStorageWarning('Storage quota exceeded. Resume functionality will be limited.');
            } else if (error.message.includes('private')) {
                this.showStorageWarning('Private browsing detected. Resume functionality disabled.');
            }
        }
    }

    /**
     * Test IndexedDB connection
     */
    async testConnection() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            // Add transaction error handling
            transaction.onerror = (event) => {
                logger.error('Transaction error during test:', event.target.error);
            };
            
            // Attempt a simple operation
            await new Promise((resolve, reject) => {
                const request = store.count();
                
                // Add timeout for hanging transactions
                const timeout = setTimeout(() => {
                    reject(new Error('IndexedDB connection test timed out'));
                }, 5000);
                
                request.onsuccess = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                request.onerror = () => {
                    clearTimeout(timeout);
                    reject(request.error);
                };
            });
            
            config.log('IndexedDB connection test passed');
        } catch (error) {
            // Enhance error detection for common scenarios
            if (error.name === 'SecurityError' || error.message.includes('private')) {
                throw new Error('Private browsing mode detected - IndexedDB disabled');
            } else if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded - cannot use IndexedDB');
            } else {
                throw new Error(`IndexedDB connection test failed: ${error.message}`);
            }
        }
    }

    /**
     * Handle IndexedDB specific errors
     */
    handleIndexedDBError(error) {
        const errorTypes = {
            'UnknownError': 'IndexedDB encountered an unknown error',
            'DataError': 'Invalid data provided to IndexedDB',
            'InvalidStateError': 'IndexedDB is in an invalid state',
            'NotFoundError': 'IndexedDB object not found',
            'QuotaExceededError': 'Storage quota exceeded',
            'VersionError': 'IndexedDB version mismatch',
            'AbortError': 'IndexedDB transaction was aborted',
            'ConstraintError': 'IndexedDB constraint violation',
            'TimeoutError': 'IndexedDB operation timed out'
        };

        const friendlyMessage = errorTypes[error.name] || `IndexedDB error: ${error.message}`;
        logger.warn(friendlyMessage, error);
        
        // Track error for analytics
        if (window.analytics) {
            window.analytics.trackError('indexeddb_error', error.name || 'unknown');
        }
    }

    /**
     * HIGH-010: Determine if an error is transient and worth retrying
     */
    isTransientError(error) {
        const transientErrorNames = [
            'AbortError',           // Transaction was aborted
            'TimeoutError',         // Operation timed out
            'TransactionInactiveError', // Transaction is no longer active
            'UnknownError',         // Unknown error (could be temporary)
        ];
        
        const transientMessages = [
            'network error',
            'connection lost',
            'timeout',
            'busy',
            'locked'
        ];
        
        // Check error name
        if (transientErrorNames.includes(error.name)) {
            return true;
        }
        
        // Check error message for transient patterns
        const errorMessage = (error.message || '').toLowerCase();
        return transientMessages.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Show storage warning to user
     */
    showStorageWarning(message) {
        if (window.errorHandler) {
            window.errorHandler.showWarning('Resume Functionality Limited', message, [
                { text: 'Continue', action: () => {} }
            ]);
        }
    }

    /**
     * Open IndexedDB connection
     * HIGH-010: Enhanced with timeout, upgrade error handling, and connection validation
     */
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            // HIGH-010: Add timeout protection for database opening
            const timeout = setTimeout(() => {
                logger.error('IndexedDB open operation timed out');
                reject(new Error('Database open operation timed out after 15 seconds'));
            }, 15000);
            
            request.onerror = (event) => {
                clearTimeout(timeout);
                const error = event.target.error || new Error('Unknown IndexedDB open error');
                logger.error('IndexedDB open failed:', error);
                this.handleIndexedDBError(error);
                reject(error);
            };
            
            request.onsuccess = (event) => {
                clearTimeout(timeout);
                const db = event.target.result;
                
                // HIGH-010: Add connection validation and error event listeners
                db.onerror = (errorEvent) => {
                    logger.error('Database error after opening:', errorEvent.target.error);
                    this.handleIndexedDBError(errorEvent.target.error);
                };
                
                db.onversionchange = () => {
                    logger.warn('Database version changed by another tab, closing connection');
                    db.close();
                };
                
                // HIGH-010: Validate database structure
                try {
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        throw new Error(`Required object store '${this.storeName}' not found`);
                    }
                    
                    logger.info('IndexedDB connection established and validated');
                    resolve(db);
                } catch (validationError) {
                    logger.error('Database validation failed:', validationError);
                    db.close();
                    reject(validationError);
                }
            };
            
            request.onupgradeneeded = (event) => {
                clearTimeout(timeout);
                const db = event.target.result;
                
                try {
                    logger.info(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);
                    
                    // HIGH-010: Safe object store creation with error handling
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const progressStore = db.createObjectStore(this.storeName, { 
                            keyPath: 'sessionId' 
                        });
                        
                        progressStore.createIndex('timestamp', 'timestamp', { unique: false });
                        progressStore.createIndex('status', 'status', { unique: false });
                        logger.info('Created progress object store');
                    }
                    
                    // Create file chunks store for large file data
                    if (!db.objectStoreNames.contains('fileChunks')) {
                        const chunksStore = db.createObjectStore('fileChunks', { 
                            keyPath: ['sessionId', 'fileIndex'] 
                        });
                        logger.info('Created fileChunks object store');
                    }
                    
                } catch (upgradeError) {
                    logger.error('Database upgrade failed:', upgradeError);
                    // The transaction will automatically rollback on error
                    // Let the error bubble up to onsuccess/onerror handlers
                    throw upgradeError;
                }
            };
            
            // HIGH-010: Handle blocked events (when other tabs have the database open)
            request.onblocked = () => {
                logger.warn('Database upgrade blocked by open connections in other tabs');
                // Note: We could show a user message here asking them to close other tabs
            };
        });
    }

    /**
     * Save current processing progress
     * HIGH-010: Added retry capability for transient errors
     */
    async saveProgress(progressData, retries = 0) {
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
            
            // Add transaction error handling
            transaction.onerror = (event) => {
                logger.error('Transaction error during save:', event.target.error);
            };
            transaction.onabort = (event) => {
                logger.warn('Transaction aborted during save:', event.target.error);
            };
            
            await new Promise((resolve, reject) => {
                const request = store.put(sessionData);
                
                // Add timeout protection
                const timeout = setTimeout(() => {
                    reject(new Error('IndexedDB save operation timed out'));
                }, 10000); // 10 second timeout
                
                request.onsuccess = () => {
                    clearTimeout(timeout);
                    resolve(request.result);
                };
                request.onerror = () => {
                    clearTimeout(timeout);
                    reject(request.error);
                };
            });

            this.currentSessionId = sessionData.sessionId;
            config.log(`Progress saved for session ${this.currentSessionId}`);
            return true;

        } catch (error) {
            logger.error('Failed to save progress:', error);
            this.handleIndexedDBError(error);
            
            // HIGH-010: Retry logic for transient errors
            if (this.isTransientError(error) && retries < 2) {
                logger.info(`Retrying save operation (attempt ${retries + 2}/3)`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
                return this.saveProgress(sessionData, retries + 1);
            }
            
            // Attempt fallback save to localStorage
            try {
                const fallbackResult = await this.saveFallback(sessionData);
                if (fallbackResult) {
                    logger.warn('Saved progress to fallback storage');
                    return true;
                }
            } catch (fallbackError) {
                logger.error('Fallback save also failed:', fallbackError);
            }
            
            return false;
        }
    }

    /**
     * Load saved progress by session ID
     * HIGH-010: Added retry capability for transient errors
     */
    async loadProgress(sessionId = null, retries = 0) {
        if (!this.db && !this.useFallback) return null;

        if (this.useFallback) {
            return this.loadFallback(sessionId);
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            // Add transaction error handling
            transaction.onerror = (event) => {
                logger.error('Transaction error during load:', event.target.error);
            };
            transaction.onabort = (event) => {
                logger.warn('Transaction aborted during load:', event.target.error);
            };
            
            let request;
            if (sessionId) {
                request = store.get(sessionId);
            } else {
                // Get most recent session
                const index = store.index('timestamp');
                request = index.openCursor(null, 'prev');
            }

            return new Promise((resolve, reject) => {
                // Add timeout protection
                const timeout = setTimeout(() => {
                    reject(new Error('IndexedDB load operation timed out'));
                }, 10000); // 10 second timeout
                
                request.onsuccess = (event) => {
                    clearTimeout(timeout);
                    if (sessionId) {
                        resolve(event.target.result);
                    } else {
                        const cursor = event.target.result;
                        resolve(cursor ? cursor.value : null);
                    }
                };
                request.onerror = () => {
                    clearTimeout(timeout);
                    reject(request.error);
                };
            });

        } catch (error) {
            logger.error('Failed to load progress:', error);
            this.handleIndexedDBError(error);
            
            // HIGH-010: Retry logic for transient errors
            if (this.isTransientError(error) && retries < 2) {
                logger.info(`Retrying load operation (attempt ${retries + 2}/3)`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
                return this.loadProgress(sessionId, retries + 1);
            }
            
            // Attempt fallback load from localStorage
            try {
                const fallbackResult = await this.loadFallback(sessionId);
                if (fallbackResult) {
                    logger.warn('Loaded progress from fallback storage');
                    return fallbackResult;
                }
            } catch (fallbackError) {
                logger.error('Fallback load also failed:', fallbackError);
            }
            
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
            logger.error('Failed to get all sessions:', error);
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

            config.log(`Session ${sessionId} deleted`);
            return true;

        } catch (error) {
            logger.error('Failed to delete session:', error);
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
        
        config.log('Autosave started');
    }

    /**
     * Stop autosave
     */
    stopAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
            config.log('Autosave stopped');
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

        config.log(`Cleaned up ${oldSessions.length} old sessions`);
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
            logger.error('Fallback save failed:', error);
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
            logger.error('Fallback load failed:', error);
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
            logger.error('Fallback get all sessions failed:', error);
            return [];
        }
    }

    deleteSessionFallback(sessionId) {
        try {
            const key = `photopackager_session_${sessionId}`;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            logger.error('Fallback delete failed:', error);
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