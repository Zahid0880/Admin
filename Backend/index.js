const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require('path');
const jwt = require('jsonwebtoken');

const bodyParser = require('body-parser');

// Increase the maximum payload size (adjust the limit as needed)
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://Iqbal:Zahid.0880@cluster0.faghstf.mongodb.net/e-commerce", { useNewUrlParser: true, useUnifiedTopology: true });

// API creation
app.get("/", (req, res) => {
    res.send("Express App is running. " + port);
});

// Image storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

app.use('/images', express.static('upload/images'));

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Schema for creating product
const product = mongoose.model("product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

app.post('/addproduct', async (req, res) => {
    let products = await product.find({});
    let id;
    if (products.length > 0) {
        let lastProductArray = products.slice(-1);
        let lastProduct = lastProductArray[0];
        id = lastProduct.id + 1;
    } else {
        id = 1;
    }

    const newProduct = new product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        date: req.body.date,
        available: req.body.available,
    });

    console.log(newProduct);

    await newProduct.save();

    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    });
});

// Creating API For deleting Products
app.post('/removeproduct', async (req, res) => {
    try {
        const deletedProduct = await product.findOneAndDelete({ id: req.body.id });

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found for deletion.',
            });
        }

        console.log("Product removed:", deletedProduct.name);
        res.json({
            success: true,
            name: deletedProduct.name,
        });
    } catch (error) {
        console.error("Error removing product:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Create API for getting all products
app.get('/allproducts', async (req, res) => {
    try {
        let products = await product.find({});
        console.log("All products fetched");
        res.send(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Schema create for getting all product
const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

// Create endpoint for registering user
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Existing user found with the same email" });
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }

    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password, // Fix: Include the password in the user creation
        cartData: cart,
    });

    await user.save();

    const data = {
        user: {
            id: user.id,
        },
    };

    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
});

app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id,
                },
            };
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Wrong password" });
        }
    } else {
        res.json({ success: false, errors: "Wrong email id" });
    }
});

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error: " + error);
    }
});
