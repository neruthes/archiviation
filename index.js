#!/usr/bin/env node

'use strict';

const fs = require('fs');
const URL = require('url');
const crypto = require('crypto');

const CryptoJS = require('crypto-js');
const markdown = require('markdown-it')();
const base32 = require('base32');
const base64img = require('base64-img');

const exec = require('child_process').exec;

const program = require('commander');

const pkg = require('./package.json');



try {

} catch (e) {
} finally {
}

//
// ---------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------
//

let projectInitializationEntry = function () {
    const config = {
        deploymentTarget: 'https://username.github.io',
        siteName: 'Yet Another Archive',
        masterKey: crypto.prng(256).toString('base64')
    };

    exec('mkdir source-articles; mkdir html; mkdir html/db; mkdir .meta');
    exec('touch .gitignore docs-index.txt html/index.html .meta/last-build-docs-list.json .meta/last-build-docs-checksums.json');
    exec('rm html/db/*;');

    fs.writeFileSync('archiviation-config.json', JSON.stringify(config), function () {});
    fs.writeFileSync('.gitignore', 'html/db/*', function () {});
    fs.writeFileSync('html/robots.txt', [
        'User-agent: *',
        'Crawl-delay: 10',
        'Disallow: /'
    ].join('\n'), function () {});
    fs.writeFileSync('.meta/last-build-docs-list.json', '[]');
    fs.writeFileSync('source-articles/Example.txt', 'This is an example article.\n');
    var hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync('source-articles/Example.txt').toString());
    fs.writeFileSync('.meta/last-build-docs-checksums.json', JSON.stringify({
        'Example.txt': hash.digest('hex')
    }));

    const indexPageTemplateDefault = fs.readFileSync(__dirname + '/page-template-default.html').toString().replace(/Yet Another Archive/g, config.siteName);
    fs.writeFileSync('html/index.html', indexPageTemplateDefault);

    console.log('Initialization done. Learn how to use: https://github.com/neruthes/archiviation');
};

