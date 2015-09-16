module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        replace: {
                version: {
                        src: ['worldpay-js/worldpay-cse.js'],
                        dest: 'build/worldpay-cse.js',
                        replacements: [{
                                from: 'COM_WORLDPAY_LIBVERSION',
                                to: '<%=pkg.version%>'
                        }]
                }
        },

        clean: ['dist/*', 'test-reports/*', 'coverage-reports/*', 'build/*'],

        jshint: {
            files: ['worldpay-js/*.js', 'unittest-js/*.js']
        },

        uglify: {
            options: {
                wrap: true,
                banner: '<%=grunt.file.read("worldpay-js/license-header.js")%>'
            },
            build: {
                files: {
                    'dist/worldpay-cse-<%=pkg.version%>.min.js': [
                        'worldpay-js/lib/define.js',
                        'worldpay-js/lib/sjcl.js',
                        'worldpay-js/lib/jsbn.js',
                        'worldpay-js/lib/prng4.js',
                        'worldpay-js/lib/rng.js',
                        'worldpay-js/lib/rsa.js',
                        'worldpay-js/lib/jsbn-rsa-patch.js',
                        'build/worldpay-cse.js'
                    ]
                }
            }
        },

        qunit_junit: {
            options: {
                dest: 'test-reports'
            }
        },

        qunit: {
            dev: {
                options: {
                    '--web-security': 'no',
                    coverage: {
                        disposeCollector: true,
                        src: ['worldpay-js/*.js'],
                        instrumentedFiles: 'temp/',
                        htmlReport: 'coverage-reports/html',
                        coberturaReport: 'coverage-reports',
                        linesThresholdPct: 85
                    }
                },
                src: ['unittest-js/cse-testrunner.html']
            },
            dist: {
                src: ['build/test/cse-dist-testrunner.html']
            }
        },

        //Must build the dist test runner dynamically to pull in the correct compiled version
        htmlbuild: {
            dist: {
                src: 'unittest-js/cse-dist-testrunner.html',
                dest: 'build/test/',
                options: {
                    relative: true,
                    scripts: {
                        compiledLibrary: 'dist/worldpay-cse-<%=pkg.version%>.min.js',
                        testLibs: ['unittest-js/lib/qunit-*.js', 'unittest-js/lib/*.js'],
                        unitTests: 'unittest-js/*.js'
                    },
                    styles: {
                        testStyle: 'unittest-js/lib/*.css'
                    }
                }
            }
        },

        jsdoc: {
            dist : {
                src: ['worldpay-js/worldpay-cse.js'],
                options: {
                    destination: 'build/doc'
                }
            }
        },

        compress: {
            docs: {
                options: {
                    mode: 'zip',
                    archive: 'dist/worldpay-cse-<%=pkg.version%>-docs.zip'
                },
                files: [
                    {expand: true, cwd: 'build/doc', src: ['**']}
                ]
            }
        },

        maven_deploy: {
            options: {
                goal: 'deploy',
                packaging: 'tgz',
                file: function(options) {
                    return 'dist/' +
                           options.artifactId + '-' +
                           options.version + '.' +
                           options.packaging;
                },
                groupId: 'com.worldpay.gateway.component',
                artifactId: 'com-worldpay-gateway-component-cse-js',
                injectDestFolder: false
            },
            release: {
                options: {
                    repositoryId: 'nexus.release',
                    url: '[REDACTED]'
                },
                files : [
                    {expand: true, cwd: 'dist', src: ['worldpay-cse-<%=pkg.version%>.min.js']},
                    {expand: true, cwd: 'deploy-scripts', src: ['install.sh'], dest: 'scripts'}
                ]
            },
            snapshot: {
                options: {
                    snapshot: true,
                    repositoryId: 'nexus.snapshot',
                    url: '[REDACTED]'
                },
                files : [
                    {expand: true, cwd: 'dist', src: ['worldpay-cse-<%=pkg.version%>.min.js']},
                    {expand: true, cwd: 'deploy-scripts', src: ['install.sh'], dest: 'scripts'}
                ]
            }
        }

    });

    // Load tasks from packages
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-html-build');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-qunit-istanbul');
    grunt.loadNpmTasks('grunt-qunit-junit');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-maven-deploy');

    //Main tasks
    grunt.registerTask('check', ['jshint', 'qunit_junit', 'qunit:dev']);
    grunt.registerTask('dist', [
        'clean', 'jshint', 'replace', 'uglify:build', 'htmlbuild:dist',
        'qunit_junit', 'qunit:dist', 'jsdoc', 'compress:docs'
    ]);
    grunt.registerTask('deploy-snapshot', ['dist', 'maven_deploy:snapshot']);
    grunt.registerTask('deploy-release', ['dist', 'maven_deploy:release']);
    grunt.registerTask('default', [
        'clean', 'jshint', 'replace', 'uglify:build', 'qunit_junit',
        'qunit:dev', 'jsdoc', 'compress:docs'
    ]);
};
