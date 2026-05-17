const express = require('express')
const path = require('path')
const fetch = require('node-fetch')
const v4 = require('uuid').v4
const { getCountryData } = require('./utils')
const open = require('open')

require('dotenv').config()

let API_URL

// Ask for these keys to sales department
const ACCOUNT_CODE = process.env.ACCOUNT_CODE
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY
const PRIVATE_SECRET_KEY = process.env.PRIVATE_SECRET_KEY

const SERVER_PORT = 8080

let CUSTOMER_ID

const staticDirectory = path.join(__dirname, 'vanilla/static')

const indexPage = path.join(__dirname, 'vanilla/pages/index.html')
const checkoutPage = path.join(__dirname, 'vanilla/pages/checkout.html')
const checkoutLitePage = path.join(__dirname, 'vanilla/pages/checkout-lite.html')
const seamlessCheckoutPage = path.join(__dirname, 'vanilla/pages/checkout-seamless.html')
const seamlessCheckoutLitePage = path.join(__dirname, 'vanilla/pages/checkout-seamless-lite.html')
const seamlessExternalButtonsPage = path.join(__dirname, 'vanilla/pages/checkout-seamless-external-buttons.html')
const statusPage = path.join(__dirname, 'vanilla/pages/status.html')
const statusLitePage = path.join(__dirname, 'vanilla/pages/status-lite.html')
const enrollmentLitePage = path.join(__dirname, 'vanilla/pages/enrollment-lite.html')
const checkoutSecureFieldsPage = path.join(__dirname, 'vanilla/pages/checkout-secure-fields.html')
const fullFeatures = path.join(__dirname, 'vanilla/pages/full-features.html')
const paymentMethodsUnfolded = path.join(__dirname, 'vanilla/pages/payment-methods-unfolded.html')

const app = express()

app.use(express.json())
app.use('/static', express.static(staticDirectory))

app.get('/', (req, res) => {
  res.sendFile(seamlessCheckoutPage)
})

app.get('/checkout', (req, res) => {
  res.sendFile(checkoutPage)
})

app.get('/checkout/lite', (req, res) => {
  res.sendFile(checkoutLitePage)
})

app.get('/checkout/seamless', (req, res) => {
  res.sendFile(seamlessCheckoutPage)
})

app.get('/checkout/seamless/lite', (req, res) => {
  res.sendFile(seamlessCheckoutLitePage)
})

app.get('/checkout/seamless/external-buttons', (req, res) => {
  res.sendFile(seamlessExternalButtonsPage)
})

app.get('/checkout/secure-fields', (req, res) => {
  res.sendFile(checkoutSecureFieldsPage)
})

app.get('/status', (req, res) => {
  res.sendFile(statusPage)
})

app.get('/status-lite', (req, res) => {
  res.sendFile(statusLitePage)
})

app.get('/enrollment-lite', (req, res) => {
  res.sendFile(enrollmentLitePage)
})

app.get('/full-features', (req, res) => {
  res.sendFile(fullFeatures)
})

app.get('/checkout/payment-methods-unfolded', async (req, res) => {
  res.sendFile(paymentMethodsUnfolded)
})

