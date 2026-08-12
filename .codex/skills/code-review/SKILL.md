---
name: code-review
description: Comprehensive, read-only code review skill for analyzing entire codebases or explicitly mentioned files. Use when asked to review code for logic bugs, type errors, security issues, performance problems, regressions, maintainability risks, or version-sensitive framework, library, package, and SDK behavior. Prioritize a thorough, evidence-based report with file references and never modify code while reviewing.
---

# Code Review

## Overview

Perform deep, read-only code reviews. Check all files in scope, prioritize real issues over style nitpicks, and produce a structured report with clear evidence and impact.

Use Context7 as an optional documentation-validation layer when a finding depends on framework, library, package, or SDK behavior. Context7 supports findings; it never replaces inspection of the actual codebase or the application's trust boundaries.

## Non-Negotiable Rules

- Never modify code during review.
- Never create, delete, or rewrite project files as part of review output.
- Treat user focus areas as mandatory priorities.
- If user asks for full-codebase review, inspect every file in the repository that can affect behavior.
- If user names specific files, inspect all named files completely.
- Do not claim a file was reviewed unless it was actually opened and analyzed.
- When a finding depends on external dependency behavior, verify it against current documentation with Context7 when relevant documentation is available.
- Do not report version-sensitive findings from model knowledge alone when relevant Context7 documentation is available.
- Prefer documentation matching the project's resolved dependency version. Do not assume the latest documentation applies unchanged to an older version.
- If Context7 is unavailable or lacks sufficient documentation, continue with direct code analysis and state the documentation limitation; do not invent or imply validation.
- Keep Context7 queries minimal and specific. Never send source code, secrets, credentials, personal data, or proprietary project identifiers.

## Review Workflow

### 1. Define Scope

- Determine whether scope is entire codebase or specific files.
- Expand scope to directly related files when needed to validate behavior.
- Record scope boundaries in the final report.

### 2. Build File Inventory

- Enumerate files in scope before analysis.
- Group files by area:
  - Runtime code
  - Configuration
  - Infrastructure
  - Tests
  - Schemas
  - Migrations
  - Scripts
  - Package manifests and lockfiles
- Do not sample when full coverage is requested.

### 3. Identify Technology Context

Before evaluating version-sensitive behavior:

- Inspect package manifests, lockfiles, configuration files, and relevant imports.
- Identify frameworks, libraries, packages, SDKs, and their resolved versions when possible.
- Identify dependencies whose APIs, security requirements, configuration, or recommended usage may be version-sensitive.
- Form a concrete documentation question before querying Context7.
- Do not query Context7 indiscriminately for every dependency.

### 4. Analyze Every In-Scope File

For each file, check at minimum:

- Logic correctness and edge cases
- Type safety and type drift risks
- Security vulnerabilities and unsafe trust boundaries
- Performance bottlenecks and unnecessary work
- Reliability issues (error handling, retries, race conditions, resource leaks)
- Regression risk from implicit assumptions or fragile coupling
- Framework or library API correctness when behavior is version-sensitive

If user requests extra focus (for example accessibility, API consistency, architecture), include it as a first-class review axis.

### 5. Validate Third-Party API Usage

When a potential finding depends on framework, library, package, or SDK behavior:

1. Identify the relevant dependency and the behavior that needs verification.
2. Determine the installed or resolved version when possible.
3. Resolve the dependency to a Context7-compatible library ID before querying, unless an exact Context7 library ID was already provided.
4. Query Context7 with one focused question about the behavior, including the relevant version when supported.
5. Prefer authoritative, version-matched documentation and distinguish explicit requirements from examples or recommendations.
6. Compare the implementation against the documented behavior and the surrounding application code.
7. Classify the result as incorrect, unsafe, deprecated, incompatible, valid but improvable, or fully valid.
8. Report a finding only when concrete code evidence supports it and documentation is used only as supporting evidence where applicable.

Reject a potential finding when documentation demonstrates that the implementation is valid. Do not inflate severity merely because the implementation differs from a preferred documentation example.

