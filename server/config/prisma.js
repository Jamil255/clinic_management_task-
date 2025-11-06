import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    
    return true
  } catch (error) {
    
    return false
  }
}

export { testDatabaseConnection }
export default prisma
