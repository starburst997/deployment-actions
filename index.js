const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get inputs
    const token = core.getInput('token', { required: true });
    const ref = core.getInput('ref', { required: true });
    const environment = core.getInput('environment', { required: true });
    const environmentUrl = core.getInput('environment-url');

    // Initialize octokit
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // Create deployment
    const deployment = await octokit.rest.repos.createDeployment({
      owner,
      repo,
      ref,
      environment,
      auto_merge: false,
      required_contexts: [],
      production_environment: environment === 'production',
      transient_environment: false
    });

    const deploymentId = deployment.data.id;
    core.info(`Created deployment ${deploymentId} for ${environment}`);

    // Set initial status to in_progress
    await octokit.rest.repos.createDeploymentStatus({
      owner,
      repo,
      deployment_id: deploymentId,
      state: 'in_progress',
      environment,
      description: 'Deployment in progress'
    });

    // Set outputs
    core.setOutput('deployment-id', deploymentId);

    // Save state for post action
    core.saveState('deployment-id', deploymentId);
    core.saveState('token', token);
    core.saveState('environment', environment);
    core.saveState('environment-url', environmentUrl);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();