# Tools

## Knowledge Sources

### Internal Documentation
- `./runbooks/` — Operational procedures
- `./docs/` — Technical documentation
- `./docs/adr/` — Architecture Decision Records
- `./docs/processes/` — Team processes
- `./postmortems/` — Incident retrospectives

### External Documentation
- AWS Docs: https://docs.aws.amazon.com
- Azure Docs: https://learn.microsoft.com/azure
- Kubernetes Docs: https://kubernetes.io/docs

### Issue History
- Search previous issues for similar problems
- Check resolved issues for solutions

## MCP Servers

Note: Knowledge agent doesn't require external MCP servers.
Works with local documentation and Paperclip API.

### Paperclip API
- `GET /api/companies/{id}/issues` — Search past issues
- `POST /api/companies/{id}/issues/{id}/comments` — Post answers

## Common Patterns

### Search for Runbook
```
1. List files in ./runbooks/
2. Find matching topic
3. Read and summarize relevant section
```

### Search Previous Issues
```
GET /api/companies/{companyId}/issues?search={query}
Filter for status=completed to find solutions
```

### Format Code Answer
```markdown
### Command
\`\`\`bash
kubectl rollout undo deployment/my-app
\`\`\`

### Expected Output
\`\`\`
deployment.apps/my-app rolled back
\`\`\`
```

### Create Doc Gap Issue
```
POST /api/companies/{companyId}/issues
{
  "title": "[DOC] Document X process",
  "priority": "low",
  "labels": ["documentation"],
  "body": "Question about X was asked but not documented..."
}
```
