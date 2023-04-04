const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const { createHash } = require('crypto');
const mongoDBStore = require('connect-mongodb-session')(session);

let app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('./public'));

const retrospectDB = "mongodb+srv://retrospect:Retrosp3ct@retrospect.fboiauc.mongodb.net/retrospectDB";
const retrospectConnection = mongoose.connect(retrospectDB);

// Initializing session
const sessionStore = new mongoDBStore({
    uri: retrospectDB,
    url: retrospectConnection,
    collection: 'sessions'
});
app.use(session({
    secret: 'some secret ya foo',
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));
const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect('/log-in')
    }
}
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// SCHEMAS
const UserModel = require('./models/userDB');
const UserCartModel = require('./models/user_cartDB');
const ItemsModel = require('./models/itemsDB');
const OrdersModel = require('./models/ordersDB');
const { findOneAndDelete } = require('./models/user_cartDB');
const items = require('./models/itemsDB');

// LANDING PAGE
app.get('/', function(req, res){
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = req.session;
    }
    res.render('landing-page', {
        curr_user: curr_user
    });
});
app.get('/landing-page', function(req, res){
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = req.session;
    }
    res.render('landing-page',{
        curr_user: curr_user
    });

});

// ABOUT US
app.get('/about-us', function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = req.session;
    }
    res.render('about-us',{
        curr_user: curr_user
    });
});

// SHOP
app.get('/shop', async function(req, res){
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = req.session;
    }

    const items = await ItemsModel.find({});

    res.render('shop',{
        curr_user: curr_user,
        items: items
    });
});

// SHOPPING-CART
app.get('/shopping-cart', async function(req, res){

    let curr_user = null;
    if(req.session.isAuth){
        curr_user = req.session;
    }

    const cart_items = await UserCartModel.find({user_id: req.session._id});
    console.log(cart_items);

    res.render('shopping-cart', {
        curr_user: curr_user,
        cart_items: cart_items,
        username: req.session.username
    })
});
// DELETE ITEM IN SHOPPING CART
app.get('/delete-item/:user_id/:item_name/:size', async function(req, res) {
    const {user_id, item_name, size} = req.params

    console.log(req.params);
    const delete_item = await UserCartModel.updateOne(
        {user_id: req.session._id},
        {$pull: {
            items: {
                item_name: item_name,
                size: size
                }
            }
        }
    );

    res.redirect('/shopping-cart');
});

//ADD ITEM TO USER CART
app.post('/add-to-cart', async function(req, res){

    if(req.session.isAuth == undefined){
        console.log("Need Account Before adding to cart");
        return res.render('login', {
            msg: "Need Account Before adding to cart. We apologize for the Inconvenience."
        });
    }

    const items = await ItemsModel.find({});

    const {item_name, item_photo ,price, size, quantity} = req.body;
    const total_price = quantity * price;

    console.log("Item Name: " + item_name);
    console.log("Item Photo: " + item_photo)
    console.log("Price: " + price);
    console.log("Size: " + size);
    console.log("Qty: " + quantity);
    console.log("Total Price: " + total_price);

    const item =  {item_name, item_photo, price, size, quantity, total_price}

    const find_item = await UserCartModel.findOne({
        user_id: req.session._id,
        items: {
            $elemMatch: {
                item_name: item_name,
                size: size
            }
        }
    });

    if(find_item) { // IF ITEMS EXIST JUST ADD CURRENT ITEM
        const user_cart = await UserCartModel.updateOne({
                user_id: req.session._id,
                items: {
                    $elemMatch: {
                        item_name: item_name,
                        size: size
                    }
                }
            }, {
                $inc:{
                    "items.$.quantity": quantity,
                    "items.$.total_price": total_price
                }
            });
    } else { // IF ITEM DOES NOT EXIST
        const user_cart = await UserCartModel.updateOne(
            {user_id: req.session._id},
            {$push: {items: item}}
        );
    }

    return res.redirect('/shop');
});

// ORDER CHECKOUT
app.get('/checkout/:username/:total_price', async function(req, res) {

    const username = req.params.username;
    const total_price = req.params.total_price;

    const user_cart = await UserCartModel.findOne({username: username});

    // If there are no items in the cart then create a new order
    if(user_cart.items.length == 0){
        return res.redirect('/shopping-cart');
    }


    const newOrder = await OrdersModel({
        user_id: req.session._id,
        username: req.session.username,
        items: user_cart.items,
        total_price: total_price
    });
    await newOrder.save();

    const deleteditems = await UserCartModel.updateOne(
        {user_id: req.session._id},
        {$pullAll: {
            items: user_cart.items
            }
        }
    );

    return res.redirect('/shopping-cart');
});

