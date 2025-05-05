import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import readline from "readline";

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
