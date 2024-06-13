require('dotenv').config();

const express = require('express');
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const app = express();

app.use(express.json());

const blobHandler = {
    async saveBlobToAzureWithSas(filename, data){
        const fileDataBuffer = Buffer.from(data, 'base64');
        
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        const blobName = generateBlobName(filename);
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.uploadData(fileDataBuffer);
        
        const sasToken = generateSasToken(blockBlobClient, BlobSASPermissions.parse('r'), sharedKeyCredential);
        
        const sasUrl = `${blockBlobClient.url}?${sasToken}`;
        
        console.log("blob saved: ", sasUrl)
        return sasUrl;
    } 
}

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




module.exports = blobHandler;
