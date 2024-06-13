const express = require("express");
const router = express.Router();
const Diet = require('../src/models/diet');
const auth = require('../src/middleware/auth');

router.get('/', auth(['admin', 'user', 'nutritionist']) ,async (req, res) => {
    try {
        const diets = await Diet.find(req.body);

        res.json(diets);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Could not retrieve data');
    }
});

router.post('/', auth(['nutritionist', 'admin']),async (req, res) =>{
    const userId = req.user.id;
    const userName =req.user.name;
    try {
        const { name, recipes, visible_recipes, price, description, info} = req.body;
        console.log(req.body);

        const diet = new Diet({
            userId,
            userName,
            name,
            recipes,
            visible_recipes,
            price,
            description,
            info
        });

        const postedData = await diet.save();
        res.json(postedData);
    } catch (error) {
        console.error('Error saving Diet:', error);
        res.status(500).json({ error: 'Could not save data' });
    }
});

//SEARCH FUNCTIONALITY
router.post('/search', auth(['user', 'nutritionist', 'admin']), async (req, res) => {
    try {
        const receivedQuery = req.body;
        
        let query = {};

        if (receivedQuery && receivedQuery.length > 0) {
            if (receivedQuery.length === 1) {
                query = receivedQuery[0];
            } else {
                query['$and'] = receivedQuery.map(condition => {
                    if (condition.categories) {
                        return { categories: { $in: condition.categories } };
                    }
                    return condition;
                });
            }
        }

        console.log('Constructed query:', JSON.stringify(query, null, 2));

        const diets = await Diet.find(query);
        res.json(diets);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Could not retrieve data');
    }
});

router.get('/:id', async (req, res) => {
    try{
       const diet = await Diet.findById(req.params.id)
       res.json(diet)
    }catch{
       res.send('could not retrieve data')
    }
})

module.exports = router;