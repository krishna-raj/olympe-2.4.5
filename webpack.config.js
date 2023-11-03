const path = require('path');
const {IgnorePlugin} = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const Copy = require('copy-webpack-plugin');
const {merge} = require('webpack-merge');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const packageFile = require('./package.json');
const version = packageFile.version || Date.now().toString();

const drawBuildPath = path.join(__dirname, 'dist/draw');
const webBuildPath = path.join(__dirname, 'dist/web');
const nodeBuildPath = path.join(__dirname, 'dist/node');

const drawPath = path.resolve(__dirname, 'node_modules/@olympeio/draw');

const versionReplaceFunction = function (versionDir, version) {
    return new ReplaceInFileWebpackPlugin([
       {
           dir: versionDir,
           files: ['version.json'],
           rules: [
               {
                   search: /(?:\"version)(?:\"\s?:\s?\")(.*)(?:\")/,
                   replace: `"version": "${version}"`
               }
           ]
       }
   ]);
};

const common = {
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {test: /\.(tsx?)$/, use: 'ts-loader', exclude: /node_modules/},
            {test: /\.js$/, enforce: "pre", use: "source-map-loader"},
            {test: /\.js$/, enforce: "pre", use: "webpack-import-glob-loader"},
            {test: /\.css$/i, use: ["style-loader", "css-loader"]},
            {
                test: /\.jsx$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: { presets: ["@babel/env", "@babel/react"] }
            },
            {
                test: /\.css$/,
                exclude: /(node_modules|bower_components)/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: ['.js', 'jsx', '.tsx', '.ts'],
        alias: {
            '@olympeio': path.resolve(__dirname, 'node_modules/@olympeio'),
            '@olympeio-extensions': path.resolve(__dirname, 'node_modules/@olympeio-extensions')
        }
    },
    plugins: [
        new CleanWebpackPlugin(),
        new Copy({patterns: [
            {from: drawPath + '/version.json', to: 'version.json'}
        ]})
    ],
    // Accept to import empty folders
    ignoreWarnings: [
        {message: /Failed to parse source map/},
        {message: /Empty results for "import '\.\/bricks\/((common|web|node)\/)?\*\*\/\*\.(jsx?|tsx?)'"/}
    ]
};

const server = {
    devServer: {
        port: 8888,
        client: {
            overlay: {
                warnings: false
            }
        },
        static: {
            directory: path.join(__dirname, 'dist/server')
        },
        devMiddleware: {
            writeToDisk: true
        }
    }
};

const draw = {
    entry: './src/main-web.js',
    name: 'draw',
    output: {path: drawBuildPath, globalObject: 'this'},
    resolve: {
        alias: {olympe: drawPath}
    },
    plugins: [
        new Copy({patterns: [
            {from: 'res/oConfig.json', to:'oConfig.json'},
            {from: drawPath + '/index.html', to: 'index.html'},
            {from: drawPath + '/images', to: 'images'},
            {from: drawPath + '/fonts', to: 'fonts'},
            {from: drawPath + '/css', to: 'css'},
            {from: drawPath + '/doc', to: 'doc'},
            {from: drawPath + '/maintenance', to: 'maintenance'},
        ]}),
        new ReplaceInFileWebpackPlugin([
            {
                dir: drawBuildPath,
                files: ['index.html'],
                rules: [
                    {search: '$VERSION', replace: version},
                    {search: '$VERSION', replace: version}
                ]
            }
        ]),
        versionReplaceFunction(drawBuildPath, version)
    ]
};

const web = {
    entry: './src/main-web.js',
    name: 'web',
    output: {path: webBuildPath, globalObject: 'this'},
    resolve: {
        alias: {olympe: path.resolve(__dirname, 'node_modules/@olympeio/runtime-web')}
    },
    plugins: [
        new Copy({patterns: [{from: 'res/oConfig.json', to:'oConfig.json'}]}),
        versionReplaceFunction(webBuildPath, version)
    ],
};

const node = {
    entry: './src/main-node.js',
    name: 'node',
    output: {path: nodeBuildPath, globalObject: 'this'},
    target: 'node',
    resolve: {
        alias: {olympe: path.resolve(__dirname, 'node_modules/@olympeio/runtime-node')}
    },
    plugins: [
        new Copy({patterns: [{from: 'res/oConfigNode.json', to:'oConfig.json'}]}),
        new IgnorePlugin({resourceRegExp: /^(mssql*|mariasql|.oracle|oracledb|mysql|mysql2|mssql.|tedious|sqlite3|better-sqlite3|@vscode\/sqlite3|pg-query-stream|pg-native|node-pre-gyp)$/}),
        versionReplaceFunction(nodeBuildPath, version)
    ],
    ignoreWarnings: [
        {module: /fast-json-stringify/, message: /Can't resolve 'long'/},
        {module: /pino/, message: /Can't resolve 'pino-pretty'/},
        {module: /knex/, message: /Critical dependency: the request of a dependency is an expression/},
    ]
};

module.exports = [merge(common, server, draw), merge(common, server, web), merge(common, node)];
