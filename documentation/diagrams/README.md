# PlantUML Sequence Diagrams

This directory contains the PlantUML source files for all use case sequence diagrams in the Virtual Fridge application.

## Files

- `imageDiagram.plantuml` - Use Case 1: Log Food via Image
- `barcodeDiagram.plantuml` - Use Case 2: Log Food via Barcode
- `viewFridgeDiagram.plantuml` - Use Case 3: View Fridge
- `generateRecipeSequence.plantuml` - Use Case 4: Generate Recipe Suggestions
- `viewNutritionDiagram.plantuml` - Use Case 5: View Nutritional Facts
- `dependencies.plantuml` - System dependencies diagram
- `usecase.plantuml` - Use case diagram

## Diagram Contents

All sequence diagrams match the technical specifications in `Requirements_and_Design.md`:

- **Section 4.1**: REST API routes and method signatures
  - e.g., `POST /api/fridge/barcode`, `FoodItem.create()`

- **Section 4.2**: Database collections and operations
  - User, FoodItem, FoodType collections in MongoDB
  - Model methods: `findById()`, `findByBarcode()`, `getAssociatedFoodType()`

- **External APIs**:
  - Gemini API (food identification & recipe generation)
  - Open Food Facts API (nutritional data)
  - TheMealDB API (recipe database)

## Generating Diagram Images

### Option 1: Using PlantUML JAR

1. Download PlantUML JAR from https://plantuml.com/download
2. Run for each diagram:
   ```bash
   java -jar plantuml.jar imageDiagram.plantuml
   java -jar plantuml.jar barcodeDiagram.plantuml
   java -jar plantuml.jar viewFridgeDiagram.plantuml
   java -jar plantuml.jar generateRecipeSequence.plantuml
   java -jar plantuml.jar viewNutritionDiagram.plantuml
   ```
3. Move generated PNG/SVG files to `../images/`

### Option 2: Using PlantUML Online Server

1. Visit https://www.plantuml.com/plantuml/uml/
2. Copy contents of each `.plantuml` file
3. Paste into the online editor
4. Download as PNG or SVG
5. Save to `../images/` directory

### Option 3: Using VS Code Extension

1. Install "PlantUML" extension by jebbs
2. Open any `.plantuml` file
3. Press `Alt+D` to preview
4. Right-click preview → Export → PNG/SVG
5. Save to `../images/` directory

### Option 4: Using Node.js

```bash
npm install -g node-plantuml
puml generate imageDiagram.plantuml -o ../images/imageDiagram.png
puml generate barcodeDiagram.plantuml -o ../images/barcodeDiagram.png
puml generate viewFridgeDiagram.plantuml -o ../images/viewFridgeDiagram.png
puml generate generateRecipeSequence.plantuml -o ../images/generateRecipeSequence.svg
puml generate viewNutritionDiagram.plantuml -o ../images/viewNutritionDiagram.png
```

## Diagram Format

All diagrams follow this structure:

```plantuml
@startuml
title Use Case X: [Name]

actor User
participant "Frontend\n(Android)" as Frontend
participant "Backend\n(Express)" as Backend
participant "External API" as External
database "MongoDB" as DB

[Sequence interactions with REST routes and method calls]

@enduml
```

## Key Features in Updated Diagrams

1. **Actual REST API Routes**: All HTTP endpoints match section 4.1
2. **Method Signatures**: Database operations use actual model method names
3. **Authentication**: JWT authentication flows shown where applicable
4. **Error Handling**: Alt/else blocks for success and failure scenarios
5. **External APIs**: Proper API endpoints and response formats
6. **Database Operations**: Foreign key relationships (userId, typeId)
7. **Recent Fixes**:
   - Barcode: Single scan with back button, fridge list refresh
   - Image: Gemini API integration (not OCR)
   - Recipe: Both MealDB API and Gemini AI modes

## Maintenance

When updating the API or database schema:
1. Update `Requirements_and_Design.md` sections 4.1 and 4.2
2. Update corresponding `.plantuml` files in this directory
3. Regenerate images and place in `../images/`
4. Verify diagrams match the documented interfaces
