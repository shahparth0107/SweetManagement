#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configuration
const config = {
  backend: {
    path: './Backend',
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage',
    watchCommand: 'npm run test:watch'
  },
  frontend: {
    path: './Frontend',
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage',
    watchCommand: 'npm run test:watch'
  }
};

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logHeader = (message) => {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${message}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
};

const logSuccess = (message) => {
  log(`✅ ${message}`, colors.green);
};

const logError = (message) => {
  log(`❌ ${message}`, colors.red);
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, colors.yellow);
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, colors.blue);
};

// Test execution functions
const runCommand = (command, cwd, description) => {
  try {
    logInfo(`Running: ${description}`);
    log(`Command: ${command}`, colors.magenta);
    
    const output = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    logSuccess(`${description} completed successfully`);
    return { success: true, output };
  } catch (error) {
    logError(`${description} failed`);
    log(`Error: ${error.message}`, colors.red);
    return { success: false, error: error.message, output: error.stdout };
  }
};

const checkDependencies = (projectPath, projectName) => {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError(`${projectName} package.json not found`);
    return false;
  }
  
  const nodeModulesPath = path.join(projectPath, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    logWarning(`${projectName} node_modules not found. Installing dependencies...`);
    const installResult = runCommand('npm install', projectPath, `Installing ${projectName} dependencies`);
    if (!installResult.success) {
      logError(`Failed to install ${projectName} dependencies`);
      return false;
    }
  }
  
  return true;
};

const runBackendTests = (options = {}) => {
  logHeader('BACKEND TESTS');
  
  const { watch = false, coverage = false } = options;
  
  if (!checkDependencies(config.backend.path, 'Backend')) {
    return false;
  }
  
  const command = coverage ? config.backend.coverageCommand : 
                 watch ? config.backend.watchCommand : 
                 config.backend.testCommand;
  
  const result = runCommand(command, config.backend.path, 'Backend Tests');
  
  if (result.success && coverage) {
    logInfo('Backend coverage report generated in Backend/coverage/');
  }
  
  return result.success;
};

const runFrontendTests = (options = {}) => {
  logHeader('FRONTEND TESTS');
  
  const { watch = false, coverage = false } = options;
  
  if (!checkDependencies(config.frontend.path, 'Frontend')) {
    return false;
  }
  
  const command = coverage ? config.frontend.coverageCommand : 
                 watch ? config.frontend.watchCommand : 
                 config.frontend.testCommand;
  
  const result = runCommand(command, config.frontend.path, 'Frontend Tests');
  
  if (result.success && coverage) {
    logInfo('Frontend coverage report generated in Frontend/coverage/');
  }
  
  return result.success;
};

const runAllTests = (options = {}) => {
  logHeader('RUNNING ALL TESTS');
  
  const { watch = false, coverage = false, parallel = false } = options;
  
  if (parallel) {
    logInfo('Running tests in parallel...');
    // Note: In a real implementation, you'd want to use a proper parallel execution library
    // For now, we'll run them sequentially but show the parallel intent
    const backendPromise = new Promise(resolve => {
      setTimeout(() => resolve(runBackendTests(options)), 0);
    });
    const frontendPromise = new Promise(resolve => {
      setTimeout(() => resolve(runFrontendTests(options)), 100);
    });
    
    return Promise.all([backendPromise, frontendPromise]).then(([backend, frontend]) => {
      return backend && frontend;
    });
  } else {
    const backendSuccess = runBackendTests(options);
    const frontendSuccess = runFrontendTests(options);
    
    return backendSuccess && frontendSuccess;
  }
};

const generateCoverageReport = () => {
  logHeader('GENERATING COVERAGE REPORT');
  
  const backendSuccess = runBackendTests({ coverage: true });
  const frontendSuccess = runFrontendTests({ coverage: true });
  
  if (backendSuccess && frontendSuccess) {
    logSuccess('Coverage reports generated successfully');
    logInfo('Backend coverage: Backend/coverage/index.html');
    logInfo('Frontend coverage: Frontend/coverage/index.html');
  } else {
    logError('Failed to generate coverage reports');
  }
  
  return backendSuccess && frontendSuccess;
};

