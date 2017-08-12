import React from "react"
import { CardElement } from 'react-stripe-elements'
import { injectStripe } from 'react-stripe-elements'
import Api from "../../lib/api.js"

class PaymentForm extends React.Component {
  constructor() {
    super()
    this.api = new Api()
  }

  handleSubmit(event) {
    event.preventDefault()

    this.props.stripe.createToken({name: 'Jenny Rosen'})
    .then(({ token }) => this.api.put(`/users/${ this.api.credentials.id }`, { stripe_token: token.id }))
    .then((response) => {
      console.log('Set stripe token', response)
    })
  }

  render() {
    return <form onSubmit={ (event) => this.handleSubmit(event) }>
      <CardElement />
      <button>Confirm</button>
    </form>
  }
}

export default injectStripe(PaymentForm)
