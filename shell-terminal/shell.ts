import * as readline from 'readline';
import { stdin, stdout } from 'process';
import { ChildProcessWithoutNullStreams } from 'child_process';

// Storing History in a list
const history = new Array<string>();

// Using the readline package to get input from the user
const rl = readline.createInterface({ input: stdin, output: stdout });

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
    }
  }
}

function handleInput(input: string) {
  childProcess = processCommand(input);
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
