# Tools

## MCP Servers

### AWS MCP (`aws`)
- EC2: `aws_ec2_describe_instances`, `aws_ec2_describe_instance_status`
- ECS: `aws_ecs_describe_services`, `aws_ecs_update_service`
- RDS: `aws_rds_describe_db_instances`
- ELB: `aws_elbv2_describe_target_health`
- Lambda: `aws_lambda_list_functions`, `aws_lambda_get_function`

### CloudWatch MCP (`cloudwatch`)
- `cloudwatch_describe_alarms`
- `cloudwatch_get_metric_statistics`
- `cloudwatch_get_log_events`
- `cloudwatch_filter_log_events`

### Datadog MCP (`datadog`)
- `datadog_query_metrics`
- `datadog_get_monitors`
- `datadog_get_dashboards`
- `datadog_search_logs`

### PagerDuty MCP (`pagerduty`)
- `pagerduty_list_incidents`
- `pagerduty_get_incident`
- `pagerduty_create_incident`
- `pagerduty_update_incident`
- `pagerduty_get_oncall`

### Slack MCP (`slack`)
- `slack_post_message`: Status updates
- `slack_update_message`: Update incident threads

## Common Patterns

### Check Service Health (AWS)
```
1. aws_elbv2_describe_target_health for load balancer
2. For unhealthy targets:
   - aws_ec2_describe_instance_status
   - cloudwatch_get_metric_statistics for CPU/Memory
```

### Get Recent Logs
```
cloudwatch_filter_log_events:
  logGroupName: "/aws/ecs/my-service"
  filterPattern: "ERROR"
  startTime: (now - 1h)
```

### Post Incident Update
```
slack_post_message:
  channel: "#ops-critical"
  text: "🔴 INCIDENT: [service] down"
  attachments: [{
    color: "danger",
    fields: [
      {title: "Impact", value: "..."},
      {title: "Status", value: "Investigating"}
    ]
  }]
```