app.post('/checkout/sessions', async (req, res) => {
  const country = req.query.country || 'CO'
  const { currency } = getCountryData(country)

  const response = await fetch(
    `${API_URL}/v1/checkout/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
        merchant_order_id: '1655401222',
        payment_description: 'Yunique Fashion Store - Linen Midi Dress',
        country,
        customer_id: CUSTOMER_ID,
        amount: {
          currency,
          value: 110,
        },
      }),
    }
  ).then((resp) => resp.json())

  res.send(response)
})

app.post('/checkout/seamless/sessions', async (req, res) => {
  try {
    const customer = req.body.customer || {}
    const delivery = req.body.delivery || {}
    const order = req.body.order || {}

    const country = delivery.country || req.query.country || 'US'
    const currency = order.currency || 'USD'

    const itemAmount = Number(order.itemAmount || 100)
    const shippingAmount = Number(order.shippingAmount || 10)
    const totalAmount = Number(order.totalAmount || 110)

    const checkoutSessionPayload = {
      account_id: ACCOUNT_CODE,
      merchant_order_id: order.merchantOrderId || `YUNIQUE-${Date.now()}`,
      payment_description: `Yunique Fashion Store - ${order.productName || 'Linen Midi Dress'}`,
      country,
      customer_id: CUSTOMER_ID,

      amount: {
        currency,
        value: totalAmount,
      },

      workflow: 'SDK_SEAMLESS',

      customer_payer: {
        id: CUSTOMER_ID,
        merchant_customer_id: CUSTOMER_ID,
        first_name: customer.firstName || '',
        last_name: customer.lastName || '',
        email: customer.email || '',

        billing_address: {
          address_line_1: delivery.address || '',
          address_line_2: delivery.apartment || '',
          city: delivery.city || '',
          country,
          zip_code: delivery.postalCode || '',
        },

        shipping_address: {
          address_line_1: delivery.address || '',
          address_line_2: delivery.apartment || '',
          city: delivery.city || '',
          country,
          zip_code: delivery.postalCode || '',
        },
      },

      payment_method: {
        type: 'CARD',
        vault_on_success: false,
        detail: {
          card: {
            verify: false,
            capture: true,
          },
        },
      },

      additional_data: {
        order: {
          shipping_amount: shippingAmount,
          fee_amount: 0,
          items: [
            {
              id: order.productId || 'YUNIQUE-DRESS-001',
              name: order.productName || 'Linen Midi Dress',
              category: order.category || 'Fashion',
              quantity: 1,
              unit_amount: itemAmount,
              brand: order.brand || 'Yunique',
              sku_code: order.sku || 'YUNIQUE-DRESS-001',
              manufacture_part_number: order.sku || 'YUNIQUE-DRESS-001',
            },
          ],
        },
      },

      metadata: [
        {
          key: 'store',
          value: 'Yunique Fashion Store',
        },
        {
          key: 'integration',
          value: 'seamless_sdk_demo',
        },
      ],
    }

    console.log('Creating Yuno checkout session with payload:')
    console.log(JSON.stringify(checkoutSessionPayload, null, 2))

    const response = await fetch(`${API_URL}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutSessionPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Yuno checkout session creation failed:')
      console.error(JSON.stringify(data, null, 2))
      return res.status(response.status).json(data)
    }

    res.send({
      ...data,
      country,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: error.message,
    })
  }
})

app.post('/payments', async (req, res) => {
  const checkoutSession = req.body.checkoutSession
  const oneTimeToken = req.body.oneTimeToken
  const country = req.query.country || 'US'
  const { currency, documentNumber, documentType, amount } = getCountryData(country)

  const response = await fetch(`${API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'public-api-key': PUBLIC_API_KEY,
      'private-secret-key': PRIVATE_SECRET_KEY,
      'X-idempotency-key': v4(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Yunique Fashion Store',
      account_id: ACCOUNT_CODE,
      merchant_order_id: '0000022',
      country,
      additional_data: {
        airline: {
          legs: [
            {
              arrival_airport: 'AMS',
              base_fare: 200,
              base_fare_currency: 'BRL',
              carrier_code: 'KL',
              departure_airport: 'EZE',
              departure_airport_timezone: '-03:00',
              departure_datetime: '2014-05-12 13:05:00',
              fare_basis_code: 'HL7LNR',
              fare_class_code: 'FR',
              flight_number: '842',
              stopover_code: 's',
            },
          ],
          passengers: [
            {
              country: 'st',
              date_of_birth: 'stringstri',
              document: {
                document_number: documentNumber,
                document_type: documentType,
              },
              first_name: 'string',
              last_name: 'string',
              loyalty_number: 'string',
              loyalty_tier: 'strin',
              middle_name: 'string',
              nationality: 'st',
              type: 's',
            },
          ],
          pnr: '1P-2UUGJW',
          ticket: {
            ticket_number: '123456',
            restricted: false,
            total_fare_amount: 80.0,
            total_tax_amount: 22.0,
            total_fee_amount: 14.0,
            issue: null,
            e_ticket: false,
          },
        },
        order: {
          fee_amount: 0,
          items: [
            {
              brand: 'Yunique',
              category: 'Fashion',
              id: 'YUNIQUE-DRESS-001',
              manufacture_part_number: 'YUNIQUE-DRESS-001',
              name: 'Linen Midi Dress',
              quantity: 1,
              sku_code: 'YUNIQUE-DRESS-001',
              unit_amount: 100,
            },
  ],
  shipping_amount: 10,
},
      },
      amount: {
        currency,
        value: 110,
      },
      checkout: {
        session: checkoutSession,
      },
      customer_payer: {
        billing_address: {
          address_line_1: 'Calle 34 # 56 - 78',
          address_line_2: 'Apartamento 502, Torre I',
          city: 'Bogota',
          country,
          state: 'Cundinamarca',
          zip_code: '111111',
        },
        date_of_birth: '1990-02-28',
        device_fingerprint: 'hi88287gbd8d7d782ge....',
        document: {
          document_type: documentType,
          document_number: documentNumber,
        },
        email: 'pepitoperez@y.uno',
        first_name: 'Pepito',
        gender: 'MALE',
        id: CUSTOMER_ID,
        ip_address: '192.168.123.167',
        last_name: 'Perez',
        merchant_customer_id: 'example00234',
        nationality: country,
        phone: {
          country_code: '57',
          number: '3132450765',
        },
        shipping_address: {
          address_line_1: 'Calle 34 # 56 - 78',
          address_line_2: 'Apartamento 502, Torre I',
          city: 'Bogota',
          country,
          state: 'Cundinamarca',
          zip_code: '111111',
        },
      },
      payment_method: {
        token: oneTimeToken,
        vaulted_token: null,
      },
    }),
  }).then((resp) => resp.json())

  res.json(response)
})

app.post('/customers/sessions', async (req, res) => {
  const country = req.query.country || 'CO'

  const response = await fetch(
    `${API_URL}/v1/customers/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "account_id": ACCOUNT_CODE,
        country,
        "customer_id": CUSTOMER_ID
      })
    }
  ).then((resp) => resp.json())

  res.send(response)
})

