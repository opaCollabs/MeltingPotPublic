const express = require("express");
const router = express.Router();
const Recipe = require('../src/models/recipe');
const User = require('../src/models/user');
const blobHandler = require('../src/middleware/blob-handler');
const auth = require('../src/middleware/auth');

router.get('/',auth(['user','nutritionist', 'admin']) ,async (req, res) => {
    try {
        const recipes = await Recipe.find(req.body);
        res.json(recipes);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Could not retrieve data');
    }
});



router.get('/feed',auth(['user','nutritionist', 'admin']) ,async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const pageSize = parseInt(req.query.pageSize) || 5;
        const userId = req.user.id; 

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const categories = user.categories;
        console.log("Categories: ", categories);
        if (!categories || categories.length === 0) {
            return res.status(400).json({ message: 'User has no preferred categories' });
        }

        const recipes = await Recipe.find({ categories: { $in: categories } })
            .skip(page * pageSize)
            .limit(pageSize);

        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/explore', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const pageSize = 9;

        const recipes = await Recipe.find()
            .skip(page * pageSize)
            .limit(pageSize);

        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


//SEARCH FUNCTIONALITY
router.post('/search', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const receivedQuery = req.body;
        
        let query = {};

        if (receivedQuery && receivedQuery.length > 0) {
            if (receivedQuery.length === 1) {
                const condition = receivedQuery[0];
                if (condition.categories && condition.categories.length > 0) {
                    query = { categories: { $in: condition.categories } };
                } else {
                    query = condition;
                }
            } else {
                query['$and'] = receivedQuery.map(condition => {
                    if (condition.categories && condition.categories.length > 0) {
                        return { categories: { $in: condition.categories } };
                    }
                    return condition;
                });
            }
        }

        console.log('Constructed query:', JSON.stringify(query, null, 2)); // Log the constructed query

        const recipes = await Recipe.find(query).limit(51);
        res.json(recipes);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Could not retrieve data');
    }
});


router.post('/', auth(['user','nutritionist', 'admin']),async (req, res) => {
    const userId = req.user.id;
    const userName =req.user.name;
    try {
        console.log('Received data:', req.body);
        const { user, name, description, ingredients, instructions, categories, imageData } = req.body;
        
        const formattedIngredients = ingredients.map(ingredient => {
            const [name, quantity] = ingredient.split(':');
            return { name: name.trim(), quantity: quantity.trim() };
        });
        
        var imageUrl = "";

        if (imageData && imageData.fileName && imageData.payloadBase64) {
            imageUrl = await blobHandler.saveBlobToAzureWithSas(imageData.fileName, imageData.payloadBase64);
             console.log(imageUrl,"to image uri: ");
        }
       
        const recipe = new Recipe({
            userId,
            userName,
            name,
            imageUrl,
            description,
            ingredients: formattedIngredients,
            instructions,
            categories 
        });

        let postedData = await recipe.save();
        postedData.imageUrl = imageUrl;
        res.json(postedData);
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).json({ error: 'Could not save data' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.json(recipe);
    } catch (error) {
        console.error('Could not retrieve data:', error);
        res.status(500).send('Could not retrieve data');
    }
});

router.get('/doesUserLike/:id', auth(['user','nutritionist', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let userLikesThis = false;

        
        if (user.recipesILiked && user.recipesILiked.includes(req.params.id)) {
            userLikesThis = true;
        }
        console.log(userLikesThis);
        res.json({userLikes: userLikesThis});
    } catch (error) {
        console.error('Could not retrieve data:', error);
        res.status(500).send('Could not retrieve data');
    }
});

router.get('/doesUserSave/:id', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const recipeId = req.params.id;
        const userSavedThis = user.savedRecipes.includes(recipeId);

        res.json({ userSaved: userSavedThis });
    } catch (error) {
        console.error('Error checking user saved state:', error);
        res.status(500).json({ error: 'Could not retrieve data' });
    }
});
router.get('/user/recipes', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        
        const uploadedRecipes = await Recipe.find({ userId: req.user.id });

        
        const savedRecipes = await Recipe.find({ _id: { $in: user.savedRecipes } });

        res.json({ uploadedRecipes, savedRecipes });
    } catch (error) {
        console.error('Error fetching user recipes:', error);
        res.status(500).json({ error: 'Could not fetch user recipes' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { user, name, imageUrl, description, ingredients, instructions, categories } = req.body;

        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        recipe.user = user || recipe.user;
        recipe.name = name || recipe.name;
        recipe.imageUrl = imageUrl || recipe.imageUrl;
        recipe.description = description || recipe.description;
        recipe.ingredients = ingredients || recipe.ingredients;
        recipe.instructions = instructions || recipe.instructions;
        recipe.categories = categories || recipe.categories; 

        const updatedData = await recipe.save();
        res.json(updatedData);
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: 'Could not modify data' });
    }
});

router.patch('/:id', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        if (req.body.user) recipe.user = req.body.user;
        if (req.body.name) recipe.name = req.body.name;
        if (req.body.imageUrl) recipe.imageUrl = req.body.imageUrl;
        if (req.body.description) recipe.description = req.body.description;
        if (req.body.ingredients) recipe.ingredients = req.body.ingredients;
        if (req.body.instructions) recipe.instructions = req.body.instructions;
        if (req.body.categories) recipe.categories = req.body.categories;

        let heartChange = 0;
        if (!isNaN(req.body.hearts)) {
            heartChange = parseInt(req.body.hearts);
        } else {
            return res.status(400).json({ error: 'Invalid hearts value' });
        }

        if (recipe.hearts === undefined) {
            recipe.hearts = 0;
        }

        recipe.hearts += heartChange;
        const patchedRecipe = await recipe.save();

        if (heartChange !== 0 || saveChange !== 0) {
            await User.updateOne(
                { _id: recipe.userId },
                { $inc: { cookScore: heartChange } }
            );

            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (!Array.isArray(user.recipesILiked)) {
                user.recipesILiked = [];
            }

            if (heartChange === 1 && !user.recipesILiked.includes(recipe._id)) {
                user.recipesILiked.push(recipe._id);
            } else if (heartChange === -1) {
                const index = user.recipesILiked.indexOf(recipe._id.toString());
                if (index !== -1) {
                    user.recipesILiked.splice(index, 1);
                }
            }

            await user.save();
        }

        res.json(patchedRecipe);
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: 'Could not modify data' });
    }
});

router.patch('/save/:id', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const saveChange = parseInt(req.body.saved);
        if (isNaN(saveChange)) {
            return res.status(400).json({ error: 'Invalid saved value' });
        }

        if (saveChange === 1 && !user.savedRecipes.includes(recipe._id)) {
            user.savedRecipes.push(recipe._id);
        } else if (saveChange === -1) {
            const index = user.savedRecipes.indexOf(recipe._id.toString());
            if (index !== -1) {
                user.savedRecipes.splice(index, 1);
            }
        }

        await user.save();
        res.json({ success: true, message: 'Recipe save state updated successfully.' });
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).json({ error: 'Could not modify data' });
    }
});





router.delete('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Could not delete recipe' });
    }
});

module.exports = router;




