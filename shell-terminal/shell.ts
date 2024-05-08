import * as readline from 'readline';
import { stderr, stdin, stdout, cwd, chdir } from 'process';
import {
  ChildProcess,
  ChildProcessWithoutNullStreams,
  spawn,
} from 'child_process';
import fs from 'fs';
import { homedir } from 'os';
import path from 'path';

// Storing History in a list
const HISTORY_FILE_PATH = path.join(homedir(), '.ccsh_history');
const history = new Array<string>();
const capacity = 1000;

// Using the readline package to get input from the user
const rl = readline.createInterface({ input: stdin, output: stdout });

let childProcess: ChildProcessWithoutNullStreams | null;

// handle when user send CTRL + C
process.on('SIGINT', () => {
  if (childProcess && childProcess.connected) {
    childProcess.kill('SIGINT');
    return;
  }

  writeHistory();
  process.exit(0);
});

function addToHistory(input: string) {
  if (history.length === capacity) {
    history.splice(0, 1);
  }
  history.push(input);
}

function writeHistory() {
  fs.writeFileSync(HISTORY_FILE_PATH, history.join('\n'));
}

function processCommand(input: string): ChildProcessWithoutNullStreams | null {
  const inputArr = input.split(' ');

  // the first word is command
  const command = inputArr[0];

  // The rest of the data is args to the command
  const args = inputArr.splice(1, inputArr.length);

  switch (command) {
    case '': {
      return null;
    }
    case 'history': {
      stdout.write(history.join('\n') + '\n');
      return null;
    }
    case 'pwd': {
      addToHistory(input);
      stdout.write(cwd() + '\n');
      return null;
    }
    case 'cd': {
      try {
        // Calling the inbuilt chdir of the process
        // since cd and pwd are built into the command line
        chdir(args[0] ?? '');
        addToHistory(input);
      } catch (e) {
        if (e instanceof Error) {
          stdout.write('No such file or directory ' + args[0] + '\n');
        }
      }
      return null;
    }
    case 'exit': {
      // Write history data back to file and exit the process
      writeHistory();
      return process.exit(0);
    }
    default: {
      try {
        const newProcess = spawn(command, args);
        return newProcess;
      } catch (e) {
        stderr.write('No such file or directory (os error 2)\n');
      }
      return null;
    }
  }
}

function handleInput(input: string) {
  childProcess = processCommand(input);

  if (childProcess != null) {
    childProcess.on('close', (code, signal) => {
      if (signal === null && code === 0) {
        addToHistory(input);
      }
      promptUser();
    });

    childProcess.stdout.on('data', async (data) => {
      stdout.write(data.toString());
    });

    childProcess.stderr.on('data', async (data) => {
      stderr.write(data.toString());
    });

    childProcess.on('error', () => {
      stderr.write('No such file or directory (os error 2)\n');
    });
  } else {
    promptUser();
  }
}

/**
 * Prompts user with ccsh> as prefix
 * After the user provides the input (ENTER key is pressed)
 * it calls {@link handleInput} function.
 */
function promptUser() {
  rl.question('ccsh>', (input) => {
    const cleanedInput = input.trim();
    handleInput(cleanedInput);
  });
}

// Entry point of the program
promptUser();
