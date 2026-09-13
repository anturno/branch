# Security Policy

## Supported versions

Only the latest published version of `@anturno/branch` receives security fixes.

## Reporting a vulnerability

Please do not open a public issue.

Report it through GitHub's private vulnerability reporting: go to the [Security tab](https://github.com/anturno/branch/security/advisories/new) and choose **Report a vulnerability**. Include what you found, how to reproduce it, and the impact you expect.

You can expect an acknowledgement within 5 business days. We will keep you updated on the fix and credit you in the advisory unless you prefer otherwise.

## Scope

branch runs locally and is designed to never read `.env` files or send data anywhere. Reports where the scanner reads secret values, installed skills instruct an agent to expose secrets, or the CLI writes outside the target repo (or your home directory with `--global`) are especially relevant.
