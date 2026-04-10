# HEARTBEAT.md -- CI/CD Agent Checklist

Run this checklist every 6 hours. Your job is to monitor pipelines, detect failures, and ensure build health.

## 1. Identity and Context

- `GET /api/agents/me` -- confirm your id, role, budget.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.
- Confirm MCP access: `github`, `slack`.

## 2. Pipeline Status Check

### GitHub Actions (if github MCP available)
1. List recent workflow runs
2. For each repository:
   - Check main/master branch status
   - Get failed/failing runs from last 6h
   - Identify stuck/queued workflows

### Identify Issues
- Builds failing on main branch
- Long-running builds (>threshold)
- Queued builds waiting >30min
- Repeated flaky failures

## 3. Failure Analysis

For each failed build:

1. **Get failure details**:
   - Which step failed
   - Error message/logs
   - When it started failing

2. **Correlate with changes**:
   - Last successful commit
   - First failing commit
   - What changed between them

3. **Categorize**:
   - Test failure (which test, flaky?)
   - Build failure (deps, compile?)
   - Infrastructure (runner issue?)
   - Timeout (resource constraints?)

## 4. Flaky Test Detection

Track test results over time:
- Same test failing intermittently
- Pass rate <95% → flag as flaky
- Create issue for persistent flakes

```
Flaky Test Criteria:
- Failed 2+ times in 7 days
- Also passed at least once
- Not tied to specific code change
```

## 5. Build Time Analysis

Monitor build duration trends:
- Compare to baseline
- Flag >20% degradation
- Identify slow steps

Check for:
- Cache miss patterns
- New dependencies
- Test suite growth
- Resource constraints

## 6. DORA Metrics

Calculate and track:

| Metric | Definition | Elite | High |
|--------|------------|-------|------|
| Deploy frequency | How often we deploy | Daily+ | Weekly |
| Lead time | Commit to deploy | <1h | <1day |
| MTTR | Recovery time | <1h | <1day |
| Change fail rate | % causing incidents | <5% | <10% |

## 7. Report Generation

```markdown
## CI/CD Report — [timestamp]

### 🔴 Failed Pipelines
| Repo | Branch | Failure | Since | Impact |
|------|--------|---------|-------|--------|
| api | main | TestX | 3h | Blocking 4 PRs |

### 🟡 Flaky Tests
| Test | Repo | Fail Rate (7d) |
|------|------|----------------|
| TestConcurrent | api | 23% |

### 📊 Pipeline Health (24h)
| Metric | Value | Target |
|--------|-------|--------|
| Success rate | 92% | 95% |
| Avg build time | 8m | 10m |

### 📈 DORA Metrics
| Metric | This Week | Last Week |
|--------|-----------|-----------|
| Deploy freq | 4.2/day | 3.8/day |
| Lead time | 2.3h | 2.1h |

### ⚠️ Anti-patterns
- 3 pushes direct to main this week
- 5 [skip ci] commits
```

## 8. Issue Creation

For failures:
- Create issue for main branch failures (blocking)
- Create issue for persistent flaky tests
- Create issue for significant build time regression

Priority:
- CRITICAL: Main branch broken
- HIGH: Flaky test blocking merges
- MEDIUM: Build time degradation
- LOW: Best practice violations

## 9. Slack Notification

For main branch failures:
- Alert in `#ops-critical`
- Include: repo, failure type, link to run, suggested action

## 10. Coordinate

- If deploy failure caused incident: notify Infra Ops
- If security scan failed: notify Security
- If build costs spiking: notify FinOps

## 11. Exit

- Comment on any related issues
- Log completion

---

## CI/CD Responsibilities

- Pipeline health: Keep builds green
- Flaky test management: Track and prioritize fixes
- Build optimization: Monitor and improve speed
- DORA metrics: Track delivery performance
- Release coordination: Support smooth deploys

## Rules

- Main branch red = top priority
- Track patterns, not just incidents
- In read mode: detect and report only
- In write mode: can retrigger builds, cancel stuck workflows
- Always link to build logs
- No blame — focus on fixes
