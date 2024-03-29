module.exports = {
  root: true,
  extends: [ 'custom' ]
  // env: {
  //   browser: true,
  //   commonjs: true,
  //   es6: true
  // },
  // globals: {
  //   __CONFIG__: true,
  //   __ENV__: true
  // },
  // // "extends": "airbnb",
  // // "parser": "babel-eslint",
  // parserOptions: {
  //   ecmaFeatures: {
  //     // Enabled object spread
  //     experimentalObjectRestSpread: true
  //   }
  // },
  // // Rule changes from Airbnb's eslint config
  // rules: {
  //   'import/no-unresolved': 0,
  //   'global-require': 0,
  //   'no-console': 0,
  //   'react/forbid-prop-types': 0,
  //   'jsx-a11y/href-no-hash': 0,
  //   'react/jsx-filename-extension': 0,
  //   'arrow-parens': [ 'warn', 'always' ],
  //   'jsx-a11y/anchor-is-valid': [ 'error', {
  //     components: [ 'Link' ],
  //     specialLink: [ 'to', 'hrefLeft', 'hrefRight' ],
  //     aspects: [ 'noHref', 'invalidHref', 'preferButton' ]
  //   } ],

  //   'comma-dangle': 1, // disallow or enforce trailing commas
  //   'class-methods-use-this': 1,

  //   'no-extra-parens': 1, // disallow unnecessary parentheses (off by default)
  //   'no-inner-declarations': 1, // disallow function or variable declarations in nested blocks
  //   'no-invalid-regexp': 2, // disallow invalid regular expression strings in the RegExp constructor
  //   'no-irregular-whitespace': 2, // disallow irregular whitespace outside of strings and comments
  //   'no-negated-in-lhs': 2, // disallow negation of the left operand of an in expression
  //   'no-obj-calls': 2, // disallow the use of object properties of the global object (Math and JSON) as functions
  //   'no-regex-spaces': 2, // disallow multiple spaces in a regular expression literal

  //   'no-sparse-arrays': 2, // disallow sparse arrays
  //   'no-unreachable': 2, // disallow unreachable statements after a return, throw, continue, or break statement
  //   'no-useless-constructor': 1,
  //   'use-isnan': 2, // disallow comparisons with the value NaN
  //   'valid-jsdoc': 2, // Ensure JSDoc comments are valid (off by default)
  //   'valid-typeof': 2, // Ensure that the results of typeof are compared against a valid string
  //   'import/prefer-default-export': 1, // Personal preference for creating modules to export to bitsrc
  //   'arrow-body-style': [ 'error', 'as-needed' ],

  //   //
  //   // Best Practices
  //   //
  //   // These are rules designed to prevent you from making mistakes.
  //   // They either prescribe a better way of doing something or help you avoid footguns.
  //   //
  //   complexity: 0, // specify the maximum cyclomatic complexity allowed in a program (off by default)
  //   // 'consistent-return': 2, // require return statements to either always or never specify values
  //   curly: 2, // specify curly brace conventions for all control statements
  //   'default-case': 1, // require default case in switch statements (off by default)
  //   'dot-notation': 2, // encourages use of dot notation whenever possible
  //   eqeqeq: 2, // require the use of === and !==
  //   'guard-for-in': 2, // make sure for-in loops have an if statement (off by default)
  //   'no-extend-native': 2, // disallow adding to native types
  //   'no-extra-bind': 2, // disallow unnecessary function binding
  //   'no-fallthrough': 2, // disallow fallthrough of case statements
  //   'no-floating-decimal': 2, // disallow the use of leading or trailing decimal points in numeric literals (off by default)
  //   'no-implied-eval': 2, // disallow use of eval()-like methods
  //   'no-labels': 2, // disallow use of labeled statements
  //   'no-lone-blocks': 2, // disallow unnecessary nested blocks
  //   'no-loop-func': 2, // disallow creation of functions within loops
  //   'no-multi-spaces': 2, // disallow use of multiple spaces
  //   'no-multi-str': 2, // disallow use of multiline strings
  //   'no-octal': 2, // disallow use of octal literals
  //   'no-octal-escape': 2, // disallow use of octal escape sequences in string literals, such as var foo = "Copyright \251";
  //   'no-param-reassign': 1, // disallow reassignment of function parameters (off by default)
  //   'no-process-env': 0, // disallow use of process.env (off by default)
  //   'no-redeclare': 2, // disallow declaring the same variable more then once
  //   'no-return-assign': 2, // disallow use of assignment in return statement
  //   'no-sequences': 2, // disallow use of comma operator
  //   'no-throw-literal': 2, // restrict what can be thrown as an exception (off by default)
  //   'no-unused-expressions': 2, // disallow usage of expressions in statement position
  //   'no-void': 2, // disallow use of void operator (off by default)
  //   'no-warning-comments': [ 0, { terms: [ 'todo', 'fixme' ], location: 'start' } ], // disallow usage of configurable warning terms in comments": 2, // e.g. TODO or FIXME (off by default)
  //   'no-with': 2, // disallow use of the with statement
  //   radix: 2, // require use of the second argument for parseInt() (off by default)
  //   'vars-on-top': 2, // requires to declare all vars on top of their containing scope (off by default)
  //   'wrap-iife': 2, // require immediate function invocation to be wrapped in parentheses (off by default)
  //   yoda: 2, // require or disallow Yoda conditions

  //   //
  //   // Strict Mode
  //   //
  //   // These rules relate to using strict mode.
  //   //
  //   strict: 0, // controls location of Use Strict Directives. 0: required by `babel-eslint`

  //   //
  //   // Variables
  //   //
  //   // These rules have to do with variable declarations.
  //   //
  //   'no-catch-shadow': 2, // disallow the catch clause parameter name being the same as a variable in the outer scope (off by default in the node environment)
  //   'no-delete-var': 2, // disallow deletion of variables
  //   'no-label-var': 2, // disallow labels that share a name with a variable
  //   'no-shadow': 2, // disallow declaration of variables already declared in the outer scope
  //   'no-shadow-restricted-names': 2, // disallow shadowing of names such as arguments
  //   'no-undef': 2, // disallow use of undeclared variables unless mentioned in a /*global */ block
  //   'no-undef-init': 2, // disallow use of undefined when initializing variables
  //   'no-undefined': 1, // disallow use of undefined variable (off by default)
  //   'no-unused-vars': 2, // disallow declaration of variables that are not used in the code
  //   'no-use-before-define': 2, // disallow use of variables before they are defined

  //   //
  //   // Stylistic Issues
  //   //
  //   // These rules are purely matters of style and are quite subjective.
  //   //
  //   indent: [ 2, 2 ], // this option sets a specific tab width for your code (off by default)
  //   'brace-style': 1, // enforce one true brace style (off by default)
  //   // camelcase: 2, // require camel case names
  //   'comma-spacing': [ 1, { before: false, after: true } ], // enforce spacing before and after comma
  //   'comma-style': [ 1, 'last' ], // enforce one true comma style (off by default)
  //   'consistent-this': [ 1, 'this' ], // enforces consistent naming when capturing the current execution context (off by default)
  //   'eol-last': 1, // enforce newline at the end of file, with no multiple empty lines
  //   'func-names': 0, // require function expressions to have a name (off by default)
  //   'func-style': 0, // enforces use of function declarations or expressions (off by default)
  //   'key-spacing': [ 1, { beforeColon: false, afterColon: true } ], // enforces spacing between keys and values in object literal properties
  //   'keyword-spacing': [ 1, { before: true, after: true } ], // require a space after certain keywords (off by default)
  //   'max-nested-callbacks': [ 1, 4 ], // specify the maximum depth callbacks can be nested (off by default)
  //   'new-cap': [ 1, { newIsCap: true, capIsNew: false } ], // require a capital letter for constructors
  //   'new-parens': 1, // disallow the omission of parentheses when invoking a constructor with no arguments
  //   'newline-after-var': 0, // allow/disallow an empty newline after var statement (off by default)
  //   'no-array-constructor': 1, // disallow use of the Array constructor
  //   'no-inline-comments': 1, // disallow comments inline after code (off by default)
  //   'no-lonely-if': 1, // disallow if as the only statement in an else block (off by default)
  //   'no-mixed-spaces-and-tabs': 2, // disallow mixed spaces and tabs for indentation
  //   'no-multiple-empty-lines': [ 1, { max: 2 } ], // disallow multiple empty lines (off by default)
  //   'no-nested-ternary': 1, // disallow nested ternary expressions (off by default)
  //   'no-new-object': 1, // disallow use of the Object constructor
  //   'no-spaced-func': 1, // disallow space between function identifier and application
  //   'no-ternary': 0, // disallow the use of ternary operators (off by default)
  //   'no-trailing-spaces': 1, // disallow trailing whitespace at the end of lines
  //   'no-underscore-dangle': 1, // disallow dangling underscores in identifiers
  //   'one-var': [ 2, 'never' ], // allow just one var statement per function (off by default)
  //   'operator-assignment': [ 1, 'never' ], // require assignment operator shorthand where possible or prohibit it entirely (off by default)
  //   'padded-blocks': [ 1, 'never' ], // enforce padding within blocks (off by default)
  //   'quote-props': [ 1, 'as-needed' ], // require quotes around object literal property names (off by default)
  //   quotes: [ 1, 'single' ], // specify whether double or single quotes should be used
  //   semi: [ 1, 'always' ], // require or disallow use of semicolons instead of ASI
  //   'semi-spacing': [ 1, { before: false, after: true } ], // enforce spacing before and after semicolons
  //   'space-before-blocks': [ 1, 'always' ], // require or disallow space before blocks (off by default)
  //   'space-before-function-paren': [ 1, { anonymous: 'always', named: 'never' } ], // require or disallow space before function opening parenthesis (off by default)
  //   'object-curly-spacing': [ 2, 'always' ],
  //   'array-bracket-spacing': [ 2, 'always' ],
  //   'computed-property-spacing': [ 1, 'never' ],
  //   'space-unary-ops': [ 1, { words: true, nonwords: false } ], // Require or disallow spaces before/after unary operators (words on by default, nonwords off by default)
  //   'spaced-comment': [ 1, 'always' ], // require or disallow a space immediately following the // in a line comment (off by default)
  //   'wrap-regex': 0, // require regex literals to be wrapped in parentheses (off by default)

  //   //
  //   // ECMAScript 6
  //   //
  //   // These rules are only relevant to ES6 environments and are off by default.
  //   //
  //   'no-var': 2, // require let or const instead of var (off by default)
  //   'generator-star-spacing': [ 2, 'before' ], // enforce the spacing around the * in generator functions (off by default)

  //   //
  //   // Legacy
  //   //
  //   // The following rules are included for compatibility with JSHint and JSLint.
  //   // While the names of the rules may not match up with the JSHint/JSLint counterpart,
  //   // the functionality is the same.
  //   //
  //   'max-depth': [ 2, 3 ], // specify the maximum depth that blocks can be nested (off by default)
  //   'max-len': [ 2, 110, 2 ], // specify the maximum length of a line in your program (off by default)
  //   'max-params': [ 2, 5 ], // limits the number of parameters that can be used in the function declaration. (off by default)
  //   'max-statements': 0, // specify the maximum number of statement allowed in a function (off by default)
  //   'no-bitwise': 0, // disallow use of bitwise operators (off by default)
  //   'no-plusplus': 2, // disallow use of unary operators, ++ and -- (off by default)

  //   //
  //   // eslint-plugin-react
  //   //
  //   // React specific linting rules for ESLint
  //   //
  //   'react/display-name': 0, // Prevent missing displayName in a React component definition

  //   'react/jsx-no-undef': 2, // Disallow undeclared variables in JSX
  //   'react/jsx-sort-props': 2, // Enforce props alphabetical sorting
  //   'react/jsx-uses-react': 2, // Prevent React to be incorrectly marked as unused
  //   'react/jsx-uses-vars': 2, // Prevent variables used in JSX to be incorrectly marked as unused
  //   'react/no-did-mount-set-state': 2, // Prevent usage of setState in componentDidMount
  //   'react/no-did-update-set-state': 2, // Prevent usage of setState in componentDidUpdate
  //   'react/no-multi-comp': 0, // Prevent multiple component definition per file
  //   'react/prop-types': 2, // Prevent missing props validation in a React component definition
  //   // 'react/react-in-jsx-scope': 2, // Prevent missing React when using JSX
  //   'react/self-closing-comp': 2 // Prevent extra closing tags for components without children
  // }
};
