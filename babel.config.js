module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/hooks': './src/hooks',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/services': './src/services',
            '@/context': './src/context',
            '@/navigation': './src/navigation'
          }
        }
      ]
    ]
  };
};