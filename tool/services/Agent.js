import AiService from "./AiService.js";

class Agent{
 

  constructor() {
    this.aiService = new AiService();
    this.conversationContext = [];
  }

  async processCommand(userInput) {
    // Analyze the command using AI
    const intent = await this.detectIntent(userInput);
    
    // Route to appropriate handler based on intent
    return await this.executeGitCommand(intent, userInput);
  }

  async detectIntent(userInput) {
    const systemPrompt = `You are a Git command analyzer. Analyze the user's input and respond with ONLY ONE of these exact words:
- commit
- push
- pull
- branch
- checkout
- merge
- status
- log
- diff
- add
- reset
- rebase
- clone
- init
- stash
- tag
- remote
- fetch
- help
- unknown

User input: "${userInput}"

Respond with only the Git command type:`;

    const response = await this.aiService.sendPrompt(
      systemPrompt,
      this.conversationContext
    );
    
    return response.trim().toLowerCase();
  }

  async executeGitCommand(intent, userInput) {
    switch (intent) {
      case "commit":
        return await this.handleCommit(userInput);
      
      case "push":
        return await this.handlePush(userInput);
      
      case "pull":
        return await this.handlePull(userInput);
      
      case "branch":
        return await this.handleBranch(userInput);
      
      case "checkout":
        return await this.handleCheckout(userInput);
      
      case "merge":
        return await this.handleMerge(userInput);
      
      case "status":
        return await this.handleStatus(userInput);
      
      case "log":
        return await this.handleLog(userInput);
      
      case "diff":
        return await this.handleDiff(userInput);
      
      case "add":
        return await this.handleAdd(userInput);
      
      case "reset":
        return await this.handleReset(userInput);
      
      case "rebase":
        return await this.handleRebase(userInput);
      
      case "clone":
        return await this.handleClone(userInput);
      
      case "init":
        return await this.handleInit(userInput);
      
      case "stash":
        return await this.handleStash(userInput);
      
      case "tag":
        return await this.handleTag(userInput);
      
      case "remote":
        return await this.handleRemote(userInput);
      
      case "fetch":
        return await this.handleFetch(userInput);
      
      case "help":
        return await this.handleHelp(userInput);
      
      default:
        return await this.handleUnknown(userInput);
    }
  }

  async handleCommit(userInput) {
    const prompt = `Generate a git commit command based on this user request: "${userInput}"
    
Provide:
1. The exact git command to run
2. A brief explanation of what it does
3. Any warnings or best practices

Format your response clearly.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handlePush(userInput) {
    const prompt = `Generate a git push command based on: "${userInput}"
    
Provide the command, explanation, and any important notes about force pushing or upstream branches.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handlePull(userInput) {
    const prompt = `Generate a git pull command based on: "${userInput}"
    
Explain the command and mention merge vs rebase strategies if relevant.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleBranch(userInput) {
    const prompt = `Help with git branch operations for: "${userInput}"
    
Provide the command for creating, listing, deleting, or renaming branches as needed.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleCheckout(userInput) {
    const prompt = `Generate a git checkout command for: "${userInput}"
    
Include switching branches, creating new branches, or checking out specific files.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleMerge(userInput) {
    const prompt = `Generate a git merge command for: "${userInput}"
    
Explain the merge process and how to handle potential conflicts.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleStatus(userInput) {
    const prompt = `Explain git status command for: "${userInput}"
    
Describe what information it shows and how to interpret the output.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleLog(userInput) {
    const prompt = `Generate a git log command for: "${userInput}"
    
Provide options for formatting, filtering, and viewing commit history.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleDiff(userInput) {
    const prompt = `Generate a git diff command for: "${userInput}"
    
Explain how to view changes between commits, branches, or working directory.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleAdd(userInput) {
    const prompt = `Generate a git add command for: "${userInput}"
    
Explain staging files for commit, including patterns and options.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleReset(userInput) {
    const prompt = `Generate a git reset command for: "${userInput}"
    
Explain soft, mixed, and hard reset options and their implications.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleRebase(userInput) {
    const prompt = `Generate a git rebase command for: "${userInput}"
    
Explain rebasing, interactive rebase, and how it differs from merge.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleClone(userInput) {
    const prompt = `Generate a git clone command for: "${userInput}"
    
Provide the command with options for cloning repositories.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleInit(userInput) {
    const prompt = `Generate a git init command for: "${userInput}"
    
Explain initializing a new repository and initial setup steps.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleStash(userInput) {
    const prompt = `Generate a git stash command for: "${userInput}"
    
Explain stashing changes, listing stashes, and applying them back.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleTag(userInput) {
    const prompt = `Generate a git tag command for: "${userInput}"
    
Explain creating, listing, and pushing tags for version marking.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleRemote(userInput) {
    const prompt = `Generate a git remote command for: "${userInput}"
    
Explain managing remote repositories and their URLs.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleFetch(userInput) {
    const prompt = `Generate a git fetch command for: "${userInput}"
    
Explain fetching changes without merging, and how it differs from pull.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleHelp(userInput) {
    const prompt = `Provide general Git help based on: "${userInput}"
    
Offer guidance on common Git operations and best practices.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  async handleUnknown(userInput) {
    const prompt = `The user said: "${userInput}"
    
This doesn't seem to be a clear Git command. Ask clarifying questions or suggest what they might be trying to do.`;

    const response = await this.aiService.sendPrompt(prompt, this.conversationContext);
    this.updateContext("user", userInput);
    this.updateContext("assistant", response);
    return response;
  }

  updateContext(role, content) {
    this.conversationContext.push({
      role: role === "user" ? "user" : "model",
      parts: [{ text: content }]
    });

    // Keep context limited to last 10 messages
    if (this.conversationContext.length > 10) {
      this.conversationContext = this.conversationContext.slice(-10);
    }
  }

  clearContext() {
    this.conversationContext = [];
  }
}

export default AgentService;