# ShopLedger architecture

```mermaid
flowchart LR
  subgraph browser[Browser UI]
    UI["public/<br/>index.html · css/style.css · js/app.js"]
  end
  S["server.js<br/>express.static() · /api mounts"]
  subgraph routes[routes/]
    RO["orders.js<br/>POST /api/orders · GET · cancel"]
    RP["products.js<br/>GET /api/products · /api/coupons"]
    RC["customers.js<br/>GET customers · POST settlement"]
    RR["reports.js<br/>dashboard · GST audit · preview · export"]
  end
  subgraph libs[lib/]
    I["inventory.js<br/>find() · check() · reserve() · release()"]
    C["coupons.js<br/>normalizeCode() · validate() · calculateDiscount()"]
    P["pricing.js<br/>subtotal() · computeTotals()"]
    T["tax.js<br/>getRateForItem() · splitCgstSgst()"]
    L["ledger.js<br/>findCustomer() · chargeOrderToKhata() · settlements"]
    O["orders.js<br/>add() · get() · list() · cancel()"]
    D["dates.js<br/>today() · normalizeDateKey()"]
    ST["store.js<br/>read() · appendAudit() · write()"]
    R["reports.js<br/>getGstReconciliation() · getDashboardSummary()"]
    INV["invoice.js<br/>render() · computeInvoiceFigures()"]
  end
  CFG["config.js<br/>shop · tax · coupons · inventory · port · adminKey"]
  DB[("data/db.json")]
  SI["server.js<br/>GET /orders/:id/invoice"]

  UI -->|1 · POST /api/orders| RO
  RO -->|2 · read| ST
  RO -->|3 · find / check| I
  RO -->|4 · normalizeCode / validate| C
  RO -->|5 · subtotal / computeTotals| P
  RO -->|6 · findCustomer / chargeOrderToKhata if Khata| L
  RO -->|7 · reserve: deduct physical stock| I
  RO -->|8 · add| O
  RO -->|9 · appendAudit / write| ST
  ST -->|10 · writeFileSync| DB

  UI -.->|GET /api/reports/gst-reconciliation or dashboard| RR
  RR -.->|getGstReconciliation / getDashboardSummary| R
  R -.->|computeInvoiceFigures: compare with stored totals| INV
  UI -.->|Invoice link| SI
  SI -.->|render| INV

  UI -->|HTTP / static assets| S
  S --> RP & RC & RR
  S -->|mount /api| RO
  RP --> ST & I & T & C
  RC --> ST & L
  RR --> ST & P & C & CFG
  P --> C & T
  O --> I & L & D
  L --> D
  R --> I & L
  SI -->|read| ST
  SI -->|get| O
  ST -->|readFileSync| DB
  S --> CFG
  I & C & T & INV --> CFG

  classDef hotspot fill:#fff,stroke:#dc2626,stroke-width:3px
  class P,INV hotspot
  linkStyle 0,1,2,3,4,5,6,7,8,9 stroke:#2563eb,stroke-width:2px
  linkStyle 10,11,12,13,14 stroke:#7c3aed,stroke-width:2px,stroke-dasharray:7 5
```

Legend:
1. Numbered blue arrows trace place-order execution; steps 3 and 7 call the same inventory module.
2. Purple dashed arrows trace the separate printable invoice and GST audit paths.
3. Other arrows show supporting calls, configuration reads, static serving and database reads; responses are omitted.
4. Ticket 1 hotspot: two engines compute the same GST
5. Khata charging is conditional; mutations stay in memory until store.write() replaces data/db.json; audit compares stored totals without calling pricing.computeTotals().
