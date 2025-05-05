import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import readline from "readline";
import { diffLines } from "diff";
import chalk from "chalk";

class Lit {
  constructor(repoPath = ".") {
    this.repoPath = path.resolve(repoPath, ".lit");
    this.objectsPath = path.join(this.repoPath, "objects"); // .lit/objects
    this.headPath = path.join(this.repoPath, "HEAD"); // .lit/HEAD
    this.indexPath = path.join(this.repoPath, "index"); // .lit/index
    this.init();
  }

  async init() {
    await fs.mkdir(this.objectsPath, { recursive: true });
    try {
      await fs.writeFile(this.headPath, "", { flag: "wx" }); // Create HEAD file if it doesn't exist
      await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: "wx" }); // Create index file if it doesn't exist
    } catch (err) {
      console.log("Already initialized .lit folder");
    }
  }

  hashObject(content) {
    return crypto.createHash("sha1").update(content, "utf-8").digest("hex");
  }

  async add(fileToBeAdded) {
    // fileToBeAdded: path/to/file
    const fileData = await fs.readFile(fileToBeAdded, { encoding: "utf-8" }); // read the file
    const fileHash = this.hashObject(fileData); // hash the file
    console.log(fileHash);
    const newFileHashedObjectPath = path.join(this.objectsPath, fileHash); // .groot/objects/abc123
    await fs.writeFile(newFileHashedObjectPath, fileData);
    await this.updateStagingArea(fileToBeAdded, fileHash);
    console.log(`Added ${fileToBeAdded}`);
  }

  async updateStagingArea(filePath, fileHash) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    );

    index.push({ path: filePath, hash: fileHash }); // Add the file to the index
    await fs.writeFile(this.indexPath, JSON.stringify(index), {
      encoding: "utf-8",
    });
  }

  async commit(message) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    );
    const parentCommit = await this.getCurrentHead(); // Get the current HEAD commit hash

    const commitData = {
      timestamp: new Date().toISOString(),
      message: message,
      files: index,
      parent: parentCommit,
    };

    const commitHash = this.hashObject(JSON.stringify(commitData)); // Hash the commit data
    const commitPath = path.join(this.objectsPath, commitHash); // .lit/objects/abc123

    await fs.writeFile(commitPath, JSON.stringify(commitData)); // Write the commit data to a file
    await fs.writeFile(this.headPath, commitHash); // Update the HEAD file to point to the new commit
    await fs.writeFile(this.indexPath, JSON.stringify([])); // Clear the index after commit
    console.log(`Committed successfully with hash: ${commitHash}`);
  }

  async getCurrentHead() {
    try {
      return await fs.readFile(this.headPath, { encoding: "utf-8" });
    } catch (err) {
      return null; // If HEAD file doesn't exist, return null
    }
  }

  async log() {
    let currentCommitHash = await this.getCurrentHead(); // Get the current HEAD commit hash
    while (currentCommitHash) {
      const commitPath = path.join(this.objectsPath, currentCommitHash); // .lit/objects/abc123
      const commitData = JSON.parse(
        await fs.readFile(commitPath, { encoding: "utf-8" })
      );
      console.log(`Commit: ${currentCommitHash}`);
      console.log(`Message: ${commitData.message}`);
      console.log(`Timestamp: ${commitData.timestamp}`);
      console.log(`Files:`);
      commitData.files.forEach((file) => {
        console.log(`  - ${file.path} (${file.hash})`);
      });
      console.log("--------------------");
      currentCommitHash = commitData.parent; // Move to the parent commit
    }
  }

  async getCommitData(commitHash) {
    const commitPath = path.join(this.objectsPath, commitHash); // .lit/objects/abc123
    try {
      const commitData = JSON.parse(
        await fs.readFile(commitPath, { encoding: "utf-8" })
      );
      return commitData;
    } catch (err) {
      console.error(`Commit ${commitHash} not found.`, err);
      return null;
    }
  }

  async getFileContent(fileHash) {
    const filePath = path.join(this.objectsPath, fileHash); // .lit/objects/abc123
    try {
      const fileContent = await fs.readFile(filePath, {
        encoding: "utf-8",
      });
      return fileContent;
    } catch (err) {
      console.error(`File ${fileHash} not found.`, err);
      return null;
    }
  }

  async getParentFileContent(parentCommitData, filePath) {
    const parentFile = parentCommitData.files.find((f) => f.path === filePath);
    if (parentFile) {
      const parentFileContent = await this.getFileContent(parentFile.hash); // Get the parent file content
      if (parentFileContent) {
        return parentFileContent; // Return the parent file content
      }
    }
  }

  async showCommitDiff(commitHash) {
    const commitData = await this.getCommitData(commitHash);
    if (!commitData) return;

    console.log("Changes in last commit:");

    for (const file of commitData.files) {
      const filePath = path.join(this.repoPath, file.path); // Get the full path of the file
      try {
        console.log(`File: ${file.path}`);
        const fileContent = await this.getFileContent(file.hash); // Get the file content from the commit
        if (fileContent) {
          console.log(`Content:\n${fileContent}`); // Print the file content
        }

        if (commitData.parent) {
          const parentCommitData = await this.getCommitData(commitData.parent);
          const getParentFileContent = await this.getParentFileContent(
            parentCommitData,
            file.path
          ); // Get the parent file content

          if (getParentFileContent !== undefined) {
            console.log("\nDiff:\n");
            const diff = diffLines(getParentFileContent, fileContent); // Get the diff between the parent and current file content
            diff.forEach((part) => {
              if (part.added) {
                process.stdout.write(chalk.green(`+${part.value}`)); // Added lines
              } else if (part.removed) {
                process.stdout.write(chalk.red(`-${part.value}`)); // Removed lines
              } else {
                process.stdout.write(chalk.grey(part.value)); // Unchanged lines
              }
            });
            console.log("\n"); // New line after diff
          } else {
            console.log("New file in this commit");
          }
        } else {
          console.log("First commit");
        }
      } catch (err) {
        console.error(`Error reading file ${file.path}:`, err);
      }
    }
  }
}

const lit = new Lit(process.cwd());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("lit> ", async (input) => {
    const [cmd, ...args] = input.split(" ");

    if (cmd === "add") {
      await lit.add(args[0]);
    } else if (cmd === "commit") {
      await lit.commit(args.join(" "));
    } else if (cmd === "log") {
      await lit.log();
    } else if (cmd === "diff") {
      const commitHash = args[0] || (await lit.getCurrentHead());
      await lit.showCommitDiff(commitHash);
    } else if (cmd === "log") {
      await lit.log();
    } else if (cmd === "exit") {
      rl.close();
      return;
    } else {
      console.log(`Unknown command: ${cmd}`);
    }

    prompt();
  });
}

prompt();
