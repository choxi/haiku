import React from "react"
import { StripeProvider } from 'react-stripe-elements'
import { Elements } from 'react-stripe-elements'
import PaymentForm from "./payment_form.jsx"
import Config from "../../lib/config.js"

export default class Payment extends React.Component {
  render() {
    return <StripeProvider apiKey={ Config.stripe.key }>
      <Elements>
        <PaymentForm />
      </Elements>
    </StripeProvider>
  }
}
