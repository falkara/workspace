---
'@falkara/presentation': patch
---

The type declarations no longer export the namespaces the build used internally, such as `Typography_d_exports`, which type-checked as imports but do not exist at runtime.
