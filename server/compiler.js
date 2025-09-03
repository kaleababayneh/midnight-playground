class CompactMidnightCompiler {
  constructor() {
    this.variables = new Map();
    this.functions = new Map();
  }

  async compile(code) {
    this.variables.clear();
    this.functions.clear();
    
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const output = [];
    
    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const result = this.executeLine(line, i + 1);
        if (result !== null && result !== undefined) {
          output.push(result);
        }
      }
      
      return {
        output: output.join('\n'),
        variables: Object.fromEntries(this.variables),
        executionTime: Date.now()
      };
    } catch (error) {
      throw error;
    }
  }

  executeLine(line, lineNumber) {
    try {
      // Skip comments
      if (line.startsWith('//') || line.startsWith('#')) {
        return null;
      }

      // Variable assignment: let x = 5
      if (line.match(/^let\s+\w+\s*=\s*.+/)) {
        return this.handleVariableAssignment(line);
      }

      // Function definition: fn name(params) { ... }
      if (line.startsWith('fn ')) {
        return this.handleFunctionDefinition(line);
      }

      // Print statement: print "hello" or print(x)
      if (line.startsWith('print ') || line.startsWith('print(')) {
        return this.handlePrint(line);
      }

      // Expression evaluation
      if (line.includes('=') && !line.startsWith('let')) {
        return this.handleAssignment(line);
      }

      // Function call
      if (line.includes('(') && line.includes(')')) {
        return this.handleFunctionCall(line);
      }

      // Direct expression
      return this.evaluateExpression(line);

    } catch (error) {
      error.line = lineNumber;
      throw error;
    }
  }

  handleVariableAssignment(line) {
    const match = line.match(/^let\s+(\w+)\s*=\s*(.+)/);
    if (!match) {
      throw new Error(`Invalid variable assignment: ${line}`);
    }

    const [, varName, expression] = match;
    const value = this.evaluateExpression(expression);
    this.variables.set(varName, value);
    
    return `${varName} = ${value}`;
  }

  handleAssignment(line) {
    const match = line.match(/^(\w+)\s*=\s*(.+)/);
    if (!match) {
      throw new Error(`Invalid assignment: ${line}`);
    }

    const [, varName, expression] = match;
    if (!this.variables.has(varName)) {
      throw new Error(`Variable '${varName}' not declared. Use 'let ${varName} = ...' first`);
    }

    const value = this.evaluateExpression(expression);
    this.variables.set(varName, value);
    
    return `${varName} = ${value}`;
  }

  handlePrint(line) {
    let expression;
    
    if (line.startsWith('print(') && line.endsWith(')')) {
      expression = line.slice(6, -1);
    } else if (line.startsWith('print ')) {
      expression = line.slice(6);
    } else {
      throw new Error(`Invalid print statement: ${line}`);
    }

    const value = this.evaluateExpression(expression);
    return `OUTPUT: ${value}`;
  }

  handleFunctionDefinition(line) {
    // Basic function definition parsing - simplified for demo
    const match = line.match(/^fn\s+(\w+)\s*\((.*?)\)\s*\{(.*)\}/);
    if (!match) {
      throw new Error(`Invalid function definition: ${line}`);
    }

    const [, funcName, params, body] = match;
    this.functions.set(funcName, { params: params.split(',').map(p => p.trim()), body });
    
    return `Function '${funcName}' defined`;
  }

  handleFunctionCall(line) {
    const match = line.match(/^(\w+)\s*\((.*?)\)/);
    if (!match) {
      throw new Error(`Invalid function call: ${line}`);
    }

    const [, funcName, args] = match;
    
    // Built-in functions
    if (funcName === 'sqrt') {
      const arg = this.evaluateExpression(args);
      return Math.sqrt(Number(arg));
    }
    
    if (funcName === 'abs') {
      const arg = this.evaluateExpression(args);
      return Math.abs(Number(arg));
    }

    if (this.functions.has(funcName)) {
      // Execute user-defined function (simplified)
      const func = this.functions.get(funcName);
      return `Called function '${funcName}' with args: ${args}`;
    }

    throw new Error(`Unknown function: ${funcName}`);
  }

  evaluateExpression(expression) {
    expression = expression.trim();

    // String literal
    if ((expression.startsWith('"') && expression.endsWith('"')) ||
        (expression.startsWith("'") && expression.endsWith("'"))) {
      return expression.slice(1, -1);
    }

    // Number literal
    if (!isNaN(expression)) {
      return Number(expression);
    }

    // Variable reference
    if (this.variables.has(expression)) {
      return this.variables.get(expression);
    }

    // Basic arithmetic expressions
    try {
      // Replace variables in expression
      let evalExpression = expression;
      for (const [varName, value] of this.variables) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evalExpression = evalExpression.replace(regex, value);
      }

      // Basic safety check - only allow numbers, operators, and parentheses
      if (/^[0-9+\-*/()\s.]+$/.test(evalExpression)) {
        return eval(evalExpression);
      }
    } catch (e) {
      // Fall through to error
    }

    throw new Error(`Cannot evaluate expression: ${expression}`);
  }
}

module.exports = { CompactMidnightCompiler };
