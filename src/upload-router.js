require('dotenv').config();

const express = require('express');
const router = express.Router();
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const app = express();

app.use(express.json());

router.post('/', async (req, res) => {
    try {
        if (!req.body.file || !req.body.file.data) {
            return res.status(400).json({ error: 'No image data provided' });
        }
        const fileDataBuffer = Buffer.from(req.body.file.data, 'base64');

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);

        const containerClient = blobServiceClient.getContainerClient(containerName);

        const blobName = generateBlobName(req.body.file.originalname);

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(fileDataBuffer);

        const sasToken = generateSasToken(blockBlobClient, BlobSASPermissions.parse('r'), sharedKeyCredential);

        const sasUrl = `${blockBlobClient.url}?${sasToken}`;

        res.status(200).json({ fileUrl: sasUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function generateBlobName(originalName) {
    const fileExtension = originalName.split('.').pop();
    
    const fileNameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');

    const identifier = Math.random().toString().replace(/0\./, '');

    return `${fileNameWithoutExtension}-${identifier}.${fileExtension}`;
}

function generateSasToken(blobClient, permissions, sharedKeyCredential) {
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(startDate.getFullYear() + 1); 
    const sasOptions = {
        containerName: containerName,
        blobName: blobClient.name,
        permissions: permissions,
        startsOn: startDate,
        expiresOn: expiryDate
    };

    return generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
}

module.exports = router;
