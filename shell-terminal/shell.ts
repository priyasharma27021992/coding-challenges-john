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

// write history
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

/**
 * This function processes the given piped commands
 * It creates multiple processes and pipes the output of the first process
 * to the input of the subsequent process
 * @param {string} input
 * @returns {ChildProcessWithoutNullStreams | null}
 */

function processPipedCommand(
  input: string,
): ChildProcessWithoutNullStreams | null {
  // Break the input into commands
  const commands = input.split('|');

  // This array will store all the processes
  const processes = new Array<ChildProcessWithoutNullStreams>();

  try {
    // Initialize the first process
    const input0Arr = commands[0].trim().split(' ');
    const command0 = input0Arr[0];
    const args0 = input0Arr.slice(1, input0Arr.length);
    processes.push(spawn(command0, args0));

    for (let i = 1; i < commands.length; i++) {
      // Create a new processes based on the command
      const inputI = commands[i].trim().split(' ');

      // If no command is provided between 2 pipes
      if (inputI.length === 0) {
        stderr.write('No such file or diretory(os error 2)\n');
        return null;
      }

      const commandI = inputI[0];
      const argsI = inputI.slice(1, inputI.length);

      const pi = spawn(commandI, argsI);

      // Pipe the output of the previous process
      processes[i - 1].stdout.pipe(pi.stdin);

      // Push the new process into the array
      processes.push(pi);

      // Handle errors in the processes except the last one
      processes[i - 1].on('error', () => {
        stderr.write('No such file or directory(os error 2)\n');
      });

      processes[i - 1].stderr.on('data', (data) => {
        stderr.write(data.toString());
      });
    }

    // Return the last one
    return processes[processes.length - 1];
  } catch (err) {
    stderr.write('No such file or directory(os error 2)\n');
  }

  return null;
}

/**
 * Checks if the given command from the user in a piped command or not
 *
 * @param {string} input
 * @returns {boolean}
 */
function checkIfPipeCommand(input: string): boolean {
  return input.indexOf('|') > 0;
}

// Handle when the user sends CTRL + C
process.on('SIGINT', () => {
  // If a child process is connected then kill it
  if (childProcess && childProcess.connected) {
    childProcess.kill('SIGINT');
    return;
  }

  // Otherwise write the history back to disk and exit
  writeHistory();
  process.exit(0);
});

/*
 * This function takes in the input command and creates a child process
 *  It attaches listeners to the stdout and stderr of the child process
 * @param {string} input
 */
function handleInput(input: string) {
  if (checkIfPipeCommand(input)) {
    childProcess = processPipedCommand(input);
  } else {
    childProcess = processCommand(input);
  }

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
