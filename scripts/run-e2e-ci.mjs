import { spawnSync } from "node:child_process";

const composeFiles = ["-f", ".devcontainer/compose.yaml", "-f", ".devcontainer/compose.e2e.yaml"];
const environment = {
  ...process.env,
  COMPOSE_PROJECT_NAME: `tango-e2e-${process.pid}`,
};

function runCompose(args) {
  const result = spawnSync("docker", ["compose", ...composeFiles, ...args], {
    env: environment,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

let status = 1;

try {
  status = runCompose(["up", "--wait", "--wait-timeout", "120", "--remove-orphans"]);
  if (status === 0) {
    status = runCompose(["run", "--rm", "--remove-orphans", "--env", "CI", "--entrypoint", "npm", "dev", "run", "e2e"]);
  }
} finally {
  const cleanupStatus = runCompose(["down", "--volumes", "--remove-orphans"]);
  if (status === 0) {
    status = cleanupStatus;
  }
}

process.exitCode = status;
