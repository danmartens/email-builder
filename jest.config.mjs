export default {
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    `<rootDir>/node_modules/(?!(${['lodash-es'].join('|')})/)`
  ]
};
