---
description: "SearXNG web search provider (via BuddhiAI Studio REST API) for the web capability seam (ctx.web)."
kind: "package-reference"
---

# @buddhilive/bah-web-search-searxng

## Summary

This package provides a SearXNG-backed web search provider (via BuddhiAI Studio REST API) for the harness web capability seam (`ctx.web`).

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin to enable web searches through a local SearXNG engine via BuddhiAI Studio.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The provider issues search requests to BuddhiAI Studio's SearXNG proxy endpoint and returns formatted search results.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through `dsh-tool-web`, which renders this provider's search results into model-visible tool results.

#### KV Cache effect

No direct invalidation; the named consumer owns any request-prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

None.
