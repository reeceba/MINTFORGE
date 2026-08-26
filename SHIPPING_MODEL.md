# MINTFORGE Worldwide Shipping Model

MINTFORGE supports international physical-goods shipping without a central admin wallet.

## Seller shipping profiles
Each connected seller wallet can manage its own shipping zones. A seller may create:
- Worldwide zone
- Country-group / region zone
- Specific-country zone
- Free shipping or flat-rate shipping
- Country exclusions
- Processing-time minimum and maximum

Matching priority is **specific country → country group/region → worldwide**. A seller's shipping rules apply to listings owned by that seller wallet. Listing-level shipping remains as a safe fallback when no seller zone matches.

## Buyer addresses
- ISO 3166-1 alpha-2 country codes
- Full international country selection
- Full name
- Email
- Address line 1/2
- City
- State/province/region (optional by country)
- Postal/ZIP code (optional by country)
- Saved wallet-specific shipping profile

## Checkout
The checkout service resolves shipping from the destination country and each seller's active shipping zones. Multi-seller carts are supported: each seller's shipping amount is calculated separately and included in that seller's payment split.

The server calculates the final subtotal, shipping and total. Buyers cannot override seller shipping prices from the client.

## Order snapshot
The exact destination country, address, shipping amount and shipping method are copied into `order_shipping` and the order totals at checkout creation. Later seller/listing shipping changes do not alter an existing order.

## Security
- Shipping totals are calculated server-side.
- Seller shipping zones are restricted to the connected seller wallet.
- Seller order/listing access remains wallet-scoped.
- No central admin receiving wallet is required for seller payments.
- Failed checkout creation does not create a fulfilable paid order.