let projectBuildingEntry = function () {
    const config = JSON.parse(fs.readFileSync('archiviation-config.json').toString());
    const dynamicDeterministicSalt = crypto.createHash('sha256').update('9cfbf34fc443455baf19c27f692ecc76-' + config.masterKey.slice(0,16)).digest('hex').slice(0, 8);

    // Rewrite default webpage template
    // Maybe need to change this behavior later
    const indexPageTemplateDefault = (function (template, vars) {
        return template.replace(/__[_\w]+__/g, function (word) {
            return vars[word];
        });
    })(fs.readFileSync(__dirname + '/page-template-default.html').toString(), {
        __SITE_TITLE__: config.siteName,
        __APP_VER__: pkg.version,
    });
    fs.writeFile('html/index.html', indexPageTemplateDefault, function () {});

    const getExportFilenameForArticle = function (articleFileName_raw) {
        var masterSalt = crypto.createHash('sha256').update(config.masterKey.slice(0, 32)).digest('base64');
        var hash = crypto.createHash('sha256');
        return hash.update('9cfbf34fc443455baf19c27f692ecc76|' + masterSalt + articleFileName_raw).digest('base64').replace(/\=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };
    const getUrlQueryArgsForArticle = function (articleFileName_raw) {
        var exportFileName = getExportFilenameForArticle(articleFileName_raw);
        var articleKey = getKeyForArticle(articleFileName_raw);
        return '?key=' + articleKey + '&file=' + exportFileName;
    };
    const getDeployedUrlForArticle = function (articleFileName_raw) {
        return config.deploymentTarget + '/' + getUrlQueryArgsForArticle(articleFileName_raw);
    };
    const getKeyForArticle = function (articleFileName_raw) {
        var hash = crypto.createHash('sha256');
        hash.update(config.masterKey + 'dASz+r+L1GvOUAKrcy9x5q7lXOL/aD7gRLcczwmXJ0iRUtuFEVkeR/UCkkl8LIU1tDzIhCLbePtYdxO70+ligfNziZ98PimpLU8a3NDWrhRsWL46Jlch8piGFaIVl9xhIts2prYs2oMJrsandWjvcss44O+Qjtxm7ZP8ssx9rmw=' + articleFileName_raw);
        return hash.digest('base64').replace(/[+/=]/g, '');
    };
    try {
        var theFullListOfAllArticlesAndTheirDeployedUrls = '';
        var theFullListOfAllArticlesAndTheirDeployedUrls_alt = '';
        var articlesDeletedInThisBuild = [];
        var articlesAddedInThisBuild = [];
        var articlesEditedInThisBuild = [];
        var listOfArticles_lastBuild = JSON.parse(fs.readFileSync('.meta/last-build-docs-list.json').toString());
        var listOfArticles_thisBuild = [];
        var checksumsOfArticles_lastBuild = JSON.parse(fs.readFileSync('.meta/last-build-docs-checksums.json').toString());
        var checksumsOfArticles_thisBuild = JSON.parse(JSON.stringify(checksumsOfArticles_lastBuild));
    } catch (e) {
        projectBuildingEntry();
    } finally {

    }
    exec('ls -1 source-articles', function (err, stdout, stderr) {
        if (stdout || stdout === '') {
            if (stdout === '') { // `source-articles` is empty
                listOfArticles_thisBuild = [];
            } else {
                listOfArticles_thisBuild = stdout.trim().split('\n');
            };

            // Find deleted articles
            listOfArticles_lastBuild.map(function (articleFileName_raw) {
                if (listOfArticles_thisBuild.indexOf(articleFileName_raw) === -1) {
                    // This article has disappeared in the current build
                    var hash = crypto.createHash('sha256');
                    hash.update(articleFileName_raw);
                    fs.unlink('html/db/' + base32.encode(hash.digest('hex')), function () {});
                    articlesDeletedInThisBuild.push(articleFileName_raw);
                };
            });

            // Compile articles
            listOfArticles_thisBuild = listOfArticles_thisBuild.sort();
            listOfArticles_thisBuild.map(function (articleFileName_raw, iterationCount) {
                var keyForThisArticle = getKeyForArticle(articleFileName_raw);

                theFullListOfAllArticlesAndTheirDeployedUrls_alt += `{{LINKTO|${articleFileName_raw}}}\n\n`;
                theFullListOfAllArticlesAndTheirDeployedUrls += articleFileName_raw + '\n';
                theFullListOfAllArticlesAndTheirDeployedUrls += getDeployedUrlForArticle(articleFileName_raw) + '\n\n';

                // Load file
                fs.readFile('source-articles/' + articleFileName_raw, 'utf8', function (err, articleContent) {
                    var isWritingNeeded = false;
                    var hash__articleContent = crypto.createHash('sha256');
                    hash__articleContent.update(articleContent);
                    var articleContentChecksum = hash__articleContent.digest('hex');
                    var articleContent_processed = '';

                    if (articleFileName_raw.match(/\.(png|jpg)$/)) {
                        // Convert images to Base64
                        articleContent_processed = '<img src="DATA">'.replace('DATA', base64img.base64Sync('source-articles/' + articleFileName_raw));
                    } else if (articleFileName_raw.match(/\.(html|htm)$/)) {
                        // HTML
                        articleContent_processed = articleContent;
                    } else {
                        // Regular text files
                        articleContent_processed = markdown.render(articleContent);
                    };

                    // Template: LINKTO
                    articleContent_processed = articleContent_processed.replace(/\{\{LINKTO\|(.+?)\}\}/g, function (match, arg1) {
                        return `<style>.u_d77f62795c78{background:#EEE;} .u_d77f62795c78:hover{background:#CCC;}</style><a class="u_d77f62795c78" style="text-decoration: none; border-radius: 6px; display: inline-block; min-width: 300px; padding: 12px 20px 8px; margin: 0 10px 12px 0;" href="${getUrlQueryArgsForArticle(arg1)}">
                            <span style="font-size: 14px; font-weight: 500; color: #999; line-height: 16px; text-transform: uppercase; display: block; padding: 0;">Link to file</span>
                            <span style="font-size: 20px; color: #000; line-height: 24px;">${arg1}</span>
                        </a>`;
                    });

                    // Add metadata area
                    articleContent_processed = JSON.stringify({
                        filename: articleFileName_raw
                    }) + '\n\n---860c7cfaa67a48e98699777da08c721f---\n\n' + articleContent_processed;

                    if (listOfArticles_lastBuild.indexOf(articleFileName_raw) === -1) {
                        // New article added to archive
                        isWritingNeeded = true;
                        checksumsOfArticles_thisBuild[articleFileName_raw] = articleContentChecksum;
                        articlesAddedInThisBuild.push(articleFileName_raw);
                    } else if (articleContentChecksum !== checksumsOfArticles_lastBuild[articleFileName_raw]) {
                        // This article is modified since last build
                        isWritingNeeded = true;
                        checksumsOfArticles_thisBuild[articleFileName_raw] = articleContentChecksum;
                        articlesEditedInThisBuild.push(articleFileName_raw);
                    };

                    // Write files
                    if (isWritingNeeded) {
                        var hash__articleFileName_raw = crypto.createHash('sha256');

                        fs.writeFile('.meta/last-build-docs-checksums.json', JSON.stringify(checksumsOfArticles_thisBuild), function () {});
                        var exportFileName = getExportFilenameForArticle(articleFileName_raw);
                        fs.writeFile('html/db/.gitkeep', 'Hey Git, do not remove empty directories, please!', function () {});
                        fs.writeFile(
                            'html/db/' + exportFileName + '.db.txt',
                            CryptoJS.AES.encrypt(articleContent_processed, keyForThisArticle).toString(),
                            function () {}
                        );
                    };

                    // Last of articles
                    if (iterationCount === listOfArticles_thisBuild.length - 1) {
                        // Building reports
                        console.log('Project successfully built.');

                        // Write the index as an article
                        fs.writeFile('source-articles/Archive-Index.txt', theFullListOfAllArticlesAndTheirDeployedUrls_alt, function () {});

                        // Write the index into file
                        fs.writeFile('Archive-Index.txt', theFullListOfAllArticlesAndTheirDeployedUrls, function () {});
                        fs.writeFile('.meta/last-build-docs-list.json', JSON.stringify(listOfArticles_thisBuild), function () {});
                        fs.writeFile('.meta/last-build-docs-checksums.json', JSON.stringify(checksumsOfArticles_thisBuild), function () {});

                        // Index change reports
                        if (articlesDeletedInThisBuild.length > 0) {
                            if (articlesDeletedInThisBuild.length === 1) {
                                console.log('\nThe following article is deleted.');
                            } else {
                                console.log('\nThe following articles are deleted.');
                            };
                            console.log('\x1b[31m%s\x1b[0m', articlesDeletedInThisBuild.join('\n').split('\n').map( x => '-\t' + x).join('\n'));
                        };
                        if (articlesAddedInThisBuild.length > 0) {
                            if (articlesAddedInThisBuild.length === 1) {
                                console.log('\nThe following article is added.');
                            } else {
                                console.log('\nThe following articles are added.');
                            };
                            console.log('\x1b[32m%s\x1b[0m', articlesAddedInThisBuild.join('\n').split('\n').map(x => '+\t' + x + '\n\t' + getDeployedUrlForArticle(x)).join('\n'));
                        };
                        if (articlesEditedInThisBuild.length > 0) {
                            if (articlesEditedInThisBuild.length === 1) {
                                console.log('\nThe following article is edited.');
                            } else {
                                console.log('\nThe following articles are edited.');
                            };
                            console.log('\x1b[33m%s\x1b[0m', articlesEditedInThisBuild.join('\n').split('\n').map(x => '*\t' + x + '\n\t' + getDeployedUrlForArticle(x)).join('\n'));
                        };
                    };
                });
            });
        };
        if (err) {
            throw 'ERR when getting articles list';
        };
        if (stderr) {
            throw 'STDERR when getting articles list';
        };
    });
};

let projectListingEntry = function () {
    const config = JSON.parse(fs.readFileSync('archiviation-config.json').toString());
};

let projectFixingEntry = function () {
    const config = JSON.parse(fs.readFileSync('archiviation-config.json').toString());
    fs.writeFileSync('html/index.html', indexPageTemplateDefault);
};

let mkdir_and_touch = function (callback) {
    exec('mkdir source-articles; mkdir html; mkdir html/db; mkdir .meta;');
    exec('touch .gitignore docs-index.txt html/index.html .meta/last-build-docs-list.json .meta/last-build-docs-checksums.json;');
    exec('touch html/.gitkeep; touch html/custom.css; touch html/db/.gitkeep;');
    callback();
};

//
// ---------------------------------------------------------------
// Command Interfaces
// ---------------------------------------------------------------
//

program.version(pkg.version);

program.command('init')
    .description('Initialize a project.')
    .action(projectInitializationEntry);

// Not reliable
program.command('build')
    .description('Build your contents into the desired static website.')
    .action(function () {
        fs.readFile('archiviation-config.json', function (err, res) {
            if (err === null) {
                mkdir_and_touch(projectBuildingEntry);
            } else {
                console.error('Not a valid project directory!');
                process.exit(1);
            };
        });
    });

// program.command('build')
//     .description('Build your contents into the desired static website.')
//     .action(function () {
//         exec('rm html/db/*;');
//         fs.writeFileSync('.meta/last-build-docs-list.json', '[]');
//         fs.writeFile('source-articles/Example.txt', 'This is an example article.\n', function () {
//             var hash = crypto.createHash('sha256');
//             hash.update(fs.readFileSync('source-articles/Example.txt').toString());
//             fs.writeFile('.meta/last-build-docs-checksums.json', JSON.stringify({
//                 // 'Example.txt': CryptoJS.SHA256(fs.readFileSync('source-articles/Example.txt').toString()).toString()
//                 'Example.txt': hash.digest('hex')
//             }), function () {
//                 projectBuildingEntry();
//             });
//         });
//     });

program.command('rebuild')
    .description('Rebuild website, clearing cache, preserving configuration.')
    .action(function () {
        fs.readFile('archiviation-config.json', function (err, res) {
            if (err === null) {
                mkdir_and_touch(function () {
                    exec('rm html/db/*;');
                    fs.writeFileSync('.meta/last-build-docs-list.json', '[]');
                    fs.writeFile('source-articles/Example.txt', 'This is an example article.\n', function () {
                        var hash = crypto.createHash('sha256');
                        hash.update(fs.readFileSync('source-articles/Example.txt').toString());
                        fs.writeFile('.meta/last-build-docs-checksums.json', JSON.stringify({
                            // 'Example.txt': CryptoJS.SHA256(fs.readFileSync('source-articles/Example.txt').toString()).toString()
                            'Example.txt': hash.digest('hex')
                        }), function () {
                            projectBuildingEntry();
                        });
                    });
                });
            } else {
                console.error('Not a valid project directory!');
                process.exit(1);
            };
        });


    });

program.command('list')
    .description('Show all articles in the archive.')
    .action(projectListingEntry);

program.command('fix')
    .description('Show all articles in the archive.')
    .action(projectFixingEntry);

program.parse(process.argv);
