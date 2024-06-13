const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user'); // Adjust the path as needed
const Request = require('../src/models/request'); // Adjust the path as needed
const blobHandler = require('../src/middleware/blob-handler');
const auth = require('../src/middleware/auth');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, categories, imageData, fileData } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        if (imageData && imageData.fileName && imageData.payloadBase64) {
            var imageUrl = await blobHandler.saveBlobToAzureWithSas(imageData.fileName, imageData.payloadBase64);
        }

        if (fileData && fileData.fileName && fileData.payloadBase64) {
            var fileUrl = await blobHandler.saveBlobToAzureWithSas(fileData.fileName, fileData.payloadBase64);
        }

        let cookScore = 0;
        const newUser = new User({
            name,
            email,
            password,
            role, 
            imageUrl,
            fileUrl,
            categories,
            cookScore
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        if(newUser.role === "nutritionist"){
                newUser.role = "user";
                console.log("request nutritionist", newUser.name);
        }
        const savedUser = await newUser.save();

        
        
        if (role === "nutritionist") {
            const newRequest = new Request({
                userId: savedUser._id,
                username: savedUser.name,
                fileUrl: savedUser.fileUrl
            });
            await newRequest.save();
        }

        const token = jwt.sign({ id: savedUser._id, name: savedUser.name ,role: savedUser.role }, process.env.JWT_SECRET, { expiresIn: 3600 });

        res.json({
            token,
            role: savedUser.role,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                imageUrl: savedUser.imageUrl,
                fileUrl: savedUser.fileUrl,
                categories: savedUser.categories,
                role: savedUser.role
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Could not register user' });
    }
});

router.get('/profile', auth(['user','nutritionist', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            imageUrl: user.imageUrl,
            fileUrl: user.fileUrl,
            categories: user.categories,
            cookScore: user.cookScore,
            savedRecipes: user.savedRecipes, 
            purchasedDiets: user.purchasedDiets 
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Could not fetch user profile' });
    }
});

router.put('/approveRequest/:userId', auth(['admin']), async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("approving request of user: ",userId);
        const updatedUser = await User.findByIdAndUpdate(userId, { role: 'nutritionist' }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id,name: user.name ,role: user.role }, process.env.JWT_SECRET, { expiresIn: 3600 });
        console.log({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        }, " connected user");

        res.json({
            token,
            role: user.role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                categories: user.categories,  
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Could not log in user' });
    }
});

router.patch('/saveRecipe/:recipeId', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        const recipeId = req.params.recipeId;
        const saveChange = req.body.saveChange;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (saveChange === 1) {
            if (!user.savedRecipes.includes(recipeId)) {
                user.savedRecipes.push(recipeId);
            }
        } else if (saveChange === -1) {
            user.savedRecipes = user.savedRecipes.filter(id => id !== recipeId);
        } else {
            return res.status(400).json({ error: 'Invalid saveChange value' });
        }

        await user.save();

        res.json({ success: true, savedRecipes: user.savedRecipes });
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).json({ error: 'Could not save recipe' });
    }
});

router.patch('/purchaseDiet/:dietId', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        const dietId = req.params.dietId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.purchasedDiets.includes(dietId)) {
            user.purchasedDiets.push(dietId);
        } else {
            return res.status(400).json({ error: 'Diet is already purchased' });
        }

        await user.save();

        res.json({ success: true, purchasedDiets: user.purchasedDiets });
    } catch (error) {
        console.error('Error purchasing diet:', error);
        res.status(500).json({ error: 'Could not purchase diet' });
    }
});

router.get('/isDietPurchased/:id', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const dietId = req.params.id;
        const userPurchasedThis = user.purchasedDiets.includes(dietId);

        res.json({ userPurchased: userPurchasedThis });
    } catch (error) {
        console.error('Error checking user diet purchasing state:', error);
        res.status(500).json({ error: 'Could not retrieve data' });
    }
});

router.post('/adminPortal/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Only admin users can log in.' });
        }

        const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Could not log in user' });
    }
});

module.exports = router;

