# Archiviation (work-in-progress)

A way to publish text with GitHub Pages without allowing everyone to read.

Note: This software does not have a stable version yet.

## Explain Like You Are A Developer

Archiviation encrypts your text files with AES, in which the encryption key is `SHA256(master_key + random_chars + filename)`. The master key is generated during initialization, consisting of 5 UUIDs.

A file can be accessed online with a URL like `https://username.github.io/#0f453f27ffffa5b60ddd5dffffc38344a04e33e310bdbd2e6b0bb4cb45680d878nw62vbgdhjjwx3reg`, after you push the repository to GitHub Pages (or any other web server). The identifier consists of the 64-character-long AES encryption key (hex) and the filename hash (base32). The page will load the file with XMLHttpRequest from `https://username.github.io/db/{{ SHA256("9cfbf34fc443455baf19c27f692ecc76|" + masterKey.slice(0, 32) + filename).toString("hex") }}`. So you do not have to worry about the sensitivity of file names; the URL itself cannot be used to infer the filename.

This approach should probably be cryptographically strong enough. Probably!

## Use

### Dependencies

- `node`
- `npm`

### Installation

Install through NPM:

```
$ npm install -g archiviation
```

If NPM is not available:

```
$ git clone https://github.com/neruthes/archiviation.git
$ cd archiviation
$ npm install .
$ npm link
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

You are supposed to `git init` in `/html`.

## Copyright

Author: Neruthes (a.k.a. J.N.)

License: AGPL.
