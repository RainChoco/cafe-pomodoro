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

    // 1. Command to start the timer & goal
    let startDisposable = vscode.commands.registerCommand('cafe-pomodoro.startTimer', async () => {
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

    // 2. Command to view daily stats dashboard notification
    let statsDisposable = vscode.commands.registerCommand('cafe-pomodoro.viewStats', () => {
        // Retrieve stored total focused minutes (default to 0 if none)
        const totalMinutesFocused: number = context.globalState.get('totalMinutesFocused', 0);
        const totalHours = (totalMinutesFocused / 60).toFixed(1);

        vscode.window.showInformationMessage(
            `📊 Cafe Pomodoro Dashboard:\n• Total Focus Time: ${totalMinutesFocused} minutes (~${totalHours} hours)`,
            { modal: true }
        );
    });

    context.subscriptions.push(startDisposable, statsDisposable);
}

function startSmartSession(totalMinutes: number, context: vscode.ExtensionContext) {
    if (timer) clearInterval(timer);

    let remainingTotalMinutes = totalMinutes;
    const focusDuration = 50; 
    let isBreak = false;
    let currentSessionSeconds = focusDuration * 60;

    vscode.window.showInformationMessage(`☕ Study session started for ${totalMinutes / 60} hour(s)! Enjoy your classical music.`);
    playClassicalMusic(context);

    let musicTimerSeconds = 0;
    const songLengthSeconds = 121; 

    timer = setInterval(async () => {
        if (remainingTotalMinutes <= 0) {
            if (timer) clearInterval(timer);
            statusBarItem.text = '☕ Study Session Complete!';
            
            // --- STATS TRACKING UPDATE ---
            // Add the completed minutes to globalState storage
            const currentStored = context.globalState.get('totalMinutesFocused', 0) as number;
            const updatedTotal = currentStored + totalMinutes;
            await context.globalState.update('totalMinutesFocused', updatedTotal);

            vscode.window.showInformationMessage(`Amazing job! You finished your goal and added ${totalMinutes} mins to your daily stats.`);
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
                musicTimerSeconds = 0; 
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

            if (musicTimerSeconds >= songLengthSeconds) {
                playClassicalMusic(context);
                musicTimerSeconds = 0;
            }

            const minutes = Math.floor(currentSessionSeconds / 60);
            const seconds = currentSessionSeconds % 60;
            statusBarItem.text = `☕ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} | Focus`;
        }
    }, 1000);
}

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