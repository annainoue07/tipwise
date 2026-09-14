---
name: work-issue
description: Take a GitHub issue from plan through to an open pull request. Use when asked to work on, implement, or pick up an issue by number.
---

# Work an issue end to end

Invoked as `/work-issue 42` or `/work-issue` to pick the next `ready` issue.

Follow these steps in order. **Do not skip ahead**, and stop at any gate that
fails rather than working around it.

## 1. Read the issue

```bash
gh issue view <number>
```

Confirm it is labelled `ready`. If it is labelled `needs-triage`, `blocked`, or
`content`, stop and say so — those need a human first.

Restate the issue in your own words in one or two sentences, and list any
ambiguity you found. If the issue does not specify acceptance criteria clearly
enough to know when you are done, **stop and ask**. Do not infer scope.

## 2. Plan before touching files

Read `CLAUDE.md`, `docs/ARCHITECTURE.md`, and `docs/CODING_STANDARDS.md` if not
already in context. Check `docs/adr/` for decisions bearing on this task.

Search for existing code that already does part of this work:

```bash
rg -n "<relevant terms>" packages/ apps/
```

Duplicated near-identical logic is this project's most likely failure mode.
Extending existing code beats adding a parallel implementation.

Then present a plan: files to change, the approach, and the tests you will
write. **Wait for approval before implementing.** For a one-line typo fix, say
so and proceed; for anything else, the plan gate is not optional.

## 3. Branch

```bash
git switch main && git pull
git switch -c feat/<number>-<short-slug>
```

Never commit to `main`. Branch protection will reject it anyway, but do not
rely on that as the check.

## 4. Implement

Follow `docs/CODING_STANDARDS.md`. Write the test alongside the code, not
afterwards. Keep the change scoped to the issue — if you find an unrelated bug,
note it for step 9 rather than fixing it here.

## 5. Verify

```bash
pnpm verify
```

This must pass. If a test fails:

- Understand **why** before changing anything.
- If the code is wrong, fix the code.
- If the test is wrong, explain in the PR why the expectation was incorrect.
- **Never edit an assertion merely to make it pass.** If you cannot tell which
  side is wrong, stop and ask. This is the most damaging thing you can do here.

## 6. Review your own diff

```bash
git diff main...HEAD
```

Then run the built-in reviewers:

```
/code-review
/security-review
```

Read the findings and act on them. Check specifically for:

- Money handled as floats anywhere
- Any path that writes an image or user data to disk
- The API key appearing in client-side code or logs
- Tipping norms added or edited (not permitted for agents)
- New runtime dependencies without an ADR

Fix what you find, then re-run `pnpm verify`.

## 7. Commit

Conventional commits, imperative mood, one logical change per commit:

```bash
git add -A
git commit -m "feat: calculate tip from subtotal excluding tax (#42)"
```

Do not add co-author trailers or emoji unless asked.

## 8. Push and open the PR

```bash
git push -u origin HEAD
gh pr create --fill --base main
```

Fill in the PR template properly — especially **"What I did NOT test"** and
**"Anything you were unsure about"**. An accurate limitation is more valuable
than a confident claim. Reviewers read the uncertainty section most carefully.

## 9. Report back

Post a short summary in chat: what changed, what you verified, what you did not
verify, and any unrelated issues you spotted (open those as new issues labelled
`needs-triage`).

## 10. Stop

**Do not merge.** Do not approve. Do not deploy. Do not modify branch
protection or CI workflow files. The human reviews and merges.

If CI fails after the PR opens, you may push fixes to the same branch — but
report what failed and why rather than silently patching until it goes green.
