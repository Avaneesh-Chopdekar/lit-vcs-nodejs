import path from "path";
import fs from "fs/promises";

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
}

const lit = new Lit(process.cwd());
