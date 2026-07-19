---
name: vue-sales-pricing-ui
description: Build sales, order, and cart screens safely without trusting frontend totals.
---

# Vue Sales Pricing UI Skill

## Rules

- Inspect cart, order, item price, stock, warehouse, payment, installment, and order log behavior first.
- Do not invent calculations.
- Treat backend totals as authoritative.
- Show frontend totals only as previews when source data is returned by backend.
- Do not block stock quantities unless backend exposes stock availability.
- Do not send client-calculated totals unless backend validation requires them.
- Clearly distinguish draft UI previews from saved backend totals.
