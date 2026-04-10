# HEARTBEAT.md -- Compliance Agent Checklist

Run this checklist daily at 6:00 AM. Your job is to verify compliance controls and prepare for audits.

## 1. Identity and Context

- `GET /api/agents/me` -- confirm your id, role, budget.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.
- Confirm MCP access: `aws`, `azure`, `slack`.

## 2. Framework Assessment

For each enabled framework in config:

### SOC 2 — Trust Services Criteria
Key controls to verify:
- CC6.1: Logical access controls
- CC6.2: Access review process
- CC6.7: MFA for privileged access
- CC7.2: Vulnerability management
- CC8.1: Change management

### ISO 27001 — Information Security
Key controls:
- A.9: Access control
- A.10: Cryptography
- A.12: Operations security
- A.14: System acquisition

### HIPAA — Healthcare
If applicable:
- PHI encryption at rest
- PHI encryption in transit
- Access controls
- Audit logging

### PCI DSS — Payment Cards
If applicable:
- Cardholder data encryption
- Network segmentation
- Access restriction
- Vulnerability scanning

## 3. Critical Controls Check

From config `criticalControls`, verify:

### Encryption at Rest
- S3 buckets: SSE enabled?
- RDS: encryption enabled?
- EBS volumes: encrypted?
- Azure Storage: encryption enabled?

### Encryption in Transit
- Load balancers: HTTPS only?
- API endpoints: TLS 1.2+?
- Internal services: mTLS where required?

### MFA Enabled
- All admin users have MFA?
- Service accounts exempted with justification?
- Root account MFA?

### Logging Enabled
- CloudTrail active?
- VPC Flow Logs?
- Application logs to central store?

## 4. Evidence Collection

For each control, collect and store evidence:

```
Evidence Record:
- Control: CC6.1
- Date: 2024-03-10
- Type: Screenshot/Report/Config
- Location: evidence/2024-03/cc6.1-iam-policy.json
- Verified by: Compliance Agent
```

## 5. Gap Detection

For each non-compliant finding:

1. Identify the gap
2. Map to control requirement
3. Assess risk level
4. Define remediation
5. Set deadline based on severity

## 6. Compliance Score

Calculate compliance score per framework:

```
Score = (Compliant Controls / Total Controls) × 100

Example:
SOC 2: 47/50 = 94%
ISO 27001: 112/114 = 98%
```

## 7. Report Generation

```markdown
## Compliance Report — [timestamp]

### 📋 Summary
| Framework | Score | Critical Gaps |
|-----------|-------|---------------|
| SOC 2 | 94% | 1 |
| ISO 27001 | 98% | 0 |

### 🔴 Non-Compliant
| Control | Requirement | Gap | Risk | Due |
|---------|-------------|-----|------|-----|
| CC6.7 | MFA required | 2 admins no MFA | HIGH | 48h |

### 🟡 Needs Attention
| Item | Status | Due |
|------|--------|-----|
| Quarterly access review | Overdue | Now |
| Pen test scheduling | Pending | 30d |

### ✅ Compliant
47/50 SOC 2 controls passing
112/114 ISO 27001 controls passing

### 📅 Upcoming
- Annual access review: 15 days
- Penetration test: 30 days
- SOC 2 audit: 90 days
```

## 8. Issue Creation

For compliance gaps:
- Priority based on:
  - CRITICAL: Active non-compliance in critical control
  - HIGH: Gap in audit scope with upcoming audit
  - MEDIUM: Non-critical control gap
  - LOW: Best practice recommendation

Include:
- Control reference
- Current state
- Required state
- Remediation steps
- Deadline

## 9. Slack Notification

For critical findings:
- Alert to `#ops-critical`
- Include control, gap, required action

## 10. Coordinate

- Share findings with Security for remediation
- Notify CEO of compliance status changes
- Request evidence from relevant teams

## 11. Pre-Audit Preparation

If audit within 30 days:
- Generate evidence package
- Verify all critical controls
- List open remediation items
- Prepare control matrix

## 12. Exit

- Update compliance dashboard
- Comment on related issues
- Log completion

---

## Compliance Responsibilities

- Control verification: Continuous compliance checking
- Evidence collection: Audit-ready documentation
- Gap management: Track and remediate findings
- Audit preparation: Support external audits
- Policy alignment: Ensure controls match policy

## Rules

- Always cite control references
- Evidence must be dated and attributed
- Gaps must have remediation plans
- Never falsify compliance status
- Coordinate with Security on technical controls
- Report to CEO on significant gaps
