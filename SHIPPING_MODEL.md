# MINTFORGE Shipping Model

MINTFORGE uses a deliberately simple seller shipping model.

## Seller options
Every physical product has exactly one of three shipping options:

1. **Free Shipping** — buyer pays $0 shipping.
2. **Flat Rate** — one fixed shipping price set by the seller.
3. **Worldwide Flat Rate** — one Australia price and one international price.

There are no seller shipping zones, country groups, exclusions, weight tables, profiles, or custom shipping engines in the storefront UI.

## Buyer profile
The connected wallet can save a reusable shipping profile containing:
- Full name
- Email
- Address line 1
- Address line 2 (optional)
- City / suburb
- State / province / region
- Postal / ZIP code
- Country

Country selection uses the ISO alpha-2 country code and includes the full country list.

## Checkout
The buyer selects their country and enters their delivery details. The checkout service remains the source of truth for the final shipping amount and total. The client only displays an estimate and sends the destination to checkout creation.

For a multi-seller cart, each seller's applicable shipping amount can be included in the server-calculated payment split.

## Order snapshot
At checkout creation, the final destination and shipping amount are captured with the order so later listing changes do not rewrite an existing order.

## Principle
Keep shipping simple now. More advanced shipping rules can be added later only if the business actually needs them; they should not be implemented as hidden compatibility layers or frontend patches.
