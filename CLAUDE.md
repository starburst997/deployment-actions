# Development Guide for Deployment Actions

This document provides guidelines for developing and maintaining the Deployment Actions GitHub Action.

## Project Overview

Deployment Actions is a GitHub Action that automates deployment lifecycle management by:
- Creating GitHub deployments with `in_progress` status
- Automatically updating deployment status to `success` or `failure` based on workflow outcomes
- Providing deployment information as outputs for downstream workflow steps

## Architecture

### Components

1. **Main Entrypoint** (`src/index.ts`)
   - Creates the GitHub deployment
   - Sets initial `in_progress` status
   - Saves state for post-action
   - Sets action outputs

2. **Post Entrypoint** (`src/post.ts`)
   - Runs after workflow completion (via `post-if: always()`)
   - Updates deployment status based on job outcome
   - Handles cleanup

3. **Docker Container**
   - Uses Node.js runtime
   - Defined in `Dockerfile`
   - Published to GitHub Container Registry

4. **Action Definition** (`action.yml`)
   - Defines inputs, outputs, and runtime configuration
   - References the Docker image

## Documentation Requirements

**CRITICAL**: Whenever you add, modify, or remove inputs, outputs, or functionality, you MUST update the following files:

### 1. `README.md`
- Update the Inputs table with any new/changed inputs
- Update the Outputs table with any new/changed outputs
- Update example workflows to demonstrate new features
- Update feature descriptions if functionality changes

### 2. `docs/index.html`
- Update the Inputs table (lines ~403-437)
- Update the Outputs table (lines ~440-456)
- Update code examples in the Quick Start section (lines ~356-391)
- Update feature descriptions if needed (lines ~323-347)

### 3. `action.yml`
- Add/modify/remove input definitions
- Add/modify/remove output definitions
- Update descriptions to be clear and concise

## Development Workflow

### Making Changes

1. **Modify Source Code**
   - Update `src/index.ts` or `src/post.ts` as needed
   - Ensure TypeScript types are correct
   - Test locally if possible

2. **Update Action Definition**
   - Modify `action.yml` to reflect any new inputs/outputs
   - Ensure defaults are sensible

3. **Update Documentation**
   - Update `README.md` with new inputs/outputs
   - Update `docs/index.html` with matching changes
   - Add examples demonstrating new functionality

4. **Build and Release**
   - Compile TypeScript: `npm run compile`
   - Build Docker image: `docker build -t deployment-actions .`
   - Test the action in a real workflow
   - Tag and push the Docker image to GHCR
   - Update the image tag in `action.yml`
   - Create a new release/tag

## Common Tasks

### Adding a New Input

1. Add to `action.yml` inputs section:
```yaml
inputs:
  new-input:
    description: "Description of the input"
    required: false
    default: "default-value"
```

2. Add to `src/index.ts` interface and getInputs():
```typescript
interface ActionInputs {
  // ... existing inputs
  newInput: string
}

async function getInputs(): Promise<ActionInputs> {
  // ... existing inputs
  const newInput = core.getInput("new-input") || "default-value"

  return {
    // ... existing inputs
    newInput,
  }
}
```

3. Update `README.md` inputs table
4. Update `docs/index.html` inputs table

### Adding a New Output

1. Add to `action.yml` outputs section:
```yaml
outputs:
  new-output:
    description: "Description of the output"
```

2. Add to `src/index.ts` in the run() function:
```typescript
// Set outputs
core.setOutput("new-output", outputValue)
```

3. Update `README.md` outputs table
4. Update `docs/index.html` outputs table
5. Add example usage to both documentation files

### Updating the Docker Image

After making changes:

1. Update version in `package.json`
2. Run `npm run compile` to build TypeScript
3. Build Docker image: `docker build -t ghcr.io/starburst997/deployment-actions:vX.X.X .`
4. Push to GHCR: `docker push ghcr.io/starburst997/deployment-actions:vX.X.X`
5. Update image tag in `action.yml`

## Testing

1. **Local Testing**
   - Compile TypeScript: `npm run compile`
   - Build Docker image locally
   - Test in a test repository workflow

2. **Integration Testing**
   - Create a test workflow in `.github/workflows/`
   - Test various scenarios (success, failure, different inputs)
   - Verify outputs are set correctly
   - Check deployment status updates

## Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and single-purpose

## GitHub Actions Specifics

- Use `@actions/core` for inputs, outputs, and logging
- Use `@actions/github` for GitHub API interactions
- Save state with `core.saveState()` for post-action access
- Use `core.setFailed()` to mark action as failed
- Always handle errors gracefully

## Documentation Style

- Use clear, concise language
- Provide complete examples
- Include both basic and advanced usage
- Keep tables aligned and formatted consistently
- Use code blocks for all code examples
- Test all example code before documenting