app.post('/customers/sessions/:customerSession/payment-methods', async (req, res) => {
  const customerSession = req.params.customerSession
  const paymentMethodType = req.query.paymentMethodType || 'NEQUI'
  const country = req.query.country || 'CO'

  const response = await fetch(
    `${API_URL}/v1/customers/sessions/${customerSession}/payment-methods`,
    {
      method: "POST",
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        "X-idempotency-key": v4(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "payment_method_type": paymentMethodType,
        country,
        "account_id": ACCOUNT_CODE
      }),
    }
  )

  res.send(response)
})

app.get('/payment-methods/:checkoutSession', async (req, res) => {
  const checkoutSession = req.params.checkoutSession
  const response = await fetch(
    `${API_URL}/v1/checkout/sessions/${checkoutSession}/payment-methods`,
    {
      method: 'GET',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    }
  )
  const paymentMethods = await response.json()
  res.json(paymentMethods)
})


app.get('/sdk-web/healthy', (req, res) => {
  res.sendStatus(200)
})

app.get('/public-api-key', (req, res) => {
  res.json({ publicApiKey: PUBLIC_API_KEY })
})

app.listen(SERVER_PORT, async () => {
  console.log(`server started at port: ${SERVER_PORT}`)
  app._router.stack.forEach((middleware) => {
    if (middleware.route && middleware.route.methods.get) {
      console.log(`Ruta disponible: http://localhost:8080${middleware.route.path}`);
    }
  });

  API_URL = generateBaseUrlApi()

  CUSTOMER_ID = await createCustomer().then(({ id }) => id)

  await open(`http://localhost:${SERVER_PORT}`);
})

const ApiKeyPrefixToEnvironmentSuffix = {
  dev: '-dev',
  staging: '-staging',
  sandbox: '-sandbox',
  prod: '',
}

const baseAPIurl = 'https://api_ENVIRONMENT_.y.uno'

function generateBaseUrlApi() {
  const [apiKeyPrefix] = PUBLIC_API_KEY.split('_')
  let baseURL = ''
  const environmentSuffix = ApiKeyPrefixToEnvironmentSuffix[apiKeyPrefix]
  baseURL = baseAPIurl.replace('_ENVIRONMENT_', environmentSuffix)

  return baseURL
}

function clean(value) {
  return typeof value === "string" ? value.trim() : ""
}

async function createYuniqueCustomer(customer, delivery, country) {
  const customerPayload = {
    country,
    merchant_customer_id: `YUNIQUE-CUSTOMER-${Date.now()}`,
    first_name: clean(customer.firstName),
    last_name: clean(customer.lastName),
    email: clean(customer.email),

    billing_address: {
      address_line_1: clean(delivery.address),
      address_line_2: clean(delivery.apartment),
      city: clean(delivery.city),
      country,
      zip_code: clean(delivery.postalCode),
    },

    shipping_address: {
      address_line_1: clean(delivery.address),
      address_line_2: clean(delivery.apartment),
      city: clean(delivery.city),
      country,
      zip_code: clean(delivery.postalCode),
    },

    metadata: [
      {
        key: "source",
        value: "yunique_checkout_demo",
      },
    ],
  }

  console.log("Creating Yuno customer with payload:")
  console.log(JSON.stringify(customerPayload, null, 2))

  const response = await fetch(`${API_URL}/v1/customers`, {
    method: "POST",
    headers: {
      "public-api-key": PUBLIC_API_KEY,
      "private-secret-key": PRIVATE_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerPayload),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error("Yuno customer creation failed:")
    console.error(JSON.stringify(data, null, 2))
    throw new Error("Could not create Yuno customer")
  }

  return data
}

function createCustomer() {
  const response = fetch(
    `${API_URL}/v1/customers`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'CO',
        merchant_customer_id: Math.floor(Math.random() * 1000000).toString(),
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@y.uno"
      })
    }
  ).then((resp) => resp.json())

  return response
}