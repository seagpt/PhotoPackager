/**
 * CookieConsent.js
 * GDPR/CCPA compliant cookie consent system
 * Manages user consent for analytics and tracking
 */

export class CookieConsent {
    constructor() {
        this.consentKey = 'photopackager_consent';
        this.consentData = this.loadConsent();
        this.init();
    }

    /**
     * Initialize cookie consent system
     */
    init() {
        if (!this.hasValidConsent()) {
            this.showConsentBanner();
        } else {
            // User has already consented, initialize analytics
            if (this.consentData.analytics) {
                window.analytics?.setAnalyticsConsent(true);
            }
        }
    }

    /**
     * Check if user has valid consent
     */
    hasValidConsent() {
        return this.consentData && 
               this.consentData.timestamp && 
               (Date.now() - this.consentData.timestamp) < (365 * 24 * 60 * 60 * 1000); // 1 year
    }

    /**
     * Show cookie consent banner
     */
    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h3>🍪 Privacy & Cookies</h3>
                    <p>We use essential cookies to make PhotoPackager work properly. We'd also like to use analytics cookies to understand how you use our service and improve it.</p>
                    <p><strong>All processing happens on your device - we never see your photos.</strong></p>
                </div>
                <div class="cookie-consent-actions">
                    <button id="accept-all-cookies" class="btn btn-primary">Accept All</button>
                    <button id="essential-only-cookies" class="btn btn-secondary">Essential Only</button>
                    <button id="manage-cookies" class="btn btn-link">Manage Settings</button>
                </div>
            </div>
        `;

        // Add styles
        this.addConsentStyles();
        
        // Add to page
        document.body.appendChild(banner);
        
        // Bind events
        this.bindConsentEvents(banner);
    }

    /**
     * Show detailed cookie management modal
     */
    showCookieManagement() {
        const modal = document.createElement('div');
        modal.id = 'cookie-management-modal';
        modal.innerHTML = `
            <div class="cookie-modal-overlay">
                <div class="cookie-modal-content">
                    <div class="cookie-modal-header">
                        <h2>Cookie Preferences</h2>
                        <button id="close-cookie-modal" class="close-btn">&times;</button>
                    </div>
                    <div class="cookie-modal-body">
                        <div class="cookie-category">
                            <h3>Essential Cookies</h3>
                            <p>These cookies are necessary for PhotoPackager to function. They cannot be disabled.</p>
                            <label class="cookie-toggle">
                                <input type="checkbox" checked disabled>
                                <span class="slider essential"></span>
                                Always Active
                            </label>
                        </div>
                        <div class="cookie-category">
                            <h3>Analytics Cookies</h3>
                            <p>Help us understand how PhotoPackager is used so we can improve it. No personal data is collected.</p>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="analytics-toggle" ${this.consentData?.analytics ? 'checked' : ''}>
                                <span class="slider"></span>
                                Allow Analytics
                            </label>
                        </div>
                        <div class="cookie-info">
                            <h4>What data do we collect?</h4>
                            <ul>
                                <li>✅ Number of photos processed</li>
                                <li>✅ Processing time and performance</li>
                                <li>✅ Error rates and types</li>
                                <li>✅ General usage patterns</li>
                                <li>❌ Your photos (never transmitted)</li>
                                <li>❌ Personal information</li>
                                <li>❌ IP addresses or location</li>
                            </ul>
                        </div>
                    </div>
                    <div class="cookie-modal-footer">
                        <button id="save-cookie-preferences" class="btn btn-primary">Save Preferences</button>
                        <button id="reject-all-cookies" class="btn btn-secondary">Reject All</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.bindModalEvents(modal);
    }

    /**
     * Add consent banner styles
     */
    addConsentStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            #cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                border-top: 3px solid #00aeff;
                padding: 1.5rem;
                z-index: 10000;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.5s ease;
            }

            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }

            .cookie-consent-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 2rem;
                flex-wrap: wrap;
            }

            .cookie-consent-text {
                flex: 1;
                min-width: 300px;
            }

            .cookie-consent-text h3 {
                color: #00aeff;
                margin-bottom: 0.5rem;
                font-size: 1.2rem;
            }

            .cookie-consent-text p {
                color: #cccccc;
                margin-bottom: 0.5rem;
                line-height: 1.4;
            }

            .cookie-consent-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .btn-link {
                background: transparent;
                color: #00aeff;
                text-decoration: underline;
                border: none;
                padding: 8px 16px;
                cursor: pointer;
            }

            .btn-link:hover {
                color: #ffffff;
                background: transparent !important;
                transform: none !important;
                box-shadow: none !important;
            }

            /* Cookie Management Modal */
            #cookie-management-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10001;
                animation: fadeIn 0.3s ease;
            }

            .cookie-modal-overlay {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }

            .cookie-modal-content {
                background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                border: 2px solid #00aeff;
                border-radius: 15px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }

            .cookie-modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(0, 174, 255, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .cookie-modal-header h2 {
                color: #00aeff;
                margin: 0;
            }

            .close-btn {
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

            .close-btn:hover {
                color: #ffffff;
            }

            .cookie-modal-body {
                padding: 1.5rem;
            }

            .cookie-category {
                margin-bottom: 2rem;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }

            .cookie-category h3 {
                color: #ffffff;
                margin-bottom: 0.5rem;
            }

            .cookie-category p {
                color: #cccccc;
                margin-bottom: 1rem;
            }

            .cookie-toggle {
                position: relative;
                display: inline-flex;
                align-items: center;
                cursor: pointer;
                font-size: 1rem;
                color: #cccccc;
            }

            .cookie-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: relative;
                width: 60px;
                height: 30px;
                background-color: #444;
                border-radius: 15px;
                margin-right: 10px;
                transition: 0.3s;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                border-radius: 50%;
                transition: 0.3s;
            }

            .cookie-toggle input:checked + .slider {
                background-color: #00aeff;
            }

            .cookie-toggle input:checked + .slider:before {
                transform: translateX(30px);
            }

            .slider.essential {
                background-color: #00aeff;
                opacity: 0.7;
            }

            .cookie-info {
                background: rgba(0, 174, 255, 0.1);
                padding: 1rem;
                border-radius: 10px;
                margin-top: 1rem;
            }

            .cookie-info h4 {
                color: #00aeff;
                margin-bottom: 0.5rem;
            }

            .cookie-info ul {
                color: #cccccc;
                margin: 0;
                padding-left: 1rem;
            }

            .cookie-info li {
                margin-bottom: 0.3rem;
            }

            .cookie-modal-footer {
                padding: 1.5rem;
                border-top: 1px solid rgba(0, 174, 255, 0.2);
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }

            @media (max-width: 768px) {
                .cookie-consent-content {
                    flex-direction: column;
                    text-align: center;
                }

                .cookie-consent-actions {
                    justify-content: center;
                }

                .cookie-modal-footer {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Bind consent banner events
     */
    bindConsentEvents(banner) {
        // Accept all cookies
        banner.querySelector('#accept-all-cookies').onclick = () => {
            this.setConsent({ essential: true, analytics: true });
            this.removeBanner(banner);
        };

        // Essential only
        banner.querySelector('#essential-only-cookies').onclick = () => {
            this.setConsent({ essential: true, analytics: false });
            this.removeBanner(banner);
        };

        // Manage cookies
        banner.querySelector('#manage-cookies').onclick = () => {
            this.showCookieManagement();
        };
    }

    /**
     * Bind modal events
     */
    bindModalEvents(modal) {
        // Close modal
        const closeModal = () => modal.remove();
        modal.querySelector('#close-cookie-modal').onclick = closeModal;
        modal.querySelector('.cookie-modal-overlay').onclick = (e) => {
            if (e.target === modal.querySelector('.cookie-modal-overlay')) {
                closeModal();
            }
        };

        // Save preferences
        modal.querySelector('#save-cookie-preferences').onclick = () => {
            const analyticsEnabled = modal.querySelector('#analytics-toggle').checked;
            this.setConsent({ essential: true, analytics: analyticsEnabled });
            closeModal();
            this.removeBanner(document.getElementById('cookie-consent-banner'));
        };

        // Reject all
        modal.querySelector('#reject-all-cookies').onclick = () => {
            this.setConsent({ essential: true, analytics: false });
            closeModal();
            this.removeBanner(document.getElementById('cookie-consent-banner'));
        };
    }

    /**
     * Set consent preferences
     */
    setConsent(preferences) {
        this.consentData = {
            ...preferences,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        localStorage.setItem(this.consentKey, JSON.stringify(this.consentData));
        
        // Initialize analytics if consented
        if (preferences.analytics && window.analytics) {
            window.analytics.setAnalyticsConsent(true);
        }
    }

    /**
     * Load existing consent
     */
    loadConsent() {
        try {
            const stored = localStorage.getItem(this.consentKey);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Remove consent banner
     */
    removeBanner(banner) {
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Get current consent status
     */
    getConsent() {
        return this.consentData;
    }

    /**
     * Reset consent (for testing)
     */
    resetConsent() {
        localStorage.removeItem(this.consentKey);
        this.consentData = null;
        window.location.reload();
    }
}

// Initialize cookie consent system
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
});

// Add slide down animation
const slideDownStyle = document.createElement('style');
slideDownStyle.textContent = `
    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideDownStyle);