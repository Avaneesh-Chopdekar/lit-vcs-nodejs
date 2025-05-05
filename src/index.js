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
    // await this.updateStagingArea(fileToBeAdded, fileHash);
    console.log(`Added ${fileToBeAdded}`);
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
