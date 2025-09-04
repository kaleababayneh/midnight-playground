import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ContractFunction {
  name: string;
  parameters: Array<{name: string, type: string}>;
  returnType: string;
  readOnly: boolean;
  description?: string;
}

export interface ContractAnalysis {
  contractName: string;
  functions: ContractFunction[];
  ledgerState: {[key: string]: string};
}

/**
 * Analyzes the contract to extract function signatures and information
 */
export class ContractAnalyzer {
  private contractPath: string;
  private contractAnalysis: ContractAnalysis | null = null;
  private contractInfoPath: string;

  constructor() {
    // Path to the .compact file in the root directory
    this.contractPath = path.resolve(__dirname, '../../bboard.compact');
    // Path to the contract-info.json file
    this.contractInfoPath = path.resolve(__dirname, '../../contract/src/managed/bboard/compiler/contract-info.json');
  }

  /**
   * Analyze the contract and return all info
   */
  async analyzeContract(): Promise<ContractAnalysis> {
    // First try to read from contract-info.json for accurate metadata
    if (fs.existsSync(this.contractInfoPath)) {
      try {
        const contractInfo = JSON.parse(fs.readFileSync(this.contractInfoPath, 'utf-8'));
        const functions = this.parseFromContractInfo(contractInfo);
        
        // Still parse ledger state from the .compact file
        let ledgerState = {};
        if (fs.existsSync(this.contractPath)) {
          const content = fs.readFileSync(this.contractPath, 'utf-8');
          ledgerState = this.parseLedgerState(content);
        }

        const analysis = {
          contractName: 'Dynamic Contract',
          functions,
          ledgerState
        };

        this.contractAnalysis = analysis;
        return analysis;
      } catch (error) {
        console.warn('Failed to read contract-info.json, falling back to .compact parsing:', error);
      }
    }

    // Fallback to parsing the .compact file directly
    if (!fs.existsSync(this.contractPath)) {
      throw new Error(`Contract file not found: ${this.contractPath}`);
    }

    const content = fs.readFileSync(this.contractPath, 'utf-8');
    const contractName = path.basename(this.contractPath, '.compact');
    
    const functions = this.parseFunctions(content);
    const ledgerState = this.parseLedgerState(content);

    const analysis = {
      contractName: `${contractName.charAt(0).toUpperCase() + contractName.slice(1)} Contract`,
      functions,
      ledgerState
    };

    // Store the analysis for later use
    this.contractAnalysis = analysis;

    return analysis;
  }

  /**
   * Parse functions from contract-info.json (more accurate than parsing .compact file)
   */
  private parseFromContractInfo(contractInfo: any): ContractFunction[] {
    const functions: ContractFunction[] = [];

    if (contractInfo.circuits && Array.isArray(contractInfo.circuits)) {
      for (const circuit of contractInfo.circuits) {
        const parameters: Array<{name: string, type: string}> = [];
        
        // Parse arguments
        if (circuit.arguments && Array.isArray(circuit.arguments)) {
          for (const arg of circuit.arguments) {
            parameters.push({
              name: arg.name,
              type: this.mapContractInfoTypeToUserFriendly(arg.type)
            });
          }
        }

        // Determine if function is read-only based on the contract-info metadata
        // A function is read-only if:
        // 1. It's marked as pure: true, OR
        // 2. It returns something other than an empty tuple (meaning it returns data)
        const hasNonEmptyReturn = circuit['result-type'] && 
                                 !(circuit['result-type']['type-name'] === 'Tuple' && 
                                   (!circuit['result-type'].types || circuit['result-type'].types.length === 0));
        
        const readOnly = circuit.pure === true || hasNonEmptyReturn;

        functions.push({
          name: circuit.name,
          parameters,
          returnType: this.mapContractInfoTypeToUserFriendly(circuit['result-type']),
          readOnly,
          description: `Execute ${circuit.name} function`
        });
      }
    }

    return functions;
  }

  /**
   * Map contract-info.json type objects to user-friendly strings
   */
  private mapContractInfoTypeToUserFriendly(typeObj: any): string {
    if (!typeObj) return 'void';
    
    switch (typeObj['type-name']) {
      case 'Uint':
        return `Uint<${typeObj.maxval || 'unknown'}>`;
      case 'Bytes':
        return `Bytes<${typeObj.length || 'unknown'}>`;
      case 'Tuple':
        if (!typeObj.types || typeObj.types.length === 0) {
          return '[]';
        }
        return `Tuple<${typeObj.types.map((t: any) => this.mapContractInfoTypeToUserFriendly(t)).join(', ')}>`;
      default:
        return typeObj['type-name'] || 'unknown';
    }
  }

  /**
   * Parse function signatures from Compact contract
   */
  private parseFunctions(content: string): ContractFunction[] {
    const functions: ContractFunction[] = [];

    // Parse circuit functions
    const circuitRegex = /export\s+circuit\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{]+)\s*\{/g;
    let match;

    while ((match = circuitRegex.exec(content)) !== null) {
      const [, name, params, returnType] = match;
      
      const parameters: Array<{name: string, type: string}> = [];
      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim()).filter(p => p);
        
        for (const param of paramList) {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            const paramName = param.substring(0, colonIndex).trim();
            const paramType = param.substring(colonIndex + 1).trim();
            parameters.push({
              name: paramName,
              type: this.mapCompactTypeToUserFriendly(paramType)
            });
          }
        }
      }

      // Determine if function is read-only based on return type only
      // If it returns something meaningful (not empty), it's likely read-only
      const readOnly = returnType.trim() !== '[]' && returnType.trim() !== '';

      functions.push({
        name,
        parameters,
        returnType: returnType.trim(),
        readOnly,
        description: `Execute ${name} function`
      });
    }

    return functions;
  }

  /**
   * Parse ledger state from Compact contract
   */
  private parseLedgerState(content: string): {[key: string]: string} {
    const ledgerState: {[key: string]: string} = {};

    // Parse ledger declarations
    const ledgerRegex = /export\s+ledger\s+(\w+):\s*([^;]+);/g;
    let match;

    while ((match = ledgerRegex.exec(content)) !== null) {
      const [, name, type] = match;
      ledgerState[name] = this.mapCompactTypeToUserFriendly(type.trim());
    }

    return ledgerState;
  }

  /**
   * Map Compact types to user-friendly display types
   */
  private mapCompactTypeToUserFriendly(compactType: string): string {
    const typeMap: {[key: string]: string} = {
      'Opaque<"string">': 'string',
      'Maybe<Opaque<"string">>': 'string?',
      'Counter': 'number',
      'Bytes<32>': 'bytes',
      'State': 'enum',
      '[]': 'void'
    };

    return typeMap[compactType] || compactType;
  }

  /**
   * Check if a function is read-only based on contract analysis
   */
  isReadOnlyFunction(functionName: string): boolean {
    // Use the contract analysis data if available
    if (this.contractAnalysis) {
      const func = this.contractAnalysis.functions.find((f: ContractFunction) => f.name === functionName);
      if (func) {
        return func.readOnly;
      }
    }
    
    // If no analysis available, we can't determine reliably
    console.warn(`No contract analysis available for function: ${functionName}, assuming not read-only`);
    return false;
  }
}
