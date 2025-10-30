import S3Uploader from './uploader.js';

class UploadApp {
    constructor() {
        this.selectedFile = null;
        this.uploader = new S3Uploader();
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.userInfo = document.getElementById('userInfo');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.statusMessage = document.getElementById('statusMessage');
        
        // File info elements
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.fileType = document.getElementById('fileType');
        
        // User info elements
        this.userName = document.getElementById('userName');
        this.userEmail = document.getElementById('userEmail');
    }

    attachEventListeners() {
        // Browse button click
        this.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });

        // Drop zone click
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Upload button click
        this.uploadBtn.addEventListener('click', () => {
            this.handleUpload();
        });

        // User input validation
        this.userName.addEventListener('input', () => this.validateForm());
        this.userEmail.addEventListener('input', () => this.validateForm());
    }

    handleFileSelect(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.zip')) {
            this.showStatus('Please select a ZIP file', 'error');
            return;
        }

        this.selectedFile = file;
        this.displayFileInfo(file);
        this.fileInfo.classList.remove('hidden');
        this.userInfo.classList.remove('hidden');
        this.validateForm();
        this.clearStatus();
    }

    displayFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileType.textContent = file.type || 'application/zip';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    validateForm() {
        const isValid = this.selectedFile && 
                       this.userName.value.trim() !== '' && 
                       this.userEmail.value.trim() !== '' &&
                       this.isValidEmail(this.userEmail.value);
        
        if (isValid) {
            this.uploadBtn.classList.remove('hidden');
            this.uploadBtn.disabled = false;
        } else {
            this.uploadBtn.disabled = true;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async handleUpload() {
        if (!this.selectedFile) {
            this.showStatus('Please select a file first', 'error');
            return;
        }

        if (!this.userName.value.trim() || !this.userEmail.value.trim()) {
            this.showStatus('Please fill in all user information', 'error');
            return;
        }

        const userInfo = {
            name: this.userName.value.trim(),
            email: this.userEmail.value.trim()
        };

        // Disable upload button during upload
        this.uploadBtn.disabled = true;
        this.progressSection.classList.remove('hidden');
        this.clearStatus();

        try {
            const result = await this.uploader.uploadFile(
                this.selectedFile,
                userInfo,
                (percent, message) => this.updateProgress(percent, message)
            );

            this.showStatus('Upload successful! File is queued for processing.', 'success');
            console.log('Upload result:', result);

            // Reset form after successful upload
            setTimeout(() => this.resetForm(), 3000);

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus('Upload failed: ' + error.message, 'error');
            this.uploadBtn.disabled = false;
        }
    }

    updateProgress(percent, message = '') {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = percent + '%' + (message ? ' - ' + message : '');
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message ' + type;
    }

    clearStatus() {
        this.statusMessage.textContent = '';
        this.statusMessage.className = 'status-message';
    }

    resetForm() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.userName.value = '';
        this.userEmail.value = '';
        this.fileInfo.classList.add('hidden');
        this.userInfo.classList.add('hidden');
        this.uploadBtn.classList.add('hidden');
        this.progressSection.classList.add('hidden');
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0%';
        this.clearStatus();
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UploadApp();
});
