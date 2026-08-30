import * as vscode from 'vscode';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

let timer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;

let musicProcess: ChildProcess | undefined;

let isPaused = false;
let remainingTotalSeconds = 0;
let currentSessionSeconds = 0;
let focusSecondsCompleted = 0;

const focusDurationMinutes = 50;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cafe Pomodoro is active');

    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );

    statusBarItem.command = 'cafe-pomodoro.startTimer';
    statusBarItem.text = '☕ Cafe Pomodoro (Click to Start)';
    statusBarItem.show();

    const startDisposable = vscode.commands.registerCommand(
        'cafe-pomodoro.startTimer',
        async () => {
            if (timer) {
                vscode.window.showWarningMessage(
                    'A study session is already running. Use Pause or Stop first.'
                );
                return;
            }

            const input = await vscode.window.showInputBox({
                prompt: 'How many total hours would you like to study?',
                placeHolder: 'e.g., 1, 1.5, 2',
                validateInput: (value) => {
                    const hours = Number(value);

                    if (!value || Number.isNaN(hours) || hours <= 0 || hours > 5) {
                        return 'Enter a valid number between 1 and 5 hours.';
                    }

                    return undefined;
                }
            });

            if (!input) {
                return;
            }

            const hours = Number(input);

            remainingTotalSeconds = Math.round(hours * 60 * 60);
            currentSessionSeconds = Math.min(
                focusDurationMinutes * 60,
                remainingTotalSeconds
            );

            focusSecondsCompleted = 0;
            isPaused = false;

            vscode.window.showInformationMessage(
                'Study session started! Playing music.'
            );

            playMusic(context);
            startTimer(context);
        }
    );

    const stopDisposable = vscode.commands.registerCommand(
        'cafe-pomodoro.stopTimer',
        async () => {
            await stopSession(context, true);

            vscode.window.showInformationMessage(
                'Session and music stopped.'
            );
        }
    );

    const pauseDisposable = vscode.commands.registerCommand(
        'cafe-pomodoro.pauseTimer',
        () => {
            if (!timer) {
                vscode.window.showWarningMessage(
                    'No active study session to pause.'
                );
                return;
            }

            isPaused = !isPaused;

            if (isPaused) {
                stopMusic();
                updateStatusBar();

                vscode.window.showInformationMessage(
                    'Session paused. Music stopped.'
                );
            } else {
                playMusic(context);
                updateStatusBar();

                vscode.window.showInformationMessage(
                    'Session resumed. Music started.'
                );
            }
        }
    );

    const statsDisposable = vscode.commands.registerCommand(
        'cafe-pomodoro.viewStats',
        () => {
            const totalMinutesFocused = context.globalState.get<number>(
                'totalMinutesFocused',
                0
            );

            vscode.window.showInformationMessage(
                `📊 Total Focus Time: ${totalMinutesFocused} minutes`,
                { modal: true }
            );
        }
    );

    context.subscriptions.push(
        statusBarItem,
        startDisposable,
        stopDisposable,
        pauseDisposable,
        statsDisposable
    );
}

function startTimer(context: vscode.ExtensionContext) {
    if (timer) {
        clearInterval(timer);
    }

    updateStatusBar();

    timer = setInterval(() => {
        if (isPaused) {
            return;
        }

        currentSessionSeconds--;
        remainingTotalSeconds--;
        focusSecondsCompleted++;

        updateStatusBar();

        if (remainingTotalSeconds <= 0) {
            void completeSession(context);
            return;
        }

        if (currentSessionSeconds <= 0) {
            void startBreak(context);
        }
    }, 1000);
}

async function startBreak(context: vscode.ExtensionContext) {
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }

    stopMusic();
    statusBarItem.text = '🌿 Break Time';

    await saveFocusedTime(context);

    const answer = await vscode.window.showInformationMessage(
        'Break time! Click "I am ready" when you want to focus again.',
        { modal: true },
        'I am ready'
    );

    if (answer !== 'I am ready' || remainingTotalSeconds <= 0) {
        return;
    }

    currentSessionSeconds = Math.min(
        focusDurationMinutes * 60,
        remainingTotalSeconds
    );

    isPaused = false;

    playMusic(context);
    startTimer(context);
}

async function completeSession(context: vscode.ExtensionContext) {
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }

    stopMusic();
    await saveFocusedTime(context);

    remainingTotalSeconds = 0;
    currentSessionSeconds = 0;
    isPaused = false;

    statusBarItem.text = '☕ Session Complete!';

    vscode.window.showInformationMessage(
        'Great job! Goal completed.'
    );
}

async function stopSession(
    context: vscode.ExtensionContext,
    saveProgress: boolean
) {
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }

    stopMusic();

    if (saveProgress) {
        await saveFocusedTime(context);
    }

    isPaused = false;
    remainingTotalSeconds = 0;
    currentSessionSeconds = 0;
    focusSecondsCompleted = 0;

    statusBarItem.text = '☕ Cafe Pomodoro (Click to Start)';
}

async function saveFocusedTime(context: vscode.ExtensionContext) {
    const completedMinutes = Math.floor(focusSecondsCompleted / 60);

    if (completedMinutes <= 0) {
        return;
    }

    const storedMinutes = context.globalState.get<number>(
        'totalMinutesFocused',
        0
    );

    await context.globalState.update(
        'totalMinutesFocused',
        storedMinutes + completedMinutes
    );

    focusSecondsCompleted %= 60;
}

function updateStatusBar() {
    const minutes = Math.floor(currentSessionSeconds / 60);
    const seconds = currentSessionSeconds % 60;
    const icon = isPaused ? '⏸️' : '☕';

    statusBarItem.text =
        `${icon} ${String(minutes).padStart(2, '0')}:` +
        `${String(seconds).padStart(2, '0')} | Focus`;
}

function playMusic(context: vscode.ExtensionContext) {
    if (process.platform !== 'win32') {
        vscode.window.showWarningMessage(
            'Background music currently works only on Windows.'
        );
        return;
    }

    // Do nothing if music is already playing.
    // This is what prevents overlapping tracks.
    if (musicProcess && !musicProcess.killed) {
        return;
    }

    const musicPath = path.join(context.extensionPath, 'classical.mp3');
    const safeMusicPath = musicPath.replace(/'/g, "''");

    const powerShellScript = `
Add-Type -AssemblyName PresentationCore

$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([System.Uri]'${safeMusicPath}')
$player.Volume = 0.35
$player.Play()

while ($true) {
    Start-Sleep -Seconds 1
}
`;

    musicProcess = spawn(
        'powershell.exe',
        [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            powerShellScript
        ],
        {
            windowsHide: true
        }
    );

    musicProcess.on('error', (error) => {
        console.error('Could not start music:', error);

        musicProcess = undefined;

        vscode.window.showWarningMessage(
            'Could not start music. Check that classical.mp3 is in the project root folder.'
        );
    });

    musicProcess.on('exit', () => {
        musicProcess = undefined;
    });
}

function stopMusic() {
    if (!musicProcess) {
        return;
    }

    try {
        if (!musicProcess.killed) {
            musicProcess.kill();
        }
    } catch (error) {
        console.error('Could not stop music:', error);
    }

    musicProcess = undefined;
}

export function deactivate() {
    if (timer) {
        clearInterval(timer);
    }

    stopMusic();
}