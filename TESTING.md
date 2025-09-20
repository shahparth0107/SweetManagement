# Testing Guide for Sweet Shop Project

This document provides comprehensive information about the testing setup and how to run tests for the Sweet Shop project.

## 🧪 Test-Driven Development (TDD) Setup

This project follows Test-Driven Development principles with a clear **Red-Green-Refactor** pattern:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

## 📁 Test Structure

```
IncuByte_Sweet_Shop/
├── Backend/
│   ├── __tests__/
│   │   ├── auth.test.js          # Authentication tests
│   │   ├── sweets.test.js        # Sweets API tests
│   │   ├── middleware.test.js    # Middleware tests
│   │   ├── models.test.js        # Model validation tests
│   │   └── integration.test.js   # End-to-end integration tests
│   ├── jest.config.js            # Jest configuration
│   └── jest.setup.js             # Test setup file
├── Frontend/
│   ├── src/
│   │   └── __tests__/
│   │       ├── Login.test.jsx           # Login component tests
│   │       ├── Register.test.jsx        # Register component tests
│   │       ├── UserDashboard.test.jsx   # Dashboard tests
│   │       ├── SweetCard.test.jsx       # Sweet card component tests
│   │       ├── AuthContext.test.jsx     # Auth context tests
│   │       ├── api.test.js              # API client tests
│   │       └── integration.test.jsx     # Frontend integration tests
│   ├── jest.config.cjs           # Jest configuration
│   └── jest.setup.js             # Test setup file
└── test-runner.js                # Comprehensive test runner
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (for backend tests)

### Installation

1. **Install dependencies for both projects:**
   ```bash
   node test-runner.js install
   ```

2. **Run all tests:**
   ```bash
   node test-runner.js test
   ```

3. **Run tests with coverage:**
   ```bash
   node test-runner.js test:coverage
   ```

## 🛠️ Test Commands

### Using the Test Runner (Recommended)

The project includes a comprehensive test runner that handles both frontend and backend tests:

```bash
# Run all tests
node test-runner.js test

# Run backend tests only
node test-runner.js test:backend

# Run frontend tests only
node test-runner.js test:frontend

# Run tests in watch mode (TDD)
node test-runner.js test:watch

# Run tests with coverage
node test-runner.js test:coverage

# Run in TDD mode
node test-runner.js test:tdd

# Install dependencies
node test-runner.js install

# Show help
node test-runner.js help
```

### Individual Project Commands

#### Backend Tests

```bash
cd Backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

#### Frontend Tests

```bash
cd Frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

## 📊 Test Coverage

### Coverage Targets

- **Backend**: 80% minimum coverage
- **Frontend**: 70% minimum coverage

### Coverage Reports

Coverage reports are generated in HTML format:

- **Backend**: `Backend/coverage/index.html`
- **Frontend**: `Frontend/coverage/index.html`

### Viewing Coverage

1. Run tests with coverage:
   ```bash
   node test-runner.js test:coverage
   ```

2. Open the coverage reports in your browser:
   - Backend: `file:///path/to/Backend/coverage/index.html`
   - Frontend: `file:///path/to/Frontend/coverage/index.html`

## 🧪 Test Types

### Backend Tests

#### 1. Unit Tests
- **Authentication**: Login, registration, validation
- **Sweets API**: CRUD operations, search, purchase, restock
- **Middleware**: Authentication, authorization
- **Models**: User and Sweet model validation

#### 2. Integration Tests
- Complete user workflows
- Admin management workflows
- Search and filter functionality
- Error handling and edge cases

#### 3. API Tests
- HTTP status codes
- Request/response validation
- Error handling
- Authentication flows

### Frontend Tests

#### 1. Component Tests
- **Login Component**: Form validation, submission, error handling
- **Register Component**: Form validation, submission, error handling
- **SweetCard Component**: Rendering, interaction, purchase functionality
- **AuthContext**: State management, login/logout flows

#### 2. Integration Tests
- Complete user authentication flows
- Sweet management workflows
- Search functionality
- Error handling

#### 3. API Client Tests
- Request/response handling
- Error handling
- Token management
- Interceptor functionality

## 🔧 Test Configuration

### Backend Jest Configuration

```javascript
// Backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Frontend Jest Configuration

```javascript
// Frontend/jest.config.cjs
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

## 🐛 Debugging Tests

### Backend Debugging

1. **Run specific test file:**
   ```bash
   cd Backend
   npm test -- auth.test.js
   ```

2. **Run tests with verbose output:**
   ```bash
   npm test -- --verbose
   ```

3. **Debug with Node.js debugger:**
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

### Frontend Debugging

1. **Run specific test file:**
   ```bash
   cd Frontend
   npm test -- Login.test.jsx
   ```

2. **Run tests with verbose output:**
   ```bash
   npm test -- --verbose
   ```

3. **Debug in browser:**
   ```bash
   npm test -- --no-coverage --watch
   ```

## 🔄 TDD Workflow

### 1. Red Phase - Write Failing Test

```javascript
// Example: Testing a new feature
describe('New Feature', () => {
  it('should do something specific', () => {
    // Write test that fails
    expect(newFeature()).toBe('expected result');
  });
});
```

### 2. Green Phase - Make Test Pass

```javascript
// Write minimal code to make test pass
function newFeature() {
  return 'expected result';
}
```

### 3. Refactor Phase - Improve Code

```javascript
// Improve the implementation while keeping tests green
function newFeature() {
  // Better implementation
  return 'expected result';
}
```

## 📝 Writing Tests

### Backend Test Example

```javascript
describe('Auth API', () => {
  it('should register a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/registered successfully/i);
  });
});
```

### Frontend Test Example

```javascript
describe('Login Component', () => {
  it('should render login form', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

## 🚨 Common Issues

### Backend Issues

1. **Database Connection**: Ensure MongoDB is running
2. **Environment Variables**: Check `.env` file for required variables
3. **Port Conflicts**: Ensure test port is available

### Frontend Issues

1. **Module Resolution**: Check import paths
2. **Mock Issues**: Verify mocks are properly configured
3. **Async Operations**: Use `waitFor` for async operations

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: node test-runner.js install
      - run: node test-runner.js test:coverage
```

## 🎯 Best Practices

1. **Write tests first** (TDD approach)
2. **Keep tests simple and focused**
3. **Use descriptive test names**
4. **Mock external dependencies**
5. **Test edge cases and error conditions**
6. **Maintain high test coverage**
7. **Keep tests fast and reliable**
8. **Use proper assertions**

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

## 🤝 Contributing

When adding new features:

1. Write tests first (Red phase)
2. Implement minimal code (Green phase)
3. Refactor and improve (Refactor phase)
4. Ensure all tests pass
5. Maintain or improve test coverage

## 📞 Support

If you encounter issues with the testing setup:

1. Check this documentation
2. Review test logs for specific errors
3. Ensure all dependencies are installed
4. Verify environment configuration
5. Check GitHub issues for similar problems
