module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          path: require.resolve('path-browserify')
        },
        extensions: ['.js', '.jsx', '.mjs']
      },
      module: {
        rules: [
          {
            test: /\.m?js/,
            resolve: {
              fullySpecified: false
            }
          }
        ]
      }
    }
  }
};
