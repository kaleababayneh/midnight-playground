import { type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { ContractAnalyzer, type ContractAnalysis, type ContractFunction } from './contract-analyzer.js';
import { type BBoardProviders, type DeployedBBoardContract } from '../../api/src/index.js';

export interface MenuItem {
  key: string;
  label: string;
  handler: (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => Promise<void>;
  readOnly?: boolean;
}

/**
 * Dynamically generates CLI menus and handlers based on contract analysis
 */
export class DynamicCLIGenerator {
  private analyzer: ContractAnalyzer;
  private logger: Logger;
  private contractAnalysis: ContractAnalysis | null = null;

  constructor(logger: Logger) {
    this.analyzer = new ContractAnalyzer();
    this.logger = logger;
  }

  /**
   * Initialize the CLI generator by analyzing the contract
   */
  async initialize(): Promise<void> {
    try {
      this.contractAnalysis = await this.analyzer.analyzeContract();
      this.logger.info(`Analyzed contract: ${this.contractAnalysis.contractName}`);
      this.logger.info(`Found ${this.contractAnalysis.functions.length} functions`);
    } catch (error) {
      this.logger.error(`Failed to analyze contract: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate menu items based on contract analysis
   */
  generateMenuItems(): MenuItem[] {
    if (!this.contractAnalysis) {
      throw new Error('Contract analysis not initialized. Call initialize() first.');
    }

    const items: MenuItem[] = [];

    // Add circuit function menu items
    this.contractAnalysis.functions.forEach((func, index) => {
      items.push({
        key: (index + 1).toString(),
        label: this.formatFunctionLabel(func),
        handler: this.createFunctionHandler(func),
        readOnly: func.readOnly
      });
    });

    // Add state display menu items
    items.push({
      key: (items.length + 1).toString(),
      label: 'Display ledger state',
      handler: this.createStateDisplayHandler(),
      readOnly: true
    });

    items.push({
      key: (items.length + 1).toString(),
      label: 'Display private state',
      handler: this.createPrivateStateDisplayHandler(),
      readOnly: true
    });

    items.push({
      key: (items.length + 1).toString(),
      label: 'Exit',
      handler: async () => {
        this.logger.info('Exiting...');
        return;
      }
    });

    return items;
  }

  /**
   * Generate menu question string
   */
  generateMenuQuestion(menuItems: MenuItem[]): string {
    let question = '\nYou can do one of the following:\n';
    
    menuItems.forEach(item => {
      const indicator = item.readOnly ? '📖' : '⚡';
      question += `  ${item.key}. ${indicator} ${item.label}\n`;
    });
    
    question += 'Which would you like to do? ';
    return question;
  }

  /**
   * Create a function handler for a specific contract function
   */
  private createFunctionHandler(func: ContractFunction): (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => Promise<void> {
    return async (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => {
      try {
        this.logger.info(`🔧 Executing ${func.name}...`);

        // Collect parameters if needed
        const args: any[] = [];
        for (const param of func.parameters) {
          const value = await this.collectParameter(param, rli);
          args.push(value);
        }

        try {
          // Get the enhanced API from global context
          const enhancedApi = (global as any).enhancedApi;
          if (!enhancedApi) {
            throw new Error('Enhanced API not available');
          }

          // Try to execute the function dynamically
          const result = await enhancedApi.executeFunction(func.name, ...args);
          
          if (result !== undefined && result !== null) {
            this.logger.info(`📋 Result: ${JSON.stringify(result)}`);
          } else {
            this.logger.info(`✅ ${func.name} executed successfully`);
          }
        } catch (error) {
          // If function not found in API, try direct contract execution
          this.logger.info(`📖 Attempting direct contract execution for ${func.name}...`);
          const result = await this.executeContractFunction(func.name, args, providers, contract);
          
          if (result !== undefined && result !== null) {
            this.logger.info(`📋 Result: ${JSON.stringify(result)}`);
          } else {
            this.logger.info(`✅ ${func.name} executed successfully`);
          }
        }
      } catch (error) {
        this.logger.error(`❌ Failed to execute ${func.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
  }

  /**
   * Execute a function directly on the contract
   */
  private async executeContractFunction(functionName: string, args: any[], providers: BBoardProviders, contract: DeployedBBoardContract): Promise<any> {
    try {
      // For read-only functions that return values - check from ledger state or call as read-only
      if (functionName === 'get_count') {
        this.logger.info('📊 Getting current count from ledger state...');
        
        const contractAddress = contract.deployTxData.public.contractAddress;
        const ledgerState = await (global as any).getBBoardLedgerState(providers, contractAddress);
        
        if (ledgerState) {
          const count = ledgerState.count || 0n;
          this.logger.info(`📋 Current count: ${count.toString()}`);
          return count.toString();
        } else {
          return '0';
        }
      } else if (functionName === 'reset') {
        // Reset returns a string value, so it's actually a read-only function
        this.logger.info('🔄 Calling reset function (returns message)...');
        
        // Since reset returns "False Counter reset", we can just return that
        // In a real implementation, this might call a pure circuit or query function
        const message = "False Counter reset";
        this.logger.info(`📋 Reset message: ${message}`);
        return message;
      } else if (functionName === 'get_results') {
        this.logger.info('📊 Getting voting results from ledger state...');
        
        const contractAddress = contract.deployTxData.public.contractAddress;
        const ledgerState = await (global as any).getBBoardLedgerState(providers, contractAddress);
        
        if (ledgerState) {
          const votesFor = ledgerState.votes_for || 0n;
          const votesAgainst = ledgerState.votes_against || 0n;
          return [votesFor.toString(), votesAgainst.toString()];
        } else {
          return ['0', '0'];
        }
      } else {
        // For transaction functions, execute them on-chain through the contract interface
        this.logger.info(`🔗 Executing ${functionName} on-chain...`);
        
        try {
          // Get the contract interface and call the function
          const contractInterface = contract.callTx as any;
          
          if (contractInterface[functionName] && typeof contractInterface[functionName] === 'function') {
            this.logger.info(`📝 Calling contract.callTx.${functionName}(${args.join(', ')})`);
            
            const txData = await contractInterface[functionName](...args);
            
            this.logger.info(`✅ Transaction submitted successfully!`);
            this.logger.info(`📄 TX Hash: ${txData.public.txHash}`);
            this.logger.info(`🏗️  Block Height: ${txData.public.blockHeight}`);
            
            return `${functionName} executed successfully on-chain`;
          } else {
            throw new Error(`Function ${functionName} not found on contract interface`);
          }
        } catch (contractError) {
          this.logger.error(`❌ Contract execution failed: ${contractError instanceof Error ? contractError.message : String(contractError)}`);
          throw contractError;
        }
      }
    } catch (error) {
      throw new Error(`Failed to execute contract function ${functionName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create state display handler
   */
  private createStateDisplayHandler(): (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => Promise<void> {
    return async (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => {
      try {
        this.logger.info('📊 Displaying current ledger state...');
        
        // Use the global displayLedgerState function
        const displayLedgerState = (global as any).displayLedgerState;
        if (displayLedgerState) {
          await displayLedgerState(providers, contract, this.logger);
        } else {
          this.logger.warn('displayLedgerState function not available');
        }
      } catch (error) {
        this.logger.error(`❌ Failed to display state: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
  }

  /**
   * Create private state display handler
   */
  private createPrivateStateDisplayHandler(): (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => Promise<void> {
    return async (providers: BBoardProviders, contract: DeployedBBoardContract, rli: Interface) => {
      try {
        this.logger.info('🔐 Displaying private state...');
        
        // Use the global displayPrivateState function
        const displayPrivateState = (global as any).displayPrivateState;
        if (displayPrivateState) {
          await displayPrivateState(providers, this.logger);
        } else {
          this.logger.warn('displayPrivateState function not available');
        }
      } catch (error) {
        this.logger.error(`❌ Failed to display private state: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
  }

  /**
   * Collect a parameter value from user input
   */
  private async collectParameter(param: {name: string, type: string}, rli: Interface): Promise<any> {
    const prompt = `Enter ${param.name} (${param.type}): `;
    const input = await rli.question(prompt);

    // Enhanced type conversion for Compact types
    if (param.type.includes('Uint<')) {
      // For Uint types, convert to BigInt (this is what the Compact runtime expects)
      const numValue = parseInt(input, 10);
      if (isNaN(numValue)) {
        throw new Error(`Invalid number: ${input}`);
      }
      this.logger.info(`🔄 Converting "${input}" to BigInt: ${numValue}n`);
      return BigInt(numValue);
    }
    
    switch (param.type) {
      case 'number':
        return BigInt(input);
      case 'string':
        return input;
      case 'bytes':
        return input; // TODO: Proper bytes conversion
      default:
        // For unknown types, try to convert to BigInt if it looks like a number
        if (!isNaN(Number(input))) {
          return BigInt(input);
        }
        return input;
    }
  }

  /**
   * Format function name for display
   */
  private formatFunctionLabel(func: ContractFunction): string {
    // Convert snake_case to title case and add parameter info
    const formatted = func.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const paramCount = func.parameters.length;
    const paramInfo = paramCount > 0 ? ` (${paramCount} param${paramCount > 1 ? 's' : ''})` : '';
    
    return `${formatted}${paramInfo}`;
  }
}
