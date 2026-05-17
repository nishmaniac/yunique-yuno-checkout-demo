import { getSeamlessCheckoutSession, getPublicApiKey } from "./api.js"

let yuno = null
let checkoutReady = false

const ORDER = {
  productName: "Linen Midi Dress",
  productId: "YUNIQUE-DRESS-001",
  sku: "YUNIQUE-DRESS-001",
  category: "Fashion",
  brand: "Yunique",
  currency: "USD",
  itemAmount: 100,
  shippingAmount: 10,
  totalAmount: 110,
}

function getFormData(formSelector) {
  const form = document.querySelector(formSelector)
  return Object.fromEntries(new FormData(form).entries())
}

function validateCheckoutForms() {
  const customerForm = document.querySelector("#customer-form")
  const deliveryForm = document.querySelector("#delivery-form")

  if (customerForm && !customerForm.reportValidity()) {
    return false
  }

  if (deliveryForm && !deliveryForm.reportValidity()) {
    return false
  }

  return true
}

function buildCheckoutPayload() {
  const customer = getFormData("#customer-form")
  const delivery = getFormData("#delivery-form")

  return {
    customer: {
      firstName: customer.firstName?.trim(),
      lastName: customer.lastName?.trim(),
      email: customer.email?.trim(),
    },

    delivery: {
      address: delivery.address?.trim(),
      apartment: delivery.apartment?.trim(),
      postalCode: delivery.postalCode?.trim(),
      city: delivery.city?.trim(),
      country: delivery.country,
    },

    order: {
      merchantOrderId: `YUNIQUE-${Date.now()}`,
      productName: ORDER.productName,
      productId: ORDER.productId,
      sku: ORDER.sku,
      category: ORDER.category,
      brand: ORDER.brand,
      currency: ORDER.currency,
      itemAmount: ORDER.itemAmount,
      shippingAmount: ORDER.shippingAmount,
      totalAmount: ORDER.totalAmount,
    },
  }
}

function lockCheckoutForms() {
  document
    .querySelectorAll("#customer-form input, #customer-form select, #delivery-form input, #delivery-form select")
    .forEach((field) => {
      field.disabled = true
    })
}

async function prepareYunoCheckout() {
  const payButton = document.querySelector("#button-pay")
  const status = document.querySelector("#status")

  status.textContent = "Preparing secure payment..."

  const checkoutPayload = buildCheckoutPayload()

  console.log("Payload being sent to backend:", checkoutPayload)

  const sessionResponse = await getSeamlessCheckoutSession(checkoutPayload)

  console.log("Yuno checkout session response:", sessionResponse)

  if (!sessionResponse.checkout_session) {
    console.error("Checkout session creation failed:", sessionResponse)
    status.textContent = "Could not create checkout session. Check Terminal and browser console."
    payButton.disabled = false
    return
  }

  const publicApiKey = await getPublicApiKey()

  yuno = await Yuno.initialize(publicApiKey)

  await yuno.startSeamlessCheckout({
    checkoutSession: sessionResponse.checkout_session,
    elementSelector: "#root",
    countryCode: checkoutPayload.delivery.country || "US",
    language: "en-US",
    showLoading: true,
    showPaymentStatus: true,

    renderMode: {
      type: "element",
      elementSelector: {
        apmForm: "#form-element",
        actionForm: "#action-form-element",
      },
    },

    card: {
      type: "extends",
      cardSaveEnable: false,
      hideCardholderName: false,
      styles: "",
      texts: {},
    },

    async yunoCreatePayment() {
      /*
        Yuno's Seamless SDK docs say this placeholder should exist.
        In this sample flow, payment is handled through the checkout session.
      */
    },

    onPaymentMethodSelected(data) {
      console.log("Payment method selected:", data)
    },

    yunoPaymentResult(data) {
      console.log("Payment result:", data)

      if (status) {
        status.textContent = `Payment result: ${typeof data === "string" ? data : data?.status || "check console"}`
      }
    },

    yunoError(error, data) {
      console.error("Yuno error:", error, data)

      if (status) {
        status.textContent = "Payment failed or was cancelled."
      }

      payButton.disabled = false
    },

    onLoading(args) {
      console.log("Yuno loading:", args)
    },
  })

  await yuno.mountSeamlessCheckout()

  checkoutReady = true
  lockCheckoutForms()

  payButton.textContent = "PAY $110.00"
  payButton.disabled = false
  status.textContent = "Payment methods loaded. Select Card, then click Pay."
}

async function handlePayButtonClick() {
  const payButton = document.querySelector("#button-pay")
  const status = document.querySelector("#status")

  if (!validateCheckoutForms()) {
    return
  }

  payButton.disabled = true

  try {
    if (!checkoutReady) {
      await prepareYunoCheckout()
      return
    }

    status.textContent = "Opening payment form..."
    await yuno.startPayment()
    payButton.disabled = false
  } catch (error) {
    console.error(error)
    status.textContent = "Something went wrong. Check the browser console and Terminal."
    payButton.disabled = false
  }
}

function initSeamlessCheckout() {
  const payButton = document.querySelector("#button-pay")

  if (!payButton) {
    console.error("Could not find #button-pay")
    return
  }

  payButton.textContent = "CONTINUE TO PAYMENT"
  payButton.addEventListener("click", handlePayButtonClick)
}

if (window.Yuno) {
  initSeamlessCheckout()
} else {
  window.addEventListener("yuno-sdk-ready", initSeamlessCheckout)
}