# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning cards application built with Kotlin/Ktor backend and TypeScript frontend. The application provides functionality for:

- **Memory/Learning Cards**: Create, manage, and study flashcards
- **Learning Materials**: Upload and manage educational content (PDFs, images, etc.)
- **Assessment System**: Take and manage examinations
- **Buchungskarten**: Financial/accounting card system
- **User Management**: Authentication, authorization with JWT
- **Content Management**: File storage with Content Addressable Storage (CAS)

## Architecture

### Backend (Kotlin/Ktor)
- **Main Application**: `src/main/kotlin/Application.kt` - Main entry point with module configuration
- **Routing**: `src/main/kotlin/Routing.kt` - HTTP endpoints and API routes
- **Database**: `src/main/kotlin/Databases.kt` - Database configuration with PostgreSQL + Exposed ORM
- **Authentication**: `src/main/kotlin/Security.kt` - JWT authentication and authorization
- **Services**: Various service classes for business logic (MCardService, LernmaterialService, etc.)
- **Schemas**: Database schema definitions for different entities
- **CAS**: Content Addressable Storage for file management

### Frontend (TypeScript)
- **Source**: `src/main/typescript/` - TypeScript source files
- **Compiled**: `src/main/resources/static/js/` - Compiled JavaScript output
- **Templates**: `src/main/resources/templates/` - Freemarker templates
- **Static Assets**: `src/main/resources/static/` - CSS, HTML, and other static resources

## Common Development Commands

### Building and Running
```bash
# Build the project
./gradlew build

# Run the application
./gradlew run

# Build TypeScript (automatically runs during build)
npm run build

# Watch TypeScript changes
npm run watch

# Build fat JAR for deployment
./gradlew buildFatJar

# Run tests
./gradlew test
```

### Docker
```bash
# Build Docker image
./gradlew buildImage

# Run with Docker
./gradlew runDocker

# Publish to local registry
./gradlew publishImageToLocalRegistry
```

### Database
- PostgreSQL database configured in `src/main/resources/application.yaml`
- Database migrations handled automatically by Exposed ORM
- Connection pool managed by HikariCP

## Key File Locations

### Configuration
- `src/main/resources/application.yaml` - Main application configuration
- `build.gradle.kts` - Gradle build configuration
- `tsconfig.json` - TypeScript compiler configuration
- `package.json` - Node.js dependencies for TypeScript compilation

### Main Source Files
- `src/main/kotlin/Application.kt` - Application entry point
- `src/main/kotlin/Routing.kt` - Main API routing
- `src/main/kotlin/Security.kt` - Authentication and group-based authorization
- `src/main/kotlin/Databases.kt` - Database configuration
- `src/main/kotlin/*Schema.kt` - Database schema definitions
- `src/main/kotlin/*Service.kt` - Business logic services

### Frontend
- `src/main/typescript/` - TypeScript source files
- `src/main/resources/static/` - Static web assets
- `src/main/resources/templates/` - Server-side templates

## Development Patterns

### API Structure
- Most endpoints require JWT authentication
- Group-based authorization system for resource access
- RESTful API design with proper HTTP status codes
- Content negotiation with JSON serialization

### Database
- Uses Exposed ORM with PostgreSQL
- All services have `initialize()` method for table creation
- Services follow the pattern: `*Service` classes handle business logic
- Schema classes define database structure

### File Storage
- Content Addressable Storage (CAS) system for file management
- Images have thumbnail and resize support
- Legacy file storage fallback for compatibility

### Frontend Build
- TypeScript compiles to `src/main/resources/static/js/`
- Build process integrated with Gradle
- Static content served by Ktor

## Authentication & Authorization

The application uses JWT-based authentication with a group-based authorization system:

- Users belong to groups
- Groups have roles
- Groups have access to products (features)
- JWT tokens contain user information
- `getCurrentUserId()` helper function extracts user ID from JWT

## Testing

Test files are located in `src/test/kotlin/`. Run tests with:
```bash
./gradlew test
```

## Key Services

- **MCardService**: Memory cards management
- **LernmaterialService**: Learning materials handling
- **UserCredentialsService**: User authentication
- **BuchungsKartenService**: Accounting cards system
- **GroupService**: User group management
- **ContentAddressableStorage**: File storage system
- **ThumbnailService**: Image processing