---
description: "BuddhiAI Harness brand occupants for the sidebar and conversation hero slots; for users and maintainers configuring brand presentation."
kind: "package-reference"
---

# @buddhilive/bah-client-ui-brand

## Summary

This package fills the sidebar brand slots — `sidebar.brand.mark` and `sidebar.brand.name` — and conversation hero slot with the BuddhiAI Harness mark and name. It retains no runtime state and contributes nothing to model requests.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin in the browser roster of a deployment whose identity is BuddhiAI.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The brand occupants install as slot occupants into `@buddhilive/dsh-client-ui-slots`.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser presentation only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

None.