### 6. Validate Findings Quality

- Report only issues with concrete evidence.
- Prefer high-signal findings over speculative comments.
- If uncertain, explicitly mark uncertainty and what would confirm it.
- Distinguish bugs from improvements.
- For third-party API findings, record whether Context7 was consulted, unavailable, or inconclusive.
- If Context7 documentation materially supports a finding, include the technology, relevant version, and documented behavior in the evidence.
- If Context7 contradicts an initial assumption, revise or reject the finding.

### 7. Produce Final Report

Order findings by severity:

1. Critical
2. High
3. Medium
4. Low

For each finding include:

- Severity
- File and line reference
- What is wrong
- Why it matters (impact)
- Minimal recommended fix direction
- Documentation basis when third-party behavior materially supports the finding

Then include:

- Scope summary (what was reviewed)
- Areas with no issues found
- Open questions or assumptions
- Residual risk or testing gaps
- Documentation, version, or Context7 limitations, if any

## Context7 Usage Guidelines

Use Context7 when the review depends on knowing how a third-party technology behaves, especially for:

- Framework APIs and lifecycle behavior
- Authentication, authorization, and session libraries
- Database clients and ORMs
- Validation and routing libraries
- Rich-text editors and state-management libraries
- SDKs and security-sensitive configuration
- Deprecated APIs and version-specific behavior
- Official configuration or migration requirements

Context7 is especially valuable when:

- An API may have changed between versions.
- A potential bug depends on framework lifecycle behavior.
- Authentication or authorization behavior needs verification.
- Security defaults or configuration requirements need verification.
- The reviewer is uncertain whether an implementation is supported.
- Documentation may contradict assumptions based on general model knowledge.

Context7 is usually unnecessary for:

- Pure application business logic
- Obvious TypeScript or JavaScript errors
- Project-specific algorithms
- Naming or formatting preferences
- Issues already proven directly by the code
- Generic maintainability observations that do not depend on external APIs

When using Context7:

- Resolve the library ID first, then query documentation; follow the Context7 tool's call limit and query requirements.
- Ask narrow, behavior-specific questions rather than broad searches.
- Match the documentation to the resolved dependency version whenever possible.
- Do not treat a documentation example as a mandatory architecture unless the documentation explicitly establishes that requirement.
- Prefer explicit API contracts, security requirements, migration notes, and documented behavior over examples.
- If documentation is ambiguous or version-mismatched, lower confidence and state the limitation.
- Do not claim Context7 validation unless it was actually consulted.
- Do not include sensitive or proprietary material in queries.

## Reporting Standards

- Be precise and concise.
- Use direct file references for every non-trivial claim.
- Avoid generic advice without evidence.
- Prefer actionable remediation guidance.
- If no issues are found, state that explicitly and list residual risks.
- Clearly separate confirmed defects from recommendations.
- Clearly identify findings whose validity depends on third-party documentation.
- Do not claim Context7 validation when Context7 was not actually consulted.

## Security Review Mindset

For security-sensitive code, pay particular attention to:

- Authentication
- Authorization
- Session management
- Cookies
- Tokens
- Password handling
- Input validation
- Database queries
- Public/private resource boundaries
- CORS
- CSRF
- XSS
- Injection risks
- Secrets and environment variables
- Public API exposure

Use Context7 to verify security-sensitive library behavior where appropriate, but independently analyze the application's trust boundaries and business rules. Official library behavior does not guarantee that the application's integration is secure.

## Reviewer Mindset

- Think like an attacker for security paths.
- Think like production traffic for performance paths.
- Think like future maintainers for reliability and clarity.
- Think like a dependency maintainer when validating third-party API usage.
- Focus on behavior and risk, not personal style preferences.
- Challenge initial assumptions before turning them into findings.

## Core Principle

Code is the primary evidence.

Context7 documentation is supporting evidence for understanding external dependencies.

A finding should survive both:

**What does the code actually do?**

and, when third-party behavior is involved:

**Is that interpretation consistent with the relevant documented API and resolved version?**
