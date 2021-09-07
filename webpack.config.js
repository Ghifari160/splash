const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports =  (env, options) => {
    const isDevelopment = (options.mode == "development") ? true : false;

    return {
        entry: "./src/pages/js/index.js",
        output:
        {
            filename: "app.js",
            path: path.resolve(__dirname, "dist"),
        },
        module:
        {
            rules: [
                {
                    test: /.(js|jsx)$/,
                    exclude: /node_modules/,
                    use:
                    {
                        loader: "babel-loader",
                    }
                },
                {
                    test: /.scss$/,
                    use: [
                        isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader",
                            options:
                            {
                                sourceMap: isDevelopment,
                            }
                        },
                        {
                            loader: "sass-loader",
                            options:
                            {
                                sourceMap: isDevelopment,
                                implementation: require("sass"),
                                sassOptions: { fiber: false },
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: "app.css",
                chunkFilename: "app.css"
            }),
            new HtmlWebPackPlugin({
                template: "./src/pages/error.html",
                filename: "error.html",
                inject: "head",
                scriptLoading: "blocking",
            }),
            new HtmlWebPackPlugin({
                template: "./src/pages/splash.html",
                filename: "splash.html",
                inject: "head",
                scriptLoading: "blocking",
            })
        ]
    };
};
