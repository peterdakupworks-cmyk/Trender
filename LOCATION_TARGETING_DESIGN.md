# Trender Location Targeting — UI/UX Specification

## Why this is a core feature
Every campaign must answer: **Where should this content be distributed?**

### Artist/Brand campaign creation
Add a prominent **Target location** card immediately after budget/creator tier.

Two choices:
1. **Specific city** — target creators in one Nigerian city.
2. **All Nigeria** — target eligible creators nationwide.

When **Specific city** is selected:
- State selector is required.
- City selector is required.
- Example: `FCT → Abuja`.
- Preview text: `Only eligible creators in Abuja, FCT`.

When **All Nigeria** is selected:
- City/state fields disappear.
- Preview text: `Eligible creators across Nigeria`.

## Creator experience
Creator registration/profile must collect:
- City
- State

The Campaigns feed uses that location automatically:
- Abuja creator → sees Abuja campaigns + Nigeria-wide campaigns.
- Lagos creator → sees Lagos campaigns + Nigeria-wide campaigns.
- Abuja creator must not see a Lagos-only campaign.

Each campaign card shows a location badge:
- `📍 Abuja, FCT`
- `📍 Lagos, Lagos State`
- `🇳🇬 Nigeria`

Campaign details repeat the targeting so the creator knows why the task is available.

## Backend rule
Location filtering is a security/business rule and must be enforced server-side after Supabase is connected. Client-side filtering is only for the demo UI.

For a city campaign:
`creator.city = campaign.target_city AND creator.state = campaign.target_state`

For a Nigeria campaign:
`campaign.target_scope = 'nigeria'`

The platform should make matching campaigns visible in the creator's eligible feed. It does not need to create a duplicate task record for every creator before they accept/claim it.
