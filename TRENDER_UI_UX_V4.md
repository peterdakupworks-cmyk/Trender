# TRENder UI/UX V4 — Location-First Campaign Targeting

## Product principle
Location targeting is a primary campaign control. It should never be buried inside an advanced-settings menu.

## Artist / Brand flow

1. Dashboard
2. Create Campaign
3. Campaign details
4. Budget and creator tier
5. **Campaign Location**
6. Requirements
7. Review & Publish

### Campaign Location component
The component appears as a prominent card with:
- "CORE TARGETING" eyebrow
- "Where should this campaign run?"
- Specific City option
- All Nigeria option
- State selector
- City selector
- Distribution preview

### Examples
**Local campaign**
- Scope: Specific City
- State: FCT
- City: Abuja
- Preview: "Eligible creators in Abuja, FCT"

**National campaign**
- Scope: All Nigeria
- Preview: "Eligible creators across Nigeria"

## Creator onboarding
Creator profile must collect:
- Country
- State
- City

The creator's location should be verified/approved before it is used for campaign eligibility.

## Creator campaign feed
Each campaign card should show a location badge:
- "Abuja, FCT"
- "Nigeria-wide"

A creator should only receive campaigns for which they are eligible.

## Campaign details
Show the target location immediately below campaign title and artist/brand:
"📍 Target audience: Abuja, FCT creators"

## UX safeguards
- If City is selected, State and City are required.
- Do not allow publishing with an incomplete target location.
- Show a distribution preview before payment/publishing.
- Server-side eligibility must enforce the location rule.
- Do not create duplicate task rows for every creator; determine eligibility when serving the campaign feed and create a task/claim record when a creator claims it.

## Visual direction
- Premium, modern, creator-economy product.
- Trender purple as the primary brand action color.
- Mint/green for success, targeting and active states.
- Deep dark surfaces with high-contrast text.
- Rounded cards and clear hierarchy.
- Mobile-first creator experience.
- Artist campaign creation should feel like a guided wizard, not a long form.

## Future-ready extension
The data model can later support:
- multiple cities
- multiple states
- radius targeting
- creator audience location
- language targeting
- demographic targeting

These are not part of the MVP.
