const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;
let ytMusic; // Declare ytMusic globally

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        frame: true,
    });

    // Load the loader HTML file
    win.loadFile('loader.html').catch(err => {
        console.error('Failed to load loader.html:', err);
    });

    // Load YouTube Music in the background
    ytMusic = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    ytMusic.loadURL('https://music.youtube.com').catch(err => {
        console.error('Failed to load YouTube Music:', err);
    });

    // When YouTube Music is loaded, switch to it
    ytMusic.webContents.on('did-finish-load', () => {
        console.log('YouTube Music loaded successfully');

        // Execute script to find and click the play/pause button
        ytMusic.webContents.executeJavaScript(`
            const playPauseButton = document.querySelector('#play-pause-button');
            if (playPauseButton) {
                console.log('Play/Pause button found:', playPauseButton);
                playPauseButton.click();
                console.log('Play/Pause button clicked');
            } else {
                console.error('Play/Pause button not found');
            }
        `).then(() => {
            // Load YouTube Music in the main window after executing the script
            win.loadURL('https://music.youtube.com').catch(err => {
                console.error('Failed to load YouTube Music in main window:', err);
            });

            // Optionally close the ytMusic window if not needed
            ytMusic.close(); // You can keep this if you want to close ytMusic after clicking
        }).catch(err => {
            console.error('Error executing script:', err);
        });
    });

    // Handle window close event
    win.on('close', (event) => {
        console.log('Main window close event triggered');

        // Prevent the window from closing immediately
        event.preventDefault();

        // Pause playback and close ytMusic before the main window closes
        if (ytMusic && !ytMusic.isDestroyed()) {
            ytMusic.webContents.executeJavaScript(`
                const playPauseButton = document.getElementById('play-pause-button');
                if (playPauseButton) {
                    console.log("Play-pause button found.");
                    playPauseButton.click(); // Click the play-pause button
                } else {
                    console.error("Play-pause button not found.");
                }
            `).then(() => {
                // After pausing the music, close the ytMusic window
                ytMusic.close();

                // Now close the main window
                win.destroy();
            }).catch(err => {
                console.error('Error executing script to pause music:', err);
                win.destroy(); // Close the main window even if there was an error
            });
        } else {
            win.destroy(); // Close the main window if ytMusic is not present
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (process.platform !== 'darwin') {
        console.log('Quitting app');
        app.quit();
    }
});
