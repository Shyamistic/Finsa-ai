/**
 * LoanWizard OS SDK — v1.0.0
 * Zero-dependency embeddable iframe SDK for Poonawalla Fincorp integration
 *
 * Usage:
 *   const wizard = new LoanWizard({
 *     baseUrl: 'https://loanwizard.poonawallafincorp.com',
 *     apiKey: 'your-api-key',
 *     institutionName: 'Poonawalla Fincorp',
 *     primaryColor: '#1a56db',
 *     logo: 'https://your-cdn.com/logo.png',
 *     language: 'en',
 *     onComplete: (result) => console.log('Offer:', result),
 *     onError: (error) => console.error('Error:', error),
 *   });
 *   wizard.mount('container-id');
 */
(function (global) {
  'use strict';

  function LoanWizard(config) {
    if (!config || !config.baseUrl || !config.apiKey) {
      throw new Error('LoanWizard: baseUrl and apiKey are required');
    }
    this.config = Object.assign({
      institutionName: 'LoanWizard',
      primaryColor: '#1a56db',
      language: 'en',
    }, config);
    this._iframe = null;
    this._container = null;
    this._messageHandler = null;
  }

  LoanWizard.prototype.mount = function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) {
      throw new Error('LoanWizard: container element "' + containerId + '" not found');
    }
    this._container = container;

    var params = new URLSearchParams({
      logo: this.config.logo || '',
      color: this.config.primaryColor,
      institution: this.config.institutionName,
      apiKey: this.config.apiKey,
      lang: this.config.language,
    });

    var iframe = document.createElement('iframe');
    iframe.src = this.config.baseUrl + '/consent?' + params.toString();
    iframe.style.cssText = [
      'width: 100%',
      'height: 700px',
      'border: none',
      'border-radius: 12px',
      'box-shadow: 0 4px 24px rgba(0,0,0,0.08)',
    ].join(';');
    iframe.allow = 'camera; microphone; autoplay';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', this.config.institutionName + ' Loan Application');

    this._iframe = iframe;
    container.appendChild(iframe);

    // Listen for postMessage events from the iframe
    var self = this;
    this._messageHandler = function (event) {
      if (event.origin !== new URL(self.config.baseUrl).origin) return;
      var data = event.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case 'LOANWIZARD_COMPLETE':
          if (typeof self.config.onComplete === 'function') {
            self.config.onComplete(data.result);
          }
          break;
        case 'LOANWIZARD_ERROR':
          if (typeof self.config.onError === 'function') {
            self.config.onError(data.error);
          }
          break;
        case 'LOANWIZARD_RESIZE':
          if (data.height && self._iframe) {
            self._iframe.style.height = data.height + 'px';
          }
          break;
        case 'LOANWIZARD_READY':
          if (typeof self.config.onReady === 'function') {
            self.config.onReady();
          }
          break;
      }
    };

    window.addEventListener('message', this._messageHandler);
    return this;
  };

  LoanWizard.prototype.unmount = function () {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
      this._messageHandler = null;
    }
    if (this._iframe && this._container) {
      this._container.removeChild(this._iframe);
      this._iframe = null;
    }
  };

  LoanWizard.prototype.setLanguage = function (lang) {
    this.config.language = lang;
    if (this._iframe) {
      this._iframe.contentWindow.postMessage({ type: 'SET_LANGUAGE', lang: lang }, this.config.baseUrl);
    }
  };

  LoanWizard.VERSION = '1.0.0';

  // UMD export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoanWizard;
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return LoanWizard; });
  } else {
    global.LoanWizard = LoanWizard;
  }
})(typeof window !== 'undefined' ? window : this);
