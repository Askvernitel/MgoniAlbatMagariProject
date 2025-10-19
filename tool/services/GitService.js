// GitService.js
// Install: npm install simple-git
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import zlib from "zlib"
class GitService {
  constructor(repoPath = '.') {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Get repository metadata
   */
  async getMetadata() {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new Error('Not a git repository');
      }

      const [branch, log, status, remotes, branches, tags] = await Promise.all([
        this.git.branchLocal(),
        this.git.log({ maxCount: 10 }),
        this.git.status(),
        this.git.getRemotes(true),
        this.git.branch(),
        this.git.tags()
      ]);

      return {
        currentBranch: branch.current,
        latestCommit: log.latest ? {
          hash: log.latest.hash,
          shortHash: log.latest.hash.substring(0, 7),
          author: log.latest.author_name,
          email: log.latest.author_email,
          date: log.latest.date,
          message: log.latest.message,
          body: log.latest.body
        } : null,
        recentCommits: log.all.map(commit => ({
          hash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          author: commit.author_name,
          date: commit.date,
          message: commit.message
        })),
        status: {
          modified: status.modified,
          created: status.created,
          deleted: status.deleted,
          renamed: status.renamed,
          staged: status.staged,
          notAdded: status.not_added,
          conflicted: status.conflicted,
          isClean: status.isClean(),
          ahead: status.ahead,
          behind: status.behind
        },
        remotes: remotes.map(r => ({
          name: r.name,
          fetchUrl: r.refs.fetch,
          pushUrl: r.refs.push
        })),
        branches: {
          all: branches.all,
          current: branches.current,
          local: branches.branches
        },
        tags: tags.all
      };
    } catch (err) {
      throw new Error(`Failed to get metadata: ${err.message}`);
    }
  }

  /**
   * Build file hierarchy tree
   */
  async getFileHierarchy(rootPath = '.', includeGitInfo = true) {
    const fullPath = path.join(this.repoPath, rootPath);
    return await this._buildTree(fullPath, rootPath, includeGitInfo);
  }

  /**
   * Recursively build directory tree
   */
  async _buildTree(fullPath, relativePath, includeGitInfo) {
    try {
      const stats = await fs.stat(fullPath);
      const name = path.basename(fullPath);

      // Skip .git directory and node_modules
      if (name === '.git' || name === 'node_modules') {
        return null;
      }

      const node = {
        name,
        path: relativePath === '.' ? name : relativePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime
      };

      // Add git information for files
      if (includeGitInfo && stats.isFile()) {
        try {
          const gitInfo = await this._getFileGitInfo(relativePath);
          node.git = gitInfo;
        } catch (err) {
          // File might not be tracked
          node.git = { tracked: false };
        }
      }

      // Recursively process directories
      if (stats.isDirectory()) {
        const entries = await fs.readdir(fullPath);
        const children = await Promise.all(
          entries.map(entry => 
            this._buildTree(
              path.join(fullPath, entry),
              path.join(relativePath, entry),
              includeGitInfo
            )
          )
        );
        
        node.children = children.filter(child => child !== null);
        node.fileCount = this._countFiles(node);
        node.dirCount = this._countDirs(node);
      }

      return node;
    } catch (err) {
      console.error(`Error processing ${fullPath}:`, err.message);
      return null;
    }
  }

  /**
   * Get git information for a specific file
   */
  async _getFileGitInfo(filePath) {
    try {
      // Get last commit for this file
      const log = await this.git.log({ file: filePath, maxCount: 1 });
      
      if (log.latest) {
        return {
          tracked: true,
          lastCommit: {
            hash: log.latest.hash.substring(0, 7),
            author: log.latest.author_name,
            date: log.latest.date,
            message: log.latest.message
          }
        };
      }
      
      return { tracked: false };
    } catch (err) {
      return { tracked: false };
    }
  }

  /**
   * Count files in tree
   */
  _countFiles(node) {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    return node.children.reduce((sum, child) => sum + this._countFiles(child), 0);
  }

  /**
   * Count directories in tree
   */
  _countDirs(node) {
    if (node.type === 'file') return 0;
    if (!node.children) return 1;
    return 1 + node.children.reduce((sum, child) => sum + this._countDirs(child), 0);
  }

  /**
   * Get flattened list of all files
   */
  async getFileList(includeGitInfo = true) {
    const tree = await this.getFileHierarchy('.', includeGitInfo);
    return this._flattenTree(tree);
  }

  /**
   * Flatten tree structure
   */
  _flattenTree(node, list = []) {
    if (node.type === 'file') {
      list.push(node);
    }
    
    if (node.children) {
      node.children.forEach(child => this._flattenTree(child, list));
    }
    
    return list;
  }

  /**
   * Get tracked files only
   */
  async getTrackedFiles() {
    try {
      const files = await this.git.raw(['ls-files']);
      return files.trim().split('\n').filter(f => f);
    } catch (err) {
      throw new Error(`Failed to get tracked files: ${err.message}`);
    }
  }

  /**
   * Get file status
   */
  async getFileStatus(filePath) {
    try {
      const status = await this.git.status([filePath]);
      return {
        path: filePath,
        modified: status.modified.includes(filePath),
        created: status.created.includes(filePath),
        deleted: status.deleted.includes(filePath),
        staged: status.staged.includes(filePath)
      };
    } catch (err) {
      throw new Error(`Failed to get file status: ${err.message}`);
    }
  }

  /**
   * Search files by name pattern
   */
  async searchFiles(pattern) {
    const tree = await this.getFileHierarchy('.', false);
    const files = this._flattenTree(tree);
    const regex = new RegExp(pattern, 'i');
    return files.filter(file => regex.test(file.name));
  }

  /**
   * Get directory summary
   */
  async getDirectorySummary(dirPath = '.') {
    const tree = await this.getFileHierarchy(dirPath, true);
    return {
      path: dirPath,
      totalFiles: this._countFiles(tree),
      totalDirs: this._countDirs(tree),
      tree
    };
  }

  /**
   * Get files in a specific branch
   */
  async getBranchFiles(branchName) {
    try {
      // Check if branch exists
      const branches = await this.git.branch();
      if (!branches.all.includes(branchName)) {
        throw new Error(`Branch '${branchName}' does not exist`);
      }

      // Get list of files in the branch
      const files = await this.git.raw(['ls-tree', '-r', '--name-only', branchName]);
      const fileList = files.trim().split('\n').filter(f => f);

      console.log(`Found ${fileList.length} files in branch ${branchName}`);

      // Get file contents and metadata
      const fileContents = await Promise.all(
        fileList.map(async (filePath) => {
          try {
            // Use array notation for git.show
            const content = await this.git.show([`${branchName}:${filePath}`]);
            const log = await this.git.log({ 
              file: filePath, 
              maxCount: 1,
              branch: branchName 
            });

            return {
              path: filePath,
              content,
              size: Buffer.byteLength(content, 'utf8'),
              lastCommit: log.latest ? {
                hash: log.latest.hash.substring(0, 7),
                author: log.latest.author_name,
                date: log.latest.date,
                message: log.latest.message
              } : null
            };
          } catch (err) {
            console.error(`Error reading file ${filePath} from ${branchName}:`, err.message);
            return {
              path: filePath,
              error: `Failed to read file: ${err.message}`,
              content: null
            };
          }
        })
      );

      return {
        branch: branchName,
        fileCount: fileList.length,
        files: fileContents
      };
    } catch (err) {
      throw new Error(`Failed to get branch files: ${err.message}`);
    }
  }

  /**
   * Compare two branches and show differences
   */
  async compareBranches(branch1, branch2) {
    try {
      // Validate branches exist
      const branches = await this.git.branch();
      if (!branches.all.includes(branch1)) {
        throw new Error(`Branch '${branch1}' does not exist`);
      }
      if (!branches.all.includes(branch2)) {
        throw new Error(`Branch '${branch2}' does not exist`);
      }

      // Get files from both branches
      const [files1, files2] = await Promise.all([
        this.git.raw(['ls-tree', '-r', '--name-only', branch1]),
        this.git.raw(['ls-tree', '-r', '--name-only', branch2])
      ]);

      const fileList1 = new Set(files1.trim().split('\n').filter(f => f));
      const fileList2 = new Set(files2.trim().split('\n').filter(f => f));

      // Find differences
      const onlyInBranch1 = [...fileList1].filter(f => !fileList2.has(f));
      const onlyInBranch2 = [...fileList2].filter(f => !fileList1.has(f));
      const commonFiles = [...fileList1].filter(f => fileList2.has(f));

      // Get diff for common files
      const modifiedFiles = [];
      for (const filePath of commonFiles) {
        try {
          const diff = await this.git.diff([`${branch1}..${branch2}`, '--', filePath]);
          if (diff) {
            modifiedFiles.push({
              path: filePath,
              diff,
              hasChanges: true
            });
          }
        } catch (err) {
          console.error(`Error diffing ${filePath}:`, err.message);
        }
      }

      // Get commit differences
      const commitDiff = await this.git.log([`${branch1}..${branch2}`]);

      return {
        branch1: {
          name: branch1,
          totalFiles: fileList1.size,
          uniqueFiles: onlyInBranch1
        },
        branch2: {
          name: branch2,
          totalFiles: fileList2.size,
          uniqueFiles: onlyInBranch2
        },
        commonFiles: commonFiles.length,
        modifiedFiles: modifiedFiles.map(f => ({
          path: f.path,
          diff: f.diff
        })),
        identicalFiles: commonFiles.length - modifiedFiles.length,
        commitsDifference: commitDiff.all.map(c => ({
          hash: c.hash.substring(0, 7),
          author: c.author_name,
          date: c.date,
          message: c.message
        })),
        summary: {
          filesOnlyIn: {
            [branch1]: onlyInBranch1.length,
            [branch2]: onlyInBranch2.length
          },
          modifiedFiles: modifiedFiles.length,
          identicalFiles: commonFiles.length - modifiedFiles.length,
          totalCommitsDifference: commitDiff.total
        }
      };
    } catch (err) {
      throw new Error(`Failed to compare branches: ${err.message}`);
    }
  }

  /**
   * Get full contents of two branches for side-by-side analysis
   * This is the main function you'll want to use for analyzing branches
   */
  async analyzeBranches(branch1, branch2) {
    try {
      console.log(`Analyzing branches: ${branch1} vs ${branch2}...`);
      
      // Get both branch contents
      const [content1, content2, comparison] = await Promise.all([
        this.getBranchFiles(branch1),
        this.getBranchFiles(branch2),
        this.compareBranches(branch1, branch2)
      ]);

      return {
        branch1: {
          name: branch1,
          fileCount: content1.fileCount,
          files: content1.files
        },
        branch2: {
          name: branch2,
          fileCount: content2.fileCount,
          files: content2.files
        },
        comparison: {
          summary: comparison.summary,
          filesOnlyInBranch1: comparison.branch1.uniqueFiles,
          filesOnlyInBranch2: comparison.branch2.uniqueFiles,
          modifiedFiles: comparison.modifiedFiles,
          identicalFiles: comparison.identicalFiles,
          commitsDifference: comparison.commitsDifference
        }
      };
    } catch (err) {
      throw new Error(`Failed to analyze branches: ${err.message}`);
    }
  }

  /**
   * Get detailed file comparison between branches
   */
  async compareFile(filePath, branch1, branch2) {
    try {
      
      let content1 = null;
      let content2 = null;
      console.log("GOT HERE");
      console.log(await this.git.show("main:tool/services/GitService.js"));
      try {
        content1 = await this.git.show([`${branch1}:${filePath}`]);
        console.log(`✓ Found ${filePath} Content ${content1}`);
      } catch (err) {
        console.log(`✗ File ${filePath} not found in ${branch1}:`, err.message);
        
        try {
          const files = await this.git.raw(['ls-tree', '-r', '--name-only', branch1]);
          const fileList = files.trim().split('\n');
          const matching = fileList.filter(f => f.includes('GitService'));
          console.log(`Files containing "GitService" in ${branch1}:`, matching);
        } catch (listErr) {
          console.log('Could not list files:', listErr.message);
        }
      }
      
      try {
        content2 = await this.git.show([`${branch2}:${filePath}`]);
      } catch (err) {
        try {
          const files = await this.git.raw(['ls-tree', '-r', '--name-only', branch2]);
          const fileList = files.trim().split('\n');
          console.log(`Files containing "GitService" in ${branch2}:`, matching);
        } catch (listErr) {
          console.log('Could not list files:', listErr.message);
        }
      }

      let diff = null;
      if (content1 && content2) {
        try {
          diff = await this.git.diff([`${branch1}`, `${branch2}`, '--', filePath]);
          console.log(`✓ Generated diff for ${filePath}`);
        } catch (err) {
          console.log(`✗ Could not generate diff for ${filePath}:`, err.message);
        }
      }

      console.log('\n=== Comparison Results ===');
      console.log('File path:', filePath);
      console.log('Diff length:', diff ? diff.length : 0);
      console.log('CONTENT 1 length:', content1 ? content1.length : 0);
      console.log('CONTENT 2 length:', content2 ? content2.length : 0);
      console.log('Files identical:', content1 === content2);

      return {
        filePath: filePath,
        existsIn: {
          [branch1]: content1 !== null,
          [branch2]: content2 !== null
        },
        content: {
          [branch1]: content1,
          [branch2]: content2
        },
        diff,
        identical: content1 === content2
      };
    } catch (err) {
      console.log(err);
      throw new Error(`Failed to compare file: ${err.message}`);
    }
  }

  /**
   * Helper: List all files in a branch
   */
  async listBranchFiles(branchName) {
    try {
      const files = await this.git.raw(['ls-tree', '-r', '--name-only', branchName]);
      return files.trim().split('\n').filter(f => f);
    } catch (err) {
      throw new Error(`Failed to list files in ${branchName}: ${err.message}`);
    }
  }

  async getCommitByHash(commitHash) {
    try {
      const log = await this.git.log([commitHash, '-1']);
      
      if (!log.latest) {
        throw new Error(`Commit ${commitHash} not found`);
      }

      const commit = log.latest;
      
      // Get files changed in this commit
      const diffSummary = await this.git.diffSummary([`${commitHash}^`, commitHash]);
      
      // Get full diff
      const diff = await this.git.diff([`${commitHash}^`, commitHash]);

      return {
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 7),
        author: {
          name: commit.author_name,
          email: commit.author_email
        },
        date: commit.date,
        message: commit.message,
        body: commit.body,
        filesChanged: diffSummary.files.map(file => ({
          file: file.file,
          changes: file.changes,
          insertions: file.insertions,
          deletions: file.deletions,
          binary: file.binary
        })),
        stats: {
          totalFiles: diffSummary.files.length,
          totalChanges: diffSummary.changed,
          totalInsertions: diffSummary.insertions,
          totalDeletions: diffSummary.deletions
        },
        diff
      };
    } catch (err) {
      throw new Error(`Failed to get commit: ${err.message}`);
    }
  }
  async getDiffBetweenCommits(hash1, hash2) {
    try {
      const diff = await this.git.diff([`${hash1}..${hash2}`]);
      return diff;
    } catch (err) {
      console.error('Error getting diff:', err.message);
    }
  }

  /**
   * Compare two commits by their hashes
   */
  
  async compareCommits(hash1, hash2) {
    const [log1, log2] = await Promise.all([
      this.git.show(["--no-patch", "--pretty=format:%H|%h|%an|%ad|%s", hash1]),
      this.git.show(["--no-patch", "--pretty=format:%H|%h|%an|%ad|%s", hash2]),
    ]);

    const [h1, short1, author1, date1, msg1] = log1.split("|");
    const [h2, short2, author2, date2, msg2] = log2.split("|");

    // Summary of differences
    const diffSummary = await this.git.diffSummary([`${hash1}`, `${hash2}`]);

    // Actual line-by-line differences for each changed file
    const fileComparisons = await Promise.all(
      diffSummary.files.map(async file => {
        const diffText = await this.git.diff([`${hash1}`, `${hash2}`, "--", file.file]);
        return {
          file: file.file,
          changeType: file.change, // e.g. "modified"
          insertions: file.insertions,
          deletions: file.deletions,
          diff: diffText,
        };
      })
    );

    // Count commits between
    const commitsBetween = await this.git.log({ from: hash1, to: hash2 });

    return {
      commit1: { hash: h1, shortHash: short1, author: author1, date: date1, message: msg1 },
      commit2: { hash: h2, shortHash: short2, author: author2, date: date2, message: msg2 },
      comparison: {
        commitsBetween: commitsBetween.all,
        totalCommitsBetween: commitsBetween.total,
        diffSummary,
        fileComparisons,
      },
      timeDifference: new Date(date2) - new Date(date1),
    };
  }

  /**
   * Get all files from a specific commit
   */
  async getCommitFiles(commitHash) {
    try {
      // Get list of files in the commit
      const files = await this.git.raw(['ls-tree', '-r', '--name-only', commitHash]);
      const fileList = files.trim().split('\n').filter(f => f);

      // Get file contents
      const fileContents = await Promise.all(
        fileList.map(async (filePath) => {
          try {
            const content = await this.git.show([`${commitHash}:${filePath}`]);
            
            return {
              path: filePath,
              content,
              size: Buffer.byteLength(content, 'utf8')
            };
          } catch (err) {
            return {
              path: filePath,
              error: `Failed to read file: ${err.message}`,
              content: null
            };
          }
        })
      );

      return {
        commitHash,
        shortHash: commitHash.substring(0, 7),
        fileCount: fileList.length,
        files: fileContents
      };
    } catch (err) {
      throw new Error(`Failed to get commit files: ${err.message}`);
    }
  }

  /**
   * Analyze two commits with full file contents
   */
