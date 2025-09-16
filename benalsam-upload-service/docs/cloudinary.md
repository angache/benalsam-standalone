# ☁️ Cloudinary Integration Documentation

## 📊 Overview

The Upload Service integrates with Cloudinary for image storage, processing, and CDN delivery. This integration provides scalable, reliable image management with automatic optimization and transformation.

## 🏗️ Architecture

### **Cloudinary Flow**
```
Image Upload → Cloudinary → Processing → CDN → Delivery
```

### **Components**
- **Cloudinary SDK**: Official Node.js SDK
- **Image Processing**: Automatic resize, compress, optimize
- **CDN Delivery**: Global content delivery network
- **Transformation**: Dynamic image transformations
- **Storage**: Secure cloud storage

## 🔧 Configuration

### **Environment Variables**

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_SECURE=true
CLOUDINARY_CDN_SUBDOMAIN=your_cdn_subdomain
```

### **Cloudinary Setup**

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
```

## 📁 Folder Structure

### **Cloudinary Organization**

```
benalsam/
├── {userId}/
│   ├── listings/
│   │   ├── temp_{timestamp}_{randomId}/
│   │   │   ├── image1.jpg
│   │   │   ├── image2.jpg
│   │   │   └── ...
│   │   └── {listingId}/
│   │       ├── image1.jpg
│   │       ├── image2.jpg
│   │       └── ...
│   ├── inventory/
│   │   ├── temp_{timestamp}_{randomId}/
│   │   │   ├── item1.jpg
│   │   │   ├── item2.jpg
│   │   │   └── ...
│   │   └── {itemId}/
│   │       ├── item1.jpg
│   │       ├── item2.jpg
│   │       └── ...
│   └── single/
│       ├── avatar1.jpg
│       ├── avatar2.jpg
│       └── ...
```

### **Folder Naming Convention**

| Type | Pattern | Example |
|------|---------|---------|
| **Temporary** | `temp_{timestamp}_{randomId}` | `temp_1694789123456_abc123` |
| **Listing** | `{listingId}` | `listing_123456789` |
| **Inventory** | `{itemId}` | `item_987654321` |
| **Single** | `single` | `single` |

## 🖼️ Image Processing

### **Automatic Transformations**

| Transformation | Description | Parameters |
|----------------|-------------|------------|
| **Resize** | Resize to fit dimensions | `w_800,h_600,c_fill` |
| **Thumbnail** | Create thumbnail | `w_300,h_300,c_fill` |
| **Compress** | Optimize file size | `q_auto,f_auto` |
| **Format** | Convert format | `f_auto` |
| **Quality** | Adjust quality | `q_80` |

### **Transformation Examples**

```typescript
// Original image
const originalUrl = 'https://res.cloudinary.com/benalsam/image/upload/v1234567890/benalsam/user123/listings/listing_123/image.jpg';

// Thumbnail (300x300)
const thumbnailUrl = 'https://res.cloudinary.com/benalsam/image/upload/w_300,h_300,c_fill/v1234567890/benalsam/user123/listings/listing_123/image.jpg';

// Medium size (800x600)
const mediumUrl = 'https://res.cloudinary.com/benalsam/image/upload/w_800,h_600,c_fill/v1234567890/benalsam/user123/listings/listing_123/image.jpg';

// Optimized (auto quality, auto format)
const optimizedUrl = 'https://res.cloudinary.com/benalsam/image/upload/q_auto,f_auto/v1234567890/benalsam/user123/listings/listing_123/image.jpg';
```

## 📤 Upload Operations

### **Single Image Upload**

```typescript
const result = await cloudinary.uploader.upload(imagePath, {
  folder: `benalsam/${userId}/single`,
  public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  resource_type: 'image',
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
});
```

### **Multiple Images Upload**

```typescript
const results = await Promise.all(
  images.map(async (image) => {
    return await cloudinary.uploader.upload(image.path, {
      folder: `benalsam/${userId}/listings/temp_${timestamp}_${randomId}`,
      public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
  })
);
```

### **Image Processing Pipeline**

```typescript
// 1. Upload original image
const uploadResult = await cloudinary.uploader.upload(imagePath, {
  folder: `benalsam/${userId}/listings/temp_${timestamp}_${randomId}`,
  public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  resource_type: 'image'
});

// 2. Generate thumbnail
const thumbnailResult = await cloudinary.uploader.upload(imagePath, {
  folder: `benalsam/${userId}/listings/temp_${timestamp}_${randomId}`,
  public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_thumb`,
  resource_type: 'image',
  transformation: [
    { width: 300, height: 300, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
});

