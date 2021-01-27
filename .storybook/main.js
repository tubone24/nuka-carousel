const path = require('path');
const custom = require('../webpack.config.js');

module.exports = {
  stories: ['../demo/stories/*.story.js'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  webpackFinal: (config) => {
    return { ...config, module: { ...config.module, rules: custom.module.rules } };
  },
};
