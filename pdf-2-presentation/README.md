# Presentation Builder App

A modern web-based presentation builder that allows you to create presentations by combining PDF pages and MP4 videos. Built with reveal.js, PDF.js, and vanilla JavaScript.

## Features

- **Dual Panel Interface**: Slides preview on the left, drop zones on the right
- **PDF Support**: Upload PDF files - each page becomes a separate slide
- **Video Support**: Upload MP4 videos as individual slides
- **Drag & Drop**: Reorder slides by dragging them
- **Sortable Slides**: Easily rearrange your presentation order
- **Fullscreen Presentation**: Present in fullscreen mode with reveal.js
- **Clean Architecture**: External JavaScript for easy maintenance

## Files Structure

```
├── index.html      # Main HTML file
├── styles.css      # All styling
├── app.js          # Application logic
└── README.md       # This file
```

## Deployment to GitHub Pages

### Option 1: Direct Upload

1. Create a new repository on GitHub
2. Upload these files: `index.html`, `styles.css`, `app.js`
3. Go to repository Settings → Pages
4. Under "Source", select "main" branch and "/ (root)" folder
5. Click Save
6. Your app will be available at `https://yourusername.github.io/repository-name/`

### Option 2: Using Git

```bash
# Initialize git repository
git init

# Add files
git add index.html styles.css app.js README.md

# Commit
git commit -m "Initial commit: Presentation Builder App"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push to GitHub
git branch -M main
git push -u origin main

# Enable GitHub Pages
# Go to Settings → Pages → Select main branch → Save
```

## Usage

### Adding Content

1. **Add PDF Files**: 
   - Drag and drop a PDF file into the "Drop PDF file here" zone, or click to browse
   - Each page of the PDF will be added as a separate slide

2. **Add Videos**: 
   - Drag and drop an MP4 file into the "Drop MP4 file here" zone, or click to browse
   - The video will be added as a single slide with controls

### Organizing Slides

- **Reorder**: Click and drag any slide preview to reorder
- **Delete**: Click the "×" button on any slide to remove it
- **Clear All**: Click "Clear All" button to remove all slides

### Presenting

1. Click the "Present" button when ready
2. The presentation will enter fullscreen mode
3. Use arrow keys or on-screen controls to navigate
4. Click "Exit Presentation" or press ESC to return to editing mode

## Keyboard Shortcuts (During Presentation)

- **Arrow Keys**: Navigate between slides
- **Space**: Next slide
- **Shift + Space**: Previous slide
- **ESC**: Exit fullscreen
- **F**: Toggle fullscreen

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Opera: ✅ Full support

## Dependencies (Loaded via CDN)

- **reveal.js** (v4.5.0): Presentation framework
- **PDF.js** (v3.11.174): PDF rendering
- **Sortable.js** (v1.15.0): Drag and drop sorting

## Technical Details

### File Size Limits

Browser-dependent, typically:
- PDFs: Up to 100MB
- Videos: Up to 500MB

Note: Large files are stored in browser memory, so performance may vary.

### Local Storage

Currently, presentations are not saved. All data is lost on page refresh. For persistent storage, you can extend the app to save slides data to localStorage or a backend service.

## Future Enhancements

Potential features to add:

- Save/Load presentations
- Export to PDF
- Add text slides
- Theme customization
- Slide transitions
- Speaker notes
- Timer/clock display
- Remote control support

## License

MIT License - Feel free to use and modify for your projects.

## Credits

Built with:
- [reveal.js](https://revealjs.com/) - HTML Presentation Framework
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Sortable.js](https://sortablejs.github.io/Sortable/) - Drag and drop library