// 3. Generate medium size
const mediumResult = await cloudinary.uploader.upload(imagePath, {
  folder: `benalsam/${userId}/listings/temp_${timestamp}_${randomId}`,
  public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_medium`,
  resource_type: 'image',
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
});
```

## 🔄 Image Management

### **Move Images**

```typescript
// Move from temp folder to permanent folder
const moveResult = await cloudinary.uploader.rename(
  `benalsam/${userId}/listings/temp_${timestamp}_${randomId}/image_123`,
  `benalsam/${userId}/listings/${listingId}/image_123`
);
```

### **Delete Images**

```typescript
// Delete single image
const deleteResult = await cloudinary.uploader.destroy(
  `benalsam/${userId}/listings/${listingId}/image_123`
);

// Delete folder (all images in folder)
const deleteFolderResult = await cloudinary.uploader.destroy(
  `benalsam/${userId}/listings/temp_${timestamp}_${randomId}`,
  { resource_type: 'image', type: 'upload' }
);
```

### **List Images**

```typescript
// List images in folder
const listResult = await cloudinary.search
  .expression(`folder:benalsam/${userId}/listings/${listingId}`)
  .execute();
```

## 📊 Monitoring

### **Cloudinary Analytics**

```typescript
// Get usage statistics
const usage = await cloudinary.api.usage();

// Get resource details
const resource = await cloudinary.api.resource('image_123');

// Get transformation details
const transformation = await cloudinary.api.transformation('w_300,h_300,c_fill');
```

### **Health Checks**

```typescript
// Check Cloudinary connection
const healthCheck = async () => {
  try {
    await cloudinary.api.ping();
    return { status: 'healthy', cloudinary: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', cloudinary: 'disconnected', error: error.message };
  }
};
```

## 🛡️ Security

### **Upload Restrictions**

```typescript
const uploadOptions = {
  folder: `benalsam/${userId}/listings`,
  resource_type: 'image',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  max_file_size: 10485760, // 10MB
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
};
```

### **Access Control**

```typescript
// Generate signed upload URL
const uploadUrl = cloudinary.utils.api_sign_request(
  {
    timestamp: Math.round(new Date().getTime() / 1000),
    folder: `benalsam/${userId}/listings`,
    public_id: `image_${Date.now()}`
  },
  process.env.CLOUDINARY_API_SECRET
);
```

## 🔧 Error Handling

### **Common Errors**

| Error | Description | Solution |
|-------|-------------|----------|
| `Invalid file type` | Unsupported image format | Check allowed formats |
| `File too large` | Image exceeds size limit | Compress or resize |
| `Upload failed` | Network or server error | Retry with exponential backoff |
| `Quota exceeded` | Storage quota reached | Check usage and upgrade plan |

### **Error Handling Implementation**

```typescript
try {
  const result = await cloudinary.uploader.upload(imagePath, uploadOptions);
  return { success: true, data: result };
} catch (error) {
  if (error.http_code === 400) {
    throw new ValidationError('Invalid file type or size');
  } else if (error.http_code === 401) {
    throw new AuthenticationError('Invalid Cloudinary credentials');
  } else if (error.http_code === 403) {
    throw new QuotaExceededError('Storage quota exceeded');
  } else {
    throw new CloudinaryError('Upload failed', error);
  }
}
```

## 📈 Performance Optimization

### **Image Optimization**

```typescript
const optimizationOptions = {
  quality: 'auto',
  fetch_format: 'auto',
  flags: 'progressive',
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
};
```

### **CDN Configuration**

```typescript
const cdnOptions = {
  secure: true,
  cdn_subdomain: true,
  secure_distribution: 'your-cdn-subdomain.cloudinary.com'
};
```

## 🧪 Testing

### **Upload Test**

```bash
# Test single image upload
curl -X POST http://localhost:3007/api/v1/upload/single \
  -H "x-user-id: test-user-123" \
  -F "image=@./test-image.png"
```

### **Health Check**

```bash
# Check Cloudinary health
curl http://localhost:3007/api/v1/health/detailed | jq '.services.cloudinary'
```

## 📚 Best Practices

### **Image Management**
- Use appropriate folder structure
- Implement cleanup for temp images
- Use meaningful public IDs
- Optimize images before upload
- Monitor storage usage

### **Performance**
- Use CDN for delivery
- Implement caching
- Optimize image sizes
- Use progressive loading
- Monitor response times

### **Security**
- Validate file types
- Check file sizes
- Use signed uploads
- Implement access control
- Monitor usage patterns

## 🔗 Related Documentation

- [API Endpoints](../API_ENDPOINTS.md)
- [Job System](job-system.md)
- [Service README](../README.md)
- [Monitoring Guide](monitoring.md)

---

**Last Updated**: 15 Eylül 2025, 10:30  
**Version**: 1.0.0
