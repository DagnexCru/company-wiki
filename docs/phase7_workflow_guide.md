# Phase 7 — Review, Approval, Rejection, and Publishing Workflow Specification

## 1. Overview
The Internal Knowledge Base & Company Wiki content lifecycle enforces peer review before documents are visible to general readers.

## 2. Permitted State Transitions
```
               [submit]
[Draft] ---------------------> [In Review]
  ^                                 |
  |             [reject]            | [approve]
  +---------------------------------+
  |       (with feedback)           v
[Rejected]                    [Published]
  |                                 |
  +-------- [resubmit] ------------>+ (via In Review)
                                    |
                              [archive]
                                    v
                               [Archived]
```

## 3. Allowed Operations by Role
| Role | Can Submit Draft? | Can Review Queue? | Can Approve? | Can Reject? | Can Review Own Article? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Administrator** | Yes | Yes | Yes | Yes | Yes (Override) |
| **Reviewer** | Yes (if author) | Yes | Yes | Yes | **NO (Independent Review Invariant)** |
| **Author** | Yes | No (403) | No (403) | No (403) | No (403) |
| **Reader** | No (403) | No (403) | No (403) | No (403) | No (403) |

## 4. Invariants Enforced
1. **Independent Review Invariant**: Authors cannot approve or reject their own articles unless they are an Administrator.
2. **Review State Invariant**: Only articles currently in `in_review` can be approved or rejected. Calling approve or reject on `draft` or `published` articles returns `400 Bad Request`.
3. **Mandatory Feedback Invariant**: Rejection requires meaningful feedback explaining the needed revisions (minimum 5 characters).
4. **Resubmission Invariant**: Authors can revise rejected articles and resubmit them back to `in_review` status.
5. **FIFO Queue Ordering**: The review queue orders articles by `submitted_at`, ensuring fair, first-come first-served processing.
6. **Audit Preservation**: Every submission, approval, and rejection generates an immutable `ReviewRecord` preserving actor, timestamp, status transition, and notes.