// BLOG
app.get('/blog', function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = req.session;
    }
    return res.render('blog', {
        curr_user: curr_user
    });
});

// SIZE CHART
app.get('/size-chart', function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = req.session;
    }
    return res.render('size-chart', {
        curr_user: curr_user
    });
});

// LOGIN
app.get('/login', function(req, res){
    const msg = null;
    return res.render('login', {msg: msg}); // Will store error message if needed
});
app.post('/user-login', async function(req, res){

    const { username, password } = req.body;

    let users = await UserModel.findOne({ username: username});
    const hashedPassword = createHash('sha256').update(password).digest('hex');
    // check if there is an existing user and if password is correct
    if(!users || users.password !== hashedPassword){
        return res.render('login',{msg: "Wrong Username or Password."});
    }

    req.session.isAuth = true;
    res.session = users;
    req.session._id = users._id;
    req.session.username = users.username;
    req.session.user_type = users.user_type;

    console.log('logged in user._id: ' + users._id);
    return res.redirect('/landing-page');
});
// LOG OUT
app.get('/log-out', function(req, res){

    if(isAuth){
        req.session.isAuth = false;
        req.session.destroy((err) => {
            if (err) throw err;

            console.log(req.session);
            console.log('log out success!');
            return res.redirect('/landing-page');
        })
    }

});

// SIGN UP
app.get('/signup', function(req, res){
    const msg = null;
    return res.render('signup', {msg: msg}); // Will store error message if needed
});
app.post('/create-user', async function(req, res){

    const { username, your_email, password, confirm_password} = req.body;
    console.log(username + " "  + your_email + " " + password + " " + confirm_password);

    const takenUsername = await UserModel.findOne({ username: username});
    // Validation if there is already an existing record with same username
    if (takenUsername) {
        console.log('taken username');
        return res.render('signup',{msg: "Username already taken"});
    }
    const takenEmail = await UserModel.findOne({ email: your_email});
    // Validation if there is already an existing record with same email
    if (takenEmail) {
        console.log('taken email');
        return res.render('signup',{msg: "Email already taken"});
    }

    // Validation if passwords match
    if( password !== confirm_password){
        console.log('passwords do not match ' + password + ' - ' + confirm_password);
        return res.render('signup',{msg: "Passwords do not match"});
    }
    const hashedPassword = createHash('sha256').update(password).digest('hex');

    const newUser = await UserModel({
        username: username,
        user_type: 0,
        email: your_email,
        password: hashedPassword
    });
    await newUser.save();

    //create cart for the user
    const newUserCart = await UserCartModel({
        user_id: newUser,
        username: username,
        items: []
    });
    await newUserCart.save();

    console.log('success!')
    return res.render('login',{msg: "You may now log in"});
});

// ADMIN
app.get('/admin', async function(req, res){
    let curr_user = null;
    let msg = null;
    
    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    // Not allowed if user null
    if(!curr_user){
        return res.redirect('back');
    }

    const orders = await OrdersModel.find({}); // Gets all orders
    const all_users = await UserModel.find({ username: {$nin: curr_user.username}}); // Gets all users except current user
    const all_items = await ItemsModel.find({}); // Gets all items
    
    return res.render('admin-dash',{
        msg: msg,
        curr_user: curr_user,
        all_users: all_users,
        all_items: all_items,
        orders: orders
    });

});
// Revert Status
app.get('/revert-status/:order_id/:status', async function(req, res) {

    const status = req.params.status;
    const order_id = req.params.order_id;

    console.log("Order: #" + order_id);
    console.log("Reverted Status: " + status);

    if(status === "Payment Successfu! Preparing your Order.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Waiting for Payment Confirmation"}
        })
    } else if(status === "Out for Delivery.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Payment Successfu! Preparing your Order."}
        })
    } else if(status === "Order Received.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Out for Delivery."}
        })
    }

    res.redirect('/admin');
});
// Revert Status
app.get('/advance-status/:order_id/:status', async function(req, res) {

    const status = req.params.status;
    const order_id = req.params.order_id;

    if(status === "Waiting for Payment Confirmation.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Payment Successfu! Preparing your Order."}
        })
    } else if(status === "Payment Successfu! Preparing your Order.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Out for Delivery."}
        })
    } else if(status === "Out for Delivery.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Order Received."}
        })
    }

    res.redirect('/admin');
});
// Revert Status
app.get('/cancel-order/:order_id', async function(req, res) {
    const order_id = req.params.order_id;
    console.log("Cancelled Order: " + order_id);

    await OrdersModel.findOneAndDelete({_id: order_id});
    
    res.redirect('/admin');
});

