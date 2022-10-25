const { User, Role, Order, Product, Order_has_product, Tva } = require("../models");
const pricesCalculation = require('../helpers/pricesCalculation')

const checkoutController = {

    
    checkoutPage (req, res) {
        if(!req.session.user){
            const message = "Veuillez vous connecter pour procéder au checkout"
            res.render('user/signin', { message })
        }
        const user = req.session.user;
        const cart = req.session.cart;
        const { cartHT, cartTTC, cartTax } = pricesCalculation.getAllCartTotals(cart)
        res.render('shop/cart/checkout', {cart, cartHT, cartTTC, cartTax, user})
    },

    async checkoutAction (req, res) {
        const cart = req.session.cart;
        const user = req.session.user
        const { cartHT, cartTTC, cartTax } = pricesCalculation.getAllCartTotals(cart)
        console.log(cartHT, cartTTC, cartTax)
        let quantity = 0
        for(const p of cart){
            quantity = p.qty + quantity
        }
        try {
            const order = await Order.create({
                totalHT: cartHT,
                tax: cartTax,
                totalTTC: cartTTC,
                user_id: user.id,
                adress: user.shipping,
                state: "en cours de livraison",
                quantity: quantity
            });
            for(const product of req.session.cart){
                const productToAdd = await Product.findByPk(product.id)
                await order.addProduct(productToAdd, 
                    { through: { 
                        quantity: product.qty, 
                        priceHT: product.priceHT, 
                        tva: product.tva.title, 
                        state: "en cours de livraison" }})
            };
            delete req.session.cart;
            res.render('shop/cart/checkoutConfirmation')
        } catch (error) {
            console.log(error);
            res.locals.error = {
              code: 500,
              text: "Query error"
            }
        }
    },
}

module.exports = checkoutController;
