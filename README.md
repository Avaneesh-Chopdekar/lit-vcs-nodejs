# Lit - Version Control System

## What is Lit?

Lit is a version control system that allows you to manage your source code in a simple and easy way.

## How to use Lit?

To use Lit, you need to copy the index.js file to your project and run the following command:

```
node index.js
```

Lit's command line interface appears and you can directly run lit's commands.

## Features

- Add files to the staging area
- Remove files from the staging area
- Commit changes
- View commit history
- View changes between commits

## Getting started

To get started with lit, add index.js file to your project and run the following command:

```
node index.js
```

This initializes a new lit repository in the current directory and starts the command line interface. You can now use lit's commands to manage your source code.

### Adding files to the staging area

To add files to the staging area, use the following command:

```
lit> add example.txt
```

### Committing changes

To commit changes, use the following command:

```
lit> commit Initial commit
```

You don't need to mention quotes around the commit message, lit will do that for you.

### Viewing commit history

To view commit history, use the following command:

```
lit> log
```

### Viewing changes between commits

To view changes in current head commit, use the following command:

```
lit> diff
```

You can also specify a commit hash to view changes in a specific commit:

```
lit> diff abc123
```
