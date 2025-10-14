# Deployment Manager Actions

A GitHub composite action that streamlines deployment management by automatically creating deployments and updating their status based on workflow outcomes.

## Features

- Creates GitHub deployment with `in_progress` status
- Automatically updates deployment status to `success` or `failure` based on workflow result
- Simplifies deployment tracking with a single action call
- Supports custom environment URLs for successful deployments

## Inputs

| Input             | Description                                                 | Required |
| ----------------- | ----------------------------------------------------------- | -------- |
| `token`           | GitHub token with deployment permissions                    | No       |
| `ref`             | Git reference for the deployment                            | No       |
| `environment`     | Deployment environment name (e.g., `production`, `staging`) | No       |
| `environment-url` | URL where the deployment will be accessible                 | No       |

## Outputs

| Output          | Description                      |
| --------------- | -------------------------------- |
| `deployment-id` | The ID of the created deployment |

## How It Works

1. Creates a GitHub deployment with `in_progress` status
2. Your workflow steps execute normally
3. Post-action cleanup automatically updates the deployment status:
   - `success` if all steps completed successfully
   - `failure` if any step failed

## Example Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - uses: actions/checkout@v4

      - name: Manage Deployment
        uses: starburst997/deployment-actions@v1
        with:
          environment: production
          environment-url: https://your-app.example.com

      - name: Build and Deploy
        run: |
          # Your deployment steps here
          npm run build
          npm run deploy
```

## License

MIT
