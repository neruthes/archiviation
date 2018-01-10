# Archiviation (work-in-progress)

The best way to publish text with GitHub Pages without allowing everyone to read.

Note: This software does not have a stable version yet.

## Explain Like You Are A Developer

Archiviation encrypts your text files with AES, in which the encryption key is `SHA256(master_key + random_chars + filename)`. The master key is generated during initialization, consisting of 5 UUIDs.

A file can be accessed online with a URL like `https://username.github.io/#0f453f27ffffa5b60ddd5dffffc38344a04e33e310bdbd2e6b0bb4cb45680d878nw62vbgdhjjwx3reg`, after you push the repository to GitHub Pages (or any other web server). The identifier consists of the 64-character-long AES encryption key (hex) and the filename (base32). The page will load the file with XMLHttpRequest from `https://username.github.io/db/{{ SHA256(filename) }}`. So you do not have to worry that filenames are sensitive enough.

This approach should probably be cryptographically strong enough. Probably!

## Use

### Dependencies

- node
- npm
- bower

Minor dependencies will be installed automatically when you run `npm install .` command.

### Installation

```
$ git clone https://github.com/joyneop/archiviation.git
$ cd archiviation
$ npm install .
$ npm link
```

When I publish Archiviation on NPM, these steps will be simplified to:

```
$ npm install -g archiviation
```

### Initialization

Get inside a directory which you would like to store your project.

```
$ archiviation init
$ archiviation build
$ cat docs-index.txt
```

### Configuration

All information you are able to configure is in `/archiviation-config.json`.

### Management

You may add plaintext files in `/source-articles`.

### Publishing

You are supposed to `git init` in `/html`, and only

## Copyright

Author: Joy Neop (a.k.a. Neruthes)

License: MIT License.