//ADD USER
app.get('/create-admin', async function(req, res){
    let curr_user = null;
    let msg = null;

    if(req.session.isAuth){
        curr_user = req.session;
        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }
    // Not allowed if user null
    if(!curr_user){
        return res.redirect('back');
    }
    
    return res.render('create-admin',{
        curr_user: curr_user,
        msg: msg
    });

});
// Add an admin to DB
app.post('/add-admin', async function(req, res){
    let curr_user = null
    const { username, your_email, password, confirm_password} = req.body;
    console.log(username + " "  + your_email + " " + password + " " + confirm_password);

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const takenUsername = await UserModel.findOne({ username: username});
    // Validation if there is already an existing record with same username
    if (takenUsername) {
        console.log('taken username');
        return res.render('create-admin',{
            curr_user: curr_user,
            msg: "Username already taken"
        });
    }
    const takenEmail = await UserModel.findOne({ email: your_email});
    // Validation if there is already an existing record with same email
    if (takenEmail) {
        console.log('taken email');
        return res.render('create-admin',{
            curr_user: curr_user,
            msg: "Email already taken"
        });
    }

    // Validation if passwords match
    if( password !== confirm_password){
        console.log('passwords do not match ' + password + ' - ' + confirm_password);
        return res.render('create-admin',{
            curr_user: curr_user,
            msg: "Passwords do not match"
        });
    }
    const hashedPassword = createHash('sha256').update(password).digest('hex');

    const newUser = await UserModel({
        username: username,
        user_type: 1, // user type admin
        email: your_email,
        password: hashedPassword
    });
    await newUser.save();

    //create cart for the user
    const newUserCart = await UserCartModel({
        user_id: newUser,
        username: username,
        items: []
    });
    await newUserCart.save();

    console.log('success!')
    return res.redirect('/admin');
});
// Delete User 
app.get('/delete-user/:user_id', async function(req, res){
    let curr_user = null

    const user_id = req.params.user_id;

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }
    if(!curr_user){
        return res.redirect('back');
    }

    await UserModel.findOneAndDelete({_id: user_id});
    await UserCartModel.findOneAndDelete({user_id: user_id});
    
    return res.redirect('/admin');
});
// Edit User
app.post('/edit-user', async function(req, res){
    let curr_user = null
    let msg = null;

    const user_id = req.body.user_id;

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }
    if(!curr_user){
        return res.redirect('back');
    }

    // User that will be edited
    const edit_user = await UserModel.findOne({_id: user_id});
    console.log(edit_user);

    return res.render('edit-user',{
        msg: msg,
        curr_user: curr_user,
        edit_user: edit_user
    });
});
// Updates User Details in the DB
app.post('/update-user-details', async function(req, res){
    let curr_user = null
    let msg = null;

    const {user_id, username, email, user_type} = req.body;

    // User whose details will be edited
    const edit_user = await UserModel.findOne({_id: user_id});

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }
    if(!curr_user){
        return res.redirect('back');
    }
    
    const takenUsername = await UserModel.findOne({_id: {$nin: user_id}, username: username});
    // Validation if there is already an existing record with same username that is not the edited user
    if (takenUsername) {
        return res.render('edit-user',{
            msg: "Username already taken",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }
    const takenEmail = await UserModel.findOne({_id: {$nin: user_id}, email: email});
    // Validation if there is already an existing record with same email that is not the edited user
    if (takenEmail) {
        return res.render('edit-user',{
            msg: "Email already taken",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }

    // Validation if user_type exists
    if (user_type !== '0' && user_type !== '1') {
        return res.render('edit-user',{
            msg: "User type " + user_type + " does not exists",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }

    
    // User details will be updated if it reaches this point
    const edited_user = await UserModel.updateOne({_id: user_id}, {
        $set: {
            username: username,
            email: email,
            user_type: user_type
        }
    })
    console.log(edited_user);

    return res.redirect('/admin');
});
// Changes User Password in DB
app.post('/change-user-password', async function(req, res){
    let curr_user = null
    let msg = null;

    const {user_id, new_password, confirm_password} = req.body;
    console.log(user_id + " " + new_password + " " + confirm_password);

    // User whose password will be edited
    const edit_user = await UserModel.findOne({_id: user_id});

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }
    if(!curr_user){
        return res.redirect('back');
    }

    if (new_password !== confirm_password) {
        return res.render('edit-user',{
            msg: "Passwords do not match",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }

    const hashedPassword = createHash('sha256').update(new_password).digest('hex');
    
    // User details will be updated
    const edited_user = await UserModel.updateOne({_id: user_id}, {
        $set: {
            password: hashedPassword
        }
    })
    console.log(edited_user);

    return res.redirect('/admin');
});

app.listen(3000, () => console.log('Server started on port 3000'));
