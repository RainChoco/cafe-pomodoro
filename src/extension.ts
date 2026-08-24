import * as vscode from 'vscode';
import * as path from 'path';
const sound = require('sound-play');

let timer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cafe Pomodoro is now active!');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cafe-pomodoro.startTimer';
    context.subscriptions.push(statusBarItem);

    statusBarItem.text = '☕ Cafe Pomodoro (Click to Start)';
    statusBarItem.show();

    let disposable = vscode.commands.registerCommand('cafe-pomodoro.startTimer', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'How many total hours would you like to study?',
            placeHolder: 'e.g., 1, 2, 3 (Max 5)'
        });

        if (!input) return;

        const hours = parseFloat(input);
        if (isNaN(hours) || hours <= 0 || hours > 5) {
            vscode.window.showErrorMessage('Please enter a valid number between 1 and 5 hours.');
            return;
        }

        const totalMins = Math.round(hours * 60);
        startSmartSession(totalMins, context);
    });

    context.subscriptions.push(disposable);
}

function startSmartSession(totalMinutes: number, context: vscode.ExtensionContext) {
    if (timer) clearInterval(timer);

    let remainingTotalMinutes = totalMinutes;
    const focusDuration = 50; 
    const breakDuration = 10;  

    let isBreak = false;
    let currentSessionSeconds = focusDuration * 60;

    vscode.window.showInformationMessage(`☕ Study session started for ${totalMinutes / 60} hour(s)! Enjoy your classical music.`);

    // Play classical music when focus starts
    playClassicalMusic(context);

    // Track how many seconds have passed to loop the music if it's a 2+ hour session
    let musicTimerSeconds = 0;
    const songLengthSeconds = 121; // Since your classical.mp3 is 2 minutes and 1 seconds (121 seconds)

    timer = setInterval(async () => {
        if (remainingTotalMinutes <= 0) {
            if (timer) clearInterval(timer);
            statusBarItem.text = '☕ Study Session Complete!';
            vscode.window.showInformationMessage('Amazing job! You finished your entire goal.');
            return;
        }

        if (currentSessionSeconds <= 0) {
            isBreak = !isBreak;
            
            if (isBreak) {
                if (timer) clearInterval(timer);
                statusBarItem.text = '🌿 Break Time';

                let userAcknowledged = false;
                while (!userAcknowledged) {
                    const selection = await vscode.window.showInformationMessage(
                        '🌿 Break time! Click below to return to focus.',
                        { modal: true },
                        'I am ready to focus!'
                    );
                    
                    if (selection) {
                        userAcknowledged = true;
                    }
                }

                isBreak = false;
                currentSessionSeconds = focusDuration * 60;
                musicTimerSeconds = 0; // Reset music loop tracker
                
                // Play music again for the next focus block
                playClassicalMusic(context);

                startSmartSession(remainingTotalMinutes, context);
                return;

            } else {
                remainingTotalMinutes -= focusDuration;
                currentSessionSeconds = focusDuration * 60;
            }
        }

        if (!isBreak) {
            currentSessionSeconds--;
            musicTimerSeconds++;

            // If your song reaches the end (121 seconds), replay it automatically!
            if (musicTimerSeconds >= songLengthSeconds) {
                playClassicalMusic(context);
                musicTimerSeconds = 0; // Reset counter for the next loop
            }

            const minutes = Math.floor(currentSessionSeconds / 60);
            const seconds = currentSessionSeconds % 60;

            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(seconds).padStart(2, '0');

            statusBarItem.text = `☕ ${formattedMinutes}:${formattedSeconds} | Focus`;
        }
    }, 1000);
}

// Helper function to play the music cleanly
function playClassicalMusic(context: vscode.ExtensionContext) {
    try {
        const musicPath = path.join(context.extensionPath, 'classical.mp3');
        sound.play(musicPath);
    } catch (err) {
        console.log("Could not play music:", err);
    }
}

export function deactivate() {
    if (timer) clearInterval(timer);
}