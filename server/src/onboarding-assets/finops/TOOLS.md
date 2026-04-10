# Tools

## MCP Servers

### AWS MCP (`aws`)
- Cost Explorer: `aws_ce_get_cost_and_usage`, `aws_ce_get_cost_forecast`
- EC2: `aws_ec2_describe_instances`, `aws_ec2_stop_instances`, `aws_ec2_terminate_instances`
- CloudWatch: `aws_cloudwatch_get_metric_statistics`
- IAM: `aws_iam_list_access_keys`, `aws_iam_get_access_key_last_used`
- RDS: `aws_rds_describe_db_instances`
- EBS: `aws_ec2_describe_volumes`
- ELB: `aws_elbv2_describe_load_balancers`, `aws_elbv2_describe_target_health`

### Azure MCP (`azure`)
- Cost Management: `azure_costmanagement_query`
- Resource Graph: `azure_resourcegraph_resources`
- Advisor: `azure_advisor_recommendations`

### Slack MCP (`slack`)
- `slack_post_message`: Send cost alerts to channels
- `slack_update_message`: Update existing reports

## Common Patterns

### Get Daily Costs (AWS)
```
aws_ce_get_cost_and_usage:
  TimePeriod: {Start: "YYYY-MM-01", End: "YYYY-MM-DD"}
  Granularity: DAILY
  Metrics: ["UnblendedCost"]
  GroupBy: [{Type: "DIMENSION", Key: "SERVICE"}]
```

### Find Idle EC2 Instances
```
1. aws_ec2_describe_instances with state=running
2. aws_cloudwatch_get_metric_statistics for CPUUtilization
3. Filter where avg < 5% for 72h
```

### Send Cost Alert
```
slack_post_message:
  channel: "#ops-daily"
  text: "🚨 Cost Alert: $XXX spike detected in [service]"
```
