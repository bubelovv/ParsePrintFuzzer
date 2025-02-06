# Tact Expression Pretty-Printer Fuzz Testing

This project implements **property-based randomized testing** for the Tact language's expression pretty-printer. The goal is to ensure the correctness of the pretty-printer by verifying that the process of pretty-printing and parsing Tact expressions is consistent.

---

## How It Works
- The tests are written using the `fast-check` library for property-based testing.
- Random ASTs are generated for expressions.
- The `prettyPrint` function converts the AST into a string representation.
- The `parseExpression` function parses the string back into an AST.
- The original and parsed ASTs are compared for equivalence.

If the ASTs are not equivalent, it indicates a bug in the pretty-printer or parser.

---

## **Features**
- **Custom AST comparison**: Implements an equality function to compare ASTs while ignoring metadata like `loc` and `id`.
- **Optional shrinking**: Helps minimize counter-examples for easier debugging (bonus feature).
---

## **Setup and Usage**
### **1. Clone the Repository**
Clone this repository into your project.

### 2. Import the Code
Add the necessary imports to your project's `imports` file to integrate the testing functionality.

### 3. Install Dependencies
Install the required dependency using `npm` or `yarn`:

```bash
npm install fast-check
```

### 4. Run the Tests
Run the tests using your preferred test runner (e.g., Jest).
