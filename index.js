#!/usr/bin/env node

'use strict';

const fs = require('fs');
const uuidv4 = require('uuid/v4');
const CryptoJS = require('crypto-js');
const URL = require('url');
const markdown = require('markdown-it')();
const base32 = require('base32');

const exec = require('child_process').exec;

const program = require('commander');

const pkg = require('./package.json');

//
// ---------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------
//

let projectInitializationEntry = function () {
    const config = {
        deploymentTarget: 'https://username.github.io',
        siteName: 'Yet Another Archive',
        masterKey: (uuidv4() + uuidv4() + uuidv4() + uuidv4() + uuidv4()).replace(/-/g, '')
    };

    exec('mkdir source-articles; mkdir html; mkdir html/db; mkdir;');
    exec('touch docs-index.txt; touch html/index.html;');
    exec('rm html/db/*;');

    fs.writeFileSync('archiviation-config.json', JSON.stringify(config));
    fs.writeFileSync('html/robots.txt', [
        'User-agent: *',
        'Crawl-delay: 10',
        'Disallow: /'
    ].join('\n'));
    fs.writeFileSync('.last-build-docs-list.json', '[]');
    fs.writeFileSync('source-articles/Example.txt', 'This is an exmaple article.');

    const indexPageTemplateDefault = fs.readFileSync(__dirname + '/page-template-default.html').toString().replace(/Yet Another Archive/g, config.siteName);
    fs.writeFileSync('html/index.html', indexPageTemplateDefault);

    exec('cd html; bower install crypto-js; bower install bower install https://raw.githubusercontent.com/agnoster/base32-js/master/dist/base32.min.js;');

    console.log('Initialization started. Learn how to use: https://github.com/joyneop/archiviation');
};

let projectBuildingEntry = function () {
    const config = JSON.parse(fs.readFileSync('archiviation-config.json').toString());

    // Rewrite default webpage template
    // Maybe need to change this behavior later
    const indexPageTemplateDefault = fs.readFileSync(__dirname + '/page-template-default.html').toString().replace(/__SITE_TITLE__/g, config.siteName);
    fs.writeFileSync('html/index.html', indexPageTemplateDefault);

    const getDeployedUrlForArticle = function (articleFileName_raw) {
        return config.deploymentTarget + '/#' + getKeyForArticle(articleFileName_raw) + base32.encode(encodeURIComponent(articleFileName_raw));
    };
    const getKeyForArticle = function (articleFileName_raw) {
        return CryptoJS.SHA256(config.masterKey + 'EC5D95CA72B5484A8DB3C6203E87FC484B5CFBA10F824DDBB4846FEC70A2946E9EB15B76614543F9A199F3B2E825BFF1' + articleFileName_raw).toString();
    };
    var theFullListOfAllArticlesAndTheirDeployedUrls = '';
    var articlesDeletedInThisBuild = [];
    var articlesAddedInThisBuild = [];
    var listOfArticles_lastBuild = JSON.parse(fs.readFileSync('.last-build-docs-list.json').toString());
    var listOfArticles_thisBuild = [];
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
                    fs.unlinkSync('html/db/' + base32.encode(CryptoJS.SHA256(articleFileName_raw).toString()));
                    articlesDeletedInThisBuild.push(articleFileName_raw);
                };
            });

            // Compile these articles
            listOfArticles_thisBuild.map(function (articleFileName_raw, iterationCount) {
                var keyForThisArticle = getKeyForArticle(articleFileName_raw);

                fs.writeFileSync('html/db/' + base32.encode(CryptoJS.SHA256(articleFileName_raw).toString()), CryptoJS.AES.encrypt(markdown.render(fs.readFileSync('source-articles/' + articleFileName_raw).toString()), keyForThisArticle).toString());
                theFullListOfAllArticlesAndTheirDeployedUrls += articleFileName_raw + '\n';
                theFullListOfAllArticlesAndTheirDeployedUrls += getDeployedUrlForArticle(articleFileName_raw) + '\n\n';

                // New in this build
                if (listOfArticles_lastBuild.indexOf(articleFileName_raw) === -1) {
                    // New article added to archive
                    articlesAddedInThisBuild.push(articleFileName_raw);
                };

                // Automate `git add`
                articlesAddedInThisBuild.map(function (articleTitle_raw) {
                    exec('cd html; git add db/' + base32.encode(CryptoJS.SHA256(articleFileName_raw).toString()));
                });

                // Last of articles
                if (iterationCount === listOfArticles_thisBuild.length - 1) {
                    // Building reports
                    console.log('Project successfully built.');

                    // Write the index into file
                    fs.writeFileSync('docs-index.txt', theFullListOfAllArticlesAndTheirDeployedUrls);
                    fs.writeFileSync('.last-build-docs-list.json', JSON.stringify(listOfArticles_thisBuild));

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
                };
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


//
// ---------------------------------------------------------------
// Command Interfaces
// ---------------------------------------------------------------
//

program.version(pkg.version);

program.command('init')
    .description('Initialize a project.')
    .action(projectInitializationEntry);

program.command('build')
    .description('Build your contents into the desired static website.')
    .action(projectBuildingEntry);

program.command('list')
    .description('Show all articles in the archive.')
    .action(projectListingEntry);

program.command('fix')
    .description('Show all articles in the archive.')
    .action(projectFixingEntry);

program.parse(process.argv);
