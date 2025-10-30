// PDF.js worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application state
const state = {
    slides: [],
    revealInstance: null
};

// Initialize the application
function init() {
    setupDropZones();
    setupButtons();
    setupSortable();
    renderSlides();
}

// Setup drag and drop zones
function setupDropZones() {
    const pdfDropZone = document.getElementById('pdf-drop-zone');
    const videoDropZone = document.getElementById('video-drop-zone');
    const pdfInput = document.getElementById('pdf-input');
    const videoInput = document.getElementById('video-input');

    // PDF drop zone
    setupDropZone(pdfDropZone, pdfInput, handlePDFFile);
    
    // Video drop zone
    setupDropZone(videoDropZone, videoInput, handleVideoFile);
}

// Generic drop zone setup
function setupDropZone(dropZone, input, handler) {
    // Click to browse
    dropZone.addEventListener('click', () => {
        input.click();
    });

    // File input change
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handler(file);
        }
        input.value = ''; // Reset input
    });

    // Drag events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handler(file);
        }
    });
}

// Handle PDF file upload
async function handlePDFFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            // Create canvas for preview
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Store slide data
            state.slides.push({
                id: generateId(),
                type: 'pdf',
                pageNumber: pageNum,
                totalPages: pdf.numPages,
                fileName: file.name,
                canvas: canvas,
                pdfData: arrayBuffer
            });
        }
        
        renderSlides();
    } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Error processing PDF file');
    }
}

// Handle video file upload
function handleVideoFile(file) {
    if (file.type !== 'video/mp4') {
        alert('Please upload an MP4 file');
        return;
    }

    const videoUrl = URL.createObjectURL(file);
    
    state.slides.push({
        id: generateId(),
        type: 'video',
        fileName: file.name,
        videoUrl: videoUrl,
        file: file
    });
    
    renderSlides();
}

