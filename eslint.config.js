import antfu from '@antfu/eslint-config';

export default antfu({
    formatters: true,
    vue: true,
    rules: {
        'style/indent': ['error', 4],
        'style/semi': ['error', 'always'],
    },
});
