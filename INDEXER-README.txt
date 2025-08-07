================================================================================
LEARNING CARDS - S3 INDEXER DOCUMENTATION
================================================================================

This document describes the S3-based indexing system for learning materials.

OVERVIEW
--------
The indexer has been enhanced to read files from S3 buckets instead of local 
folders. This allows for cloud-based storage and processing of learning 
materials with dynamic bucket selection via API calls.

WHAT WAS IMPLEMENTED
-------------------
1. S3 Integration: Uses existing S3FileStorage infrastructure
2. API Endpoint: POST /index/s3 for dynamic bucket indexing
3. Content Processing: PDF text extraction and search optimization
4. Database Storage: Structured learning materials with categorization
5. Error Handling: Comprehensive error handling and progress reporting

API ENDPOINT
-----------
POST /index/s3

Purpose: Index learning materials from any S3 bucket by providing the bucket 
name via API call.

REQUEST FORMAT
-------------
Content-Type: application/json

JSON Body:
{
  "bucketName": "your-s3-bucket-name",    // Required: S3 bucket name
  "prefix": "optional/folder/path/"       // Optional: S3 prefix/folder
}

PARAMETERS
----------
- bucketName (required): Name of the S3 bucket to index
- prefix (optional): S3 prefix/folder to limit indexing scope
  - Defaults to "learning-materials/" if not provided
  - Use "" to index entire bucket  
  - Use "folder/" to index specific folder
  - Use "path/to/subfolder/" for nested folders

EXAMPLE API CALLS
----------------

1. Basic Request (using default prefix):
   curl -X POST https://m3-works.com/index/s3 \
     -H "Content-Type: application/json" \
     -d '{"bucketName": "my-learning-bucket"}'

2. With Custom Prefix:
   curl -X POST https://m3-works.com/index/s3 \
     -H "Content-Type: application/json" \
     -d '{
       "bucketName": "company-documents",
       "prefix": "training-materials/2024/"
     }'

3. For m3-cas1 bucket with data/data/ structure:
   curl -X POST https://m3-works.com/index/s3 \
     -H "Content-Type: application/json" \
     -d '{
       "bucketName": "m3-cas1",
       "prefix": "data/data/"
     }'

RESPONSE FORMAT
--------------
Success Response:
{
  "success": true,
  "message": "S3 indexing completed successfully from bucket: my-bucket",
  "bucketName": "my-bucket",
  "prefix": "documents/",
  "totalDirectories": 5,
  "totalFiles": 23,
  "uniqueFiles": 20
}

Error Response:
{
  "success": false,
  "message": "S3 indexing failed: [error details]",
  "bucketName": "my-bucket",
  "prefix": "documents/",
  "totalDirectories": 0,
  "totalFiles": 0,
  "uniqueFiles": 0
}

HOW IT WORKS
-----------
1. API Call: Client sends POST request with bucket name and optional prefix
2. S3 Connection: System connects to specified S3 bucket using AWS credentials
3. File Discovery: Lists all files matching the prefix pattern
4. Directory Grouping: Groups files by S3 "directories" (folder structure)
5. File Processing:
   - Downloads each file temporarily for processing
   - Extracts text content from PDFs using Apache PDFBox
   - Removes German stopwords for better search optimization
   - Calculates content hash for deduplication
6. Storage:
   - Stores files in Content Addressable Storage (CAS)
   - Creates structured learning material entries in database
   - Organizes by packets and unterlagen (categories)
7. Cleanup: Removes temporary files and reports results

PREFIX EXAMPLES
--------------
S3 Bucket Structure:
my-bucket/
├── learning-materials/
│   ├── mathematics/
│   │   ├── algebra.pdf
│   │   └── geometry.pdf
│   └── science/
│       ├── physics.pdf
│       └── chemistry.pdf
├── other-documents/
└── backup-files/

Prefix Usage:
- "learning-materials/" → Indexes mathematics and science folders
- "learning-materials/mathematics/" → Indexes only algebra.pdf, geometry.pdf  
- "" → Indexes entire bucket
- "other-documents/" → Indexes only other-documents folder