// Render slides preview
function renderSlides() {
    const container = document.getElementById('slides-container');
    container.innerHTML = '';
    
    if (state.slides.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <p>No slides yet. Drop files on the right to get started!</p>
            </div>
        `;
        return;
    }
    
    state.slides.forEach((slide, index) => {
        const slideElement = createSlidePreview(slide, index);
        container.appendChild(slideElement);
    });
}

// Create slide preview element
function createSlidePreview(slide, index) {
    const div = document.createElement('div');
    div.className = 'slide-preview';
    div.dataset.id = slide.id;
    
    const typeLabel = slide.type === 'pdf' ? 'PDF' : 'VIDEO';
    const typeClass = slide.type === 'video' ? 'video' : '';
    
    let contentHtml = '';
    if (slide.type === 'pdf') {
        contentHtml = `<canvas width="${slide.canvas.width}" height="${slide.canvas.height}"></canvas>`;
    } else if (slide.type === 'video') {
        contentHtml = `<video src="${slide.videoUrl}"></video>`;
    }
    
    div.innerHTML = `
        <div class="slide-preview-header">
            <span class="slide-type ${typeClass}">${typeLabel}</span>
            <span class="slide-number">Slide ${index + 1}</span>
        </div>
        <div class="slide-preview-content">
            ${contentHtml}
            ${slide.type === 'pdf' ? `<p>${slide.fileName} - Page ${slide.pageNumber}/${slide.totalPages}</p>` : `<p>${slide.fileName}</p>`}
        </div>
        <button class="delete-slide" data-id="${slide.id}">×</button>
    `;
    
    // Render PDF canvas
    if (slide.type === 'pdf') {
        const canvas = div.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.drawImage(slide.canvas, 0, 0);
    }
    
    // Delete button handler
    const deleteBtn = div.querySelector('.delete-slide');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSlide(slide.id);
    });
    
    return div;
}

// Delete slide
function deleteSlide(id) {
    const slideIndex = state.slides.findIndex(s => s.id === id);
    if (slideIndex !== -1) {
        // Revoke video URL if it's a video slide
        if (state.slides[slideIndex].type === 'video') {
            URL.revokeObjectURL(state.slides[slideIndex].videoUrl);
        }
        state.slides.splice(slideIndex, 1);
        renderSlides();
    }
}

// Setup sortable for drag and drop reordering
function setupSortable() {
    const container = document.getElementById('slides-container');
    
    new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            // Reorder slides array
            const movedSlide = state.slides.splice(oldIndex, 1)[0];
            state.slides.splice(newIndex, 0, movedSlide);
            
            renderSlides();
        }
    });
}

// Setup button handlers
function setupButtons() {
    const presentBtn = document.getElementById('present-btn');
    const exitBtn = document.getElementById('exit-presentation');
    const clearAllBtn = document.getElementById('clear-all-btn');

    presentBtn.addEventListener('click', startPresentation);
    exitBtn.addEventListener('click', exitPresentation);
    clearAllBtn.addEventListener('click', clearAllSlides);

    // Setup tab switching
    setupTabs();
}

// Setup tab functionality
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// Start presentation
async function startPresentation() {
    if (state.slides.length === 0) {
        alert('Please add some slides first!');
        return;
    }
    
    // Hide editor, show presentation
    document.getElementById('editor-view').style.display = 'none';
    document.getElementById('presentation-view').style.display = 'block';
    
    // Build reveal.js slides
    const revealSlides = document.getElementById('reveal-slides');
    revealSlides.innerHTML = '';
    
    for (const slide of state.slides) {
        const section = document.createElement('section');
        
        if (slide.type === 'pdf') {
            const canvas = document.createElement('canvas');
            canvas.width = slide.canvas.width;
            canvas.height = slide.canvas.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(slide.canvas, 0, 0);

            // Let Reveal.js handle canvas sizing
            section.appendChild(canvas);
        } else if (slide.type === 'video') {
            const video = document.createElement('video');
            video.src = slide.videoUrl;
            video.controls = false; // Remove controls for fullscreen
            video.preload = 'auto';
            video.autoplay = false; // Don't autoplay immediately
            video.muted = false;
            video.loop = false;

            // Let Reveal.js handle video sizing
            section.appendChild(video);

            // Store video reference on section for slide events
            section._video = video;
        }
        
        revealSlides.appendChild(section);
    }
    
    // Initialize Reveal.js with default settings
    if (state.revealInstance) {
        state.revealInstance.destroy();
        state.revealInstance = null;
    }

    state.revealInstance = new Reveal({
        controls: true,
        progress: true,
        center: true,
        hash: false,
        transition: 'slide',
        width: '100%',
        height: '100%',
        margin: 0,
        minScale: 0.1,
        maxScale: 3.0,
        backgroundTransition: 'none'
    });

    await state.revealInstance.initialize();

    // Add slide change event listener
    state.revealInstance.on('slidechanged', (event) => {
        // Pause all videos first
        const allVideos = document.querySelectorAll('#reveal-slides video');
        allVideos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });

        // Auto-play video on current slide if it exists
        const currentSlide = event.currentSlide;
        if (currentSlide && currentSlide._video) {
            // Small delay to ensure slide transition is complete
            setTimeout(() => {
                currentSlide._video.currentTime = 0;
                currentSlide._video.play().catch(e => {
                    console.log('Video autoplay failed:', e);
                });
            }, 500);
        }
    });

    // Auto-play video on first slide if it's a video
    setTimeout(() => {
        const firstSlide = document.querySelector('#reveal-slides section');
        if (firstSlide && firstSlide._video) {
            firstSlide._video.currentTime = 0;
            firstSlide._video.play().catch(e => {
                console.log('Video autoplay failed:', e);
            });
        }
    }, 1000);
    
    // Enter fullscreen after a small delay to ensure everything is loaded
    setTimeout(() => {
        enterFullscreen();
        setupExitHintAndButton();
    }, 100);
}

// Exit presentation
function exitPresentation() {
    // Stop all videos
    const videos = document.querySelectorAll('#reveal-slides video');
    videos.forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    
    document.getElementById('editor-view').style.display = 'flex';
    document.getElementById('presentation-view').style.display = 'none';
    
    // Exit fullscreen
    exitFullscreen();
}

// Listen for ESC key to exit presentation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('presentation-view').style.display === 'block') {
        exitPresentation();
    }
});

// Listen for fullscreen change to exit presentation when fullscreen is exited
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        
        // Fullscreen was exited, check if we're in presentation mode
        if (document.getElementById('presentation-view').style.display === 'block') {
            // Don't auto-exit, just stay in presentation mode without fullscreen
            // User can click Exit Presentation button if they want to leave
        }
    }
}

// Clear all slides
function clearAllSlides() {
    if (state.slides.length === 0) return;
    
    if (confirm('Are you sure you want to clear all slides?')) {
        // Revoke all video URLs
        state.slides.forEach(slide => {
            if (slide.type === 'video') {
                URL.revokeObjectURL(slide.videoUrl);
            }
        });
        
        state.slides = [];
        renderSlides();
    }
}

// Fullscreen utilities
function enterFullscreen() {
    const elem = document.getElementById('presentation-view');
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    }
}

function exitFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement || 
        document.mozFullScreenElement || document.msFullscreenElement) {
        
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }
}

// Setup exit hint and button auto-hide functionality
function setupExitHintAndButton() {
    const exitBtn = document.getElementById('exit-presentation');
    const exitHint = document.getElementById('exit-hint');
    let mouseTimer;

    // Show hint initially, hide after 3 seconds
    setTimeout(() => {
        exitHint.classList.add('hidden');
    }, 3000);

    // Mouse move handler
    function onMouseMove() {
        exitBtn.classList.add('visible');

        // Clear existing timer
        clearTimeout(mouseTimer);

        // Set timer to hide button after 3 seconds of no movement
        mouseTimer = setTimeout(() => {
            exitBtn.classList.remove('visible');
        }, 3000);
    }

    // Add mouse move listener to presentation view
    const presentationView = document.getElementById('presentation-view');
    presentationView.addEventListener('mousemove', onMouseMove);

    // Show button initially
    exitBtn.classList.add('visible');

    // Hide button after 3 seconds initially
    setTimeout(() => {
        exitBtn.classList.remove('visible');
    }, 3000);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}