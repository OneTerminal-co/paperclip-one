# Tools

## MCP Servers

### GitHub MCP (`github`)
- `github_list_workflow_runs`: Get recent workflow executions
- `github_get_workflow_run`: Get specific run details
- `github_get_workflow_run_logs`: Get build logs
- `github_rerun_workflow`: Retry failed workflow
- `github_cancel_workflow_run`: Cancel stuck workflow
- `github_list_pull_requests`: Get open PRs
- `github_get_commit`: Get commit details

### Slack MCP (`slack`)
- `slack_post_message`: Send build alerts
- `slack_update_message`: Update status

## Common Patterns

### Get Failed Builds (GitHub Actions)
```
1. github_list_workflow_runs with status=failure
2. Filter for last 6h
3. For each failure:
   - github_get_workflow_run for details
   - Identify failing step
```

### Detect Flaky Tests
```
1. github_list_workflow_runs for last 7 days
2. Group by test name
3. Calculate pass/fail ratio
4. Flag tests with <95% pass rate and >1 failure
```

### Alert on Main Branch Failure
```
slack_post_message:
  channel: "#ops-critical"
  text: "🔴 CI FAILURE: main branch broken"
  attachments: [{
    color: "danger",
    fields: [
      {title: "Repo", value: "api"},
      {title: "Failure", value: "TestUserService"},
      {title: "Link", value: "[View Run](url)"}
    ]
  }]
```

### Retrigger Build
```
github_rerun_workflow:
  owner: "org"
  repo: "api"
  run_id: 12345
```

### Calculate DORA Metrics
```
Deploy Frequency:
  Count successful deploys to production / days

Lead Time:
  Average time from commit to production deploy

MTTR:
  Average time from failure detection to fix

Change Failure Rate:
  Deploys causing incidents / total deploys
```
