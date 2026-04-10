# Tools

## MCP Servers

### AWS MCP (`aws`)
- IAM: `aws_iam_generate_credential_report`, `aws_iam_list_mfa_devices`
- S3: `aws_s3_get_bucket_encryption`, `aws_s3_get_bucket_policy`
- RDS: `aws_rds_describe_db_instances` (check encryption)
- CloudTrail: `aws_cloudtrail_describe_trails`, `aws_cloudtrail_get_trail_status`
- Config: `aws_config_describe_compliance_by_config_rule`
- KMS: `aws_kms_list_keys`, `aws_kms_describe_key`

### Azure MCP (`azure`)
- Security Center: `azure_security_assessments`
- Policy: `azure_policy_states`
- Compliance Manager: `azure_compliance_results`
- Key Vault: `azure_keyvault_list_secrets`

### Slack MCP (`slack`)
- `slack_post_message`: Compliance alerts
- `slack_upload_file`: Share reports

## Common Patterns

### Check Encryption at Rest (S3)
```
1. aws_s3_list_buckets
2. For each bucket: aws_s3_get_bucket_encryption
3. Flag buckets without encryption
4. Document compliant buckets as evidence
```

### Verify MFA for Admins
```
1. aws_iam_list_users
2. Filter for admin permissions
3. For each: aws_iam_list_mfa_devices
4. Flag users without MFA
```

### Check CloudTrail Enabled
```
1. aws_cloudtrail_describe_trails
2. Verify multi-region trail exists
3. aws_cloudtrail_get_trail_status
4. Verify IsLogging = true
```

### Generate Evidence Package
```
For each control:
1. Run verification check
2. Capture current state (config, screenshot)
3. Date stamp the evidence
4. Store in evidence/YYYY-MM/controlid-type.ext
```

### Compliance Alert
```
slack_post_message:
  channel: "#ops-critical"
  text: "⚠️ COMPLIANCE GAP: [control] non-compliant"
  attachments: [{
    color: "warning",
    fields: [
      {title: "Control", value: "CC6.7"},
      {title: "Requirement", value: "MFA for privileged access"},
      {title: "Gap", value: "2 admin users without MFA"},
      {title: "Deadline", value: "48 hours"}
    ]
  }]
```

### Control Mapping
```
SOC 2 CC6.1 → IAM policies, access controls
SOC 2 CC6.2 → Access review process
SOC 2 CC6.7 → MFA implementation
SOC 2 CC7.2 → Vulnerability scanning (coord w/ Security)
SOC 2 CC8.1 → Change management (coord w/ CI/CD)
```
