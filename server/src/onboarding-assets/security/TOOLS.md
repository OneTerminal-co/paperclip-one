# Tools

## MCP Servers

### AWS MCP (`aws`)
- IAM: `aws_iam_list_users`, `aws_iam_list_mfa_devices`, `aws_iam_get_credential_report`
- EC2: `aws_ec2_describe_security_groups`
- GuardDuty: `aws_guardduty_list_findings`, `aws_guardduty_get_findings`
- Secrets Manager: `aws_secretsmanager_list_secrets`, `aws_secretsmanager_describe_secret`
- ACM: `aws_acm_list_certificates`, `aws_acm_describe_certificate`

### Azure MCP (`azure`)
- Security Center: `azure_security_assessments`, `azure_security_score`
- Key Vault: `azure_keyvault_list_secrets`
- Defender: `azure_defender_alerts`

### Sentry MCP (`sentry`)
- `sentry_list_project_issues`: Get error events
- `sentry_get_issue`: Get issue details
- `sentry_search_events`: Search for security patterns

### Slack MCP (`slack`)
- `slack_post_message`: Send security alerts
- `slack_update_message`: Update incident status

## Common Patterns

### Check MFA Status (AWS)
```
1. aws_iam_list_users
2. For each user: aws_iam_list_mfa_devices
3. Flag users where mfa_devices is empty
```

### Check Open Security Groups
```
1. aws_ec2_describe_security_groups
2. Filter IpPermissions where:
   - IpRanges contains "0.0.0.0/0"
   - FromPort in [22, 3389, 5432, 3306, 27017]
```

### Send Critical Alert
```
slack_post_message:
  channel: "#ops-critical"
  text: "🚨 SECURITY ALERT: [description]"
  attachments: [{color: "danger", fields: [...]}]
```
