import * as core from "@actions/core"
import * as github from "@actions/github"

interface ActionInputs {
  token: string
  ref: string
  environment: string
  environmentUrl: string
}

async function getInputs(): Promise<ActionInputs> {
  const token = core.getInput("token") || process.env.GITHUB_TOKEN || ""
  const ref =
    core.getInput("ref") ||
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF ||
    ""
  const environment = core.getInput("environment") || "production"
  const environmentUrl = core.getInput("environment-url") || ""

  return {
    token,
    ref,
    environment,
    environmentUrl,
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

    // Build the log URL for the current GitHub Actions run
    const logUrl = `https://github.com/${owner}/${repo}/actions/runs/${github.context.runId}`

    // Set initial status to in_progress with log URL
    await octokit.rest.repos.createDeploymentStatus({
      owner,
      repo,
      deployment_id: deploymentId,
      state: "in_progress",
      environment: inputs.environment,
      description: "Deployment in progress",
      log_url: logUrl,
    })

    // Extract domain from URL (without protocol)
    let domain = ""
    if (inputs.environmentUrl) {
      try {
        const url = new URL(inputs.environmentUrl)
        domain = url.host // This includes subdomain.domain.com
      } catch (error) {
        core.warning(`Failed to parse domain from URL: ${inputs.environmentUrl}`)
      }
    }

    // Set outputs
    core.setOutput("deployment-id", deploymentId.toString())
    core.setOutput("environment", inputs.environment)
    core.setOutput("url", inputs.environmentUrl)
    core.setOutput("domain", domain)

    // Save state for post action
    core.saveState("deployment-id", deploymentId.toString())
    core.saveState("token", inputs.token)
    core.saveState("environment", inputs.environment)
    core.saveState("environment-url", inputs.environmentUrl)
    core.saveState("log-url", logUrl)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    core.setFailed(`Action failed: ${errorMessage}`)
  }
}

run()
