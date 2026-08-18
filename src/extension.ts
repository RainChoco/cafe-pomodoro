import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Cafe Pomodoro is now active!');

    // 1. Create a Status Bar Item on the right side (alignment: Right, priority: 100)
    let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cafe-pomodoro.startTimer';
    statusBarItem.text = '$(coffee) Cafe Pomodoro';
    statusBarItem.tooltip = 'Click to start your Cafe Pomodoro timer';
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);

    // 2. Register the command to start the timer
    let disposable = vscode.commands.registerCommand('cafe-pomodoro.startTimer', () => {
        vscode.window.showInformationMessage('☕ Cafe Pomodoro started! Focus for 25 minutes.');

        // Update status bar text to show it's running
        statusBarItem.text = '$(clock) Focus Time...';

        // 5-second test timer (change to 25 * 60 * 1000 for real life)
        setTimeout(() => {
            statusBarItem.text = '$(coffee) Break Time!';
            
            vscode.window.showInformationMessage(
                'Time for a virtual coffee break! Take a sip. ☕🌿',
                'Take Break',
                'Skip'
            ).then(selection => {
                if (selection === 'Take Break') {
                    vscode.window.showInformationMessage('Enjoy your relaxing 5-minute break!');
                }
                // Reset status bar text after choice
                statusBarItem.text = '$(coffee) Cafe Pomodoro';
            });
        }, 5000); 
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}