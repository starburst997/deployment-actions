import * as core from "@actions/core"
import * as github from "@actions/github"

interface SavedState {
  deploymentId: string
  token: string
  environment: string
  environmentUrl: string
}

type JobStatus = "success" | "failure" | "cancelled"

function getSavedState(): SavedState | null {
  const deploymentId = core.getState("deployment-id")
  const token = core.getState("token")
  const environment = core.getState("environment")
  const environmentUrl = core.getState("environment-url")

  if (!deploymentId || !token) {
    return null
  }

  return {
    deploymentId,
    token,
    environment,
    environmentUrl,
  }
}

function determineDeploymentState(jobStatus: string): {
  state: "success" | "failure"
  description: string
} {
  switch (jobStatus as JobStatus) {
    case "success":
      return {
        state: "success",
        description: "Deployment completed successfully",
      }
    case "failure":
      return {
        state: "failure",
        description: "Deployment failed",
      }
    case "cancelled":
      return {
        state: "failure",
        description: "Deployment cancelled",
      }
    default:
      // Fallback for unknown status
      return {
        state: "success",
        description: "Deployment completed successfully",
      }
  }
}

async function getJobStatus(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string
): Promise<JobStatus> {
  try {
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: github.context.runId,
    })

    // Find the main job (not the post-cleanup job)
    // The main job is the one that's completed and not a post-cleanup
    const mainJob = jobs.jobs.find(
      (job) => job.name === github.context.job && job.conclusion !== null
    )

    if (!mainJob) {
      core.warning(
        "Could not find completed main job, checking workflow run status"
      )

      // Fallback: check the overall workflow run conclusion
      const { data: workflowRun } = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: github.context.runId,
      })

      core.warning("Workflow conclusion: " + workflowRun.conclusion)

      switch (workflowRun.conclusion) {
        case "success":
          return "success"
        case "failure":
        case "timed_out":
          return "failure"
        case "cancelled":
          return "cancelled"
        default:
          return "failure"
      }
    }

    // Map GitHub job conclusion to our JobStatus
    switch (mainJob.conclusion) {
      case "success":
        return "success"
      case "failure":
      case "timed_out":
        return "failure"
      case "cancelled":
        return "cancelled"
      default:
        core.warning(
          `Unknown job conclusion: ${mainJob.conclusion}, assuming failure`
        )
        return "failure"
    }
  } catch (error) {
    core.warning(
      `Failed to get job status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
    return "failure"
  }
}

async function run(): Promise<void> {
  try {
    const savedState = getSavedState()

    if (!savedState) {
      core.info("No deployment to update")
      return
    }

    // Initialize octokit with proper typing
    const octokit = github.getOctokit(savedState.token)
    const { owner, repo } = github.context.repo

    // Determine the final state based on actual job status from API
    const jobStatus = await getJobStatus(octokit, owner, repo)
    const { state, description } = determineDeploymentState(jobStatus)

    core.info(
      `Updating deployment ${savedState.deploymentId} status to ${state}`
    )

    // Create status parameters using the GitHub API's expected structure
    const baseParams = {
      owner,
      repo,
      deployment_id: parseInt(savedState.deploymentId, 10),
      state,
      environment: savedState.environment,
      description,
    }

    // Add environment URL if provided and deployment succeeded
    const statusParams =
      savedState.environmentUrl && state === "success"
        ? { ...baseParams, environment_url: savedState.environmentUrl }
        : baseParams

    await octokit.rest.repos.createDeploymentStatus(statusParams)

    core.info(
      `Deployment ${savedState.deploymentId} status updated to ${state}`
    )
  } catch (error) {
    // Don't fail the workflow in post action, just log the error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    core.warning(`Failed to update deployment status: ${errorMessage}`)
  }
}

run()
