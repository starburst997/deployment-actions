import * as core from "@actions/core"
import * as github from "@actions/github"

interface ActionInputs {
  token: string
  ref: string
  environment: string
  environmentUrl: string
}

async function getInputs(): Promise<ActionInputs> {
  return {
    token: core.getInput("token"),
    ref: core.getInput("ref"),
    environment: core.getInput("environment"),
    environmentUrl: core.getInput("environment-url"),
  }
}

async function run(): Promise<void> {
  try {
    const inputs = await getInputs()

    // Initialize octokit with proper typing
    const octokit = github.getOctokit(inputs.token)
    const { owner, repo } = github.context.repo

    // Create deployment with properly typed parameters
    const deployment = await octokit.rest.repos.createDeployment({
      owner,
      repo,
      ref: inputs.ref,
      environment: inputs.environment,
      auto_merge: false,
      required_contexts: [],
      production_environment: inputs.environment === "production",
      transient_environment: false,
    })

    if (
      !deployment.data ||
      typeof deployment.data !== "object" ||
      !("id" in deployment.data)
    ) {
      throw new Error("Failed to create deployment: Invalid response")
    }

    const deploymentId = deployment.data.id
    core.info(`Created deployment ${deploymentId} for ${inputs.environment}`)

    // Set initial status to in_progress
    await octokit.rest.repos.createDeploymentStatus({
      owner,
      repo,
      deployment_id: deploymentId,
      state: "in_progress",
      environment: inputs.environment,
      description: "Deployment in progress",
    })

    // Set outputs
    core.setOutput("deployment-id", deploymentId.toString())

    // Save state for post action
    core.saveState("deployment-id", deploymentId.toString())
    core.saveState("token", inputs.token)
    core.saveState("environment", inputs.environment)
    core.saveState("environment-url", inputs.environmentUrl)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    core.setFailed(`Action failed: ${errorMessage}`)
  }
}

run()
