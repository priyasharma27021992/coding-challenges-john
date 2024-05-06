import * as readline from 'readline';
import { stdin, stdout } from 'process';
import { ChildProcessWithoutNullStreams } from 'child_process';

// // Using the readline package to get input from the user
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
