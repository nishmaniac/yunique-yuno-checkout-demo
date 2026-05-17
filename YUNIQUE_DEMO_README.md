# Yunique Fashion Store Checkout Demo

This is a Yuno Solution Engineer case study demo for a fictional ecommerce merchant, Yunique Fashion Store.

The demo shows an embedded checkout experience using Yuno Web SDK, where the customer can enter their details, review an order, select card as the payment method, complete a test payment, and see the payment reflected in the Yuno Dashboard.

## What this demo shows

- Embedded checkout inside the merchant website
- Credit card payment using Yuno Web SDK
- Payment processed through Yuno Test Payment Gateway
- Customer details collected before payment
- Delivery details collected before payment
- Order summary with item cost, shipping fee, and total amount
- $110.00 USD test transaction
- Payment confirmation visible in the Yuno Dashboard
- Integration pattern that can support future payment methods through Yuno configuration

## Demo merchant

Merchant: Yunique Fashion Store  
Product: Linen Midi Dress  
Item price: $100.00 USD  
Shipping: $10.00 USD  
Total amount: $110.00 USD  
Payment method: Card  
Gateway: Yuno Test Payment Gateway  

## Demo flow

1. Open the checkout page at `http://localhost:8080`
2. Fill in the customer details:
   - First Name
   - Last Name
   - Email
3. Fill in the delivery details:
   - Address
   - Apartment, suite etc.
   - Postal Code
   - City
   - Country
4. Review the order summary
5. Click `Continue to Payment`
6. Select Card
7. Click `Pay $110.00`
8. Enter the Yuno test card details
9. Complete the payment
10. Verify the payment in the Yuno Dashboard

## Test card

Use the Yuno test card:

Cardholder name: Harry Potter  
Card number: 4242 4242 4242 4242  
Expiration date: 09/29  
CVV: 123  

## Local setup

Install dependencies:

```bash
npm install