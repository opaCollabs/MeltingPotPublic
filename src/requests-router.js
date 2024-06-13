const express = require("express");
const router = express.Router();
const Request = require('../src/models/request');
const auth = require('../src/middleware/auth');

router.get('/', auth(['admin']), async (req, res) => {
    try {
        const requests = await Request.find();

        res.json(requests);
    } catch (error) {
        console.error('Error retrieving requests:', error);
        res.status(500).send('Could not retrieve requests');
    }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
    try {
        const requestId = req.params.id;
        console.log("trying to remove request:", requestId);
        const deletedRequest = await Request.findByIdAndDelete(requestId);
        
        if (!deletedRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Could not delete request' });
    }
});

module.exports = router;
