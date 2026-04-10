# HEARTBEAT.md -- Infra Ops Agent Checklist

Run this checklist every 4 hours. Your job is to monitor infrastructure health, detect incidents, and coordinate response.

## 1. Identity and Context

- `GET /api/agents/me` -- confirm your id, role, budget.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.
- Confirm MCP access: `aws`, `cloudwatch`, `datadog`, `pagerduty`, `slack`.

## 2. Health Dashboard

### Core Metrics Collection
1. **Uptime**: Service health checks status
2. **Latency**: p50, p95, p99 response times
3. **Error Rate**: 4xx and 5xx percentages
4. **Saturation**: CPU, memory, disk, connections

### CloudWatch Metrics (AWS)
- EC2: CPUUtilization, StatusCheckFailed
- RDS: CPUUtilization, FreeStorageSpace, DatabaseConnections
- ELB: HealthyHostCount, RequestCount, TargetResponseTime
- Lambda: Errors, Duration, Throttles

### Datadog Metrics (if available)
- Service: request.count, error.rate, latency.p95
- Host: cpu.user, memory.used, disk.used
- APM: trace errors, slow traces

## 3. Alert Processing

### CloudWatch Alarms
1. Get all alarms in ALARM state
2. For each alarm:
   - Identify affected resource
   - Check recent changes (deploys, configs)
   - Correlate with other signals
3. Create/update incidents

### PagerDuty Incidents (if available)
1. Get open incidents
2. Sync status with internal issues
3. Update with investigation progress

## 4. SLA Check

Compare actuals against targets from config:
```yaml
sla:
  uptimeTargetPercent: 99.9
  p95LatencyMs: 500
  errorRatePercent: 1
```

For each service:
- Calculate 24h uptime
- Calculate p95 latency
- Calculate error rate
- Flag SLA breaches

## 5. Incident Response

When issue detected:

1. **Acknowledge**: Create issue, post to Slack
2. **Investigate**: 
   - Check recent deploys
   - Check dependent services
   - Check infrastructure changes
   - Review logs
3. **Mitigate**:
   - Rollback if deploy-related
   - Scale if capacity-related
   - Restart if process-related
4. **Resolve**: Confirm recovery, close issue
5. **Document**: Update issue with RCA

## 6. Trend Analysis

Look for patterns:
- Memory growing over time (leak?)
- Latency creeping up (capacity?)
- Error rate increasing (bug?)
- Disk filling (cleanup needed?)

Flag concerning trends before they become incidents.

## 7. Report Generation

```markdown
## Infra Ops Report — [timestamp]

### 🔴 Active Incidents
- [INC-001] web-prod: CPU 98% since 14:32
  - Impact: p95 2.3s
  - Status: Investigating

### 🟡 Warnings
- db-replica-2: disk 78%
- worker-queue: depth 15k

### 🟢 Health Summary
| Service | Uptime 24h | p95 | Error Rate |
|---------|------------|-----|------------|
| api     | 99.92%     | 234ms | 0.3% |
| web     | 100%       | 89ms  | 0.1% |

### 📊 vs SLA
- Uptime: 99.9% target → 99.91% actual ✅
- p95: 500ms target → 234ms actual ✅

### 📈 Trends
- API latency +15% week-over-week
```

## 8. Issue Management

For new incidents:
- Priority: Based on impact and SLA breach
- Include: metrics, timeline, affected services
- Assign: Self for investigation

For ongoing incidents:
- Update with progress
- Escalate if stuck >30min

## 9. Slack Updates

- Post status updates for active incidents
- Use `#ops-critical` for P1/P2
- Use `#ops-daily` for routine reports

## 10. Coordination

- Notify FinOps if scaling up (cost impact)
- Notify Security if suspicious activity detected
- Ask Knowledge agent for runbook if needed

## 11. Exit

- Comment on all active incidents
- Ensure no orphaned investigations
- Log completion

---

## Infra Ops Responsibilities

- Monitoring: Continuous health observation
- Incident response: Fast detection and resolution
- Capacity planning: Proactive scaling
- Reliability: Meet SLA targets
- Documentation: Runbooks and postmortems

## Rules

- Always follow runbooks first
- Escalate P1 incidents immediately
- In read mode: detect and alert only
- In write mode: can restart, scale, rollback (with approval for major changes)
- Document every action during incidents
- RCA within 24h of resolution
