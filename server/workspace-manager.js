const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class WorkspaceManager {
  constructor() {
    this.workspaceDir = path.join(__dirname, 'workspace');
    this.contractFile = path.join(this.workspaceDir, 'bboard.compact');
  }

  async updateContract(compactCode) {
    try {
      // Write the new compact code to the workspace
      await fs.writeFile(this.contractFile, compactCode, 'utf8');
      console.log(`Contract updated: ${this.contractFile}`);
      return true;
    } catch (error) {
      console.error('Failed to update contract:', error);
      throw error;
    }
  }

  async compile() {
    try {
      console.log('Starting compilation in workspace...');
      
      // Compile the contract using npm run compile (which just compiles, doesn't build)
      const compileResult = await execAsync('npm run compile', {
        cwd: this.workspaceDir,
        timeout: 60000, // 1 minute timeout
        maxBuffer: 1024 * 1024 // 1MB buffer for output
      });

      console.log('Contract compiled successfully');

      // Parse the output to extract function information
      const functions = await this.parseFunctionsFromContract();
      
      return {
        success: true,
        output: compileResult.stdout,
        errors: compileResult.stderr ? [compileResult.stderr] : [],
        contractInfo: {
          functions: Array.isArray(functions) ? functions.map(f => f.name) : []
        },
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Compilation failed:', error);
      
      // Extract detailed error information
      let errorMessages = [];
      if (error.stderr) {
        errorMessages.push(error.stderr);
      }
      if (error.stdout && error.stdout.includes('Exception:')) {
        errorMessages.push(error.stdout);
      }
      if (errorMessages.length === 0) {
        errorMessages.push(error.message);
      }
      
      return {
        success: false,
        output: error.stdout || '',
        errors: errorMessages,
        contractInfo: null,
        timestamp: Date.now()
      };
    }
  }

  async deploy() {
    try {
      console.log('Starting deployment in workspace...');
      
       // First compile the contract
      const compileResult = await execAsync('npm run contract', {
        cwd: this.workspaceDir,
        timeout: 60000, // 1 minute timeout
        maxBuffer: 1024 * 1024 // 1MB buffer for output
      });

      console.log('Contract compiled & built successfully');

      // Then run the CLI with automatic exit
      //const cliResult = await this.runCLIWithAutoExit();

      // Parse the output to extract function information
      //const functions = this.parseFunctionsFromOutput(cliResult.output);
      
      return {
        success: true,
        // output: `Contract Compilation:\n${compileResult.stdout}\n\nDeployment & CLI:\n${cliResult.output}`,
        // errors: cliResult.errors,
        // functions: functions,
      };

    } catch (error) {
      console.error('Deployment failed:', error);
      return {
        success: false,
        output: error.stdout || '',
        errors: [error.stderr || error.message],
        functions: [],
        timestamp: Date.now()
      };
    }
  }

  async runCLIWithAutoExit() {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Run the CLI command
      const cliProcess = spawn('npm', ['run', 'testnet-remote'], {
        cwd: path.join(this.workspaceDir, 'bboard-cli'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errors = [];

      cliProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('CLI Output:', text);

        // Auto-exit when we see the menu
        if (text.includes('Which would you like to do?')) {
          console.log('Auto-exiting CLI...');
          cliProcess.stdin.write('6\n'); // Exit option
        }
      });

      cliProcess.stderr.on('data', (data) => {
        const text = data.toString();
        console.log('CLI Error:', text);
        errors.push(text);
      });

      cliProcess.on('close', (code) => {
        console.log(`CLI process exited with code ${code}`);
        resolve({
          output,
          errors,
          exitCode: code
        });
      });

      cliProcess.on('error', (error) => {
        console.error('CLI process error:', error);
        reject(error);
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        console.log('CLI timeout, killing process...');
        cliProcess.kill();
        resolve({
          output,
          errors: [...errors, 'CLI process timed out'],
          exitCode: -1
        });
      }, 120000);
    });
  }

  parseFunctionsFromOutput(output) {
    const functions = [];
    
    try {
      // Look for function listings in the CLI output
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Look for the menu items like "1. ⚡ Increment (1 param)"
        const menuMatch = line.match(/^\s*\d+\.\s+[⚡📖]\s+(\w+)(\s+\(.*\))?/);
        if (menuMatch) {
          const functionName = menuMatch[1].toLowerCase();
          // Skip non-function items
          if (functionName !== 'exit' && functionName !== 'display') {
            functions.push({
              name: functionName,
              displayName: menuMatch[1],
              description: `Execute ${functionName} function`,
              hasParams: menuMatch[2] && menuMatch[2].includes('param')
            });
          }
        }
      }

      // Also look for detected circuits
      const circuitMatch = output.match(/🔍 Detected circuits:\s*\[\s*([^\]]+)\s*\]/);
      if (circuitMatch && functions.length === 0) {
        const circuits = circuitMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
        circuits.forEach(circuit => {
          functions.push({
            name: circuit,
            displayName: circuit.charAt(0).toUpperCase() + circuit.slice(1),
            description: `Execute ${circuit} circuit`
          });
        });
      }

      // Fallback: parse from the contract file if no functions found in output
      if (functions.length === 0) {
        return this.parseFunctionsFromContract();
      }

      console.log(`Found ${functions.length} functions:`, functions.map(f => f.name));
      return functions;

    } catch (error) {
      console.warn('Error parsing functions from output:', error);
      return this.parseFunctionsFromContract();
    }
  }

  async parseFunctionsFromContract() {
    try {
      if (await fs.pathExists(this.contractFile)) {
        const compactCode = await fs.readFile(this.contractFile, 'utf8');
        const functionMatches = compactCode.match(/export\s+circuit\s+(\w+)/g) || [];
        
        return functionMatches.map(match => {
          const name = match.replace(/export\s+circuit\s+/, '').split('(')[0];
          return {
            name: name,
            displayName: name.charAt(0).toUpperCase() + name.slice(1),
            description: `Execute ${name} function`
          };
        });
      }
      return [];
    } catch (error) {
      console.warn('Error parsing functions from contract:', error);
      return [];
    }
  }

  async executeFunction(functionName, args = []) {
    try {
      console.log(`Executing function: ${functionName} with args:`, args);
      
      // For function execution, we need to run the CLI and automatically select the function
      const cliResult = await this.runCLIWithFunctionSelection(functionName, args);
      
      return {
        success: cliResult.exitCode === 0,
        output: `Function ${functionName} executed:\n${cliResult.output}`,
        errors: cliResult.errors,
        functionName: functionName,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error.message],
        functionName: functionName,
        timestamp: Date.now()
      };
    }
  }

  async runCLIWithFunctionSelection(functionName, args = []) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Run the CLI command
      const cliProcess = spawn('npm', ['run', 'testnet-remote'], {
        cwd: path.join(this.workspaceDir, 'bboard-cli'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errors = [];
      let menuShown = false;

      cliProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('CLI Output:', text);

        // When we see the menu, select the function
        if (text.includes('Which would you like to do?') && !menuShown) {
          menuShown = true;
          console.log(`Auto-selecting function: ${functionName}`);
          
          // Find the function number in the menu
          const lines = output.split('\n');
          let functionNumber = null;
          
          for (const line of lines) {
            const match = line.match(/^\s*(\d+)\.\s+[⚡📖]\s+(\w+)/);
            if (match && match[2].toLowerCase() === functionName.toLowerCase()) {
              functionNumber = match[1];
              break;
            }
          }
          
          if (functionNumber) {
            console.log(`Selecting option ${functionNumber} for ${functionName}`);
            cliProcess.stdin.write(`${functionNumber}\n`);
            
            // If the function needs parameters, provide them
            if (args.length > 0) {
              setTimeout(() => {
                args.forEach(arg => {
                  console.log(`Sending argument: ${arg}`);
                  cliProcess.stdin.write(`${arg}\n`);
                });
              }, 1000);
            }
            
            // Exit after execution
            setTimeout(() => {
              console.log('Auto-exiting CLI...');
              cliProcess.stdin.write('6\n'); // Exit option
            }, 3000);
          } else {
            console.log(`Function ${functionName} not found in menu, exiting...`);
            cliProcess.stdin.write('6\n'); // Exit option
          }
        }
      });

      cliProcess.stderr.on('data', (data) => {
        const text = data.toString();
        console.log('CLI Error:', text);
        errors.push(text);
      });

      cliProcess.on('close', (code) => {
        console.log(`CLI process exited with code ${code}`);
        resolve({
          output,
          errors,
          exitCode: code
        });
      });

      cliProcess.on('error', (error) => {
        console.error('CLI process error:', error);
        reject(error);
      });

      // Timeout after 3 minutes
      setTimeout(() => {
        console.log('CLI timeout, killing process...');
        cliProcess.kill();
        resolve({
          output,
          errors: [...errors, 'CLI process timed out'],
          exitCode: -1
        });
      }, 180000);
    });
  }

  getExampleContracts() {
    return {
      bboard: `
pragma language_version >= 0.16 && <= 0.17;

import CompactStandardLibrary;

export enum State {
  VACANT,
  OCCUPIED
}

export ledger state: State;

export ledger message: Maybe<Opaque<"string">>;

export ledger sequence: Counter;

export ledger owner: Bytes<32>;

constructor() {
  state = State.VACANT;
  message = none<Opaque<"string">>();
  sequence.increment(1);
}

witness localSecretKey(): Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Attempted to post to an occupied board");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}

export circuit takeDown(): Opaque<"string"> {
  assert(state == State.OCCUPIED, "Attempted to take down post from an empty board");
  assert(owner == publicKey(localSecretKey(), sequence as Field as Bytes<32>), "Attempted to take down post, but not the current owner");
  const formerMsg = message.value;
  state = State.VACANT;
  sequence.increment(1);
  message = none<Opaque<"string">>();
  return formerMsg;
}

export circuit publicKey(sk: Bytes<32>, sequence: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<3, Bytes<32>>>([pad(32, "bboard:pk:"), sequence, sk]);
}`,

      counter: `pragma language_version 0.17;
import CompactStandardLibrary;

export ledger count: Counter;

export circuit increment(value: Uint<16>): [] {
  count.increment(disclose(value));
}

export circuit decrement(value: Uint<16>): [] {
  count.decrement(disclose(value));
}

export circuit get_count(): Uint<64> {
  return count;
}`
    };
  }
}

module.exports = { WorkspaceManager };
