import { type Logger } from 'pino';
import { ContractAnalyzer } from './contract-analyzer.js';
import { DynamicCLIGenerator } from './dynamic-cli-generator.js';
import { BBoardAPI, type BBoardProviders } from '../../api/src/index.js';

export interface ContractInfo {
  contractName: string;
  functions: Array<{
    name: string;
    parameters: Array<{ name: string; type: string }>;
    returnType: string;
    readOnly: boolean;
    description: string;
  }>;
  ledgerState: Array<{ name: string; type: string }>;
}

/**
 * Enhanced API with dynamic contract analysis
 */
export class EnhancedBBoardAPI {
  private analyzer: ContractAnalyzer;
  private cliGenerator: DynamicCLIGenerator;
  private contractInfo: ContractInfo | null = null;
  private bboardApi: BBoardAPI | null = null;

  constructor(logger: Logger) {
    this.analyzer = new ContractAnalyzer();
    this.cliGenerator = new DynamicCLIGenerator(logger);
  }

  /**
   * Initialize the enhanced API
   */
  async initialize(bboardApi: BBoardAPI): Promise<ContractInfo> {
    try {
      this.bboardApi = bboardApi;
      const analysis = await this.analyzer.analyzeContract();
      await this.cliGenerator.initialize();
      
      // Convert ContractAnalysis to ContractInfo format
      this.contractInfo = {
        contractName: analysis.contractName,
        functions: analysis.functions.map(func => ({
          ...func,
          readOnly: this.analyzer.isReadOnlyFunction(func.name),
          description: func.description || `Execute ${func.name} function`
        })),
        ledgerState: Object.entries(analysis.ledgerState).map(([name, type]) => ({ name, type }))
      };
      
      return this.contractInfo;
    } catch (error) {
      throw new Error(`Failed to initialize enhanced API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get contract information
   */
  getContractInfo(): ContractInfo | null {
    return this.contractInfo;
  }

  /**
   * Generate menu items for the CLI
   */
  generateMenuItems(): any[] {
    return this.cliGenerator.generateMenuItems();
  }

  /**
   * Generate menu question string
   */
  generateMenuQuestion(menuItems: any[]): string {
    return this.cliGenerator.generateMenuQuestion(menuItems);
  }

  /**
   * Get the underlying BBoardAPI instance
   */
  getBBoardAPI(): BBoardAPI | null {
    return this.bboardApi;
  }

  /**
   * Execute a function dynamically by name
   */
  async executeFunction(functionName: string, ...args: any[]): Promise<any> {
    if (!this.bboardApi) {
      throw new Error('BBoardAPI not initialized');
    }

    // Check if the function exists on the BBoardAPI
    const api = this.bboardApi as any;
    if (api[functionName] && typeof api[functionName] === 'function') {
      return await api[functionName](...args);
    } else {
      // For new contract functions that don't exist in the old API, 
      // we need to handle them differently
      throw new Error(`Function ${functionName} not found in BBoardAPI - will be handled by contract interface`);
    }
  }

  // Remove hardcoded proxy methods since we're now fully dynamic
  // The contract functions will be handled through the dynamic system

  get state$() {
    if (!this.bboardApi) {
      throw new Error('BBoardAPI not initialized');
    }
    return this.bboardApi.state$;
  }

  get deployedContract() {
    if (!this.bboardApi) {
      throw new Error('BBoardAPI not initialized');
    }
    return this.bboardApi.deployedContract;
  }

  get deployedContractAddress() {
    if (!this.bboardApi) {
      throw new Error('BBoardAPI not initialized');
    }
    return this.bboardApi.deployedContractAddress;
  }
}
