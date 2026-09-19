---
title: Limiance Gateway
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# Limiance Gateway

All REST/HTTP endpoints for Limiance Backend Gateway.

Base URLs:

# Authentication

- HTTP Authentication, scheme: bearer

- HTTP Authentication, scheme: bearer

- HTTP Authentication, scheme: bearer

# System

## GET Get system languages

GET /languages

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get system time zones

GET /timezones

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# KYC

## GET Get KYC status

GET /api/v1/users/kyc_status

Returns the current KYC verification status, tier, and a human-readable tier name/description for the authenticated user.

> Response Examples

> 200 Response

```json
{
  "statusCode": 0,
  "success": true,
  "message": "string",
  "error": "string",
  "kycStatus": "APPROVED",
  "rejectionReason": "string",
  "submittedAt": "string",
  "tier": 0,
  "tierName": "Tier 1 — Basic",
  "tierDescription": "Identity verified (face match + government ID)."
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» error|string|false|none||none|
|» kycStatus|string|false|none||none|
|» rejectionReason|string|false|none||none|
|» submittedAt|string|false|none||none|
|» tier|integer|false|none||none|
|» tierName|string|false|none||none|
|» tierDescription|string|false|none||none|

#### Enum

|Name|Value|
|---|---|
|tier|0|
|tier|1|
|tier|2|

## POST Start KYC

POST /api/v1/users/kyc_start

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Auth

## POST Register

POST /api/v1/users/register

> Body Parameters

```json
{
    "email":"ayoseunsolomon@gmail.com",
    "phone":"09078097974",
    "password":"Lim!@nce2024xchnge",
    "confirmPassword":"Lim!@nce2024xchnge",
    "firstName":"Limnce",
    "lastName":"Limnce",
    "country":"Nigeria"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» firstName|body|string| yes |none|
|» lastName|body|string| yes |none|
|» email|body|string| yes |none|
|» password|body|string| yes |none|
|» referralCode|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Login

POST /api/v1/users/login

> Body Parameters

```json
{
  "emailOrPhone": "ayoseunsolomon@gmail.com",
  "password": "new_Password1234!",
  "rememberMe": false,
  "userAgent": "Mozilla/5.0 ...",
"lotNumber":"af6183f4f9de4eb1924849b640cb3acd","captchaOutput":"ymQJ7n7OdCWVEBuMCBZ7FkvnnZkm6Zi2t_D7xHo1GHAmHr1AT0IWVdnygbHfoqQlTf2HOZE-F-NGwpj8DfFvCeE8AlPTFMW33kFSW3CUDSUlnYKxvPMzG9-8J_EO3GgTFGsaJYFWZHxv-6T9_eVlscZuQ3LfWuyiEsso9WacNWfkoP1F6otviBvLfA6xskoHg3QvASSUYwcmkwxB6uDPlUjCmi1KmdLub71rt5VU5q27p81DA_xL46AqPgH-21V8PDzdWE6o-FK5JY-uzfB1MQoRau46m7MlplGrhPp5x5cvZOKQbmvuUUpXO1DlXEWxDaYG0IJlmT85PS4JwOBi7yeF9OVbJrRNu6VDKQ8_HK739E3n2hVoGy4E-esZh95LizSCX1fQaNET2IqflGNGKd9hUd9gJx9l7DauBeIgit_uv2ImMWCMGw2tL6Xh8D4T","passToken":"bf981b320eca6a3b539ff95dad9b6674cfce4ee8cc1025438eee1bd507da1b62","genTime":"1785508253"}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» emailOrPhone|body|string| yes |none|
|» password|body|string| yes |none|
|» rememberMe|body|boolean| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Social login

POST /users/login_socials

> Body Parameters

```json
{
  "provider": "google",
  "idToken": "<google-id-token>"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» provider|body|string| yes |none|
|» idToken|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Forgot password

POST /api/v1/users/forgot_password

> Body Parameters

```json
{
    "email":"ayoseunsolomon@gmail.com"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» email|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Refresh token

POST /api/v1/users/refresh_token

> Body Parameters

```json
{
  "refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiIzZGZjYWY0OSIsImVtYWlsIjoiYWRlZ29rZWFkZW5pcmFuOTY2QGdtYWlsLmNvbSIsImV4cCI6MTc3OTkyNzgzNywiaWF0IjoxNzc5ODg0NjM3fQ.W6QuVZqR69LhR6irM574FpMM-R8DZ8-DKSAlm3EZCcA"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» refreshToken|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Verify email

POST /api/v1/users/verify_email

> Body Parameters

```json
{
  "email":"ayoseunsolomon@gmail.com",
  "otp": "876380"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» otp|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Reset password

POST /api/v1/users/reset_password

> Body Parameters

```json
{
  "code": "343967",
  "email":"ayoseunsolomon@gmail.com",
  "confirmPassword": "new_Password1234!",
  "newPassword": "new_Password1234!"}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» otp|body|string| yes |none|
|» newPassword|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Update user profile

POST /api/v1/users/update_user

> Body Parameters

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+2348000000000"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» firstName|body|string| yes |none|
|» lastName|body|string| yes |none|
|» phone|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Change password

POST /api/v1/users/change_password

> Body Parameters

```json
{
  "oldPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» oldPassword|body|string| yes |none|
|» newPassword|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Complete second-factor login

POST /api/v1/users/login/verify-second-factor

Completes a login that was parked pending a second factor. When BOTH email OTP and TOTP are enabled for the account, they must be cleared sequentially in two separate calls, not one combined request: (1) call this endpoint with `loginChallengeToken` + `emailOtpCode` only — the response comes back with `requiresSecondFactor: true` and `totpRequired: true` (same `loginChallengeToken`), meaning the OTP step is done and only TOTP remains; (2) call this endpoint again with the same `loginChallengeToken` + `totpCode` to complete the login and receive tokens. If only one factor is enabled for the account, a single call with that factor's code completes the login directly. All failure responses return a generic "Invalid or expired login session" error so a caller cannot distinguish which factor was wrong.

> Body Parameters

```json
{
 "loginChallengeToken": "9a1f9557-cc0a-464b-b229-e5bdd636887d",
    "emailOtpCode": "434959",
    "totpCode": "516913",
    "rememberMe": true
}
```

```json
{
    "loginChallengeToken": "b3f1...-uuid",
    "totpCode": "123456",
    "rememberMe": false
}
```

```json
{
    "loginChallengeToken": "b3f1...-uuid",
    "totpCode": "123456",
    "rememberMe": false
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» loginChallengeToken|body|string| yes |Token returned by POST /users/login when a second factor is required|
|» totpCode|body|string| no |6-digit authenticator app code. Only accepted once the email OTP step (if required) has already been cleared.|
|» emailOtpCode|body|string| no |6-digit code emailed to the user. Required first if the account has email OTP enabled.|
|» rememberMe|body|boolean| no |none|

> Response Examples

> Login complete, or intermediate step\-up response if another factor is still pending

```json
{
    "statusCode": 200,
    "success": false,
    "message": "second factor required",
    "requiresSecondFactor": true,
    "totpRequired": true,
    "emailOtpRequired": false,
    "loginChallengeToken": "b3f1...-uuid"
}
```

```json
{
    "statusCode": 200,
    "success": true,
    "message": "Login successful",
    "accessToken": "...",
    "refreshToken": "..."
}
```

> 400 Response

```json
{
  "statusCode": 0,
  "success": true,
  "error": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Login complete, or intermediate step-up response if another factor is still pending|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid/expired challenge token, or wrong code|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» error|string|false|none||none|
|» accessToken|string|false|none||none|
|» refreshToken|string|false|none||none|
|» data|object|false|none||none|
|» requiresSecondFactor|boolean|false|none||true when another factor is still needed (see totpRequired/emailOtpRequired)|
|» totpRequired|boolean|false|none||none|
|» emailOtpRequired|boolean|false|none||none|
|» loginChallengeToken|string|false|none||Reuse this same token for the next step|

HTTP Status Code **400**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» error|string|false|none||none|

HTTP Status Code **500**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|string|false|none||none|
|» error|string|false|none||none|

## GET Logout

GET /api/v1/auth/logout

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Auth/2FA

## POST Enable 2FA

POST /api/v1/users/enable_2fa

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Disable 2FA

POST /users/disable_2fa

> Body Parameters

```json
{
  "code": "123456"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» code|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Verify 2FA

POST /api/v1/users/verify_2fa

> Body Parameters

```json
{
  "code": "222405"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» code|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet

## POST Add a whitelisted withdrawal address

POST /api/v1/wallet/whitelist

> Body Parameters

```json
{
  "chain": "string",
  "address": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» chain|body|string| yes |none|
|» address|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## DELETE Remove a whitelisted withdrawal address

DELETE /api/v1/wallet/whitelist

> Body Parameters

```json
{
  "chain": "string",
  "address": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» chain|body|string| yes |none|
|» address|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's whitelisted withdrawal addresses

GET /api/v1/wallet/whitelist

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get wallet by ID

GET /api/v1/wallet/76d56437-d346-4609-99a5-67db1924ea73

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get all wallets

GET /api/v1/wallet/all_wallets

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Suspend wallet

POST /wallet/wallets/<wallet-id>/suspend

> Body Parameters

```json
{
  "reason": "Suspicious activity"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» reason|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Convert asset

POST /api/v1/wallet/convert_asset

> Body Parameters

```json
{
  "fromSymbol": "BTC",
  "toSymbol": "USDT",
  "amount": "0.05"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» fromAsset|body|string| yes |none|
|» toAsset|body|string| yes |none|
|» amount|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete a wallet

DELETE /api/v1/wallet/wallets/{walletId}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|walletId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Wallet/Withdrawal

## POST Initiate withdrawal

POST /api/v1/wallet/initiate_withdrawal

> Body Parameters

```json
{
  "walletId": "6b67827e-554c-460a-854a-fec6d85d9be1", //wallet address of that chain
  "asset": "SOL", //coin or token
  "chain": "SOLANA", //chain or network name
  "amount": "0.01", //amount
  "destinationAddress": "7DbPvPYKaRAx5daqYsUVGPusTnYeojr9xNw7iQQ4rB6r", //receipent
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» walletId|body|string| yes |none|
|» asset|body|string| yes |none|
|» network|body|string| yes |none|
|» amount|body|string| yes |none|
|» destinationAddress|body|string| yes |none|
|» idempotencyKey|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Withdrawal

POST /api/v1/wallet/confirm_withdrawal

> Body Parameters

```json
{
    "otpCode": "466006"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|X-2FA-Code|header|string| no |none|
|body|body|object| no |none|
|» walletId|body|string| yes |none|
|» asset|body|string| yes |none|
|» network|body|string| yes |none|
|» amount|body|string| yes |none|
|» destinationAddress|body|string| yes |none|
|» idempotencyKey|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get network withdrawal/transfer fees

GET /api/v1/wallet/fees

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the minimum withdrawal amount per asset

GET /api/v1/wallet/minimum_withdrawal

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Wallet/Transactions

## GET Get User Transaction History

GET /api/v1/wallet/user/transactions_history

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|transaction_type|query|string| no |none|
|status|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Wallet Transaction History

GET /api/v1/wallet/6b67827e-554c-460a-854a-fec6d85d9be1/transaction_history

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|transaction_type|query|string| no |none|
|status|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet/Balance

## GET Get Balance

GET /api/v1/wallet/balance

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|account|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get balance allocations

GET /api/v1/wallet/balance_allocations

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get user portfolio

GET /api/v1/wallet/portfolio

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|query|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet/Transfer

## POST Internal transfer (intra-wallet)

POST /api/v1/wallet/internal_transfer

> Body Parameters

```json
{
  "symbol": "USDT",
  "fromBalance":  "funding_balance",
  "toBalance": "margin_balance",
  "amount": 2000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» fromBalance|body|string| yes |none|
|» toBalance|body|string| yes |none|
|» amount|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get external transfer code

GET /api/v1/wallet/get_external_transfer_code/ETH

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST External transfer (inter-wallet)

POST /api/v1/wallet/external_transfer

> Body Parameters

```json
{
  "symbol": "btc",
  "amount": "0.05",
  "sourceWallet": "funding_balance",
  "destinationWallet": "funding_balance",
  "recipientAccount": "083d5a2b",
  "releaseCode": "473496"
}

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» toUserId|body|string| yes |none|
|» symbol|body|string| yes |none|
|» fromBalance|body|string| yes |none|
|» toBalance|body|string| yes |none|
|» amount|body|string| yes |none|
|» releaseCode|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet/Whitelist

## POST Suspend one of the authenticated user's own wallets

POST /api/v1/wallet/wallets/{walletId}/suspend

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|walletId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Wallet/Deposit

## GET Get the minimum deposit amount per asset

GET /api/v1/wallet/minimum_deposit

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|asset|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Generate Wallet

POST /api/v1/wallet/generate

> Body Parameters

```json
{
    "chain": "BTC"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{"error":"Authorization token not provided","message":"","statusCode":400}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet/Fiat

## POST Get a fiat conversion quote

POST /api/v1/wallet/fiat/quote

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List supported banks

GET /wallet/fiat/banks

Banks Monnify supports as virtual-account/withdrawal destinations

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "banks": [
    {
      "name": "string",
      "code": "string",
      "ussdTemplate": "string",
      "baseUssdCode": "string"
    }
  ]
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[BanksListResponse](#schemabankslistresponse)|

## POST Create a one-time NGN deposit account

POST /api/v1/wallet/fiat/deposit/account

Provisions a Monnify virtual account for a bank-transfer deposit, to be credited as symbol once settled. Requires deposits enabled on the account.

> Body Parameters

```json
{
   "symbol":"SOL",
  "bankCode":"required",
 "amount" :"5000"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[TemporaryDepositAccountRequest](#schematemporarydepositaccountrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "accountNumber": "string",
  "accountName": "string",
  "bankName": "string",
  "bankCode": "string",
  "accountDurationSeconds": 0,
  "ussdPayment": "string",
  "requestTime": "string",
  "expiresOn": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "amount": "string",
  "fee": "string",
  "totalPayable": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[TemporaryDepositAccountResponse](#schematemporarydepositaccountresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[TemporaryDepositAccountResponse](#schematemporarydepositaccountresponse)|

## POST Confirm a fiat deposit settled

POST /api/v1/wallet/fiat/deposit/{transaction_reference}/confirm

Verifies the bank transfer for transaction_reference actually settled with Monnify and credits the user. Requires deposits enabled on the account.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|transaction_reference|path|string| yes |Transaction reference from POST /wallet/fiat/deposit/account|

> Response Examples

> 200 Response

```json
{
  "statusCode": 0,
  "success": true,
  "message": "string",
  "error": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[DefaultResponse](#schemadefaultresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[DefaultResponse](#schemadefaultresponse)|

## POST Pay by card

POST /wallet/fiat/card/pay

Charges a card directly, to be credited as symbol once settled. May require a CompleteCardOTP/CompleteCard3DS follow-up depending on paymentStatus. Requires deposits enabled on the account.

> Body Parameters

```json
{
  "symbol": "string",
  "amount": "string",
  "cardNumber": "string",
  "cardExpiryMonth": "string",
  "cardExpiryYear": "string",
  "cardPin": "string",
  "cardCvv": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PayWithCardRequest](#schemapaywithcardrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "responseMessage": "string",
  "paymentStatus": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "amountPaid": "string",
  "currencyPaid": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[PayWithCardResponse](#schemapaywithcardresponse)|

## POST Complete a card payment with OTP

POST /wallet/fiat/card/otp

Submits the OTP the card issuer sent the user, completing a PayWithCard charge. Requires deposits enabled on the account.

> Body Parameters

```json
{
  "transactionReference": "string",
  "tokenId": "string",
  "otp": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CompleteCardOTPRequest](#schemacompletecardotprequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "status": "string",
  "message": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "authorizedAmount": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[CardAuthResponse](#schemacardauthresponse)|

## POST Complete a card payment with 3-D Secure

POST /wallet/fiat/card/3ds

Finalizes a PayWithCard charge after the issuer's 3DS challenge redirects back. Requires deposits enabled on the account.

> Body Parameters

```json
{
  "transactionReference": "string",
  "apiKey": "string",
  "cardNumber": "string",
  "cardExpiryMonth": 0,
  "cardExpiryYear": 0,
  "cardCvv": 0,
  "cardPin": 0
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CompleteCard3DSRequest](#schemacompletecard3dsrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "status": "string",
  "message": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "authorizedAmount": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[CardAuthResponse](#schemacardauthresponse)|

## POST Withdraw to a bank account

POST /wallet/fiat/withdraw

Deducts amount of symbol from the caller's balance (converted to NGN first if needed) and starts a Monnify bank payout. May require CompleteFiatWithdrawal if 2FA disbursement is enabled — see response status. Rate-limited (5/min/user), requires KYC tier 1, withdrawals enabled, and 2FA if enabled on the account.

> Body Parameters

```json
{
  "symbol": "string",
  "amount": "string",
  "bankCode": "string",
  "accountNumber": "string",
  "accountName": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[InitiateFiatWithdrawalRequest](#schemainitiatefiatwithdrawalrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "amount": "string",
  "reference": "string",
  "status": "string",
  "dateCreated": "string",
  "transactionReference": "string",
  "destinationAccountName": "string",
  "destinationAccountNumber": "string",
  "destinationBankCode": "string",
  "destinationBankName": "string",
  "narration": "string",
  "currency": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[FiatWithdrawalResponse](#schemafiatwithdrawalresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[FiatWithdrawalResponse](#schemafiatwithdrawalresponse)|

## POST Authorize a pending bank withdrawal

POST /wallet/fiat/withdraw/authorize

Submits the authorization code Monnify sent to complete a withdrawal left in PENDING_AUTHORIZATION. Rate-limited (5/min/user), requires KYC tier 1, withdrawals enabled, and 2FA if enabled on the account.

> Body Parameters

```json
{
  "reference": "string",
  "authorizationCode": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CompleteFiatWithdrawalRequest](#schemacompletefiatwithdrawalrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "amount": "string",
  "reference": "string",
  "status": "string",
  "dateCreated": "string",
  "transactionReference": "string",
  "destinationAccountName": "string",
  "destinationAccountNumber": "string",
  "destinationBankCode": "string",
  "destinationBankName": "string",
  "narration": "string",
  "currency": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[FiatWithdrawalResponse](#schemafiatwithdrawalresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[FiatWithdrawalResponse](#schemafiatwithdrawalresponse)|

## GET Get the authenticated user's fiat transaction history

GET /wallet/fiat/history

Filters the user's wallet transaction history to fiat_buy/fiat_sell types. Supersedes the old /trading/fiat/history path.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# P2P

## GET Get advertiser info

GET /api/v1/trading/p2p/advertiser_info

Get a P2P advertiser's public profile (name, rating, completed orders, verified/active status). Pass advertiser_id to view another user's profile — e.g. before trading with them; omit it to view your own.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|advertiser_id|query|string| no |Advertiser's user ID — defaults to the authenticated user if omitted|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's P2P orders

GET /api/v1/trading/p2p/get_user_orders

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get a P2P order by ID

GET /api/v1/trading/p2p/get_order_by_id/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get a P2P payment method by ID

GET /api/v1/trading/p2p/get_payment_by_method_by_id/{id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## DELETE Delete a P2P payment method

DELETE /api/v1/trading/p2p/payment_methods/{payment_method_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|payment_method_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get a matched P2P order by ID

GET /api/v1/trading/p2p/matched_order/{order_match_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_match_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Deactivate a single P2P order (as advertiser)

GET /api/v1/trading/p2p/deactivate_single_order/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Reactivate a single P2P order (as advertiser)

GET /api/v1/trading/p2p/reactivate_single_order/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Deactivate all of the advertiser's P2P orders

GET /api/v1/trading/p2p/deactivate_orders

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Reactivate all of the advertiser's P2P orders

GET /api/v1/trading/p2p/reactivate_orders

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# P2P/Payment Methods

## GET Get payment methods

GET /api/v1/trading/p2p/payment_methods

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get specific payment method

GET /trading/p2p/get_payment_by_method_by_id/<payment-method-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Save bank payment method

POST /api/v1/trading/p2p/payment_methods/bank

> Body Parameters

```json
{
  "bankName": "First Bank",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» bankName|body|string| yes |none|
|» accountNumber|body|string| yes |none|
|» accountName|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete payment method

DELETE /trading/p2p/payment_methods/<payment-method-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Advertiser

## GET Become advertiser

GET /api/v1/trading/p2p/become_an_advertiser

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Orders

## POST Sell- Create P2P order

POST /api/v1/trading/p2p/create_order

> Body Parameters

```json
{
  "type": "SELL",
  "asset": "BTC",
  "fiat": "NGN",
  "fixedPrice": 95000000,
  "floatingPrice": false,
  "assetLogo": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1704266489",
  "quantity": 0.01,
  "minQuantity": 0.001,
  "maxQuantity": 0.01,
  "paymentDuration": "15",
  "paymentMethod": ["00c491a-8938-48e3-9690-827deb688a38"],
  "remark": "Fast trade, verified only",
  "selectedCountry": "NG"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» type|body|string| yes |none|
|» asset|body|string| yes |none|
|» fiat|body|string| yes |none|
|» fixedPrice|body|integer| yes |none|
|» floatingPrice|body|boolean| yes |none|
|» assetLogo|body|string| yes |none|
|» quantity|body|number| yes |none|
|» minQuantity|body|number| yes |none|
|» maxQuantity|body|number| yes |none|
|» paymentDuration|body|string| yes |none|
|» paymentMethod|body|[string]| yes |none|
|» remark|body|string| yes |none|
|» selectedCountry|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get all P2P orders

GET /api/v1/trading/p2p/all_orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|type|query|string| yes |BUY | SELL|
|asset|query|string| yes |none|
|currency|query|string| no |none|
|payment_method|query|string| no |none|
|status|query|string| no |none|
|country|query|string| no |none|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get P2P order by ID

GET /trading/p2p/get_order_by_id/<order-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Deactivate all orders

GET /trading/p2p/deactivate_orders

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Reactivate all orders

GET /trading/p2p/reactivate_orders

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Deactivate single order

GET /api/v1/trading/p2p/deactivate_single_order/<order-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Reactivate single order

GET /api/v1/trading/p2p/reactivate_single_order/ed124046-1f22-4454-9a71-ca4d2ac760ea

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Order Matching

## POST Release order match

POST /api/v1/trading/p2p/release_order/5954e73c-756e-48fb-b37d-396274e56b99

> Body Parameters

```json
{
  "releaseCode": "123456"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|X-2FA-Code|header|string| no |none|
|body|body|object| no |none|
|» releaseCode|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get all matched orders

GET /api/v1/trading/p2p/all_matched_orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get matched order by ID

GET /trading/p2p/matched_order/<order-match-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Add review

POST /api/v1/trading/p2p/add_review

> Body Parameters

```json
{
  "orderMatchId": "ff0bce52-de58-4b4f-8fc1-ce58357ad2f2",
  "rating": 5,
  "review": "Fast and trustworthy trader!"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» orderMatchId|body|string| yes |none|
|» rating|body|integer| yes |none|
|» review|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Order Matching/Buy Order

## GET Get matcher release code (OTP)

GET /api/v1/trading/p2p/get_release_order_code/b4a2991e-ad7a-45ce-b861-c909acadc272

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Order Matching/Sell Order

## POST Match order

POST /api/v1/trading/p2p/match_order

> Body Parameters

```json
{
  "orderId": "312d8ef1-c76c-4ada-a5ad-0a8d91f64472",
  "quantity": 0.005
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» orderId|body|string| yes |none|
|» quantity|body|string| yes |none|
|» paymentMethodId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get advertiser release code (OTP) Copy

GET /api/v1/trading/p2p/get_release_order_code/5954e73c-756e-48fb-b37d-396274e56b99

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Chat

## GET List user chats

GET /api/v1/trading/p2p/chats

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get chats by order ID

GET /api/v1/trading/p2p/chats/a38dcc80-0847-4aff-83e0-8335dd5d3185

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get chat messages

GET /api/v1/trading/p2p/chats/messages/ffdf7d41-9f1e-415a-baff-bade38d2bf6a

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Send chat message

POST /api/v1/trading/p2p/chats/send/ffdf7d41-9f1e-415a-baff-bade38d2bf6a

> Body Parameters

```json
{
  "message": "I have made the payment, please check.",
  "attachmentUrl": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» message|body|string| yes |none|
|» attachmentUrl|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Dispute

## PATCH Dispute Matched Order

PATCH /api/v1/trading/p2p/update_matched_order

> Body Parameters

```json
{
  "orderMatchId": "1ec7c0ab-f666-493b-86b7-7c1b44aa5f05",
  "status": "DISPUTED"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Disputed Orders

GET /api/v1/trading/p2p/advertiser_disputed_orders

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading

## POST Place a spot stop-sell order

POST /api/v1/trading/spot/sell_stop

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's favorite trading pairs

GET /api/v1/trading/favorites

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Add a trading pair to favorites

POST /api/v1/trading/favorites/{symbol}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## DELETE Remove a trading pair from favorites

DELETE /api/v1/trading/favorites/{symbol}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's trading bots

GET /api/v1/trading/bot/list

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's margin orders

GET /api/v1/trading/margin/orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|status|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's asset-conversion history

GET /api/v1/trading/convert/history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's fiat transaction history

GET /api/v1/trading/fiat/history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's payment history

GET /api/v1/trading/payment/history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Trading/Market Data

## POST Token conversion rate

POST /api/v1/trading/conversion_rate

> Body Parameters

```json
{
  "fromAsset": "BTC",
  "toAsset": "USDT",
  "quantity": "1"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» fromAsset|body|string| yes |none|
|» toAsset|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed trading pairs

GET /api/v1/trading/listed_pairs

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|query|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed networks

GET /api/v1/trading/listed_networks

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed currencies

GET /api/v1/trading/listed_currencies

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed tokens

GET /api/v1/trading/listed_tokens

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|isTradable|query|string| yes |none|
|blockchain|query|string| yes |none|
|Accept|header|string| no |none|
|Authorization|header|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Platform fees

GET /api/v1/trading/platform_fees

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Spot

## POST Place market buy

POST /api/v1/trading/spot/buy

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 0.001,
  "price":63622.9307
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place market sell

POST /api/v1/trading/spot/sell

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "SELL",
  "type": "MARKET",
  "quantity": 0.001, //Mr Tolu what are you editing
   "price":63622.9307
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place limit buy

POST /api/v1/trading/spot/buy_limit

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "BUY",
  "type": "LIMIT",
  "price": 63169.986,
  "quantity": 0.0001
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place limit sell

POST /api/v1/trading/spot/sell_limit

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "SELL",
  "type": "LIMIT",
  "price": 62815.2947,
  "quantity": 0.0022
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place stop buy

POST /api/v1/trading/spot/buy_stop

> Body Parameters

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "STOP",
  "quantity": 0.001,
  "stopPrice": 65000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET OrderBook

GET /api/v1/trading/spot/orderbook

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get My Orders

GET /api/v1/trading/spot/orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|limit|query|string| no |none|
|page|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Recent Trades

GET /api/v1/trading/spot/recent_trades

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get the current spot price for a symbol

GET /api/v1/trading/spot/price

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Close Order

POST /api/v1/trading/spot/close_order

> Body Parameters

```json
{
  "orderId": "e2a6e75c-3289-4266-8962-ce32f5a09a1a",
  "symbol": "BTC/USDT"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Orders By ID

GET /api/v1/trading/transactions/spot/17861ed4-7d90-4f12-ba19-688be90224e8

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Futures

## GET Get User Futures Order History

GET /api/v1/trading/futures/order_history

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Futures Funding Rate

GET /api/v1/trading/futures/funding_rate

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|pair|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Set Futures Leverage

POST /api/v1/trading/futures/set_leverage

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "leverage": 10
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get User Futures Mode

GET /api/v1/trading/futures/get_margin_mode

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Set Futures Mode

POST /api/v1/trading/futures/set_margin_mode

> Body Parameters

```json
{ "mode": "cross" }//isolated

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get User Futures PNL History

GET /api/v1/trading/futures/pnl_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Futures/Position

## GET Get User Positions

GET /api/v1/trading/futures/positions

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Close futures Position

POST /api/v1/trading/futures/close_position/yuwdywdiywg

> Body Parameters

```json
{
  "symbol": "string",
  "side": "string",
  "type": "string",
  "quantity": "string",
  "leverage": 0
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Partial. Close Position

POST /api/v1/trading/futures/partial_close/{position_id}

> Body Parameters

```json
{
    "close_quantity": "0.05"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|position_id|path|string| yes |none|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH Update TP/SL on open position

PATCH /api/v1/trading/futures/position/{position_id}/tpsl

> Body Parameters

```json
{
    "take_profit_price": "70000",
    "stop_loss_price": "62000"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|position_id|path|string| yes |none|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Futures/Place Orders

## POST Limit Long

POST /api/v1/trading/futures/place_order

> Body Parameters

```json
{
  "pair": "BTC/USDT",
  "side": "long",
  "type": "limit",
  "price": 65000,
  "quantity": 0.1,
  "leverage": 10,
  "takeProfit": 70000,
  "stopLoss": 62000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Margin

## POST Place margin market buy

POST /api/v1/trading/margin/buy

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 0.01
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin market sell

POST /api/v1/trading/margin/sell

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "SELL",
  "type": "MARKET",
  "quantity": 0.01
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin limit buy

POST /api/v1/trading/margin/buy_limit

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": 0.01,
  "price": 60000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin limit sell

POST /api/v1/trading/margin/sell_limit

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "SELL",
  "type": "LIMIT",
  "quantity": 0.01,
  "price": 70000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin stop buy

POST /api/v1/trading/margin/buy_stop

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "BUY",
  "type": "STOP",
  "quantity": 0.01,
  "stopPrice": 65000
  }
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin stop sell

POST /api/v1/trading/margin/sell_stop

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "side": "SELL",
  "type": "STOP",
  "quantity": 0.01,
  "stopPrice": 58000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get All Conditional Orders

GET /api/v1/trading/margin/conditional

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Margin Borrow History

GET /api/v1/trading/margin/borrow_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Margin Liquidation History

GET /api/v1/trading/margin/liquidation_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST One-Cancels-Other Order

POST /api/v1/trading/margin/oco

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "order_side": "SELL",
  "tp_trigger_price": "70000",
  "sl_trigger_price": "58000",
  "quantity": "0.1",
  "tp_limit_price": "69900",
  "sl_limit_price": "57900"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Conditional Order By ID

GET /api/v1/trading/margin/conditional/qwdefefefefe

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Cancel a margin conditional order (TP/SL/OCO)

DELETE /api/v1/trading/margin/conditional/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get a margin order's transaction record

GET /api/v1/trading/transactions/margin/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Trading/Margin/TP/SL

## POST Stop Loss

POST /api/v1/trading/margin/sl

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "order_side": "SELL",
  "order_type": "MARKET",
  "trigger_price": "65000",
  "quantity": "0.1",
  "limit_price": "64900"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Take Profit

POST /api/v1/trading/margin/tp

> Body Parameters

```json
{
  "symbol": "BTC/USDT",
  "order_side": "SELL",
  "order_type": "MARKET",
  "trigger_price": "65000",
  "quantity": "0.1",
  "limit_price": "64900"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Margin/Account

## GET Get Margin Account

GET /api/v1/trading/margin/account

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Create Account

POST /api/v1/trading/margin/account

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PUT Margin Borrow And Repay Config

PUT /api/v1/trading/margin/settings

> Body Parameters

```json
{
    "auto_borrow_enabled": true,
    "auto_repay_enabled": false
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Margin Leverages

GET /api/v1/trading/margin/leverage

> Body Parameters

```json

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PUT Set Margin Leverage

PUT /api/v1/trading/margin/leverage

> Body Parameters

```json

  { "max_leverage": 1 }

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Repay Margin

POST /api/v1/trading/margin/repay

> Body Parameters

```json
 { "asset": "USDT", "amount": 500 }
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Borrow Margin

POST /api/v1/trading/margin/borrow

> Body Parameters

```json
{
  "asset": "USDT",
  "amount": 500
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PUT Set Margin Mode

PUT /api/v1/trading/margin/mode

> Body Parameters

```json
{ "mode": "cross" }//isolated

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Candles

## GET Historical OHLC candles

GET /api/v1/trading/kline/historical

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| yes |none|
|interval|query|string| yes |none|
|limit|query|string| yes |none|
|startTime|query|string| no |none|
|endTime|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Gainers_Losers

GET /api/v1/trading/24_hours_movers

> Response Examples

> 200 Response

```json
{"status_code":0,"success":true,"message":"","error":"","Data":{"gainers":null,"losers":null}}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Bot

## POST Create a trading bot

POST /api/v1/trading/bot/create

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Stop a trading bot

POST /api/v1/trading/bot/stop

> Body Parameters

```json
{
  "botId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» botId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Get a trading bot's trade history

POST /api/v1/trading/bot/trading_history

> Body Parameters

```json
{
  "botId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» botId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# User

## POST Enable Futures

POST /api/v1/users/accept_futures

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get user settings

GET /api/v1/users/settings

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get login logs

GET /

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH Update app settings

PATCH /users/app_settings

> Body Parameters

```json
{
  "theme": "dark",
  "currency": "USD",
  "language": "en"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» theme|body|string| yes |none|
|» currency|body|string| yes |none|
|» language|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get current user

GET /api/v1/user

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Add Notification token

POST /api/v1/notifications/device-token

> Body Parameters

```json
{
  "deviceToken": "3333-333-333-33",
  "platform": "ios" // "android", "web"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete Notification Token

DELETE /api/v1/notifications/device-token

> Body Parameters

```json
{
  "deviceToken": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Enable Email Login

GET /api/v1/users/enable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Disable Email Login

POST /users/disenable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# User/Sessions

## GET Get active sessions

GET /api/v1/users/active_sessions

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Revoke session

POST /users/revoke_session

> Body Parameters

```json
{
  "sessionId": "<session-id>"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» sessionId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# User/Api

## GET List API keys

GET /users/api_keys

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Create API key

POST /users/api_keys

> Body Parameters

```json
{
  "label": "My Trading Bot",
  "permissions": ["trade", "read"]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» label|body|string| yes |none|
|» permissions|body|[string]| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete API key

DELETE /users/api_keys/<key-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Health

## GET Liveness probe

GET /health/live

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Readiness probe

GET /health/ready

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Misc

## GET Ping the gateway

GET /api/v1/ping

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List supported system languages

GET /api/v1/languages

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List supported system timezones

GET /api/v1/timezones

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET WebSocket upgrade endpoint for real-time trading/account data

GET /api/v1/ws

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Users

## POST Enable email-OTP login

POST /api/v1/users/enable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Start Tier 1 → Tier 2 KYC upgrade (proof of address); requires Tier 1+

POST /api/v1/users/kyc_upgrade

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Log in via a social/OAuth provider

POST /api/v1/users/login_socials

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Disable 2FA on the authenticated account

POST /api/v1/users/disable_2fa

> Body Parameters

```json
{
  "code": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» code|body|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Disable email-OTP login

POST /api/v1/users/disable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Revoke an active session

POST /api/v1/users/revoke_session

> Body Parameters

```json
{
  "sessionId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» sessionId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's login history

GET /api/v1/users/login_logs

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's API keys

GET /api/v1/users/api_keys

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Create a new API key

POST /api/v1/users/api_keys

> Body Parameters

```json
{
  "label": "string",
  "permissions": [
    "string"
  ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» label|body|string| yes |none|
|» permissions|body|[string]| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## DELETE Delete an API key

DELETE /api/v1/users/api_keys/{keyId}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|keyId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## PATCH Update in-app UI settings

PATCH /api/v1/users/app_settings

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Earn

## GET List Earn products

GET /api/v1/earn/products

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's Earn positions

GET /api/v1/earn/positions

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Subscribe to an Earn product

POST /api/v1/earn/subscribe

> Body Parameters

```json
{
  "productId": "string",
  "amount": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» productId|body|string| yes |none|
|» amount|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Unstake/redeem an Earn position

POST /api/v1/earn/unstake

> Body Parameters

```json
{
  "positionId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» positionId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Support

## POST Open a support ticket

POST /api/v1/trading/support/tickets

> Body Parameters

```json
{
  "subject": "string",
  "message": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» subject|body|string| yes |none|
|» message|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's support tickets

GET /api/v1/trading/support/tickets

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get a support ticket's detail/thread

GET /api/v1/trading/support/tickets/{ticket_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|ticket_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Reply to a support ticket

POST /api/v1/trading/support/tickets/{ticket_id}/messages

> Body Parameters

```json
{
  "message": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|ticket_id|path|string| yes |none|
|body|body|object| yes |none|
|» message|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Notifications

## GET Get notification history

GET /api/v1/notifications/history

Returns the authenticated user's own past notifications (email/SMS/push), newest first. Currently only covers trading-alert notifications that carry a user_id (order placed/cancelled, TP/SL triggered, margin call, position liquidated) — withdrawal/P2P/spot-order/OTP notifications are not yet included since they're keyed by email/phone at the notification service layer.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |Max 100|

> Response Examples

> 200 Response

```json
{
  "notifications": [
    {
      "id": "string",
      "user_id": "string",
      "channel": "string",
      "type": "string",
      "title": "string",
      "body": "string",
      "status": "string",
      "created_at": "2019-08-24T14:15:22Z"
    }
  ],
  "currentPage": "string",
  "totalPages": "string",
  "totalRecords": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|data-manager call failed|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» notifications|[object]|false|none||none|
|»» id|string|false|none||none|
|»» user_id|string|false|none||none|
|»» channel|string|false|none||email | sms | push|
|»» type|string|false|none||e.g. order_placed, margin_call, position_liquidated|
|»» title|string|false|none||none|
|»» body|string|false|none||none|
|»» status|string|false|none||sent | failed|
|»» created_at|string(date-time)|false|none||none|
|» currentPage|string|false|none||none|
|» totalPages|string|false|none||none|
|» totalRecords|string|false|none||none|

# Data Schema

<h2 id="tocS_Bank">Bank</h2>

<a id="schemabank"></a>
<a id="schema_Bank"></a>
<a id="tocSbank"></a>
<a id="tocsbank"></a>

```json
{
  "name": "string",
  "code": "string",
  "ussdTemplate": "string",
  "baseUssdCode": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|false|none||none|
|code|string|false|none||none|
|ussdTemplate|string|false|none||none|
|baseUssdCode|string|false|none||none|

<h2 id="tocS_BanksListResponse">BanksListResponse</h2>

<a id="schemabankslistresponse"></a>
<a id="schema_BanksListResponse"></a>
<a id="tocSbankslistresponse"></a>
<a id="tocsbankslistresponse"></a>

```json
{
  "success": true,
  "error": "string",
  "banks": [
    {
      "name": "string",
      "code": "string",
      "ussdTemplate": "string",
      "baseUssdCode": "string"
    }
  ]
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|success|boolean|false|none||none|
|error|string|false|none||none|
|banks|[[Bank](#schemabank)]|false|none||none|

<h2 id="tocS_TemporaryDepositAccountRequest">TemporaryDepositAccountRequest</h2>

<a id="schematemporarydepositaccountrequest"></a>
<a id="schema_TemporaryDepositAccountRequest"></a>
<a id="tocStemporarydepositaccountrequest"></a>
<a id="tocstemporarydepositaccountrequest"></a>

```json
{
  "symbol": "string",
  "bankCode": "string",
  "amount": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|symbol|string|true|none||Asset to credit once the transfer settles (e.g. "NGN", "USDT", "BTC")|
|bankCode|string|true|none||Destination bank code, from GET /wallet/fiat/banks|
|amount|string|true|none||NGN amount to transfer into the virtual account|

<h2 id="tocS_TemporaryDepositAccountResponse">TemporaryDepositAccountResponse</h2>

<a id="schematemporarydepositaccountresponse"></a>
<a id="schema_TemporaryDepositAccountResponse"></a>
<a id="tocStemporarydepositaccountresponse"></a>
<a id="tocstemporarydepositaccountresponse"></a>

```json
{
  "success": true,
  "error": "string",
  "accountNumber": "string",
  "accountName": "string",
  "bankName": "string",
  "bankCode": "string",
  "accountDurationSeconds": 0,
  "ussdPayment": "string",
  "requestTime": "string",
  "expiresOn": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "amount": "string",
  "fee": "string",
  "totalPayable": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|success|boolean|false|none||none|
|error|string|false|none||none|
|accountNumber|string|false|none||none|
|accountName|string|false|none||none|
|bankName|string|false|none||none|
|bankCode|string|false|none||none|
|accountDurationSeconds|integer|false|none||none|
|ussdPayment|string|false|none||none|
|requestTime|string|false|none||none|
|expiresOn|string|false|none||none|
|transactionReference|string|false|none||none|
|paymentReference|string|false|none||none|
|amount|string|false|none||none|
|fee|string|false|none||none|
|totalPayable|string|false|none||none|

<h2 id="tocS_DefaultResponse">DefaultResponse</h2>

<a id="schemadefaultresponse"></a>
<a id="schema_DefaultResponse"></a>
<a id="tocSdefaultresponse"></a>
<a id="tocsdefaultresponse"></a>

```json
{
  "statusCode": 0,
  "success": true,
  "message": "string",
  "error": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|statusCode|integer|false|none||none|
|success|boolean|false|none||none|
|message|string|false|none||none|
|error|string|false|none||none|

<h2 id="tocS_PayWithCardRequest">PayWithCardRequest</h2>

<a id="schemapaywithcardrequest"></a>
<a id="schema_PayWithCardRequest"></a>
<a id="tocSpaywithcardrequest"></a>
<a id="tocspaywithcardrequest"></a>

```json
{
  "symbol": "string",
  "amount": "string",
  "cardNumber": "string",
  "cardExpiryMonth": "string",
  "cardExpiryYear": "string",
  "cardPin": "string",
  "cardCvv": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|symbol|string|true|none||Asset to credit once the charge settles|
|amount|string|true|none||NGN amount to charge|
|cardNumber|string|true|none||none|
|cardExpiryMonth|string|true|none||none|
|cardExpiryYear|string|true|none||none|
|cardPin|string|false|none||none|
|cardCvv|string|true|none||none|

<h2 id="tocS_PayWithCardResponse">PayWithCardResponse</h2>

<a id="schemapaywithcardresponse"></a>
<a id="schema_PayWithCardResponse"></a>
<a id="tocSpaywithcardresponse"></a>
<a id="tocspaywithcardresponse"></a>

```json
{
  "success": true,
  "error": "string",
  "responseMessage": "string",
  "paymentStatus": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "amountPaid": "string",
  "currencyPaid": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|success|boolean|false|none||none|
|error|string|false|none||none|
|responseMessage|string|false|none||none|
|paymentStatus|string|false|none||e.g. PAID/SUCCESS, or a status indicating an OTP/3DS follow-up is required|
|transactionReference|string|false|none||none|
|paymentReference|string|false|none||none|
|amountPaid|string|false|none||none|
|currencyPaid|string|false|none||none|

<h2 id="tocS_CompleteCardOTPRequest">CompleteCardOTPRequest</h2>

<a id="schemacompletecardotprequest"></a>
<a id="schema_CompleteCardOTPRequest"></a>
<a id="tocScompletecardotprequest"></a>
<a id="tocscompletecardotprequest"></a>

```json
{
  "transactionReference": "string",
  "tokenId": "string",
  "otp": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|transactionReference|string|true|none||none|
|tokenId|string|true|none||none|
|otp|string|true|none||none|

<h2 id="tocS_CompleteCard3DSRequest">CompleteCard3DSRequest</h2>

<a id="schemacompletecard3dsrequest"></a>
<a id="schema_CompleteCard3DSRequest"></a>
<a id="tocScompletecard3dsrequest"></a>
<a id="tocscompletecard3dsrequest"></a>

```json
{
  "transactionReference": "string",
  "apiKey": "string",
  "cardNumber": "string",
  "cardExpiryMonth": 0,
  "cardExpiryYear": 0,
  "cardCvv": 0,
  "cardPin": 0
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|transactionReference|string|true|none||none|
|apiKey|string|false|none||none|
|cardNumber|string|true|none||none|
|cardExpiryMonth|integer|true|none||none|
|cardExpiryYear|integer|true|none||none|
|cardCvv|integer|true|none||none|
|cardPin|integer|false|none||none|

<h2 id="tocS_CardAuthResponse">CardAuthResponse</h2>

<a id="schemacardauthresponse"></a>
<a id="schema_CardAuthResponse"></a>
<a id="tocScardauthresponse"></a>
<a id="tocscardauthresponse"></a>

```json
{
  "success": true,
  "error": "string",
  "status": "string",
  "message": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "authorizedAmount": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|success|boolean|false|none||none|
|error|string|false|none||none|
|status|string|false|none||none|
|message|string|false|none||none|
|transactionReference|string|false|none||none|
|paymentReference|string|false|none||none|
|authorizedAmount|string|false|none||none|

<h2 id="tocS_InitiateFiatWithdrawalRequest">InitiateFiatWithdrawalRequest</h2>

<a id="schemainitiatefiatwithdrawalrequest"></a>
<a id="schema_InitiateFiatWithdrawalRequest"></a>
<a id="tocSinitiatefiatwithdrawalrequest"></a>
<a id="tocsinitiatefiatwithdrawalrequest"></a>

```json
{
  "symbol": "string",
  "amount": "string",
  "bankCode": "string",
  "accountNumber": "string",
  "accountName": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|symbol|string|true|none||Asset to deduct from (converted to NGN first if not already NGN)|
|amount|string|true|none||none|
|bankCode|string|true|none||none|
|accountNumber|string|true|none||none|
|accountName|string|true|none||none|

<h2 id="tocS_CompleteFiatWithdrawalRequest">CompleteFiatWithdrawalRequest</h2>

<a id="schemacompletefiatwithdrawalrequest"></a>
<a id="schema_CompleteFiatWithdrawalRequest"></a>
<a id="tocScompletefiatwithdrawalrequest"></a>
<a id="tocscompletefiatwithdrawalrequest"></a>

```json
{
  "reference": "string",
  "authorizationCode": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|reference|string|true|none||none|
|authorizationCode|string|true|none||none|

<h2 id="tocS_FiatWithdrawalResponse">FiatWithdrawalResponse</h2>

<a id="schemafiatwithdrawalresponse"></a>
<a id="schema_FiatWithdrawalResponse"></a>
<a id="tocSfiatwithdrawalresponse"></a>
<a id="tocsfiatwithdrawalresponse"></a>

```json
{
  "success": true,
  "error": "string",
  "amount": "string",
  "reference": "string",
  "status": "string",
  "dateCreated": "string",
  "transactionReference": "string",
  "destinationAccountName": "string",
  "destinationAccountNumber": "string",
  "destinationBankCode": "string",
  "destinationBankName": "string",
  "narration": "string",
  "currency": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|success|boolean|false|none||none|
|error|string|false|none||none|
|amount|string|false|none||none|
|reference|string|false|none||none|
|status|string|false|none||e.g. SUCCESS, or PENDING_AUTHORIZATION if 2FA disbursement is enabled|
|dateCreated|string|false|none||none|
|transactionReference|string|false|none||none|
|destinationAccountName|string|false|none||none|
|destinationAccountNumber|string|false|none||none|
|destinationBankCode|string|false|none||none|
|destinationBankName|string|false|none||none|
|narration|string|false|none||none|
|currency|string|false|none||none|