async analyzeCommits(hash1, hash2) {
  try {
    console.log(`Analyzing commits: ${hash1} vs ${hash2}...`);

    // Run all three tasks concurrently
    const [content1, content2, comparison, fullDiff] = await Promise.all([
      this.getCommitFiles(hash1),
      this.getCommitFiles(hash2),
      this.compareCommits(hash1, hash2),
      this.getDiffBetweenCommits(hash1, hash2) // full repository diff
    ]);

    return {
      commit1: {
        hash: comparison.commit1.hash,
        shortHash: comparison.commit1.shortHash,
        author: comparison.commit1.author,
        date: comparison.commit1.date,
        message: comparison.commit1.message,
        fileCount: content1.fileCount,
        files: content1.files
      },
      commit2: {
        hash: comparison.commit2.hash,
        shortHash: comparison.commit2.shortHash,
        author: comparison.commit2.author,
        date: comparison.commit2.date,
        message: comparison.commit2.message,
        fileCount: content2.fileCount,
        files: content2.files
      },
      comparison: {
        commitsBetween: comparison.comparison.commitsBetween,
        totalCommitsBetween: comparison.comparison.totalCommitsBetween,
        diffSummary: comparison.comparison.diffSummary,
        fileComparisons: comparison.comparison.fileComparisons,
        timeDifference: comparison.timeDifference,
        // full repo diff text between both commits
        diff: fullDiff 
      }
    };
  } catch (err) {
    throw new Error(`Failed to analyze commits: ${err.message}`);
  }
}

