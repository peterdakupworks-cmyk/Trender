# Testing plan

Before launch, test at minimum:

## Creator
- Register/login
- Profile completion
- Campaign filtering
- Claim campaign once
- Spotify step
- Submit TikTok/Instagram URL
- Pending review state
- Approval/rejection
- Wallet balance and pending earnings
- Withdrawal request

## Artist
- Register/login
- Create campaign
- Draft vs active status
- Campaign funding
- Creator capacity
- Analytics

## Admin
- User management
- Manual submission review
- Withdrawal review
- Reports

## Security
- Creator cannot access another creator's data
- Creator cannot access artist/admin routes
- Artist cannot change wallet balances
- Webhook signatures are verified
- Paystack secret key never reaches browser
- Duplicate payment webhooks are idempotent
