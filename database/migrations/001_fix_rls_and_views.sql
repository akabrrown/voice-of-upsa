            // Alias react for switching between default set and share subset.
                        oneOf: [
                            {
                                issuerLayer: _utils.isWebpackServerOnlyLayer,
                                test: {
                                    // Resolve it if it is a source code file, and it has NOT been
                                    // opted out of bundling.
                                    and: [
                                        aliasCodeConditionTest,
                                        {
                                            not: [
                                                optOutBundlingPackageRegex,
                                                asyncStoragesRegex
                                            ]
                                        }
                                    ]
                                },
                                resolve: {
                                    // It needs `conditionNames` here to require the proper asset,
                                    // when react is acting as dependency of compiled/react-dom.
                                    alias: (0, _createcompileraliases.createRSCAliases)(bundledReactChannel, {
                                        reactProductionProfiling,
                                        layer: _constants.WEBPACK_LAYERS.reactServerComponents,
                                        isEdgeServer
                                    })
                                }
                            },
                            {
                                test: aliasCodeConditionTest,
                                issuerLayer: _constants.WEBPACK_LAYERS.serverSideRendering,
                                resolve: {
                                    alias: (0, _createcompileraliases.createRSCAliases)(bundledReactChannel, {
                                        reactProductionProfiling,
                                        layer: _constants.WEBPACK_LAYERS.serverSideRendering,
                                        isEdgeServer
                                    })
                                }
                            }
                        ]
                    },
                    {
                        test: aliasCodeConditionTest,
                        issuerLayer: _constants.WEBPACK_LAYERS.appPagesBrowser,
                        resolve: {
                            alias: (0, _createcompileraliases.createRSCAliases)(bundledReactChannel, {
                                reactProductionProfiling,
                                layer: _constants.WEBPACK_LAYERS.appPagesBrowser,
                                isEdgeServer
                            })
                        }
                    }
                ] : [],
                // Do not apply react-refresh-loader to node_modules for app router browser layer
                ...hasAppDir && dev && isClient ? [
                    {
                        test: codeCondition.test,
                        exclude: [
                            // exclude unchanged modules from react-refresh
                            codeCondition.exclude,
                            transpilePackagesRegex,
                            precompileRegex
                        ],
                        issuerLayer: _constants.WEBPACK_LAYERS.appPagesBrowser,
                        use: reactRefreshLoaders,
                        resolve: {
                            mainFields: (0, _resolve.getMainField)(compilerType, true)
                        }
                    }
                ] : [],
                {
                    oneOf: [
                        {
                            ...codeCondition,
                            issuerLayer: _constants.WEBPACK_LAYERS.api,
                            parser: {
                                // Switch back to normal URL handling
                                url: true
                            },
                            use: apiRoutesLayerLoaders
                        },
                        {
                            test: codeCondition.test,
                            issuerLayer: _constants.WEBPACK_LAYERS.middleware,
                            use: middlewareLayerLoaders
                        },
                        {
                            test: codeCondition.test,
                            issuerLayer: _constants.WEBPACK_LAYERS.instrument,
                            use: instrumentLayerLoaders
                        },
                        ...hasAppDir ? [
                            {
                                test: codeCondition.test,
                                issuerLayer: _utils.isWebpackServerOnlyLayer,
                                exclude: asyncStoragesRegex,
                                use: appServerLayerLoaders
                            },
                            {
                                test: codeCondition.test,
                                resourceQuery: new RegExp(_constants.WEBPACK_RESOURCE_QUERIES.edgeSSREntry),
                                use: appServerLayerLoaders
                            },
                            {
                                test: codeCondition.test,
                                issuerLayer: _constants.WEBPACK_LAYERS.appPagesBrowser,
                                // Exclude the transpilation of the app layer due to compilation issues
                                exclude: browserNonTranspileModules,
                                use: appBrowserLayerLoaders,
                                resolve: {
                                    mainFields: (0, _resolve.getMainField)(compilerType, true)
                                }
                            },
                            {
                                test: codeCondition.test,
                                issuerLayer: _constants.WEBPACK_LAYERS.serverSideRendering,
                                exclude: asyncStoragesRegex,
                                use: appSSRLayerLoaders,
                                resolve: {
                                    mainFields: (0, _resolve.getMainField)(compilerType, true)
                                }
                            }
                        ] : [],
                        {
                            ...codeCondition,
                            use: [
                                ...reactRefreshLoaders,
                                defaultLoaders.babel
                            ]
                        }
                    ]
                },
                ...!config.images.disableStaticImages ? [
                    {
                        test: nextImageLoaderRegex,
                        loader: "next-image-loader",
                        issuer: {
                            not: _css.regexLikeCss
                        },
                        dependency: {
                            not: [
                                "url"
                            ]
                        },
                        resourceQuery: {
                            not: [
                                new RegExp(_constants.WEBPACK_RESOURCE_QUERIES.metadata),
                                new RegExp(_constants.WEBPACK_RESOURCE_QUERIES.metadataRoute),
                                new RegExp(_constants.WEBPACK_RESOURCE_QUERIES.metadataImageMeta)
                            ]
                        },
                        options: {
                            isDev: dev,
                            compilerType,
                            basePath: config.basePath,
                            assetPrefix: config.assetPrefix
                        }
                    }
                ] : [],
                ...isEdgeServer ? [
                    {
                        resolve: {
                            fallback: {
                                process: require.resolve("./polyfills/process")
                            }
                        }
                    }
                ] : isClient ? [
                    {
                        resolve: {
                            fallback: config.experimental.fallbackNodePolyfills === false ? {
                                assert: false,
                                buffer: false,
                                constants: false,
                                crypto: false,
                                domain: false,
                    