async getCommitTree(maxCommits = 50) {
  
  try {
    // Get commit log with parent information and refs using raw format
    const logOutput = await this.git.raw([
      'log',
      '--all',
      `--max-count=${maxCommits}`,
      '--pretty=format:%H|%P|%s|%an|%ar|%ad|%D',
      '--date=iso'
    ]);
    
    const lines = logOutput.trim().split('\n');
    const commits = [];
    
    // Parse and create commit objects
    lines.forEach(line => {
      if (!line) return;
      
      const [hash, parents, message, author, relativeDate, date, refs] = line.split('|');
      const parentList = (parents && parents.trim()) ? parents.split(' ').filter(p => p) : [];
      
      // Parse refs (branches, tags, HEAD)
      let branch = '';
      if (refs) {
        const refParts = refs.split(',').map(r => r.trim());
        // Prioritize: HEAD -> local branch > remote branch > tag
        for (const ref of refParts) {
          if (ref.startsWith('HEAD -> ')) {
            branch = ref.replace('HEAD -> ', '') + ' (HEAD)';
            break;
          }
        }
        // If no HEAD, take first branch
        if (!branch) {
          for (const ref of refParts) {
            if (!ref.startsWith('tag:') && ref !== 'HEAD') {
              branch = ref;
              break;
            }
          }
        }
      }
      
      commits.push({
        id: hash,
        parents: parentList,
        message: message,
        author: author,
        date: date,
        relativeDate: relativeDate,
        branch: branch
      });
    });
    
    return commits;
    
  } catch (error) {
    console.error('Error fetching git history:', error);
    throw error;
  }
}
/**
   * Get detailed file diff between two commits for a specific file
   */
  async getFileDiffBetweenCommits(filePath, hash1, hash2) {
    try {
      // Get file content from both commits
      let content1 = null;
      let content2 = null;
      
      try {
        content1 = await this.git.show([`${hash1}:${filePath}`]);
      } catch (err) {
        console.log(`File ${filePath} not found in commit ${hash1}`);
      }
      
      try {
        content2 = await this.git.show([`${hash2}:${filePath}`]);
      } catch (err) {
        console.log(`File ${filePath} not found in commit ${hash2}`);
      }
      
      // Get unified diff
      let diff = null;
      if (content1 || content2) {
        try {
          diff = await this.git.diff([hash1, hash2, '--', filePath]);
        } catch (err) {
          console.log(`Could not generate diff for ${filePath}:`, err.message);
        }
      }
      
      // Get patch format with stats
      let patch = null;
      try {
        patch = await this.git.show([`${hash2}:${filePath}`, '--stat']);
      } catch (err) {
        // Ignore
      }
      
      // Parse diff statistics
      let stats = {
        additions: 0,
        deletions: 0,
        changes: 0
      };
      
      if (diff) {
        const addMatch = diff.match(/\n\+[^\+]/g);
        const delMatch = diff.match(/\n-[^-]/g);
        stats.additions = addMatch ? addMatch.length : 0;
        stats.deletions = delMatch ? delMatch.length : 0;
        stats.changes = stats.additions + stats.deletions;
      }
      
      return {
        filePath,
        existsIn: {
          [hash1]: content1 !== null,
          [hash2]: content2 !== null
        },
        content: {
          [hash1]: content1,
          [hash2]: content2
        },
        diff,
        stats,
        status: !content1 && content2 ? 'added' : 
                content1 && !content2 ? 'deleted' : 
                content1 === content2 ? 'unchanged' : 'modified',
        identical: content1 === content2
      };
    } catch (err) {
      throw new Error(`Failed to get file diff: ${err.message}`);
    }
  }

  /**
   * Get all file diffs between two commits
   */
  async getAllFileDiffsBetweenCommits(hash1, hash2) {
    try {
      // Get list of all changed files
      const diffSummary = await this.git.diffSummary([hash1, hash2]);
      
      // Get detailed diff for each file
      const fileDiffs = await Promise.all(
        diffSummary.files.map(async (file) => {
          const fileDiff = await this.getFileDiffBetweenCommits(file.file, hash1, hash2);
          return {
            ...fileDiff,
            changeType: file.binary ? 'binary' : fileDiff.status,
            isBinary: file.binary || false
          };
        })
      );
      
      return {
        commit1: hash1.substring(0, 7),
        commit2: hash2.substring(0, 7),
        totalFiles: fileDiffs.length,
        summary: {
          added: fileDiffs.filter(f => f.status === 'added').length,
          deleted: fileDiffs.filter(f => f.status === 'deleted').length,
          modified: fileDiffs.filter(f => f.status === 'modified').length,
          unchanged: fileDiffs.filter(f => f.status === 'unchanged').length,
          binary: fileDiffs.filter(f => f.isBinary).length,
          totalAdditions: fileDiffs.reduce((sum, f) => sum + f.stats.additions, 0),
          totalDeletions: fileDiffs.reduce((sum, f) => sum + f.stats.deletions, 0)
        },
        files: fileDiffs
      };
    } catch (err) {
      throw new Error(`Failed to get all file diffs: ${err.message}`);
    }
  }

  /**
   * Analyze two commits with full file contents
   */
