---
description: "BuddhiAI Studio local inferencing adapter for the BuddhiAI Harness LLM seam; routes LLM requests to local BuddhiAI Studio."
kind: "package-reference"
---

# @buddhilive/bah-llm-buddhi

## Summary

This package provides the BuddhiAI Studio local inferencing adapter for the harness LLM seam (`ctx.llm`). It connects the harness to locally running models hosted on BuddhiAI Studio.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin to route LLM completions through BuddhiAI Studio.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The adapter connects to BuddhiAI Studio's local endpoint over HTTP with SSE streaming.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through provider adapters that forward assembled requests to the local inferencing endpoint.

#### KV Cache effect

Dependent on the local engine's prompt-caching implementation.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

None.