SPECIFIC CASE: m3-cas1 BUCKET
----------------------------
Structure: m3-cas1/data/data/[learning materials]

Correct API call:
{
  "bucketName": "m3-cas1",
  "prefix": "data/data/"
}

This targets the learning materials in the nested data/data/ folder structure.

AWS REQUIREMENTS
---------------
1. AWS Credentials: Configure via environment variables or IAM roles
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_SESSION_TOKEN (if using temporary credentials)
   
2. S3 Permissions: Read access to the target bucket
   - s3:ListBucket
   - s3:GetObject
   - s3:GetObjectMetadata

3. Network: Connectivity from application server to S3

EXISTING CONFIGURATION
---------------------
The application already has S3 configuration in application.yaml:

fileStorage:
  type: local
  s3:
    bucketName: m3-cas1
    region: eu-central-1

The indexer creates S3 connections dynamically based on the API call parameters,
allowing indexing from different buckets than the configured default.

FEATURES
-------
- Dynamic Bucket Selection: Any S3 bucket can be indexed via API
- Prefix Filtering: Index only specific folders/prefixes  
- Automatic Organization: Groups files by S3 directory structure
- Content Extraction: PDF text extraction for full-text search
- Deduplication: Content-addressable storage prevents duplicates
- Progress Tracking: Detailed logging and result metrics
- Error Recovery: Graceful handling of failed downloads or processing
- Temporary File Management: Automatic cleanup of downloaded files

BACKWARDS COMPATIBILITY
----------------------
- Original local indexing still available via GET /index
- S3 indexing is additive, doesn't replace existing functionality
- Fallback mechanism: S3 indexing falls back to local if S3 fails

LOGGING AND MONITORING
---------------------
The indexer provides detailed console logging:
- S3 connection status
- File discovery progress  
- Processing status per file
- Directory organization results
- Error details for troubleshooting
- Final statistics summary

TROUBLESHOOTING
--------------
Common Issues:
1. "Failed to create S3 storage" → Check AWS credentials and permissions
2. "No files found in S3 bucket" → Verify bucket name and prefix
3. "Error downloading S3 file" → Check network connectivity and file permissions
4. "PDF processing failed" → File may be corrupted or encrypted

Check application logs for detailed error messages and S3 operation status.

PERFORMANCE CONSIDERATIONS  
-------------------------
- Files are downloaded temporarily for processing (requires local disk space)
- Large buckets may take considerable time to process
- PDF text extraction is CPU intensive
- Network bandwidth affects download speed
- Temporary files are automatically cleaned up after processing

SECURITY NOTES
--------------
- Use IAM roles instead of hardcoded credentials when possible
- Limit S3 permissions to minimum required (read-only)
- Temporary files are created in system temp directory with restricted access
- All temporary files are cleaned up after processing
- API endpoint may need authentication depending on deployment configuration

IMPLEMENTATION DETAILS
----------------------
Key Files Modified:
- src/main/kotlin/Indexer.kt: Core indexing logic with S3 support
- src/main/kotlin/Routing.kt: API endpoint for S3 indexing
- Existing S3 infrastructure: storage/FileStorageFactory.kt, storage/Storage.kt

New Functions:
- indexFromS3Bucket(): Main API-callable function
- processS3Files(): Core S3 file processing logic  
- downloadS3FileToTemp(): Helper for temporary file downloads
- IndexResult data class: Structured return type for API responses

TESTING
------
1. Verify S3 connectivity and permissions
2. Test with small bucket first to validate functionality
3. Check database entries after successful indexing
4. Verify content search functionality with indexed materials
5. Monitor logs for any error patterns

FUTURE ENHANCEMENTS
------------------
Potential improvements:
- Asynchronous processing for large buckets
- Progress callbacks for long-running operations
- Support for additional file formats beyond PDF
- Incremental indexing (only process changed files)
- Batch processing optimizations
- S3 event-driven indexing triggers

================================================================================
Generated: 2025-01-08
Version: 1.0
Last Updated: S3 Indexing Implementation Complete
================================================================================