async analyzeCommits(hash1, hash2) {
  try {
    console.log(`Analyzing commits: ${hash1} vs ${hash2}...`);
    // Run all three tasks concurrently
    const [content1, content2, comparison, fullDiff] = await Promise.all([
      this.getCommitFiles(hash1),
      this.getCommitFiles(hash2),
      this.compareCommits(hash1, hash2),
      this.getDiffBetweenCommits(hash1, hash2) // full repository diff
    ]);
    return {
      commit1: {
        hash: comparison.commit1.hash,
        shortHash: comparison.commit1.shortHash,
        author: comparison.commit1.author,
        date: comparison.commit1.date,
        message: comparison.commit1.message,
        fileCount: content1.fileCount,
        files: content1.files
      },
      commit2: {
        hash: comparison.commit2.hash,
        shortHash: comparison.commit2.shortHash,
        author: comparison.commit2.author,
        date: comparison.commit2.date,
        message: comparison.commit2.message,
        fileCount: content2.fileCount,
        files: content2.files
      },
      comparison: {
        commitsBetween: comparison.comparison.commitsBetween,
        totalCommitsBetween: comparison.comparison.totalCommitsBetween,
        diffSummary: comparison.comparison.diffSummary,
        fileComparisons: comparison.comparison.fileComparisons,
        timeDifference: comparison.timeDifference,
        // full repo diff text between both commits
        diff: fullDiff 
      }
    };
  } catch (err) {
    throw new Error(`Failed to analyze commits: ${err.message}`);
  }
}

}
// Usage example
async function example() {
  let repo = '/home/danieludzlieresi/Desktop/badgit';
  const gitService = new GitService(repo);
//  console.log(await gitService.getCommitTree());
  let files = await gitService.getTrackedFiles();
  console.log();
  try {
/*
    // Compare specific file
    console.log('\n=== File Comparison ===');
    const fileComparison = await gitService.compareFile('tool/services/GitService.js', 'main', 'daniel');
    console.log('File exists in main:', fileComparison.existsIn.main);
    console.log('File exists in develop:', fileComparison.existsIn.daniel);
    console.log('Files identical:', fileComparison.identical);
    if (fileComparison.diff) {
      console.log('Diff:', fileComparison.diff);
    }*/
    

    // Compare commits by hash
    console.log('\n=== Commit Comparison ===');
    //const commitAnalysis = await gitService.analyzeCommits('eb4ea610e92d433119b8ad17061ce380cc14fcbc', 'd5f31b3fa1e4fdeb9550783cb8a22321986c1630');
    console.log('Commit 1:', commitAnalysis.commit1.message);
    console.log('Commit 2:', commitAnalysis.commit2.message);
    console.log('Files in Commit 1:', commitAnalysis.commit1.fileCount);
    console.log('Files in Commit 2:', commitAnalysis.commit2.fileCount);
    console.log('Commits between:', commitAnalysis.comparison.totalCommitsBetween);
    console.log('Time difference:', commitAnalysis.comparison.timeDifference.days, 'days');
   /* 
    // Get single commit details
    console.log('\n=== Single Commit Details ===');
    const commit = await gitService.getCommitByHash('eb4ea610e92d433119b8ad17061ce380cc14fcbc');

    const diff = await gitService.getDiffBetweenCommits('eb4ea610e92d433119b8ad17061ce380cc14fcbc', 'd5f31b3fa1e4fdeb9550783cb8a22321986c1630');

    console.log("Diff", diff);
    console.log('Commit:', commit.shortHash);
    console.log('Author:', commit.author.name);
    console.log('Message:', commit.message);
    console.log('Files changed:', commit.stats.totalFiles);
    console.log('Insertions:', commit.stats.totalInsertions);
    console.log('Deletions:', commit.stats.totalDeletions);
    */
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Uncomment to run example
 example();

export default GitService;