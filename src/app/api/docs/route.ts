import { readFileSync } from 'fs'
import { join } from 'path'
import * as yaml from 'js-yaml'

export async function GET() {
  try {
    // Read the swagger.yaml file from the project root
    const swaggerPath = join(process.cwd(), 'swagger.yaml')
    const swaggerContent = readFileSync(swaggerPath, 'utf8')
    
    // Parse YAML to JSON
    const swaggerDoc = yaml.load(swaggerContent)
    
    return Response.json(swaggerDoc)
  } catch (error) {
    console.error('Error loading swagger documentation:', error)
    return Response.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    )
  }
}
