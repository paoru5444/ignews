import { faunadb } from "../../../../services/faunadb"
import { query as q } from 'faunadb';
import { stripe } from "../../../../services/stripe";
export async function saveSubscription(
  subscriptionId: string,
  costumerId: string,
  createAction = false,
) {
  console.log({ subscriptionId  })
  console.log({ costumerId  })
  const userRef = await faunadb.query(
    q.Select(
      "ref",
      q.Get(
        q.Match(
          q.Index('user_by_stripe_customer_id'),
          costumerId
        )
      )
    )
  )

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const subscriptionData = {
    id: subscription.id,
    user_id: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id
  }

  if (createAction) {
    await faunadb.query(
      q.Create(
        q.Collection('subscriptions'),
        { data: subscriptionData }
      )
    )
  } else {
    await faunadb.query(
      q.Replace(
         q.Select(
           'ref',
           q.Get(
             q.Match('subscription_by_id'),
             subscriptionId
           )
         ),
         { data: subscriptionData }
      )
    )
  }
}