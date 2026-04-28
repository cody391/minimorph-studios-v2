const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  try {
    // Get the platform account
    const account = await stripe.accounts.retrieve();
    console.log('Account ID:', account.id);
    console.log('Current capabilities:', JSON.stringify(account.capabilities, null, 2));
    
    // Try requesting transfers capability on the platform
    try {
      const updated = await stripe.accounts.update(account.id, {
        capabilities: {
          transfers: { requested: true }
        }
      });
      console.log('Transfers capability requested successfully!');
      console.log('Updated capabilities:', JSON.stringify(updated.capabilities, null, 2));
    } catch (err) {
      console.log('Cannot request transfers:', err.message);
    }

    // Try creating an account link for the platform itself
    try {
      const link = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'https://minimorphstudios.net/admin',
        return_url: 'https://minimorphstudios.net/admin',
        type: 'account_onboarding',
      });
      console.log('Account link created:', link.url);
    } catch (err) {
      console.log('Cannot create account link for platform:', err.message);
    }

  } catch (err) {
    console.log('Error:', err.message);
  }
}

main();