const runTDD = () => {
  logHeader('TEST-DRIVEN DEVELOPMENT MODE');
  logInfo('This will run tests in watch mode for both frontend and backend');
  logInfo('Press Ctrl+C to exit');
  
  // Run backend tests in watch mode
  const backendProcess = execSync(
    config.backend.watchCommand,
    { cwd: config.backend.path, stdio: 'inherit' }
  );
  
  // In a real implementation, you'd want to run both processes concurrently
  // For now, this is a simplified version
};

const showHelp = () => {
  logHeader('TEST RUNNER HELP');
  log('Usage: node test-runner.js [command] [options]', colors.bright);
  log('');
  log('Commands:', colors.bright);
  log('  test                    Run all tests', colors.green);
  log('  test:backend           Run backend tests only', colors.green);
  log('  test:frontend          Run frontend tests only', colors.green);
  log('  test:watch             Run tests in watch mode', colors.green);
  log('  test:coverage          Run tests with coverage', colors.green);
  log('  test:tdd               Run in TDD mode (watch mode)', colors.green);
  log('  install                Install dependencies for both projects', colors.green);
  log('  help                   Show this help message', colors.green);
  log('');
  log('Options:', colors.bright);
  log('  --parallel             Run tests in parallel (experimental)', colors.yellow);
  log('  --watch                Run tests in watch mode', colors.yellow);
  log('  --coverage             Generate coverage reports', colors.yellow);
  log('');
  log('Examples:', colors.bright);
  log('  node test-runner.js test', colors.cyan);
  log('  node test-runner.js test:backend --coverage', colors.cyan);
  log('  node test-runner.js test:watch', colors.cyan);
  log('  node test-runner.js test:tdd', colors.cyan);
};

const installDependencies = () => {
  logHeader('INSTALLING DEPENDENCIES');
  
  const backendSuccess = runCommand('npm install', config.backend.path, 'Backend dependencies');
  const frontendSuccess = runCommand('npm install', config.frontend.path, 'Frontend dependencies');
  
  if (backendSuccess.success && frontendSuccess.success) {
    logSuccess('All dependencies installed successfully');
    return true;
  } else {
    logError('Failed to install some dependencies');
    return false;
  }
};

// Main execution
const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {
    watch: args.includes('--watch'),
    coverage: args.includes('--coverage'),
    parallel: args.includes('--parallel')
  };
  
  logHeader('SWEET SHOP TEST RUNNER');
  log(`Node.js version: ${process.version}`, colors.blue);
  log(`Platform: ${process.platform}`, colors.blue);
  log(`Architecture: ${process.arch}`, colors.blue);
  
  switch (command) {
    case 'test':
      const success = runAllTests(options);
      process.exit(success ? 0 : 1);
      break;
      
    case 'test:backend':
      const backendSuccess = runBackendTests(options);
      process.exit(backendSuccess ? 0 : 1);
      break;
      
    case 'test:frontend':
      const frontendSuccess = runFrontendTests(options);
      process.exit(frontendSuccess ? 0 : 1);
      break;
      
    case 'test:watch':
      runAllTests({ ...options, watch: true });
      break;
      
    case 'test:coverage':
      const coverageSuccess = generateCoverageReport();
      process.exit(coverageSuccess ? 0 : 1);
      break;
      
    case 'test:tdd':
      runTDD();
      break;
      
    case 'install':
      const installSuccess = installDependencies();
      process.exit(installSuccess ? 0 : 1);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      logError(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  runBackendTests,
  runFrontendTests,
  runAllTests,
  generateCoverageReport,
  runTDD,
  installDependencies
};
