const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CompactCompiler {
  constructor() {
    this.workspaceDir = path.join(__dirname, 'workspace');
    this.tempProjectDir = path.join(this.workspaceDir, 'temp-project');
  }

  async compile(compactCode, options = {}) {
    try {
      // Ensure workspace directory exists
      await fs.ensureDir(this.workspaceDir);
      
      // Clean up any existing temp project
      if (await fs.pathExists(this.tempProjectDir)) {
        await fs.remove(this.tempProjectDir);
      }

      // Create a new temp project using create-midnight-app
      await this.createMidnightProject();
      
      // Write the compact code to the project
      await this.writeCompactCode(compactCode);
      
      // Compile the contract
      const compileResult = await this.compileContract();
      
      // If compilation successful and user wants to run, execute the CLI
      let executionResult = null;
      if (compileResult.success && options.execute) {
        executionResult = await this.executeContract(options.functionCall);
      }
      
      return {
        success: compileResult.success,
        output: compileResult.output,
        errors: compileResult.errors,
        executionResult,
        contractInfo: await this.getContractInfo(),
        timestamp: Date.now()
      };
      
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error.message],
        executionResult: null,
        contractInfo: null,
        timestamp: Date.now()
      };
    }
  }

  async createMidnightProject() {
    try {
      // Use npx to create a new midnight app
      const { stdout, stderr } = await execAsync(
        `npx create-midnight-app@latest temp-project`,
        { 
          cwd: this.workspaceDir,
          timeout: 60000 // 60 second timeout
        }
      );
      
      console.log('Create Midnight App Output:', stdout);
      if (stderr) console.warn('Create Midnight App Warnings:', stderr);
      
      return { success: true, output: stdout };
    } catch (error) {
      console.error('Failed to create Midnight project:', error);
      throw new Error(`Failed to create Midnight project: ${error.message}`);
    }
  }

  async writeCompactCode(compactCode) {
    // Find the main compact file in the project (usually ends with .compact)
    const contractFile = path.join(this.tempProjectDir, 'my-contract.compact');
    
    // Write the compact code
    await fs.writeFile(contractFile, compactCode, 'utf8');
    
    console.log(`Compact code written to: ${contractFile}`);
  }

  async compileContract() {
    try {
      // Run the build command from create-midnight-app
      const { stdout, stderr } = await execAsync(
        'npm run build',
        { 
          cwd: this.tempProjectDir,
          timeout: 120000 // 2 minute timeout for compilation
        }
      );
      
      return {
        success: true,
        output: stdout,
        errors: stderr ? [stderr] : []
      };
      
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        errors: [error.stderr || error.message]
      };
    }
  }

  async executeContract(functionCall) {
    if (!functionCall) return null;
    
    try {
      // Run the CLI with the specified function
      const { stdout, stderr } = await execAsync(
        `npm run cli -- --function ${functionCall.function} ${functionCall.args ? `--args '${JSON.stringify(functionCall.args)}'` : ''}`,
        { 
          cwd: this.tempProjectDir,
          timeout: 30000 // 30 second timeout
        }
      );
      
      return {
        success: true,
        output: stdout,
        errors: stderr ? [stderr] : []
      };
      
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        errors: [error.stderr || error.message]
      };
    }
  }

  async getContractInfo() {
    try {
      // Try to read the generated API file to get contract information
      const apiFilePath = path.join(this.tempProjectDir, 'boilerplate', 'contract-cli', 'src', 'api.ts');
      
      if (await fs.pathExists(apiFilePath)) {
        const apiContent = await fs.readFile(apiFilePath, 'utf8');
        
        // Extract function names from the API file (basic parsing)
        const functionMatches = apiContent.match(/export\s+async\s+function\s+(\w+)/g) || [];
        const functions = functionMatches.map(match => match.replace(/export\s+async\s+function\s+/, ''));
        
        return {
          functions,
          hasAPI: true,
          apiPath: apiFilePath
        };
      }
      
      return {
        functions: [],
        hasAPI: false,
        apiPath: null
      };
      
    } catch (error) {
      console.warn('Could not read contract info:', error);
      return {
        functions: [],
        hasAPI: false,
        apiPath: null,
        error: error.message
      };
    }
  }

  async cleanup() {
    try {
      if (await fs.pathExists(this.tempProjectDir)) {
        await fs.remove(this.tempProjectDir);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  // Get example Compact contracts based on create-midnight-app templates
  getExampleContracts() {
    return {
      counter: `pragma language_version 0.15;
import CompactStandardLibrary;

export ledger count: Counter;

export circuit increment(value: Uint<16>): [] {
  count.increment(value);
}

export circuit decrement(value: Uint<16>): [] {
  count.decrement(value);
}

export circuit get_count(): Uint<64> {
  return count;
}`,

      voting: `pragma language_version 0.15;
import CompactStandardLibrary;

export ledger votes_for: Counter;
export ledger votes_against: Counter;

export circuit vote_yes(): [] {
  votes_for.increment(1);
}

export circuit vote_no(): [] {
  votes_against.increment(1);
}

export circuit get_results(): [Uint<64>, Uint<64>] {
  return [votes_for, votes_against];
}`,

      message: `pragma language_version 0.15;
import CompactStandardLibrary;

export ledger messages: Vector<Opaque<"string">>;

export circuit post_message(message: Opaque<"string">): [] {
  messages.push(message);
}

export circuit get_messages(): Vector<Opaque<"string">> {
  return messages;
}

export circuit get_message_count(): Uint<64> {
  return messages.length();
}`
    };
  }
}

module.exports = { CompactCompiler };
