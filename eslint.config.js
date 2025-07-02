import antfu from '@antfu/eslint-config';

export default antfu({
    // Enable Vue and TypeScript support (auto-detected)
    vue: true,
    typescript: true,

    // Stylistic formatting rules
    stylistic: {
        indent: 4, // 4 spaces
        quotes: 'single', // Use single quotes
        semi: true, // Always use semicolons
    },

    // Disable YAML and JSONC if you don't need them
    yaml: false,
    jsonc: false,

    // Ignore patterns
    ignores: [
        'node_modules',
        'dist',
        '*.min.js',
        'coverage',
        'public',
    ],
}, {
    // Custom rules to override defaults
    rules: {
        // Allow console.log statements
        'no-console': 'off',

        // Allow alert (needed for Figma plugins)
        'no-alert': 'off',

        // Allow process global (for Node.js scripts)
        'node/prefer-global/process': 'off',

        // TypeScript specific rules
        '@typescript-eslint/no-explicit-any': 'off', // Allow any type for Figma API

        // Vue specific rules
        'vue/multi-word-component-names': 'off', // Allow single-word component names

        // Style preferences
        'style/brace-style': ['error', '1tbs'], // One true brace style
        'style/arrow-parens': ['error', 'always'], // Always use parens with arrow functions
    },
});
