const fs = require('fs');
const node_modules = fs.readdirSync('node_modules').filter(x => x !== '.bin');
const globby = require('globby');
const path = require('path')

const shell = require('shelljs');


function CreateIndex_d_ts() { }

CreateIndex_d_ts.prototype.apply = function(compiler) {

  compiler.plugin("emit", function(compilation, callback) {
    //chunk.files.forEach(function(filename) {
    //     console.log(compilation.assets[filename]);
    //});
    //console.log("The compilation is going to emit files...", compilation);
    shell.mkdir('-p', "dist/npm");
    shell.cp('README.md', 'dist/npm/README.md');
    shell.cp('LICENSE', 'dist/npm/LICENSE');
    shell.cp('package.json', 'dist/npm/package.json');
    shell.mkdir('-p', "dist/tsc");
    shell.exec("./node_modules/typescript/bin/tsc --outDir dist/tsc -d");
    shell.cp('dist/tsc/src/*.d.ts', "dist/npm");
    callback();
  });
};


fs.writeFileSync('test/all.ts',
 globby.sync(['test/**/*-test.ts', 'test/**/*-test.tsx'])
   .map(file => file.replace('test/', '').replace(/\.tsx?$/, ''))
   .map(file => `import './${file}';`)
   .join('\n'));

module.exports = [
{
  target: 'node',
  entry: './src/index',
  output: {
    path: __dirname,
    filename: 'dist/npm/promise-etcd.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  },
  externals: node_modules,
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.ts', '.webpack.js', '.web.js', '.js']
  },
  plugins: [
    new CreateIndex_d_ts()
  ]
},
{
  target: 'node',
  entry: './test/etcd_daemon.ts',
  output: {
    filename: './dist/etcd_daemon.js'
  },
  module: {
    loaders: [
      {
        test: /etcd_daemon\.ts$/,
        loader: 'ts-loader'
      }
    ],
    include: [
      path.resolve(__dirname, "test/etcd_daemon.ts")
    ]
  },
  externals: node_modules,
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.ts']
  }
},
{
  target: 'node',
  entry: './test/all',
  output: {
    path: __dirname + '/dist',
    filename: 'test.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ],
    exclude: [
      {
        test: /etcd_daemon\.ts$/
      }
    ]
  },
  externals: node_modules,
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.ts', '.webpack.js', '.web.js', '.js']
  }
}];
