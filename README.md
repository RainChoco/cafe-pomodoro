# Cafe Pomodoro ☕

A cozy cafe-themed Pomodoro timer extension for Visual Studio Code. It helps developers stay focused with structured 50-minute focus sessions, mindful break prompts, background classical music, and persistent focus-time statistics.

## Features

- **Custom study goals:** Start a study goal from 1 to 5 hours directly from VS Code.

- **50-minute focus sessions:** Your study goal is split into 50-minute focus blocks. If your remaining goal is shorter than 50 minutes, the final focus block automatically uses the remaining time.

- **Background classical music:** Plays `classical.mp3` while you are in a focus session. Music stops when you pause, take a break, stop the session, complete your goal, or close/deactivate the extension.

- **No overlapping music:** The extension prevents multiple copies of the music from playing at the same time when you pause and resume.

- **Pause and resume:** Pause the focus timer and stop the music, then resume your study session when you are ready.

- **Mindful break reminder:** After each completed 50-minute focus block, a modal break message appears. Click **I am ready** to start the next focus block.

- **Status bar timer:** See your current focus countdown in the VS Code status bar.

- **Persistent focus statistics:** Tracks completed focus minutes using VS Code global storage. Your total remains available after restarting VS Code.

- **Stop session anytime:** Stop an active session at any time. Completed whole minutes from that session are saved to your total focus statistics.

## Requirements

- Visual Studio Code version `1.125.0` or higher.
- Windows is required for background music playback in the current version.
- A file named `classical.mp3` must be placed in the extension project root folder, beside `package.json`.

Your project structure should look like this:

```text
cafe-pomodoro/
├── classical.mp3
├── package.json
├── src/
│   └── extension.ts
├── out/
│   └── extension.js
└── images/
    └── Cafe-Pomodoro.png
```

## Installation

### Install from a VSIX file

1. Download the Cafe Pomodoro `.vsix` extension package.
2. Open Visual Studio Code.
3. Open the Extensions view with `Ctrl+Shift+X`.
4. Click the `...` menu at the top-right of the Extensions view.
5. Choose **Install from VSIX...**.
6. Select the downloaded Cafe Pomodoro `.vsix` file.
7. Reload Visual Studio Code if prompted.

### Run during development

1. Open the `cafe-pomodoro` project folder in VS Code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile the extension:

   ```bash
   npm run compile
   ```

4. Press `F5` to launch an **Extension Development Host** window.
5. In the new window, open the Command Palette and run **Cafe Pomodoro: Start Timer**.

## Usage

### Start a focus session

1. Click the **☕ Cafe Pomodoro (Click to Start)** item in the bottom-right status bar.

   Or open the Command Palette with `Ctrl+Shift+P` and run:

   ```text
   Cafe Pomodoro: Start Timer
   ```

2. Enter a study goal between 1 and 5 hours.

   Examples:

   ```text
   1
   1.5
   2
   ```

3. Press Enter.

4. The status bar shows the current focus countdown and background music begins.

### Pause or resume

1. Open the Command Palette with `Ctrl+Shift+P`.
2. Run:

   ```text
   Cafe Pomodoro: Pause / Resume Timer
   ```

3. When paused:
   - The countdown stops.
   - Background music stops.
   - The status bar shows a pause icon.

4. Run the same command again to resume:
   - The countdown continues.
   - Music starts again.
   - Only one music track will play at a time.

### Take a break

After every 50-minute focus block:

1. The music stops.
2. A modal **Break time** message appears.
3. Take a proper break, stretch, drink water, or make coffee.
4. Click **I am ready** when you want to continue.
5. A new focus block begins if time remains in your overall study goal.

### Stop a session

To end your study session before your goal is complete:

1. Open the Command Palette with `Ctrl+Shift+P`.
2. Run:

   ```text
   Cafe Pomodoro: Stop Session
   ```

The timer and music stop. Any completed whole focus minutes are added to your saved total.

### View focus statistics

1. Open the Command Palette with `Ctrl+Shift+P`.
2. Run:

   ```text
   Cafe Pomodoro: View Daily Stats
   ```

A message shows your accumulated total focus time in minutes.

> Note: The current version stores an overall accumulated total. It does not reset automatically every day.

## Commands

| Command | Description |
|---|---|
| `Cafe Pomodoro: Start Timer` | Set a 1–5 hour study goal and begin a focus session |
| `Cafe Pomodoro: Pause / Resume Timer` | Pause or resume the active focus timer |
| `Cafe Pomodoro: Stop Session` | Stop the active session and save completed focus minutes |
| `Cafe Pomodoro: View Daily Stats` | View accumulated completed focus minutes |

## Notes

- Each focus block lasts up to 50 minutes.
- The current break system waits for you to click **I am ready**; it does not include an automatic 10-minute break countdown.
- Music restarts from the beginning after a pause or break in the current version.
- Background music playback is currently implemented for Windows.
- Ensure `classical.mp3` exists in the extension root folder before starting a session.

## Enjoy! 🌿

Created by Zheng Hong