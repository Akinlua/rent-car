const noLayout = '../views/layouts/nothing.ejs'
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const notFound = async (req, res) =>  {

    return res.render("error-404", {layout: noLayout}) 
}

module.exports = notFound
