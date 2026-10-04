# Patched braces

This directory contains the runtime sources and MIT license from
[upstream security PR #72](https://github.com/micromatch/braces/pull/72), pinned to
[commit 28d440b](https://github.com/FSDevelop/braces/tree/28d440b5dd449dbf1fe6f3506cf94ecca4d02660).
The package manifest contains only runtime metadata. Internal imports use named
bindings, two unused private helpers are removed, and `isInteger` remains private
so Knip can verify the actual dependency graph. The public API and security patch
are unchanged.

The patch bounds nesting in parsing and AST traversal to address
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
There is no patched registry release yet. An npm workspace supplies this local
package to its consumers while keeping npm's default remote-fetch restrictions.
Remove this workspace and directory after updating to a patched registry release
when one becomes available. npm audit does not assess this local package, so
the pinned patch also requires source review and upstream regression validation.
