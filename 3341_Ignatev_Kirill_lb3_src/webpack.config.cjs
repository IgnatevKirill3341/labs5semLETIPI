const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        app: './src/js/app.js',
        friends: './src/js/friends.js',
        news: './src/js/news.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist-webpack'),
        filename: 'js/[name].[contenthash].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/index.html',
            filename: 'index.html',
            chunks: ['app'],
            inject: 'body'
        }),
        new HtmlWebpackPlugin({
            template: './src/html/friends.html',
            filename: 'friends.html',
            chunks: ['friends'],
            inject: 'body'
        }),
        new HtmlWebpackPlugin({
            template: './src/html/news.html',
            filename: 'news.html',
            chunks: ['news'],
            inject: 'body'
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash].css'
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin()
        ]
    },
    resolve: {
        extensions: ['.js', '.json']
    }
};

