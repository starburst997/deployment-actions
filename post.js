const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get saved state
    const deploymentId = core.getState('deployment-id');
    const token = core.getState('token');
    const environment = core.getState('environment');
    const environmentUrl = core.getState('environment-url');

    if (!deploymentId || !token) {
      core.info('No deployment to update');
      return;
    }

    // Initialize octokit
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // Determine the final state based on job status
    // The job.status context is available in post actions
    const jobStatus = process.env['GITHUB_JOB_STATUS'] || 'success';
    let state = 'success';
    let description = 'Deployment completed successfully';

    if (jobStatus === 'failure' || jobStatus === 'cancelled') {
      state = 'failure';
      description = jobStatus === 'cancelled' ? 'Deployment cancelled' : 'Deployment failed';
    }

    core.info(`Updating deployment ${deploymentId} status to ${state}`);

    // Update deployment status
    const statusParams = {
      owner,
      repo,
      deployment_id: parseInt(deploymentId),
      state,
      environment,
      description
    };

    // Add environment URL if provided and deployment succeeded
    if (environmentUrl && state === 'success') {
      statusParams.environment_url = environmentUrl;
    }

    await octokit.rest.repos.createDeploymentStatus(statusParams);

    core.info(`Deployment ${deploymentId} status updated to ${state}`);

  } catch (error) {
    // Don't fail the workflow in post action, just log the error
    core.warning(`Failed to update deployment status: ${error.message}`);
  }
}

run();